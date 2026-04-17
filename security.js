import crypto from "crypto";
import {dataDescriptors, regexMap, format} from "./dataDescriptors.js";

const PASSWORD_DESCRIPTOR = {
  type: dataDescriptors[regexMap.password.id],
  pattern: regexMap.password.pattern,
  minLength: 8,
  maxLength: 100,
  required: true,
  parametersValidationRoles: function (request) {
    return {
      password: {...PASSWORD_DESCRIPTOR, source:(req)=>req.password },
    }
  }
};

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = "sha256";
const LEGACY_SALT = "aReS-salt";
const DYNAMIC_PREFIX = "aReS:enc:v2";
const SALT_LENGTH = 16;

function validatePassword(password, passwordDescriptor = PASSWORD_DESCRIPTOR) {
  if (!passwordDescriptor) return;
  const req = { password };
  const validated = format(req, passwordDescriptor.parametersValidationRoles(req), null);
  if (validated["€rror"]) {
    throw new Error(`Password descriptor ${passwordDescriptor.type} not supported`);
  }
}

function deriveKey(password, options = {}) {
  const { passwordDescriptor = PASSWORD_DESCRIPTOR, salt = LEGACY_SALT } = options;
  validatePassword(password, passwordDescriptor);
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

function isDynamicEncryptedText(value) {
  return typeof value === "string" && value.startsWith(`${DYNAMIC_PREFIX}:`);
}

function encryptTextWithKey(text, key, salt = null) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  if (!salt) return iv.toString("base64") + ":" + encrypted;
  return `${DYNAMIC_PREFIX}:${salt.toString("base64")}:${iv.toString("base64")}:${encrypted}`;
}

export function encryptText(text, key, options = {}) {
  return encryptTextWithKey(text, key, options?.salt ?? null);
}

function decryptLegacyText(text, key) {
  const parts = text.split(":");
  const iv = Buffer.from(parts[0], "base64");
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function decryptDynamicText(text, password, options = {}) {
  const [, , , saltBase64, ivBase64, encryptedText] = text.split(":");
  const salt = Buffer.from(saltBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  const key = deriveKey(password, { ...options, salt });
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function decryptText(text, keyOrPassword, options = {}) {
  if (isDynamicEncryptedText(text)) {
    return decryptDynamicText(text, keyOrPassword, options);
  }
  return decryptLegacyText(text, keyOrPassword);
}

function encryptObject(obj, key, options = {}) {
  if (typeof obj !== "object" || !obj) return obj;
  const encryptedObj = {};
  for (const [objkey, value] of Object.entries(obj)) {
    const encryptedKey = encryptText(objkey, key, options);
    encryptedObj[encryptedKey] = encryptByKey(value, key, options);
  }
  encryptedObj["@aReS-encrypted"] = true;
  return encryptedObj;
}

function decryptObject(obj, key, options = {}) {
  if (typeof obj !== "object" || !obj) return obj;
  const decryptedObj = {};
  for (const [encKey, value] of Object.entries(obj)) {
    if (encKey === "@aReS-encrypted") continue;
    const decryptedKey = decryptByKey(encKey, key, options);
    decryptedObj[decryptedKey] = decryptByKey(value, key, options);
  }
  return decryptedObj;
}

function encryptArray(arr, key, options = {}) {
  return arr.map((item) => encryptByKey(item, key, options));
}

function decryptArray(arr, key, options = {}) {
  return arr.map((item) => decryptByKey(item, key, options));
}

export function encrypt(data, password, options = {}) {
  const salt = options?.salt ?? crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, { ...options, salt });
  return encryptByKey(data, key, { ...options, salt });
}

export function decrypt(data, password, options = {}) {
  const legacyKey = deriveKey(password, options);
  return decryptByKey(data, legacyKey, { ...options, password });
}

function encryptByKey(data, key, options = {}) {
  if (typeof data === "string") {
    return encryptText(data, key, options);
  }
  if (Array.isArray(data)) {
    return encryptArray(data, key, options);
  }
  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data;
  }
  if (typeof data === "object" && data !== null) {
    return encryptObject(data, key, options);
  }
  return data;
}

function decryptByKey(data, key, options = {}) {
  if (typeof data === "string") {
    const decryptor = isDynamicEncryptedText(data) ? options?.password ?? key : key;
    return decryptText(data, decryptor, options);
  }
  if (Array.isArray(data)) {
    return decryptArray(data, key, options);
  }
  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data;
  }
  if (typeof data === "object" && data !== null) {
    return decryptObject(data, key, options);
  }
  return data;
}
