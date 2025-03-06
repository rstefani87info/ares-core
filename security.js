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

function deriveKey(password, passwordDescriptor = PASSWORD_DESCRIPTOR) {
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

function encryptObject(obj, key) {
    if (typeof obj !== "object" || !obj) return obj;
    const encryptedObj = {};
    for (let [key, value] of Object.entries(obj)) {
      const encryptedKey = encryptText(key, key);
      encryptedObj[encryptedKey] =  encryptByKey(value, key);
    }
     
    encryptedObj["@aReS-encrypted"] = true;
    return encryptedObj;
}

function decryptObject(obj, key) {
    if (typeof obj !== "object" || !obj) return obj;
    const decryptedObj = {};
    for (let [encKey, value] of Object.entries(obj)) {
      if (encKey === "@aReS-encrypted") continue;
      const decryptedKey = decryptText(encKey, key);
      decryptedObj[decryptedKey] =decryptByKey(value, key);
    }
    return decryptedObj;
}


function encryptArray (arr, key){
  return arr.map(item => encrypt(item, key));
}

function decryptArray (arr, key){
  return arr.map(item => decrypt(item, key));
}

export function encrypt (data, password){
  const key = deriveKey(password);
  return   encryptByKey (data, key);
}
export function decrypt(data, password) {
  const key = deriveKey(password);
  return decryptByKey(data, key);
}


function encryptByKey (data, key){
  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data;
  }

  if (data && data instanceof String) {
    return encryptText(data, key);
  }

  if (data && Array.isArray(data)) {
    return encryptArray(data, key);
  }

  if (data && typeof data === "object") {
    return encryptObject(data, key);
  }

  return data;
}

function decryptByKey (data, key){
  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data;
  }

  if (data && data instanceof String) {
    return decryptText(data, key);
  }

  if (data && Array.isArray(data)) {
    return decryptArray(data, key);
  }

  if (data && typeof data === "object") {
    return decryptObject(data, key);
  }

  return data;
}
