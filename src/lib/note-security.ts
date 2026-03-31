import "server-only";

import {
    createCipheriv,
    createDecipheriv,
    createHash,
    createHmac,
    randomBytes,
    scryptSync,
    timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

const AES_ALGORITHM = "aes-256-gcm";
const MASTER_KEY_BYTES = 32;
const PASSWORD_DERIVED_BYTES = 64;
const LEGACY_PASSWORD_DERIVED_BYTES = 64;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const KDF_OPTIONS = {
    cost: 32768,
    blockSize: 8,
    parallelization: 1,
    maxmem: 128 * 1024 * 1024,
};
const UNLOCK_COOKIE_PREFIX = "note_unlock_";
const UNLOCK_TTL_MS = 15 * 60 * 1000;
const MAX_FAILED_UNLOCKS = 5;
const FAILED_UNLOCK_WINDOW_MS = 15 * 60 * 1000;
const BLOCKED_UNLOCK_MS = 15 * 60 * 1000;
const COMMON_PASSWORDS = new Set([
    "12345678",
    "123456789",
    "1234567890",
    "admin1234",
    "adminadmin",
    "changeme123",
    "dragon123",
    "letmein123",
    "password",
    "password1",
    "password12",
    "password123",
    "password1234",
    "qwerty123",
    "qwerty12345",
    "welcome123",
]);
const PASSWORD_SCHEME_V2 = "password_v2";
const PASSWORD_SCHEME_LEGACY_V1 = "legacy_v1";

export interface SecureNotePayload {
    title: string;
    content: string;
    tags: string[];
}

export interface SecureNoteRow {
    id: string;
    user_id: string;
    payload_ciphertext: string;
    payload_iv: string;
    payload_auth_tag: string;
    accent_color?: string | null;
    icon?: string | null;
    is_pinned: boolean;
    is_archived: boolean;
    is_protected: boolean;
    password_scheme?: string | null;
    password_salt?: string | null;
    password_verifier?: string | null;
    failed_unlock_attempts: number;
    first_failed_unlock_at?: string | null;
    unlock_blocked_until?: string | null;
    created_at: string;
    updated_at: string;
}

function getCookieName(noteId: string): string {
    return `${UNLOCK_COOKIE_PREFIX}${noteId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
}

function parseBase64Key(input: string): Buffer | null {
    try {
        const decoded = Buffer.from(input, "base64");
        return decoded.length === MASTER_KEY_BYTES ? decoded : null;
    } catch {
        return null;
    }
}

function parseHexKey(input: string): Buffer | null {
    if (!/^[0-9a-fA-F]{64}$/.test(input)) {
        return null;
    }

    try {
        const decoded = Buffer.from(input, "hex");
        return decoded.length === MASTER_KEY_BYTES ? decoded : null;
    } catch {
        return null;
    }
}

function getMasterKey(): Buffer {
    const envValue = process.env.NOTES_ENCRYPTION_KEY;

    if (!envValue) {
        throw new Error("Missing NOTES_ENCRYPTION_KEY");
    }

    const parsed = parseBase64Key(envValue) || parseHexKey(envValue);

    if (!parsed) {
        throw new Error(
            "NOTES_ENCRYPTION_KEY must be a 32-byte base64 or 64-char hex value"
        );
    }

    return parsed;
}

function getPasswordPepper(): string {
    const pepper = process.env.NOTES_PASSWORD_PEPPER;

    if (!pepper) {
        throw new Error("Missing NOTES_PASSWORD_PEPPER");
    }

    return pepper;
}

function getPasswordPepperBuffer(): Buffer {
    return Buffer.from(getPasswordPepper(), "utf8");
}

function getCookieKey(): Buffer {
    return createHash("sha256")
        .update(getMasterKey())
        .update("notes-unlock-cookie-v1")
        .digest();
}

function encodeBase64Url(buffer: Buffer): string {
    return buffer.toString("base64url");
}

function decodeBase64Url(value: string): Buffer {
    return Buffer.from(value, "base64url");
}

function encryptBuffer(buffer: Buffer, key: Buffer, aad: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(AES_ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(aad, "utf8"));
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
        payload_ciphertext: encodeBase64Url(encrypted),
        payload_iv: encodeBase64Url(iv),
        payload_auth_tag: encodeBase64Url(authTag),
    };
}

function decryptBuffer(
    ciphertext: string,
    iv: string,
    authTag: string,
    key: Buffer,
    aad: string
): Buffer {
    const decipher = createDecipheriv(
        AES_ALGORITHM,
        key,
        decodeBase64Url(iv)
    );
    decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(decodeBase64Url(authTag));

    return Buffer.concat([
        decipher.update(decodeBase64Url(ciphertext)),
        decipher.final(),
    ]);
}

function derivePasswordMaterial(password: string, salt: string) {
    const pepperedPassword = `${password}${getPasswordPepper()}`;
    const derived = scryptSync(
        pepperedPassword,
        salt,
        PASSWORD_DERIVED_BYTES,
        KDF_OPTIONS
    );

    return {
        encryptionKey: derived.subarray(0, MASTER_KEY_BYTES),
        verifier: derived.subarray(MASTER_KEY_BYTES),
    };
}

function deriveLegacyPasswordHash(password: string, salt: string) {
    return scryptSync(password, salt, LEGACY_PASSWORD_DERIVED_BYTES).toString("hex");
}

function deriveLegacyVerifier(hash: string) {
    return createHmac("sha256", getPasswordPepperBuffer())
        .update("notes-legacy-verifier-v1")
        .update(hash)
        .digest("hex");
}

function deriveLegacyEncryptionKey(hash: string, salt: string) {
    return createHash("sha256")
        .update("notes-legacy-encryption-v1")
        .update(getPasswordPepperBuffer())
        .update(hash)
        .update(salt)
        .digest();
}

export function normalizeTags(tags: string[] = []): string[] {
    const unique = new Set<string>();

    tags.forEach((tag) => {
        const normalized = tag.trim().replace(/\s+/g, " ");

        if (normalized) {
            unique.add(normalized);
        }
    });

    return [...unique];
}

export function stripMarkdown(content: string): string {
    return content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^>\s?/gm, "")
        .replace(/^[-*+]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/~~([^~]+)~~/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

export function buildExcerpt(content: string): string | null {
    const plain = stripMarkdown(content);

    if (!plain) {
        return null;
    }

    return plain.length > 180 ? `${plain.slice(0, 177)}...` : plain;
}

export function validatePasswordPolicy(password: string) {
    const trimmed = password.trim();
    const normalized = trimmed.toLowerCase();

    if (trimmed.length < PASSWORD_MIN_LENGTH) {
        return {
            error: `Password must have at least ${PASSWORD_MIN_LENGTH} characters`,
        };
    }

    if (trimmed.length > PASSWORD_MAX_LENGTH) {
        return {
            error: `Password must have at most ${PASSWORD_MAX_LENGTH} characters`,
        };
    }

    if (COMMON_PASSWORDS.has(normalized)) {
        return {
            error: "Password is too common. Choose a less predictable password.",
        };
    }

    if (/^(.)\1+$/.test(trimmed)) {
        return {
            error: "Password is too weak. Use a phrase or a less repetitive password.",
        };
    }

    return { password: trimmed };
}

export function createProtectedSecrets(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derived = derivePasswordMaterial(password, salt);

    return {
        password_scheme: PASSWORD_SCHEME_V2,
        password_salt: salt,
        password_verifier: derived.verifier.toString("hex"),
        encryptionKey: Buffer.from(derived.encryptionKey),
    };
}

export function verifyProtectedPassword(
    password: string,
    salt?: string | null,
    verifier?: string | null
) {
    if (!salt || !verifier) {
        return null;
    }

    const derived = derivePasswordMaterial(password, salt);
    const storedVerifier = Buffer.from(verifier, "hex");

    if (storedVerifier.length !== derived.verifier.length) {
        return null;
    }

    if (!timingSafeEqual(storedVerifier, derived.verifier)) {
        return null;
    }

    return Buffer.from(derived.encryptionKey);
}

export function createLegacyProtectedMigrationSecrets(
    legacyHash: string,
    legacySalt: string
) {
    return {
        password_scheme: PASSWORD_SCHEME_LEGACY_V1,
        password_salt: legacySalt,
        password_verifier: deriveLegacyVerifier(legacyHash),
        encryptionKey: deriveLegacyEncryptionKey(legacyHash, legacySalt),
    };
}

export function verifyLegacyProtectedPassword(
    password: string,
    salt?: string | null,
    verifier?: string | null
) {
    if (!salt || !verifier) {
        return null;
    }

    const legacyHash = deriveLegacyPasswordHash(password, salt);
    const derivedVerifier = deriveLegacyVerifier(legacyHash);
    const storedVerifier = Buffer.from(verifier, "hex");
    const candidateVerifier = Buffer.from(derivedVerifier, "hex");

    if (storedVerifier.length !== candidateVerifier.length) {
        return null;
    }

    if (!timingSafeEqual(storedVerifier, candidateVerifier)) {
        return null;
    }

    return deriveLegacyEncryptionKey(legacyHash, salt);
}

export function encryptPayload(
    payload: SecureNotePayload,
    key: Buffer,
    userId: string,
    noteId: string
) {
    return encryptBuffer(
        Buffer.from(JSON.stringify(payload), "utf8"),
        key,
        `note:${userId}:${noteId}:payload:v1`
    );
}

export function decryptPayload(row: SecureNoteRow, key: Buffer): SecureNotePayload {
    const decrypted = decryptBuffer(
        row.payload_ciphertext,
        row.payload_iv,
        row.payload_auth_tag,
        key,
        `note:${row.user_id}:${row.id}:payload:v1`
    );

    const parsed = JSON.parse(decrypted.toString("utf8")) as SecureNotePayload;

    return {
        title: parsed.title || "",
        content: parsed.content || "",
        tags: Array.isArray(parsed.tags) ? normalizeTags(parsed.tags) : [],
    };
}

function buildUnlockToken(payload: {
    userId: string;
    noteId: string;
    encryptionKey: string;
    expiresAt: number;
}) {
    const encrypted = encryptBuffer(
        Buffer.from(JSON.stringify(payload), "utf8"),
        getCookieKey(),
        `note-unlock:${payload.userId}:${payload.noteId}:v1`
    );

    return [
        encrypted.payload_iv,
        encrypted.payload_auth_tag,
        encrypted.payload_ciphertext,
    ].join(".");
}

function parseUnlockToken(token: string, userId: string, noteId: string) {
    const [iv, authTag, ciphertext] = token.split(".");

    if (!iv || !authTag || !ciphertext) {
        return null;
    }

    try {
        const decrypted = decryptBuffer(
            ciphertext,
            iv,
            authTag,
            getCookieKey(),
            `note-unlock:${userId}:${noteId}:v1`
        );
        const parsed = JSON.parse(decrypted.toString("utf8")) as {
            userId: string;
            noteId: string;
            encryptionKey: string;
            expiresAt: number;
        };

        if (
            parsed.userId !== userId ||
            parsed.noteId !== noteId ||
            parsed.expiresAt <= Date.now()
        ) {
            return null;
        }

        return Buffer.from(parsed.encryptionKey, "base64url");
    } catch {
        return null;
    }
}

export async function setUnlockCookie(
    noteId: string,
    userId: string,
    encryptionKey: Buffer
) {
    const cookieStore = await cookies();
    const expiresAt = Date.now() + UNLOCK_TTL_MS;
    cookieStore.set(
        getCookieName(noteId),
        buildUnlockToken({
            userId,
            noteId,
            encryptionKey: encryptionKey.toString("base64url"),
            expiresAt,
        }),
        {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/notes",
            expires: new Date(expiresAt),
        }
    );
}

export async function clearUnlockCookie(noteId: string) {
    const cookieStore = await cookies();
    cookieStore.set(getCookieName(noteId), "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/notes",
        expires: new Date(0),
    });
}

export async function getUnlockedEncryptionKey(
    noteId: string,
    userId: string
): Promise<Buffer | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(getCookieName(noteId))?.value;

    if (!token) {
        return null;
    }

    return parseUnlockToken(token, userId, noteId);
}

export function getMasterEncryptionKey() {
    return Buffer.from(getMasterKey());
}

export function getUnlockBlock(record: SecureNoteRow) {
    if (!record.unlock_blocked_until) {
        return null;
    }

    const blockedUntil = new Date(record.unlock_blocked_until);

    return blockedUntil.getTime() > Date.now() ? blockedUntil : null;
}

export function getFailedAttemptUpdate(record: SecureNoteRow) {
    const now = new Date();
    const firstFailedAt = record.first_failed_unlock_at
        ? new Date(record.first_failed_unlock_at)
        : null;
    const withinWindow =
        firstFailedAt &&
        now.getTime() - firstFailedAt.getTime() <= FAILED_UNLOCK_WINDOW_MS;
    const attempts = withinWindow ? record.failed_unlock_attempts + 1 : 1;
    const blocked =
        attempts >= MAX_FAILED_UNLOCKS
            ? new Date(now.getTime() + BLOCKED_UNLOCK_MS)
            : null;

    return {
        failed_unlock_attempts: attempts,
        first_failed_unlock_at: withinWindow ? firstFailedAt?.toISOString() : now.toISOString(),
        unlock_blocked_until: blocked?.toISOString() || null,
    };
}

export function getSuccessfulUnlockReset() {
    return {
        failed_unlock_attempts: 0,
        first_failed_unlock_at: null,
        unlock_blocked_until: null,
    };
}

export const NOTE_SECURITY_CONSTANTS = {
    PASSWORD_SCHEME_V2,
    PASSWORD_SCHEME_LEGACY_V1,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    MAX_FAILED_UNLOCKS,
    FAILED_UNLOCK_WINDOW_MS,
    BLOCKED_UNLOCK_MS,
    UNLOCK_TTL_MS,
};
