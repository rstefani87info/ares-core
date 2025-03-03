import crypto from "crypto";
import dataDescriptors from "./dataDescriptors.js";

const PASSWORD_DESCRIPTOR = {
  type: dataDescriptors.regexMap.password.id,
  pattern: dataDescriptors.regexMap.password.pattern,
  minLength: 8,
  maxLength: 100,
};

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES blocco IV a 16 byte

export function deriveKey(password, passwordDescriptor = PASSWORD_DESCRIPTOR) {
  if (passwordDescriptor) {
    const validated = dataDescriptors.format({ password }, descriptor, null);
    if (validated["€rror"]) {
      throw new Error(
        `Password descriptor ${passwordDescriptor.type} not supported`,
        validated["€rror"]
      );
    }
    return crypto.createHash("sha256").update(password).digest();
  }
}

export function encryptText(text, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

export function decryptText(text, key) {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "base64");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encryptObject(obj, password) {
  const key = deriveKey(password);
  function recursiveEncrypt(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    const encryptedObj = {};
    for (let [key, value] of Object.entries(obj)) {
      const encryptedKey = encryptText(key, key);
      encryptedObj[encryptedKey] =
        typeof value === "string"
          ? encryptText(value, key)
          : recursiveEncrypt(value);
    }
    return encryptedObj;
  }
  const result = recursiveEncrypt(obj);
  result["@aReS-encrypted"] = true;
  return result;
}

export function decryptObject(obj, password) {
  const key = deriveKey(password);
  function recursiveDecrypt(obj) {
    if (typeof obj !== "object" || obj === null) return obj;
    const decryptedObj = {};
    for (let [encKey, value] of Object.entries(obj)) {
      if (encKey === "@aReS-encrypted") continue;
      const decryptedKey = decryptText(encKey, key);
      decryptedObj[decryptedKey] =
        typeof value === "string"
          ? decryptText(value, key)
          : recursiveDecrypt(value);
    }
    return decryptedObj;
  }
  return recursiveDecrypt(obj);
}
