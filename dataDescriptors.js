import numeral from "numeral";
import { findPropValueByAlias } from "./objects.js";
import { stringTokenizer, capitalizeTokens } from "./text.js";

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
      if (p) return (v + "").match(p);
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

  "date([+s-_]*time)?|time": {
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
export async function format(this_object, descriptor, db) {
  const ret = {};
  for (const k in descriptor) {
    ret[k] = descriptor[k].source
      ? descriptor[k].source(this_object, k)
      : this_object[k];
    const objectDescriptorDefinitionKey = descriptor[k]?.type || "text";
    console.log("objectDescriptorDefinitionKey:", k, descriptor[k]);
    if (
      objectDescriptorDefinitionKey.match(regexMap.identity.id) &&
    ) {
      ret[k] = db.hashKeyMap[ret[k]];
    }
    const objectDescriptorDefinition = findPropValueByAlias(
      objectDescriptorDefinitions,
      objectDescriptorDefinitionKey
    );
    if (descriptor[k].normalization) {
      ret[k] = await descriptor[k].normalization(ret[k]);
    }
    if (descriptor[k].defaultValue && !ret[k]) {
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
    if (descriptor[k].pattern) {
      const match = objectDescriptorDefinition.pattern(
        ret[k],
        descriptor[k].pattern
      );
      if (!match) setRequestError(ret, k, "pattern");
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

export const regexMap = {
  text: { id: /^text|$/, tokenizer: /[a-zA-Z]+|[^a-zA-Z]+/gm },
  personalName: {
    id: /^(proper|person(al)?|sur|first|last|family)[+\s\-_]*name$/gi,
    pattern: /^\s*[a-z]{3,}(\s[a-z]{2,})*\s*$/gi,
  },
  commonName: {
    id: /^common[+\s\-_]*name$/i,
    pattern: /^\s*[a-z]{3,}(\s[a-z]{3,})*\s*$/gi,
    pattern: /^\s*([a-z]{1}\.)+|([\s\-_]*[a-z]{3,})*\s*$/gi,
  },
  email: {
    id: /^(@|email)([+\s\-_]*address)?$/i,
    pattern: /^[a-zA-Z0-9\._%+-]+@[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,}$/gi,
  },
  username: {
    id: /^user([+\s\-_]*(name))?|handle|nik([+\s\-_]*(name))?$/i,
    pattern: /^[a-zA-Z0-9\._%+-]+$/gi,
  },
  password: {
    id: /^password|pwd$/i,
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g,
  },
  zipCode: {
    id: /^(zip|cap|location)([+\s\-_]*code)?$/i,
    pattern: /^\d{5}(-\d{4})?$/gi,
  },
  countryCode: { id: /^country[+\s\-_]*(code)?$/i, pattern: /^[A-Z]{2}$/gi },
  languageCode: {
    id: /^language[+\s\-_]*(code)?$/i,
    pattern: /^[A-Z]{2}([-_][A-Z]{2})?$/gi,
  },
  currencyCode: { id: /^currency[+\s\-_]*(code)?$/i, pattern: /^[A-Z]{3}$/gi },
  boolean: {
    id: /^bool(ean)?|y(es)([+\s\-_]*or)([+\s\-_]*n(o(t)?)?)|binary[+\s\-_]*digit|true([+\s\-_]*or)([+\s\-_]*false)|switch|on([+\s\-_]*or)([+\s\-_]*off)$/i,
    pattern: /^(true|false|on|off|1|0|yes|no||y|n|null|not)$/gi,
  },
  nullableBoolean: {
    id: /^(null(able)?|\?)[+\s\-_]*bool(ean)?|y(es)([+\s\-_]*or)([+\s\-_]*n(o(t)?)?)|binary[+\s\-_]*digit|true([+\s\-_]*or)([+\s\-_]*false)|switch|on([+\s\-_]*or)([+\s\-_]*off)$/,
    pattern: /^(true|false|on|off|1|0|yes|no||y|n|null|not|undefined)$/gi,
  },
  number: { id: /^number|°|#$/i, pattern: /^[+-]?[0-9]+([\.]?[0-9])?$/gi },
  date: { id: /^date$/i },
  isodate: {
    id: /^iso([+\s\-_]*)?date$/i,
    pattern: /^(\d{4})-(\d{2})-(\d{2})$/gi,
  },
  datetime: { id: /^date([+\s\-_]*)?time$/i },
  sqldatetime: {
    id: /^sql([+\s\-_]*)?date([+\s\-_]*)?time$/i,
    pattern:
      /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?$/gi,
  },
  isodatetime: {
    id: /^iso([+\s\-_]*)?date([+\s\-_]*)?time$/i,
    pattern:
      /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?$/gi,
  },
  time: { id: /^time$/i },
  isotime: {
    id: /^iso([+\s\-_]*)?time$/i,
    pattern: /^(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?$/gi,
  },
  datetimeoffset: { id: /^date(([+\s\-_]*)?time)?([+]|[+\s\-_]offset)?$/i },
  phoneNumber: {
    id: /^((tele)?phone|tel)([+\s\-_]*(number|#))?$/i,
    pattern: /^(\+?\d{2,3})?[.-\s\/\\0-9]{10,}$/gi,
  },
  gpsCoordinate: {
    id: /^gps[+\s\-_]*coordinates$/i,
    pattern: /^[+-]?[0-9]+(\.[0-9]+)?$/,
  },
  gpsCoordinates: {
    id: /^gps[+\s\-_]*coordinates$/i,
    pattern: /^[+-]?[0-9]+(\.[0-9]+),[+-]?[0-9]+(\.[0-9]+)?$/,
  },
  hashtag: {
    id: /^hashtag$/i,
    pattern: /^#[a-zA-Z0-9_]+$/,
  },
  mimeType: { id: /^mime([+s-_]*type)?$/i, pattern: /^[a-zA-Z0-9_]+\/[a-zA-Z0-9_+-. ]+$/},
  imageFileExtension: {
    id: /^image[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(jpg|jpeg|png|gif|bmp|tiff|svg|webp|heic|heif|ico|psd|raw|cr2|nef|orf|sr2|raf|dng|arw|3fr|ai|arw|bay|bpg|cap|cin|crw|cs1|cur|dc2|dcr|dds|djvu|erf|exr|fff|fits|fpx|gbr|hrd|iff|iiq|j2k|jng|jp2|jpe|jpf|jpx|k25|kdc|mef|mng|mrw|nrw|ora|pbm|pcd|pct|pcx|pef|pgf|pgm|pnm|ppm|psb|ptx|pxn|r3d|rle|rw2|rwl|sct|sfw|srw|tga|webp|x3f|xcf|yuv)$/i,
  },
  videoFileExtension: {
    id: /^video[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(mp4|m4v|mov|avi|wmv|flv|f4v|mkv|webm|mpeg|mpg|3gp|3g2|ogg|ogv|mts|m2ts|ts|vob|mxf|rm|rmvb|asf|swf|dv|divx|xvid|h264|hevc|avchd|mpe|mpv|m2v|amv|bik|drc|fli|flic|ivf|mjpg|mjpeg|roq|svi|yuv)$/i,
  },
  audioFileExtension: {
    id: /^audio[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(mp3|wav|aac|flac|alac|ogg|oga|opus|wma|m4a|m4b|m4p|aiff|aif|aifc|au|ra|rm|mid|midi|mpa|mpc|amr|dss|dvf|gsm|iklax|ivs|m3u|m3u8|pls|xspf|tta|voc|vox|wv)$/i,
  },
  documentFileExtension: {
    id: /^document[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(pdf|doc|docx|odt|rtf|txt|tex|wpd|wps|ppt|pptx|odp|xls|xlsx|ods|csv|tsv|epub|mobi|azw|azw3|ibooks|fb2|djvu|ps|md|rst|rtfd|pages|key|numbers|xml|xps|oxps|sdw|sgm|sgml|wks|wp|gdoc|gsheet|gslides)$/i,
  },
  textFileExtension: {
    id: /^(plain|(plain[+s-_]*)?t[e]?xt|t[e]?xt([+s-_]*plain)?)[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(txt|wps|vb|vbs|php|js|css|html|xml|xsl|xslt|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|tsx|vue|jsx)$/i,
  },
  markupLanguageFileExtension: {
    id: /^markup[+s-_]*lang(uage)?[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(xml|html|xhtml|xht|svg|rss|atom|kml|gpx|xsd|xslt|xsl|xul|xaml|xlf|xliff|svgz|wsdl|opf|ncx|plist|rdf|smil|mathml|collada|scxml|sitemap|xbrl|cxml|dita|ditamap|x3d|sldx|docx|pptx|xlsx|odt|ods|odp|gml|ebxml|rvt|lvproj)$/i,
  },
  dataFileExtension: {
    id: /^data[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(csv|tsv|xml|json|yaml|yml|toml|ini|sql|ts|scss|sass|properties|init|conf|cfg|json5|jsonc|jsonl|jsonml|json5l|jsonmlc|css|scss|sass|js|ejs|cjs)$/i,
  },
  oopFileExtension: {
    id: /^oop[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(js|jsx|ts|tsx|json|java|php|cs|cpp|c|py|rb|go|ts|scss|sass|ejs|cjs)$/i,
  },
  programmingLanguageFileExtension: {
    id: /^prog(r(amming)?)?[+s-_]*lang(uage)?[+s-_]*file[+s-_]*ext(ension)?$/i,
    pattern: /\.(vb|vbs|php|js|css|cjs|ejs|html|xhtml|xht|shtm|xml|xsl|xslt|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|tsx|vue|jsx)$/i,
  },
  jwt: {
    id: /^jwt|json[+s-_]*web[+s-_]*token$/i,
    pattern: /^[A-Za-z0-9-_]{36,64}\.[A-Za-z0-9-_]{50,200}\.[A-Za-z0-9-_]{43,86}$/,
  },
  identity: {
    id: /^id(enti(fier|ty)?)?|(primary[+s-_]*)?key|index|idx$/i,
    pattern: /^[a-f0-9]{128}$/i,
  },
  ip: {
    id: /^ip([+\s\-_]*v4)?([+\s\-_]*address)?$/i,
    pattern:
      /^(([0-9]{1,2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]{1,2}|2[0-4][0-9]|25[0-5])$/gi,
  },
  ipv6: {
    id: /^ip([+\s\-_]*v6){1}([+\s\-_]*address)?$/i,
    pattern:
      /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}((:[0-9A-Fa-f]{1,4}){1,2}))|(([0-9A-Fa-f]{1,4}:){1,4}((:[0-9A-Fa-f]{1,4}){1,3}))|(([0-9A-Fa-f]{1,4}:){1,3}((:[0-9A-Fa-f]{1,4}){1,4}))|(([0-9A-Fa-f]{1,4}:){1,2}((:[0-9A-Fa-f]{1,4}){1,5}))|([0-9A-Fa-f]{1,4}:)((:[0-9A-Fa-f]{1,4}){1,6})|:((:[0-9A-Fa-f]{1,4}){1,7}|:)|((([0-9A-Fa-f]{1,4}:){6}|:):((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|::([fF]{4}:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?){1,4}))$/g,
  },
  urls: {
    url: {
      id: /^url$/i,
      pattern:
        /^((([a-zA-Z0-9+.-]+):\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?)(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    httpUrl: {
      id: /^http[s]?([+\s\-_]*url)?$/i,
      pattern:
        /^(https?:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    httpsUrl: {
      id: /^https([+\s\-_]*url)?$/i,
      pattern:
        /^(https:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    ftpUrl: {
      id: /^ftp[s]?([+\s\-_]*url)?$/i,
      pattern:
        /^(ftp(s)?:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    ftpsUrl: {
      id: /^ftps?([+\s\-_]*url)?$/i,
      pattern:
        /^(ftps:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    smtpUrl: {
      id: /^smtp?([+\s\-_]*url)?$/i,
      pattern:
        /^(smtp:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    pop3Url: {
      id: /^pop3?([+\s\-_]*url)?$/i,
      pattern:
        /^(pop3:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    sshUrl: {
      id: /^ssh?([+\s\-_]*url)?$/i,
      pattern:
        /^(ssh:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    blobUrl: {
      id: /^blob?([+\s\-_]*url)?$/i,
      pattern:
        /^(blob:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    fileUrl: {
      id: /^file?([+\s\-_]*url)?$/i,
      pattern:
        /^(file:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    imapUrl: {
      id: /^imap?([+\s\-_]*url)?$/i,
      pattern:
        /^(imap:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    ldapUrl: {
      id: /^ldap?([+\s\-_]*url)?$/i,
      pattern:
        /^(ldap:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?$/g,
    },
    uuid: {
      id: /^uuid|unique([+\s\-_]*id)?$/i,
      pattern:
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/g,
    },
  },
  hashes: {
    md5: { id: /^hash[+\s\-_]*md5$/i, pattern: /^[a-fA-F0-9]{32}$/g },
    sha1: { id: /^hash[+\s\-_]*sha1$/i, pattern: /^[a-fA-F0-9]{40}$/g },
    sha256: { id: /^hash[+\s\-_]*sha256$/i, pattern: /^[a-fA-F0-9]{64}$/g },
    sha512: { id: /^hash[+\s\-_]*sha512$/i, pattern: /^[a-fA-F0-9]{128}$/g },
    sha3_224: { id: /^hash[+\s\-_]*sha3_224$/i, pattern: /^[a-fA-F0-9]{56}$/g },
    sha3_256: { id: /^hash[+\s\-_]*sha3_256$/i, pattern: /^[a-fA-F0-9]{64}$/g },
    sha3_384: { id: /^hash[+\s\-_]*sha3_384$/i, pattern: /^[a-fA-F0-9]{96}$/g },
    sha3_512: {
      id: /^hash[+\s\-_]*sha3_512$/i,
      pattern: /^[a-fA-F0-9]{128}$/g,
    },
    blake2b_256: {
      id: /^hash[+\s\-_]*blake2b_256$/i,
      pattern: /^[a-fA-F0-9]{64}$/g,
    },
    blake2b_384: {
      id: /^hash[+\s\-_]*blake2b_384$/i,
      pattern: /^[a-fA-F0-9]{96}$/g,
    },
    blake2b_512: {
      id: /^hash[+\s\-_]*blake2b_512$/i,
      pattern: /^[a-fA-F0-9]{128}$/g,
    },
    blake2s_256: {
      id: /^hash[+\s\-_]*blake2s_256$/i,
      pattern: /^[a-fA-F0-9]{32}$/g,
    },
    blake2s_384: {
      id: /^hash[+\s\-_]*blake2s_384$/i,
      pattern: /^[a-fA-F0-9]{48}$/g,
    },
    blake2s_512: {
      id: /^hash[+\s\-_]*blake2s_512$/i,
      pattern: /^[a-fA-F0-9]{64}$/g,
    },
    keccak_256: {
      id: /^hash[+\s\-_]*keccak_256$/i,
      pattern: /^[a-fA-F0-9]{64}$/g,
    },
    keccak_384: {
      id: /^hash[+\s\-_]*keccak_384$/i,
      pattern: /^[a-fA-F0-9]{96}$/g,
    },
    keccak_512: {
      id: /^hash[+\s\-_]*keccak_512$/i,
      pattern: /^[a-fA-F0-9]{128}$/g,
    },
    ripemd_128: {
      id: /^hash[+\s\-_]*ripemd_128$/i,
      pattern: /^[a-fA-F0-9]{32}$/g,
    },
    ripemd_160: {
      id: /^hash[+\s\-_]*ripemd_160$/i,
      pattern: /^[a-fA-F0-9]{40}$/g,
    },
    ripemd_256: {
      id: /^hash[+\s\-_]*ripemd_256$/i,
      pattern: /^[a-fA-F0-9]{64}$/g,
    },
    ripemd_320: {
      id: /^hash[+\s\-_]*ripemd_320$/i,
      pattern: /^[a-fA-F0-9]{80}$/g,
    },
    ripemd_384: {
      id: /^hash[+\s\-_]*ripemd_384$/i,
      pattern: /^[a-fA-F0-9]{96}$/g,
    },
    ripemd_512: {
      id: /^hash[+\s\-_]*ripemd_512$/i,
      pattern: /^[a-fA-F0-9]{128}$/g,
    },
    crc32: { id: /^hash[+\s\-_]*crc32$/i, pattern: /^[a-fA-F0-9]{8}$/g },
    crc32c: { id: /^hash[+\s\-_]*crc32c$/i, pattern: /^[a-fA-F0-9]{8}$/g },
    crc64: { id: /^hash[+\s\-_]*crc64$/i, pattern: /^[a-fA-F0-9]{16}$/g },
    crc64ecma: {
      id: /^hash[+\s\-_]*crc64ecma$/i,
      pattern: /^[a-fA-F0-9]{16}$/g,
    },
    crc64x: { id: /^hash[+\s\-_]*crc64x$/i, pattern: /^[a-fA-F0-9]{16}$/g },
    crc64xmod: {
      id: /^hash[+\s\-_]*crc64xmod$/i,
      pattern: /^[a-fA-F0-9]{16}$/g,
    },
    crc64ecma: {
      id: /^hash[+\s\-_]*crc64ecma$/i,
      pattern: /^[a-fA-F0-9]{16}$/g,
    },
  },
};

/**
 * Data descriptors
 */
export const dataDescriptors = {
  [regexMap.personalName.id]: {
    type: "text",
    normalization: capitalizeTokens,
    pattern: regexMap.personalName.pattern,
    minLength: 2,
  },
  [regexMap.date.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD",
    maxLength: 10,
    minLength: 10,
  },
  [regexMap.datetime.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mm:ss",
    pattern: regexMap.datetime.pattern,
    minLength: 10,
  },
  [regexMap.sqldatetime.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mm:ss.sssZ",
    pattern: regexMap.sqldatetime.pattern,
    maxLength: 19,
    minLength: 10,
  },
  [regexMap.isodatetime.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mm:ss.sssZ",
    pattern: regexMap.isodatetime.pattern,
    maxLength: 19,
    minLength: 10,
  },
  [regexMap.isotime.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "HH:mm:ss",
    pattern: regexMap.isotime.pattern,
    maxLength: 10,
    minLength: 10,
  },
  [regexMap.datetimeoffset.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "YYYY-MM-DD\\THH:mmZ",
    minLength: 10,
  },
  [regexMap.time.id]: {
    type: "date",
    normalization: (s) => s.trim(),
    format: "HH:mm:ssZ",
    minLength: 10,
  },
  [regexMap.commonName.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.commonName.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.phoneNumber.id]: {
    type: "text",
    normalization: (s) => s.trim().replaceAll(/[.-\s\/\\]+/, ""),
    pattern: regexMap.phoneNumber.pattern,
    minLength: 10,
  },
  [regexMap.email.id]: {
    type: "text",
    normalization: (s) => s.trim().toLowerCase(),
    pattern: regexMap.email.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.ip.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.ip.pattern,
    maxLength: 15,
    minLength: 5,
  },
  [regexMap.ipV6.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.ipV6.pattern,
    maxLength: 39,
    minLength: 5,
  },
  [regexMap.url.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.url.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.httpUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.httpUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.httpsUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.httpsUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.ftpUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.ftpUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.ftpsUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.ftpsUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.sshUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.sshUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.smtpUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.smtpUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.pop3Url.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.pop3Url.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.blobUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.blobUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.fileUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.fileUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.imapUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.imapUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.urls.ldapUrl.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.ldapUrl.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.uuid.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.uuid.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.hashes.md5.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.md5.pattern,
    maxLength: 32,
    minLength: 32,
  },
  [regexMap.hashes.sha1.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha1.pattern,
    maxLength: 40,
    minLength: 40,
  },
  [regexMap.hashes.sha256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.sha512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.sha3_224.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha3_224.pattern,
    maxLength: 56,
    minLength: 56,
  },
  [regexMap.hashes.sha3_256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha3_256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.sha3_384.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha3_384.pattern,
    maxLength: 96,
    minLength: 96,
  },
  [regexMap.hashes.sha3_512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.sha3_512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.blake2b_256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2b_256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.blake2b_384.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2b_384.pattern,
    maxLength: 96,
    minLength: 96,
  },
  [regexMap.hashes.blake2b_512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2b_512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.blake2s_256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2s_256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.blake2s_384.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2s_384.pattern,
    maxLength: 96,
    minLength: 96,
  },
  [regexMap.hashes.blake2s_512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.blake2s_512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.keccak_256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.keccak_256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.keccak_384.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.keccak_384.pattern,
    maxLength: 96,
    minLength: 96,
  },
  [regexMap.hashes.keccak_512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.keccak_512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.ripemd_128.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_128.pattern,
    maxLength: 32,
    minLength: 32,
  },
  [regexMap.hashes.ripemd_160.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_160.pattern,
    maxLength: 40,
    minLength: 40,
  },
  [regexMap.hashes.ripemd_256.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_256.pattern,
    maxLength: 64,
    minLength: 64,
  },
  [regexMap.hashes.ripemd_320.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_320.pattern,
    maxLength: 80,
    minLength: 80,
  },
  [regexMap.hashes.ripemd_384.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_384.pattern,
    maxLength: 96,
    minLength: 96,
  },
  [regexMap.hashes.ripemd_512.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.ripemd_512.pattern,
    maxLength: 128,
    minLength: 128,
  },
  [regexMap.hashes.crc32.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc32,
    maxLength: 8,
    minLength: 8,
  },
  [regexMap.hashes.crc32c.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc32c,
    maxLength: 8,
    minLength: 8,
  },
  [regexMap.hashes.crc64.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc64,
    maxLength: 16,
    minLength: 16,
  },
  [regexMap.hashes.crc64ecma.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc64ecma,
    maxLength: 16,
    minLength: 16,
  },
  [regexMap.hashes.crc64x.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc64x,
    maxLength: 16,
    minLength: 16,
  },
  [regexMap.hashes.crc64xmod.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc64xmod,
    maxLength: 16,
    minLength: 16,
  },
  [regexMap.hashes.crc64ecma.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.hashes.crc64ecma,
    maxLength: 16,
    minLength: 16,
  },
  [regexMap.username.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.username.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.password.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.password.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.zipCode.id]: {
    type: "text",
    pattern: regexMap.zipCode.pattern,
    maxLength: 5,
    minLength: 5,
  },
  [regexMap.countryCode.id]: {
    type: "text",
    pattern: regexMap.countryCode.pattern,
    maxLength: 2,
    minLength: 2,
  },
  [regexMap.countryCode2.id]: {
    type: "text",
    pattern: regexMap.countryCode2.pattern,
    maxLength: 2,
    minLength: 2,
  },
  [regexMap.boolean.id]: {
    type: "boolean",
    pattern: regexMap.boolean.pattern,
  },
  [regexMap.nullableBoolean.id]: {
    type: "boolean",
    pattern: regexMap.nullableBoolean.pattern,
  },
  [regexMap.number.id]: {
    type: "number",
    pattern: regexMap.number.pattern,
    normalization: (s) => parseFloat(s.trim()),
  },
  [regexMap.gpsCoordinate.id]: {
    type: "number",
    pattern: regexMap.gpsCoordinate.pattern,
    normalization: (s) => parseFloat(s.trim()),
  },
  [regexMap.gpsCoordinates.id]: {
    type: "array",
    pattern: regexMap.gpsCoordinates.pattern,
    normalization: (s) =>
      s
        .trim()
        .split(/[\s,]/)
        .map((x) => parseFloat(x.trim())),
  },
  [regexMap.hashtag.id]: {
    type: "text",
    pattern: regexMap.hashtag.pattern,
  },
  [regexMap.mimeType.id]: {
    type: "text",
    pattern: regexMap.mimeType.pattern,
    maxLength: 100,
    minLength: 5,
  },
  [regexMap.imageFileExtension.id]: {
    type: "text",
    pattern: regexMap.imageFileExtension.pattern,
  },
  [regexMap.videoFileExtension.id]: {
    type: "text",
    pattern: regexMap.videoFileExtension.pattern,
  },
  [regexMap.audioFileExtension.id]: {
    type: "text",
    pattern: regexMap.audioFileExtension.pattern,
  },
  [regexMap.documentFileExtension.id]: {
    type: "text",
    pattern: regexMap.documentFileExtension.pattern,
  },
  [regexMap.textFileExtension.id]: {
    type: "text",
    pattern: regexMap.textFileExtension.pattern,
  },
  [regexMap.dataFileExtension.id]: {
    type: "text",
    pattern: regexMap.dataFileExtension.pattern,
  },
  [regexMap.oopFileExtension.id]: {
    type: "text",
    pattern: regexMap.oopFileExtension.pattern,
  },
  [regexMap.programmingLanguageFileExtension.id]: {
    type: "text",
    pattern: regexMap.programmingLanguageFileExtension.pattern,
  },
  [regexMap.identity.id]: {
    type: "text",
    pattern: regexMap.identity.pattern,
  },
  [regexMap.jwt.id]: {
    type: "text",
    pattern: regexMap.jwt.pattern,  
  },
};
