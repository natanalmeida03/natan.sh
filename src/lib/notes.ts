"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import type { Note, NoteInput, NoteListItem } from "@/types/notes";
import {
    NOTE_SECURITY_CONSTANTS,
    buildExcerpt,
    clearUnlockCookie,
    createProtectedSecrets,
    decryptPayload,
    encryptPayload,
    getFailedAttemptUpdate,
    getMasterEncryptionKey,
    getSuccessfulUnlockReset,
    getUnlockBlock,
    getUnlockedEncryptionKey,
    normalizeTags,
    setUnlockCookie,
    type SecureNotePayload,
    type SecureNoteRow,
    validatePasswordPolicy,
    verifyLegacyProtectedPassword,
    verifyProtectedPassword,
} from "@/lib/note-security";

const NOTE_SELECT = [
    "id",
    "user_id",
    "payload_ciphertext",
    "payload_iv",
    "payload_auth_tag",
    "accent_color",
    "icon",
    "is_pinned",
    "is_archived",
    "is_protected",
    "password_scheme",
    "password_salt",
    "password_verifier",
    "failed_unlock_attempts",
    "first_failed_unlock_at",
    "unlock_blocked_until",
    "created_at",
    "updated_at",
].join(", ");

function toNoteRow(value: unknown): SecureNoteRow {
    return value as SecureNoteRow;
}

function buildLockedNote(row: SecureNoteRow): Note {
    return {
        id: row.id,
        title: "Protected note",
        content: "",
        excerpt: null,
        tags: [],
        accent_color: row.accent_color || null,
        icon: row.icon || null,
        is_pinned: !!row.is_pinned,
        is_archived: !!row.is_archived,
        is_protected: !!row.is_protected,
        is_locked: true,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

function buildDecryptedNote(row: SecureNoteRow, payload: SecureNotePayload): Note {
    return {
        id: row.id,
        title: payload.title,
        content: payload.content,
        excerpt: buildExcerpt(payload.content),
        tags: normalizeTags(payload.tags),
        accent_color: row.accent_color || null,
        icon: row.icon || null,
        is_pinned: !!row.is_pinned,
        is_archived: !!row.is_archived,
        is_protected: !!row.is_protected,
        is_locked: false,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

async function requireUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "User not authenticated" as const };
    }

    return { user };
}

async function loadNoteRow(noteId: string, userId: string) {
    const { data, error } = await supabaseAdmin
        .from("notes")
        .select(NOTE_SELECT)
        .eq("id", noteId)
        .eq("user_id", userId)
        .single();

    if (error || !data) {
        return { error: error?.message || "Note not found" };
    }

    return { data: toNoteRow(data) };
}

async function decryptForResponse(
    row: SecureNoteRow
): Promise<{ note: Note; locked: boolean }> {
    if (!row.is_protected) {
        const payload = decryptPayload(row, getMasterEncryptionKey());
        return { note: buildDecryptedNote(row, payload), locked: false };
    }

    const unlockKey = await getUnlockedEncryptionKey(row.id, row.user_id);

    if (!unlockKey) {
        return { note: buildLockedNote(row), locked: true };
    }

    try {
        const payload = decryptPayload(row, unlockKey);
        return { note: buildDecryptedNote(row, payload), locked: false };
    } catch {
        await clearUnlockCookie(row.id);
        return { note: buildLockedNote(row), locked: true };
    }
}

async function getCurrentPayloadForEdit(row: SecureNoteRow) {
    if (!row.is_protected) {
        return {
            payload: decryptPayload(row, getMasterEncryptionKey()),
            encryptionKey: getMasterEncryptionKey(),
        };
    }

    const unlockKey = await getUnlockedEncryptionKey(row.id, row.user_id);

    if (!unlockKey) {
        return { error: "Unlock the note again before editing or deleting it" };
    }

    try {
        return {
            payload: decryptPayload(row, unlockKey),
            encryptionKey: unlockKey,
        };
    } catch {
        await clearUnlockCookie(row.id);
        return { error: "Unlock the note again before editing or deleting it" };
    }
}

function buildPayload(input: {
    title: string;
    content: string;
    tags: string[];
}): SecureNotePayload {
    return {
        title: input.title.trim(),
        content: input.content,
        tags: normalizeTags(input.tags),
    };
}

function noteToListItem(note: Note): NoteListItem {
    return note;
}

export async function getNotes() {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const { data, error } = await supabaseAdmin
        .from("notes")
        .select(NOTE_SELECT)
        .eq("user_id", auth.user.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

    if (error) {
        return { error: error.message };
    }

    try {
        const notes = await Promise.all(
            (data || []).map(async (record) => {
                const resolved = await decryptForResponse(toNoteRow(record));
                return noteToListItem(resolved.note);
            })
        );

        return { data: notes };
    } catch {
        return { error: "Failed to decrypt notes securely" };
    }
}

export async function getNoteById(noteId: string) {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const rowResult = await loadNoteRow(noteId, auth.user.id);

    if (rowResult.error) {
        return { error: rowResult.error };
    }

    const row = rowResult.data;

    if (!row) {
        return { error: "Note not found" };
    }

    try {
        const resolved = await decryptForResponse(row);
        return { data: resolved.note, locked: resolved.locked };
    } catch {
        return { error: "Failed to load note securely" };
    }
}

export async function unlockNote(noteId: string, password: string) {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const rowResult = await loadNoteRow(noteId, auth.user.id);

    if (rowResult.error) {
        return { error: rowResult.error };
    }

    const row = rowResult.data;

    if (!row) {
        return { error: "Note not found" };
    }

    if (!row.is_protected) {
        const resolved = await decryptForResponse(row);
        return { data: resolved.note, locked: false };
    }

    const blockedUntil = getUnlockBlock(row);

    if (blockedUntil) {
        return {
            error: `Too many failed attempts. Try again after ${blockedUntil.toLocaleTimeString(
                "en-us",
                { hour: "2-digit", minute: "2-digit" }
            )}.`,
            blocked_until: blockedUntil.toISOString(),
        };
    }

    const encryptionKey = verifyProtectedPassword(
        password.trim(),
        row.password_salt,
        row.password_verifier
    );
    const resolvedEncryptionKey =
        row.password_scheme === NOTE_SECURITY_CONSTANTS.PASSWORD_SCHEME_LEGACY_V1
            ? verifyLegacyProtectedPassword(
                  password.trim(),
                  row.password_salt,
                  row.password_verifier
              )
            : encryptionKey;

    if (!resolvedEncryptionKey) {
        const nextAttemptState = getFailedAttemptUpdate(row);
        await supabaseAdmin
            .from("notes")
            .update(nextAttemptState)
            .eq("id", noteId)
            .eq("user_id", auth.user.id);

        if (nextAttemptState.unlock_blocked_until) {
            return {
                error: `Too many failed attempts. Try again after ${new Date(
                    nextAttemptState.unlock_blocked_until
                ).toLocaleTimeString("en-us", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}.`,
                blocked_until: nextAttemptState.unlock_blocked_until,
            };
        }

        return { error: "Invalid note password" };
    }

    await supabaseAdmin
        .from("notes")
        .update(getSuccessfulUnlockReset())
        .eq("id", noteId)
        .eq("user_id", auth.user.id);

    let finalEncryptionKey = resolvedEncryptionKey;

    if (row.password_scheme === NOTE_SECURITY_CONSTANTS.PASSWORD_SCHEME_LEGACY_V1) {
        const validation = validatePasswordPolicy(password);

        if (!("error" in validation)) {
            const payload = decryptPayload(row, resolvedEncryptionKey);
            const upgradedSecrets = createProtectedSecrets(validation.password);
            const upgradedEncrypted = encryptPayload(
                payload,
                upgradedSecrets.encryptionKey,
                auth.user.id,
                noteId
            );

            await supabaseAdmin
                .from("notes")
                .update({
                    payload_ciphertext: upgradedEncrypted.payload_ciphertext,
                    payload_iv: upgradedEncrypted.payload_iv,
                    payload_auth_tag: upgradedEncrypted.payload_auth_tag,
                    password_scheme: upgradedSecrets.password_scheme,
                    password_salt: upgradedSecrets.password_salt,
                    password_verifier: upgradedSecrets.password_verifier,
                })
                .eq("id", noteId)
                .eq("user_id", auth.user.id);

            row.password_scheme = upgradedSecrets.password_scheme;
            row.password_salt = upgradedSecrets.password_salt;
            row.password_verifier = upgradedSecrets.password_verifier;
            row.payload_ciphertext = upgradedEncrypted.payload_ciphertext;
            row.payload_iv = upgradedEncrypted.payload_iv;
            row.payload_auth_tag = upgradedEncrypted.payload_auth_tag;
            finalEncryptionKey = upgradedSecrets.encryptionKey;
        }
    }

    await setUnlockCookie(noteId, auth.user.id, finalEncryptionKey);

    try {
        const payload = decryptPayload(row, finalEncryptionKey);
        return { data: buildDecryptedNote(row, payload), locked: false };
    } catch {
        return { error: "Failed to unlock note securely" };
    }
}

export async function createNote(input: NoteInput) {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const payload = buildPayload({
        title: input.title,
        content: input.content ?? "",
        tags: input.tags || [],
    });

    if (!payload.title) {
        return { error: "Title is required" };
    }

    const noteId = randomUUID();
    const isProtected = !!input.is_protected;
    let encryptionKey = getMasterEncryptionKey();
    let password_salt: string | null = null;
    let password_verifier: string | null = null;

    if (isProtected) {
        const validation = validatePasswordPolicy(input.password || "");

        if ("error" in validation) {
            return { error: validation.error };
        }

        const protectedSecrets = createProtectedSecrets(validation.password);
        encryptionKey = protectedSecrets.encryptionKey;
        password_salt = protectedSecrets.password_salt;
        password_verifier = protectedSecrets.password_verifier;
    }

    const encrypted = encryptPayload(payload, encryptionKey, auth.user.id, noteId);

    const { data, error } = await supabaseAdmin
        .from("notes")
        .insert({
            id: noteId,
            user_id: auth.user.id,
            payload_ciphertext: encrypted.payload_ciphertext,
            payload_iv: encrypted.payload_iv,
            payload_auth_tag: encrypted.payload_auth_tag,
            accent_color: input.accent_color || null,
            icon: input.icon?.trim() || null,
            is_pinned: !!input.is_pinned,
            is_archived: !!input.is_archived,
            is_protected: isProtected,
            password_scheme: isProtected
                ? NOTE_SECURITY_CONSTANTS.PASSWORD_SCHEME_V2
                : null,
            password_salt,
            password_verifier,
            ...getSuccessfulUnlockReset(),
        })
        .select(NOTE_SELECT)
        .single();

    if (error || !data) {
        return { error: error?.message || "Failed to create note" };
    }

    if (isProtected) {
        await setUnlockCookie(noteId, auth.user.id, encryptionKey);
    }

    return { success: true, data: buildDecryptedNote(toNoteRow(data), payload) };
}

export async function updateNote(noteId: string, input: Partial<NoteInput>) {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const rowResult = await loadNoteRow(noteId, auth.user.id);

    if (rowResult.error) {
        return { error: rowResult.error };
    }

    const row = rowResult.data;

    if (!row) {
        return { error: "Note not found" };
    }

    const currentResult = await getCurrentPayloadForEdit(row);

    if ("error" in currentResult) {
        return { error: currentResult.error };
    }

    const currentPayload = currentResult.payload;
    const nextPayload = buildPayload({
        title:
            input.title !== undefined ? input.title : currentPayload.title,
        content:
            input.content !== undefined ? input.content : currentPayload.content,
        tags:
            input.tags !== undefined ? input.tags : currentPayload.tags,
    });

    if (!nextPayload.title) {
        return { error: "Title is required" };
    }

    const nextIsProtected = input.is_protected ?? row.is_protected;
    let encryptionKey = nextIsProtected
        ? currentResult.encryptionKey
        : getMasterEncryptionKey();
    let password_scheme = row.password_scheme || null;
    let password_salt = row.password_salt || null;
    let password_verifier = row.password_verifier || null;

    if (nextIsProtected) {
        if (input.password && input.password.trim()) {
            const validation = validatePasswordPolicy(input.password);

            if ("error" in validation) {
                return { error: validation.error };
            }

            const protectedSecrets = createProtectedSecrets(validation.password);
            encryptionKey = protectedSecrets.encryptionKey;
            password_scheme = protectedSecrets.password_scheme;
            password_salt = protectedSecrets.password_salt;
            password_verifier = protectedSecrets.password_verifier;
        } else if (!row.is_protected) {
            return { error: "Add a password to protect this note" };
        }
    } else {
        password_scheme = null;
        password_salt = null;
        password_verifier = null;
    }

    const encrypted = encryptPayload(nextPayload, encryptionKey, auth.user.id, noteId);

    const { data, error } = await supabaseAdmin
        .from("notes")
        .update({
            payload_ciphertext: encrypted.payload_ciphertext,
            payload_iv: encrypted.payload_iv,
            payload_auth_tag: encrypted.payload_auth_tag,
            accent_color:
                input.accent_color !== undefined
                    ? input.accent_color || null
                    : row.accent_color || null,
            icon:
                input.icon !== undefined
                    ? input.icon?.trim() || null
                    : row.icon || null,
            is_pinned:
                input.is_pinned !== undefined ? !!input.is_pinned : row.is_pinned,
            is_archived:
                input.is_archived !== undefined
                    ? !!input.is_archived
                    : row.is_archived,
            is_protected: nextIsProtected,
            password_scheme,
            password_salt,
            password_verifier,
            ...getSuccessfulUnlockReset(),
        })
        .eq("id", noteId)
        .eq("user_id", auth.user.id)
        .select(NOTE_SELECT)
        .single();

    if (error || !data) {
        return { error: error?.message || "Failed to update note" };
    }

    if (nextIsProtected) {
        await setUnlockCookie(noteId, auth.user.id, encryptionKey);
    } else {
        await clearUnlockCookie(noteId);
    }

    return {
        success: true,
        data: buildDecryptedNote(toNoteRow(data), nextPayload),
    };
}

export async function deleteNote(noteId: string) {
    const auth = await requireUser();

    if ("error" in auth) {
        return { error: auth.error };
    }

    const rowResult = await loadNoteRow(noteId, auth.user.id);

    if (rowResult.error) {
        return { error: rowResult.error };
    }

    const row = rowResult.data;

    if (!row) {
        return { error: "Note not found" };
    }

    if (row.is_protected) {
        const unlockKey = await getUnlockedEncryptionKey(noteId, auth.user.id);

        if (!unlockKey) {
            return { error: "Unlock the note again before editing or deleting it" };
        }
    }

    const { error } = await supabaseAdmin
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", auth.user.id);

    if (error) {
        return { error: error.message };
    }

    await clearUnlockCookie(noteId);

    return { success: true };
}

export async function getNoteSecurityInfo() {
    return {
        password_min_length: NOTE_SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH,
        unlock_ttl_ms: NOTE_SECURITY_CONSTANTS.UNLOCK_TTL_MS,
        max_failed_unlocks: NOTE_SECURITY_CONSTANTS.MAX_FAILED_UNLOCKS,
        blocked_unlock_ms: NOTE_SECURITY_CONSTANTS.BLOCKED_UNLOCK_MS,
    };
}
