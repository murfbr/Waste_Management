// functions/src/core/crypto.ts
import { defineString } from "firebase-functions/params";
import * as crypto from "crypto";

export const ineaEncryptionKey = defineString("INEA_ENCRYPTION_KEY");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    const key = ineaEncryptionKey.value();
    if (!key || key.length !== 32) {
        throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente no ambiente.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(text: string): string {
    const key = ineaEncryptionKey.value();
    if (!key || key.length !== 32) {
        throw new Error("A chave de criptografia (INEA_ENCRYPTION_KEY) não está configurada corretamente no ambiente.");
    }
    const [ivHex, authTagHex, encryptedHex] = text.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error("Formato de texto criptografado inválido.");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
}