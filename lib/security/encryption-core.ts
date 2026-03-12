import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { getServerEnv } from "@/lib/env.server";

const IV_LENGTH = 12;

function buildKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

export function encryptText(plainText: string) {
  const { APP_ENCRYPTION_KEY } = getServerEnv();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", buildKey(APP_ENCRYPTION_KEY), iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString(
    "base64",
  )}`;
}

export function decryptText(cipherText: string) {
  const { APP_ENCRYPTION_KEY } = getServerEnv();
  const [ivPart, tagPart, dataPart] = cipherText.split(":");

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    buildKey(APP_ENCRYPTION_KEY),
    Buffer.from(ivPart, "base64"),
  );

  decipher.setAuthTag(Buffer.from(tagPart, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function hashText(value: string) {
  const { TELEGRAM_ENCRYPTION_SECRET } = getServerEnv();
  return createHash("sha256")
    .update(`${TELEGRAM_ENCRYPTION_SECRET}:${value}`)
    .digest("hex");
}
