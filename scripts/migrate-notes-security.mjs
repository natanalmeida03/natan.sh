import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const notesEncryptionKey = process.env.NOTES_ENCRYPTION_KEY;
const notesPasswordPepper = process.env.NOTES_PASSWORD_PEPPER;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

if (!notesEncryptionKey || !notesPasswordPepper) {
  throw new Error("Missing NOTES_ENCRYPTION_KEY or NOTES_PASSWORD_PEPPER");
}

function parseBase64Key(input) {
  try {
    const decoded = Buffer.from(input, "base64");
    return decoded.length === 32 ? decoded : null;
  } catch {
    return null;
  }
}

function parseHexKey(input) {
  if (!/^[0-9a-fA-F]{64}$/.test(input)) {
    return null;
  }

  try {
    const decoded = Buffer.from(input, "hex");
    return decoded.length === 32 ? decoded : null;
  } catch {
    return null;
  }
}

const masterKey = parseBase64Key(notesEncryptionKey) || parseHexKey(notesEncryptionKey);

if (!masterKey) {
  throw new Error(
    "NOTES_ENCRYPTION_KEY must be a 32-byte base64 or 64-char hex value"
  );
}

function encodeBase64Url(buffer) {
  return buffer.toString("base64url");
}

function encryptPayload(payload, key, userId, noteId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`note:${userId}:${noteId}:payload:v1`, "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(payload), "utf8")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    payload_ciphertext: encodeBase64Url(encrypted),
    payload_iv: encodeBase64Url(iv),
    payload_auth_tag: encodeBase64Url(authTag),
  };
}

function deriveLegacyVerifier(legacyHash) {
  return createHmac("sha256", Buffer.from(notesPasswordPepper, "utf8"))
    .update("notes-legacy-verifier-v1")
    .update(legacyHash)
    .digest("hex");
}

function deriveLegacyEncryptionKey(legacyHash, salt) {
  return createHash("sha256")
    .update("notes-legacy-encryption-v1")
    .update(Buffer.from(notesPasswordPepper, "utf8"))
    .update(legacyHash)
    .update(salt)
    .digest();
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data: notes, error } = await supabase
  .from("notes")
  .select(
    [
      "id",
      "user_id",
      "title",
      "content",
      "tags",
      "is_protected",
      "password_hash",
      "password_salt",
      "password_verifier",
      "password_scheme",
      "payload_ciphertext",
    ].join(", ")
  )
  .order("created_at", { ascending: true });

if (error) {
  throw new Error(`Failed to load notes: ${error.message}`);
}

let migrated = 0;
let upgradedSchemeOnly = 0;
let skipped = 0;

for (const note of notes || []) {
  if (note.payload_ciphertext) {
    if (note.is_protected && note.password_verifier && !note.password_scheme) {
      const { error: schemeError } = await supabase
        .from("notes")
        .update({ password_scheme: "password_v2" })
        .eq("id", note.id)
        .eq("user_id", note.user_id);

      if (schemeError) {
        throw new Error(
          `Failed to patch password scheme for note ${note.id}: ${schemeError.message}`
        );
      }

      upgradedSchemeOnly += 1;
    } else {
      skipped += 1;
    }

    continue;
  }

  const payload = {
    title: note.title || "Untitled note",
    content: note.content || "",
    tags: Array.isArray(note.tags) ? note.tags : [],
  };

  let encryptionKey = masterKey;
  let passwordVerifier = null;
  let passwordScheme = null;
  let passwordSalt = null;
  let placeholderTitle = "Encrypted note";

  if (note.is_protected) {
    if (!note.password_hash || !note.password_salt) {
      throw new Error(
        `Protected legacy note ${note.id} is missing password_hash or password_salt`
      );
    }

    encryptionKey = deriveLegacyEncryptionKey(note.password_hash, note.password_salt);
    passwordVerifier = deriveLegacyVerifier(note.password_hash);
    passwordScheme = "legacy_v1";
    passwordSalt = note.password_salt;
    placeholderTitle = "Protected note";
  }

  const encrypted = encryptPayload(payload, encryptionKey, note.user_id, note.id);

  const { error: updateError } = await supabase
    .from("notes")
    .update({
      payload_ciphertext: encrypted.payload_ciphertext,
      payload_iv: encrypted.payload_iv,
      payload_auth_tag: encrypted.payload_auth_tag,
      password_verifier: passwordVerifier,
      password_scheme: passwordScheme,
      password_salt: passwordSalt,
      password_hash: null,
      title: placeholderTitle,
      content: "",
      excerpt: null,
      tags: [],
      failed_unlock_attempts: 0,
      first_failed_unlock_at: null,
      unlock_blocked_until: null,
    })
    .eq("id", note.id)
    .eq("user_id", note.user_id);

  if (updateError) {
    throw new Error(`Failed to migrate note ${note.id}: ${updateError.message}`);
  }

  migrated += 1;
}

console.log(
  JSON.stringify(
    {
      migrated,
      upgraded_scheme_only: upgradedSchemeOnly,
      skipped,
      total: notes?.length || 0,
    },
    null,
    2
  )
);
