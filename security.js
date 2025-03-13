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
const IV_LENGTH = 16; // AES blocco IV a 16 byte


function deriveKey(password, passwordDescriptor = PASSWORD_DESCRIPTOR) {
  if (passwordDescriptor) {
    const req ={ password };
    const validated = format(req, passwordDescriptor.parametersValidationRoles(req), null);
    if (validated["€rror"]) {
      throw new Error(
        `Password descriptor ${passwordDescriptor.type} not supported`,
        validated["€rror"]
      );
    }
    return crypto.pbkdf2Sync(password, "aReS-salt", 100000, 32, "sha256");
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
    for (let [objkey, value] of Object.entries(obj)) {
      const encryptedKey = encryptText(objkey, key);
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

function encryptByKey(data, key) {
  if (typeof data === "string") {
    return encryptText(data, key); // Ora cifra correttamente le stringhe!
  }

  if (Array.isArray(data)) {
    return encryptArray(data, key);
  }

  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data; // Non cifrare questi tipi
  }

  if (typeof data === "object" && data !== null) {
    return encryptObject(data, key);
  }

  return data;
}

function decryptByKey(data, key) {
  if (typeof data === "string") {
    return decryptText(data, key); // Ora decifra correttamente le stringhe!
  }

  if (Array.isArray(data)) {
    return decryptArray(data, key);
  }

  if (typeof data === "number" || typeof data === "boolean" || data instanceof Date || data instanceof RegExp || data instanceof Function) {
    return data; // Non cifrare questi tipi
  }

  if (typeof data === "object" && data !== null) {
    return decryptObject(data, key);
  }

  return data;
}