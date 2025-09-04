// functions/src/core/crypto.ts
import * as crypto from "crypto";
import { logger } from "firebase-functions";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export function encrypt(text: string, key: string): string {
    logger.info("[DEBUG] [CRYPTO] Iniciando função encrypt.");
    if (!key || key.length !== 32) {
        logger.error("[DEBUG] [CRYPTO] ERRO: A chave de criptografia fornecida é inválida.");
        throw new Error("A chave de criptografia fornecida é inválida.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
    logger.info("[DEBUG] [CRYPTO] Texto criptografado com sucesso.");
    return result;
}

export function decrypt(text: string, key: string): string {
    logger.info("[DEBUG] [CRYPTO] Iniciando função decrypt.");
    if (!key || key.length !== 32) {
        logger.error("[DEBUG] [CRYPTO] ERRO: A chave de descriptografia fornecida é inválida.");
        throw new Error("A chave de criptografia fornecida é inválida.");
    }
    const [ivHex, authTagHex, encryptedHex] = text.split(":");
    if (!ivHex || !authTagHex || !encryptedHex) {
        logger.error("[DEBUG] [CRYPTO] ERRO: O formato do texto criptografado é inválido.");
        throw new Error("Formato de texto criptografado inválido.");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const result = decrypted.toString();
    logger.info("[DEBUG] [CRYPTO] Texto descriptografado com sucesso.");
    return result;
}