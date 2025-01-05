import numeral from "numeral";
import { findPropValueByAlias } from "./objects.js";
import { stringTokenizer, capitalizeTokens } from "./text.js";

export const regexMap = {
  text: { 
    id: /plain|(plain[+\s\-_]*)?t[e]?xt|t[e]?xt([+\s\-_]*plain)?$/, 
    tokenizer: /[a-zA-Z]+|[^0-9a-zA-Z\s\r\n]+|[0-9]+|\s+|[\r\n]+/ 
  },
  personalName: {
    id: /(proper|person(al)?|sur|first|last|family)[+\s\-_]*name/,
    pattern: /\s*[a-z]{3,}(\s[a-z]{2,})*\s*/,
  },
  commonName: {
    id: /common[+\s\-_]*name/,
    pattern: /\s*[a-z]{3,}(\s[a-z]{3,})*\s*/,
    pattern: /\s*([a-z]{1}\.)+|([\s\-_]*[a-z]{3,})*\s*/,
  },
  email: {
    id: /(@|email)([+\s\-_]*address)?/,
    pattern: /[a-zA-Z0-9\._%+-]+@[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,}/,
  },
  username: {
    id: /user([+\s\-_]*(name))?|handle|nik([+\s\-_]*(name))?/,
    pattern: /[a-zA-Z0-9\._%+-]+/,
  },
  password: {
    id: /password|pwd/,
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/,
  },
  zipCode: {
    id: /(zip|cap|location)([+\s\-_]*code)?/,
    pattern: /\d{5}(-\d{4})?/,
  },
  countryCode: { id: /country[+\s\-_]*(code)?/, pattern: /[A-Z]{2}/ },
  languageCode: {
    id: /language[+\s\-_]*(code)?/,
    pattern: /[A-Z]{2}([-_][A-Z]{2})?/,
  },
  currencyCode: { id: /currency[+\s\-_]*(code)?/, pattern: /[A-Z]{3}/ },
  boolean: {
    id: /bool(ean)?|y(es)([+\s\-_]*or)([+\s\-_]*n(o(t)?)?)|binary[+\s\-_]*digit|true([+\s\-_]*or)([+\s\-_]*false)|switch|on([+\s\-_]*or)([+\s\-_]*off)/,
    pattern: /(true|false|on|off|1|0|yes|no||y|n|null|not)/,
  },
  nullableBoolean: {
    id: /(null(able)?|\?)[+\s\-_]*bool(ean)?|y(es)([+\s\-_]*or)([+\s\-_]*n(o(t)?)?)|binary[+\s\-_]*digit|true([+\s\-_]*or)([+\s\-_]*false)|switch|on([+\s\-_]*or)([+\s\-_]*off)$/,
    pattern: /(true|false|on|off|1|0|yes|no||y|n|null|not|undefined)/,
  },
  number: { id: /number|°|#/, pattern: /[+-]?[0-9]+([\.]?[0-9])?/ },
  date: { id: /date/ },
  isodate: {
    id: /iso([+\s\-_]*)?date/,
    pattern: /(\d{4})-(\d{2})-(\d{2})/,
  },
  datetime: { id: /date([+\s\-_]*)?time/ },
  sqldatetime: {
    id: /sql([+\s\-_]*)?date([+\s\-_]*)?time/,
    pattern:
      /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?/,
  },
  isodatetime: {
    id: /iso([+\s\-_]*)?date([+\s\-_]*)?time/,
    pattern:
      /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?/,
  },
  countdown: { id: /countdown/ },
  time: { id: /time/ },
  isotime: {
    id: /iso([+\s\-_]*)?time/,
    pattern: /(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?.*?/,
  },
  datetimeoffset: { id: /date(([+\s\-_]*)?time)?([+]|[+\s\-_]offset)?/ },
  phoneNumber: {
    id: /((tele)?phone|tel)([+\s\-_]*(number|#))?/,
    pattern: /(\+?\d{2,3})?[.-\s\/\\0-9]{10,}/,
  },
  gpsCoordinate: {
    id: /ps[+\s\-_]*coordinates/,
    pattern: /[+-]?[0-9]+(\.[0-9]+)?$/,
  },
  gpsCoordinates: {
    id: /ps[+\s\-_]*coordinates/,
    pattern: /[+-]?[0-9]+(\.[0-9]+),[+-]?[0-9]+(\.[0-9]+)?$/,
  },
  hashtag: {
    id: /hashtag/,
    pattern: /#[a-zA-Z0-9_]+$/,
  },
  mimeType: { id: /e([+s\-_]*type)?/, pattern: /[a-zA-Z0-9_]+\/[a-zA-Z0-9_+-. ]+$/},
  imageFileExtension: {
    id: /age[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(jpg|jpeg|png|gif|bmp|tiff|svg|webp|heic|heif|ico|psd|raw|cr2|nef|orf|sr2|raf|dng|arw|3fr|ai|arw|bay|bpg|cap|cin|crw|cs1|cur|dc2|dcr|dds|djvu|erf|exr|fff|fits|fpx|gbr|hrd|iff|iiq|j2k|jng|jp2|jpe|jpf|jpx|k25|kdc|mef|mng|mrw|nrw|ora|pbm|pcd|pct|pcx|pef|pgf|pgm|pnm|ppm|psb|ptx|pxn|r3d|rle|rw2|rwl|sct|sfw|srw|tga|webp|x3f|xcf|yuv)/,
  },
  videoFileExtension: {
    id: /video[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(mp4|m4v|mov|avi|wmv|flv|f4v|mkv|webm|mpeg|mpg|3gp|3g2|ogg|ogv|mts|m2ts|ts|vob|mxf|rm|rmvb|asf|swf|dv|divx|xvid|h264|hevc|avchd|mpe|mpv|m2v|amv|bik|drc|fli|flic|ivf|mjpg|mjpeg|roq|svi|yuv)/,
  },
  audioFileExtension: {
    id: /audio[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(mp3|wav|aac|flac|alac|ogg|oga|opus|wma|m4a|m4b|m4p|aiff|aif|aifc|au|ra|rm|mid|midi|mpa|mpc|amr|dss|dvf|gsm|iklax|ivs|m3u|m3u8|pls|xspf|tta|voc|vox|wv)/,
  },
  documentFileExtension: {
    id: /document[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(pdf|doc|docx|odt|rtf|txt|tex|wpd|wps|ppt|pptx|odp|xls|xlsx|ods|csv|tsv|epub|mobi|azw|azw3|ibooks|fb2|djvu|ps|md|rst|rtfd|pages|key|numbers|xml|xps|oxps|sdw|sgm|sgml|wks|wp|gdoc|gsheet|gslides)/,
  },
  textFileExtension: {
    id: /(plain|(plain[+s\-_]*)?t[e]?xt|t[e]?xt([+s\-_]*plain)?)[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(txt|wps|vb|vbs|php|js|css|html|xml|xsl|xslt|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|tsx|vue|jsx)/,
  },
  markupLanguageFileExtension: {
    id: /arkup[+s\-_]*lang(uage)?[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(xml|html|xhtml|xht|svg|rss|atom|kml|gpx|xsd|xslt|xsl|xul|xaml|xlf|xliff|svgz|wsdl|opf|ncx|plist|rdf|smil|mathml|collada|scxml|sitemap|xbrl|cxml|dita|ditamap|x3d|sldx|docx|pptx|xlsx|odt|ods|odp|gml|ebxml|rvt|lvproj)/,
  },
  dataFileExtension: {
    id: /data[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(csv|tsv|xml|json|yaml|yml|toml|ini|sql|ts|scss|sass|properties|init|conf|cfg|json5|jsonc|jsonl|jsonml|json5l|jsonmlc|css|scss|sass|js|ejs|cjs)/,
  },
  oopFileExtension: {
    id: /oop[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(js|jsx|ts|tsx|json|java|php|cs|cpp|c|py|rb|go|ts|scss|sass|ejs|cjs)/,
  },
  programmingLanguageFileExtension: {
    id: /prog(r(amming)?)?[+s\-_]*lang(uage)?[+s\-_]*file[+s\-_]*ext(ension)?/,
    pattern: /\.(vb|vbs|php|js|css|cjs|ejs|html|xhtml|xht|shtm|xml|xsl|xslt|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|tsx|vue|jsx)/,
  },
  jwt: {
    id: /jwt|json[+s\-_]*web[+s\-_]*token/,
    pattern: /[A-Za-z0-9-_]{36,64}\.[A-Za-z0-9-_]{50,200}\.[A-Za-z0-9-_]{43,86}$/,
  },
  identity: {
    id: /d(enti(fier|ty)?)?|(primary[+s\-_]*)?key|index|idx/,
    pattern: /[a-f0-9]{128}/,
  },
  ip: {
    id: /p([+\s\-_]*v4)?([+\s\-_]*address)?/,
    pattern:
      /^(([0-9]{1,2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]{1,2}|2[0-4][0-9]|25[0-5])/,
  },
  ipv6: {
    id: /p([+\s\-_]*v6){1}([+\s\-_]*address)?/,
    pattern:
      /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}((:[0-9A-Fa-f]{1,4}){1,2}))|(([0-9A-Fa-f]{1,4}:){1,4}((:[0-9A-Fa-f]{1,4}){1,3}))|(([0-9A-Fa-f]{1,4}:){1,3}((:[0-9A-Fa-f]{1,4}){1,4}))|(([0-9A-Fa-f]{1,4}:){1,2}((:[0-9A-Fa-f]{1,4}){1,5}))|([0-9A-Fa-f]{1,4}:)((:[0-9A-Fa-f]{1,4}){1,6})|:((:[0-9A-Fa-f]{1,4}){1,7}|:)|((([0-9A-Fa-f]{1,4}:){6}|:):((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))|::([fF]{4}:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?){1,4}))/,
  },
  urls: {
    url: {
      id: /url/,
      pattern:
        /^((([a-zA-Z0-9+.-]+):\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?)(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    httpUrl: {
      id: /http[s]?([+\s\-_]*url)?/,
      pattern:
        /^(https?:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    httpsUrl: {
      id: /https([+\s\-_]*url)?/,
      pattern:
        /^(https:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    ftpUrl: {
      id: /ftp[s]?([+\s\-_]*url)?/,
      pattern:
        /^(ftp(s)?:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    ftpsUrl: {
      id: /ftps?([+\s\-_]*url)?/,
      pattern:
        /^(ftps:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    smtpUrl: {
      id: /smtp?([+\s\-_]*url)?/,
      pattern:
        /^(smtp:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    pop3Url: {
      id: /pop3?([+\s\-_]*url)?/,
      pattern:
        /^(pop3:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    sshUrl: {
      id: /ssh?([+\s\-_]*url)?/,
      pattern:
        /^(ssh:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    blobUrl: {
      id: /blob?([+\s\-_]*url)?/,
      pattern:
        /^(blob:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    fileUrl: {
      id: /file?([+\s\-_]*url)?/,
      pattern:
        /^(file:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    imapUrl: {
      id: /ap?([+\s\-_]*url)?/,
      pattern:
        /^(imap:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    ldapUrl: {
      id: /ldap?([+\s\-_]*url)?/,
      pattern:
        /^(ldap:\/\/)?(([^:@\/\s]+)(:[^:@\/\s]*)?@)?(([a-zA-Z0-9-_]{1,256}\.)+[a-zA-Z]{2,63}|(\[[0-9a-fA-F:.]+\])|(([0-9]{1,3}\.){3}[0-9]{1,3}))(:[0-9]{1,5})?(\/[a-zA-Z0-9@:%._+~#=/-]*)?(\?[a-zA-Z0-9&=_-]*)?(#[a-zA-Z0-9-_]*)?/,
    },
    
  },
  uuid: {
      id: /uuid|unique([+\s\-_]*id)?/,
      pattern:
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/,
    },
  hashes: {
    md5: { id: /hash[+\s\-_]*md5/, pattern: /[a-fA-F0-9]{32}/ },
    sha1: { id: /hash[+\s\-_]*sha1/, pattern: /[a-fA-F0-9]{40}/ },
    sha256: { id: /hash[+\s\-_]*sha256/, pattern: /[a-fA-F0-9]{64}/ },
    sha512: { id: /hash[+\s\-_]*sha512/, pattern: /[a-fA-F0-9]{128}/ },
    sha3_224: { id: /hash[+\s\-_]*sha3_224/, pattern: /[a-fA-F0-9]{56}/ },
    sha3_256: { id: /hash[+\s\-_]*sha3_256/, pattern: /[a-fA-F0-9]{64}/ },
    sha3_384: { id: /hash[+\s\-_]*sha3_384/, pattern: /[a-fA-F0-9]{96}/ },
    sha3_512: {
      id: /hash[+\s\-_]*sha3_512/,
      pattern: /[a-fA-F0-9]{128}/,
    },
    blake2b_256: {
      id: /hash[+\s\-_]*blake2b_256/,
      pattern: /[a-fA-F0-9]{64}/,
    },
    blake2b_384: {
      id: /hash[+\s\-_]*blake2b_384/,
      pattern: /[a-fA-F0-9]{96}/,
    },
    blake2b_512: {
      id: /hash[+\s\-_]*blake2b_512/,
      pattern: /[a-fA-F0-9]{128}/,
    },
    blake2s_256: {
      id: /hash[+\s\-_]*blake2s_256/,
      pattern: /[a-fA-F0-9]{32}/,
    },
    blake2s_384: {
      id: /hash[+\s\-_]*blake2s_384/,
      pattern: /[a-fA-F0-9]{48}/,
    },
    blake2s_512: {
      id: /hash[+\s\-_]*blake2s_512/,
      pattern: /[a-fA-F0-9]{64}/,
    },
    keccak_256: {
      id: /hash[+\s\-_]*keccak_256/,
      pattern: /[a-fA-F0-9]{64}/,
    },
    keccak_384: {
      id: /hash[+\s\-_]*keccak_384/,
      pattern: /[a-fA-F0-9]{96}/,
    },
    keccak_512: {
      id: /hash[+\s\-_]*keccak_512/,
      pattern: /[a-fA-F0-9]{128}/,
    },
    ripemd_128: {
      id: /hash[+\s\-_]*ripemd_128/,
      pattern: /[a-fA-F0-9]{32}/,
    },
    ripemd_160: {
      id: /hash[+\s\-_]*ripemd_160/,
      pattern: /[a-fA-F0-9]{40}/,
    },
    ripemd_256: {
      id: /hash[+\s\-_]*ripemd_256/,
      pattern: /[a-fA-F0-9]{64}/,
    },
    ripemd_320: {
      id: /hash[+\s\-_]*ripemd_320/,
      pattern: /[a-fA-F0-9]{80}/,
    },
    ripemd_384: {
      id: /hash[+\s\-_]*ripemd_384/,
      pattern: /[a-fA-F0-9]{96}/,
    },
    ripemd_512: {
      id: /hash[+\s\-_]*ripemd_512/,
      pattern: /[a-fA-F0-9]{128}/,
    },
    crc32: { id: /hash[+\s\-_]*crc32/, pattern: /[a-fA-F0-9]{8}/ },
    crc32c: { id: /hash[+\s\-_]*crc32c/, pattern: /[a-fA-F0-9]{8}/ },
    crc64: { id: /hash[+\s\-_]*crc64/, pattern: /[a-fA-F0-9]{16}/ },
    crc64ecma: {
      id: /hash[+\s\-_]*crc64ecma/,
      pattern: /[a-fA-F0-9]{16}/,
    },
    crc64x: { id: /hash[+\s\-_]*crc64x/, pattern: /[a-fA-F0-9]{16}/ },
    crc64xmod: {
      id: /hash[+\s\-_]*crc64xmod/,
      pattern: /[a-fA-F0-9]{16}/,
    },
    crc64ecma: {
      id: /hash[+\s\-_]*crc64ecma/,
      pattern: /[a-fA-F0-9]{16}/,
    },
  },
};


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

  [regexMap.datetime.id]: {
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
      objectDescriptorDefinitionKey.match(regexMap.identity.id)
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
      descriptor[k].minValue && objectDescriptorDefinition?.minValue &&
      !
        objectDescriptorDefinition?.minValue(ret[k], descriptor[k].minValue) 
      
    ) {
      setRequestError(ret, k, "minValue");
    }
    if (
      descriptor[k].maxValue && objectDescriptorDefinition?.maxValue &&
      !
        objectDescriptorDefinition?.maxValue(ret[k], descriptor[k].maxValue) 
    ) {
      setRequestError(ret, k, "maxValue");
    }
    if (
      descriptor[k].minLength && objectDescriptorDefinition?.minLength &&
      !
        objectDescriptorDefinition?.minLength(
          ret[k],
          descriptor[k].minLength
    
      )
    ) {
      setRequestError(ret, k, "minLength");
    }
    if (
      descriptor[k].maxLength && objectDescriptorDefinition?.maxLength &&
      ! 
        objectDescriptorDefinition?.maxLength(
          ret[k],
          descriptor[k].maxLength
      )
    ) {
      setRequestError(ret, k, "maxLength");
    }
    if (
      descriptor[k].minDecimalLength && objectDescriptorDefinition?.minDecimalLength &&
      !
        objectDescriptorDefinition?.minDecimalLength(
          ret[k],
          descriptor[k].minDecimalLength
      )
    ) {
      setRequestError(ret, k, "minDecimalLength");
    }
    if (
      descriptor[k].maxDecimalLength && objectDescriptorDefinition?.maxDecimalLength &&
      !
        objectDescriptorDefinition?.maxDecimalLength(
          ret[k],
          descriptor[k].maxDecimalLength
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
      descriptor[k].format && objectDescriptorDefinition?.format &&
      !
        objectDescriptorDefinition?.format(ret[k], descriptor[k].format) 
      
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
  '@get':function(name){
    return findPropValueByAlias(this, name);
  },
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
  [regexMap.ipv6.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.ipv6.pattern,
    maxLength: 39,
    minLength: 5,
  },
  [regexMap.urls.url.id]: {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: regexMap.urls.url.pattern,
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
    minLength: 2,
  },
  [regexMap.languageCode.id]: {
    type: "text",
    pattern: regexMap.languageCode.pattern,
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
