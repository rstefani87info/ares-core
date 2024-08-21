import { findPropValueByAlias } from "./objects.js";
import numeral from "numeral";

/**
 * a mapping of the most common data descriptors useful for validation and formatting
 */
export const objectDescriptorDefinitions = {
  text: {
    parse: (s) => s + "",
    minLength: (v, m) => (m > 0 ? v.length >= m : true),
    maxLength: (v, m) => (m > 0 ? v.length <= m : true),
    minValue: (v, m) => (m ? v >= m : true),
    maxValue: (v, m) => (m ? v <= m : true),
    pattern: (v, p) => {
      if (p) return v.match(p);
      else return true;
    },
  },
  number: {
    parse: (s) => new Number(s + ""),
    minLength: (v, m) => (m > 0 ? ("" + v).length >= m : true),
    maxLength: (v, m) => (m > 0 ? ("" + v).length <= m : true),
    minDecimalLength: (v, m) =>
      m > 0 ? ("" + v).split("[.,]").pop().length >= m : true,
    maxDecimalLength: (v, m) =>
      m > 0 ? ("" + v).split("[.,]").pop().length <= m : true,
    minValue: (v, m) => (m ? v >= m : true),
    maxValue: (v, m) => (m ? v <= m : true),
    format: (v, f) => {
      if (f) {
        try {
          const number = numeral(v).value();
          const formattedNumber = numeral(number).format(f);

          // Controlla se la stringa formattata corrisponde alla stringa originale
          return formattedNumber === v;
        } catch (e) {
          return false;
        }
      }
      return false;
    },
    pattern: (v, p) => {
      if (p) return ("" + v).match(p);
      else return ("" + v).match("\\d+(\\.\\d+)");
    },
  },

  "date([\\s\\-_]*time)?|time": {
    parse: (s, f) => (f ? moment(v, f) : moment(v)),
    minValue: (v, m, f) =>
      m
        ? f
          ? moment(v, f)
          : moment(v).toDate() >= f
          ? moment(m, f).toDate()
          : moment(m).toDate()
        : true,
    maxValue: (v, m, f) =>
      m
        ? f
          ? moment(v, f)
          : moment(v).toDate() <= f
          ? moment(m, f).toDate()
          : moment(m).toDate()
        : true,
    format: (v, f) => (f ? moment(v, f) : moment(v)),
    pattern: (v, p) => {
      if (p) return ("" + v).match(p);
      else return true;
    },
  },
};

/**
 * @prototype {Object}  
 * @param {Object} this_object
 * @param {Object} descriptor
 * 
 * Format an object according to the descriptor
 */
export async function format(this_object, descriptor) {
  const ret = {};
  for (const k in descriptor) {
    console.log(" - formatting: " + k);
    ret[k] = descriptor.source? descriptor.source(this_object, k) : this_object[k];
    const objectDescriptorDefinitionKey = descriptor[k]?.type || null;
    const objectDescriptorDefinition = findPropValueByAlias(
      objectDescriptorDefinitions,
      objectDescriptorDefinitionKey
    );
    if (descriptor.normalization) {
      ret[k] = await descriptor.normalization(ret[k]);
    }
    if (descriptor.defaultValue && !ret[k]) {
      ret[k] = descriptor.defaultValue;
      if (ret[k] instanceof Object || Array.isArray(ret[k])) {
        ret[k] = JSON.parse(JSON.stringify(ret[k]));
      }
    }
    if (descriptor[k].required && !ret[k]) {
      setRequestError(ret, k, "required");
    }
    if (
      descriptor[k].minValue &&
      !(
        objectDescriptorDefinition?.minValue(ret[k], descriptor[k].minValue) ||
        null
      )
    ) {
      setRequestError(ret, k, "minValue");
    }
    if (
      descriptor[k].maxValue &&
      !(
        objectDescriptorDefinition?.maxValue(ret[k], descriptor[k].maxValue) ||
        null
      )
    ) {
      setRequestError(ret, k, "maxValue");
    }
    if (
      descriptor[k].minLength &&
      !(
        objectDescriptorDefinition?.minLength(
          ret[k],
          descriptor[k].minLength
        ) || null
      )
    ) {
      setRequestError(ret, k, "minLength");
    }
    if (
      descriptor[k].maxLength &&
      !(
        objectDescriptorDefinition?.maxLength(
          ret[k],
          descriptor[k].maxLength
        ) || null
      )
    ) {
      setRequestError(ret, k, "maxLength");
    }
    if (
      descriptor[k].minDecimalLength &&
      !(
        objectDescriptorDefinition?.minDecimalLength(
          ret[k],
          descriptor[k].minDecimalLength
        ) || null
      )
    ) {
      setRequestError(ret, k, "minDecimalLength");
    }
    if (
      descriptor[k].maxDecimalLength &&
      !(
        objectDescriptorDefinition?.maxDecimalLength(
          ret[k],
          descriptor[k].maxDecimalLength
        ) || null
      )
    ) {
      setRequestError(ret, k, "maxDecimalLength");
    }
    if (
      descriptor[k].pattern &&
      !(
        objectDescriptorDefinition?.pattern(ret[k], descriptor[k].pattern) ||
        null
      )
    ) {
      setRequestError(ret, k, "pattern");
    }
    if (
      descriptor[k].format &&
      !(
        objectDescriptorDefinition?.format(ret[k], descriptor[k].format) || null
      )
    ) {
      setRequestError(ret, k, "format");
    }
    if (
      descriptor[k].transform &&
      typeof descriptor[k].transform === "function"
    ) {
      ret[k] = await descriptor[k].transform(ret[k]);
    }
    if (descriptor[k].exists) {
      if (
        (typeof descriptor[k].exists === "function" &&
          !(await descriptor[k].exists(ret[k]))) ||
        (Array.isArray(descriptor[k].exists) &&
          !descriptor[k].exists.includes(ret[k]))
      ) {
        setRequestError(ret, k, "exists");
      }
    }
    if (
      (descriptor[k].notExists &&
        typeof descriptor[k].notExists === "function" &&
        !(await descriptor[k].notExists(ret[k]))) ||
      (Array.isArray(descriptor[k].notExists) &&
        !descriptor[k].notExists.includes(ret[k]))
    ) {
      setRequestError(ret, k, "notExists");
    }
  }
  return ret;
}

function setRequestError(requestParams, property, cause) {
  if (!requestParams["€rror"]) requestParams["€rror"] = {};
  if (!requestParams["€rror"][property]) requestParams["€rror"][property] = [];
  requestParams["€rror"][property] = [
    ...requestParams["€rror"][property],
    cause,
  ];
}

/**
 * Data descriptors
 */
export const dataDescriptors = {
  "(person(al){0,1}[\\s\\-_]*|sur|first[\\s\\-_]*|last[\\s\\-_]*)name": {
    type: "text",
    normalization: (s) =>
      s
        .split(/[^a-zA-Z]+/)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
        .join(" "),
    pattern: /^\s*[a-z]{3,}(\s[a-z]{3,})*\s*$/i,
    minLength: 3,
  },
  date: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD",
    maxLength: 10,
    minLength: 10,
  },
  "date([\\s\\-_]){0,1}time": {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mm:ss",
    minLength: 10,
  },
  "sql([\\s\\-_]){0,1}date([\\s\\-_]){0,1}time": {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mm:ss.sssZ",
    maxLength: 19,
    minLength: 10,
  },
  "date([\\s\\-_]){0,1}time([+]|[+\\s\\-_]offset){0,1}": {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mmZ",
    minLength: 10,
  },
  time: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "HH:mm:ssZ",
    maxLength: 10,
    minLength: 10,
  },
  "common[\\s\\-_]name": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[\w]+[ \w]*$/,
    maxLength: 100,
    minLength: 5,
  },
  "((tele){0,1}phone|tel)([\\s\\-_](number|#)){0,1}": {
    type: "text",
    normalization: (s) => s.trim().replaceAll(/[.-\s\/\\]+/, ""),
    pattern: /^(\+?\d{2,3})?[.-\s\/\\0-9]{10,}$/,
    minLength: 10,
  },
  "(@|email)[\\s\\-_](address){0,1}": {
    type: "text",
    normalization: (s) => s.trim().toLowerCase(),
    pattern: /^[\w-]+@[\w-]+\.[\w-]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ip([\\s\\-_]*v4)?([\\s\\-_]*address){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    maxLength: 15,
    minLength: 5,
  },
  "ip([\\s\\-_]*v6){1}([\\s\\-_]*address){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}$/,
    maxLength: 39,
    minLength: 5,
  },
  "http[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ftp[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:ftp(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ssh[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:ssh(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "smtp[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:smtp(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "pop3[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:pop3(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "blob[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:blob(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "file[s]?([\\s\\-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:file(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "hash[\\s\\-_]*md5": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{32}$/,
    maxLength: 32,
    minLength: 32,
  },
  "crc([\\s\\-_]*32)?[\\s\\-_](hash){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{8}$/,
    maxLength: 8,
    minLength: 8,
  },
  "crc[\\s\\-_]*64?[\\s\\-_](hash){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{16}$/,
    maxLength: 16,
    minLength: 16,
  },
  "user([\\s\\-_]*(name)){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-zA-Z0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "password|pwd": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    maxLength: 100,
    minLength: 5,
  },
  "zip[\\s\\-_]?(code){0,1}": {
    type: "text",
    pattern: /^\d{5}$/,
    maxLength: 5,
    minLength: 5,
  },
  "country[\\s\\-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}$/,
    maxLength: 2,
    minLength: 2,
  },
  "language[\\s\\-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}([-_][A-Z]{2}){0,1}$/,
    maxLength: 2,
    minLength: 2,
  },
  "province|city[\\s\\-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}$/,
    maxLength: 2,
    minLength: 2,
  },
  "bool(ean)?|y(es)([\\s\\-_]*or)([\\s\\-_]*n(o(t)?)?)|binary[\\s\\-_]*digit|true([\\s\\-_]*or)([\\s\\-_]*false)":
    { type: "boolean" },
  "(real|float|double|decimal|numeric|r)?[\\s\\-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^[+-]?[0-9]+([.,]{0,1}[0-9])?$/,
  },
  "(positive|+)[\\s\\-_]*(real|float|double|decimal|numeric|r)[\\s\\-_]*(n(umber)?|°|#)?":
    {
      type: "number",
      pattern: /^(\+)?[1-9]+([.,]{0,1}[0-9])?$/,
      normalization: (s) => s.trim(),
    },
  "(negative|-)[\\s\\-_]*(real|float|double|decimal|numeric|r)[\\s\\-_]*(n(umber)?|°|#)?":
    {
      type: "number",
      pattern: /^-[1-9]+([.,]{0,1}[0-9])?$/,
      normalization: (s) => s.trim(),
    },
  "integer[\\s\\-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^[+-]?[0-9]+$/,
    normalization: (s) => s.trim(),
  },
  "((positive|+)[\\s\\-_]*integer|natural|n)[\\s\\-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^(\+)?[1-9]+$/,
    normalization: (s) => s.trim(),
  },
  "(negative|-)[\\s\\-_]*integer[\\s\\-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^-[1-9]+$/,
    normalization: (s) => s.trim(),
  },
  "(geographical)[\\s\\-_]*coordinate": {
    type: "number",
    pattern: /^[+-]?[0-9]+(\.[0-9]+)?$/,
    normalization: (s) => s.trim(),
  },
  "(geographical)[\\s\\-_]*coordinates": {
    type: "array",
    pattern: /^[+\\-]?[0-9]+(\.[0-9]+)?([\s,][+\\-]?[0-9]+(\.[0-9]+)?)?$/,
    normalization: (s) => s.trim().split(/[\s,]/),
  },
  hashtag: {
    type: "text",
    pattern: /^#[a-zA-Z0-9_]+$/,
  },
  "facebook[\\s\\-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "instagram[\\s\\-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "(x|twitter)[\\s\\-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "youtube[\\s\\-_]*(id){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ticktock[\\s\\-_]*(id){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "mime[\\s\\-_]*(type){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+\/[a-zA-Z0-9_+-. ]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "image[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^jpg|jpeg|png|gif|webp|svg|tiff|avif|apng|jfif|bmp$/,
  },
  "video[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^mp4|mkv|webm|mov|avi|3gp|flv|wmv|mpeg|mpg|m4v|ogv|ogm|mk3d|gifv|3gpp|3g2|3gpp2|hevc|heic|av1|h264|h265|avchd|heif$/,
  },
  "audio[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^mp3|wav|ogg|flac|aac|wma|webm|m4a|aiff|amr|opus|vorbis|3gpp|3g2|3gpp2|amr|aac|m4a$/,
  },
  "document[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^pdf|doc|docx|odt|rtf|txt|wps$/,
  },
  "text[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^txt|wps|vb|vbs|php|js|css|html|xml|xsl(t)?|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|ts|tsx|vue|jsx$/,
  },
  "programming[\\s\\-_]*lang(uage)[\\s\\-_]*file[\\s\\-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^vb|vbs|php|js|css|html|xml|xsl(t)?|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|ts|tsx|vue|jsx$/,
  },

  'jwt|json\s\\-_]*[wW]eb[\\s\\-_]*[tT]oken|json(\s\\-_]*[wW]eb[\\s\\-_]*[tT]oken': {
    type: "text",
    pattern: /^[A-Za-z0-9-_]{36,64}\.[A-Za-z0-9-_]{50,200}\.[A-Za-z0-9-_]{43,86}$/

  },
  'sha1':{
    type: "text",
    pattern: /^[a-f0-9]{40}$/
  },
  'sha256':{
    type: "text",
    pattern: /^[a-f0-9]{64}$/
  },
  'sha512':{
    type: "text", 
    pattern: /^[a-f0-9]{128}$/
  }, //fallo per altri algoritmi di encryption

  'md5':{
    type: "text",
    pattern: /^[a-f0-9]{32}$/
  },

  'base64':{
    type: "text", 
    pattern: /^[a-zA-Z0-9+\/]+={0,2}$/
  },

  'base64url':{
    type: "text",
    pattern: /^[a-zA-Z0-9-_]+={0,2}$/
  },

  'base32':{
    type: "text",
    pattern: /^[a-zA-Z2-7]+={0,2}$/
  },

  'base16':{
    type: "text",
    pattern: /^[a-zA-Z0-9]+={0,2}$/
  },


};
