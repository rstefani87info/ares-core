/**
 * @desc {en} a mapping of the most common data descriptors useful for validation and formatting
 * @desc {it} una mappa di descrittori di dati comuni di utilità per la validazione e formattazione
 * @desc {es} un mapeo de datos comunes de uso comu
 * @desc {pt} um mapeamento de dados comuns de uso comum
 * @desc {fr} une carte descripteurs de données les plus courants utiles pour la validation et le formatage
 * @desc {de} eine Karte der besonders genutzten Datenbeschreibungen für die Validierung und Formatierung
 * @desc {ja} 一般的なデータ記述子
 * @desc {zh} 常用数据描述符
 * @desc {ru} карта наиболее часто используемых данных
 */
const objectDescriptorDefinitions = {

	"text": {
		parse: (s) => s + '',
		minLength: (v, m) => m > 0 ? v.length >= m : true,
		maxLength: (v, m) => m > 0 ? v.length <= m : true,
		minValue: (v, m) => m ? v >= m : true,
		maxValue: (v, m) => m ? v <= m : true,
		pattern: (v, p) => {
			if (p) return v.match(p);
			else return true;
		}
	},
	"number": {
		parse: (s) => new Number(s + ""),
		minLength: (v, m) => m > 0 ? ('' + v).length >= m : true,
		maxLength: (v, m) => m > 0 ? ('' + v).length <= m : true,
		minDecimalLength: (v, m) => m > 0 ? ('' + v).split("[.,]").pop().length >= m : true,
		maxDecimalLength: (v, m) => m > 0 ? ('' + v).split("[.,]").pop().length <= m : true,
		minValue: (v, m) => m ? v >= m : true,
		maxValue: (v, m) => m ? v <= m : true,
		format: (v, f) => f ? moment(v, f) : moment(v),
		pattern: (v, p) => {
			if (p) return ('' + v).match(p);
			else return ('' + v).match("\\d+(\\.\\d+)");
		}
	},
 
	"date([\\s-_]*time)?|time": {
		parse: (s, f) => f ? moment(v, f) : moment(v),
		minValue: (v, m, f) => m ? f ? moment(v, f) : moment(v).toDate() >= f ? moment(m, f).toDate() : moment(m).toDate() : true,
		maxValue: (v, m, f) => m ? f ? moment(v, f) : moment(v).toDate() <= f ? moment(m, f).toDate() : moment(m).toDate() : true,
		format: (v, f) => f ? moment(v, f) : moment(v),
		pattern: (v, p) => {
			if (p) return ('' + v).match(p);
			else return true;
		}
	},


};

/**
 * @prototype {Object}  
 */
function format(this_object, descriptor) {
	const ret = {};
	for (const k in descriptor.params) {
		ret[k] = this_object[k];
		const objectDescriptorDefinitionKey = descriptor[k]?.type || null;
		const objectDescriptorDefinition = findPropValueByAlias(objectDescriptorDefinitions, objectDescriptorDefinitionKey);
		
    if (descriptor.normalization) ret[k] = descriptor.normalization(ret[k]);
		
    if (!(objectDescriptorDefinition?.minValue(ret[k], descriptor[k].minValue) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minValue'] = true;
		}
		if (!(objectDescriptorDefinition?.maxValue(ret[k], descriptor[k].maxValue) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxValue'] = true;
		}
		if (!(objectDescriptorDefinition?.minLength(ret[k], descriptor[k].minLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minLength'] = true;
		}
		if (!(objectDescriptorDefinition?.maxLength(ret[k], descriptor[k].maxLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxLength'] = true;
		}
		if (!(objectDescriptorDefinition?.minDecimalLength(ret[k], descriptor[k].minDecimalLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minDecimalLength'] = true;
		}
		if (!(objectDescriptorDefinition?.maxDecimalLength(ret[k], descriptor[k].maxDecimalLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxDecimalLength'] = true;
		}
		if (!(objectDescriptorDefinition?.pattern(ret[k], descriptor[k].pattern) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['pattern'] = true;
		}

	}
	return ret;
}

const dataDescriptors = {
  "common[\\s-_]name": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[\w]+[ \w]*$/,
    maxLength: 100,
    minLength: 5,
  },
  "(tele){0,1}phone[\\s-_](number|#){0,1}": {
    type: "text",
    normalization: (s) => s.trim().replaceAll(/[.-\s\/\\]+/, ""),
    pattern: /^(\+?\d{2,3})?[.-\s\/\\0-9]{10,}$/,
    minLength: 10,
  },
  "(@|email)[\\s-_](address){0,1}": {
    type: "text",
    normalization: (s) => s.trim().toLowerCase(),
    pattern: /^[\w-]+@[\w-]+\.[\w-]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ip([\\s-_]*v4)?([\\s-_]*address){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    maxLength: 15,
    minLength: 5,
  },
  "ip([\\s-_]*v6){1}([\\s-_]*address){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^(?:[a-f0-9]{1,4}:){7}[a-f0-9]{1,4}$/,
    maxLength: 39,
    minLength: 5,
  },
  "http[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ftp[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:ftp(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "ssh[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:ssh(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "smtp[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:smtp(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "pop3[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:pop3(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "blob[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:blob(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "file[s]?([\\s-_]*url)?": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?:file(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "hash[\\s-_]*md5": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{32}$/,
    maxLength: 32,
    minLength: 32,
  },
  "crc([\\s-_]*32)?[\\s-_](hash){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{8}$/,
    maxLength: 8,
    minLength: 8,
  },
  "crc[\\s-_]*64?[\\s-_](hash){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-f0-9]{16}$/,
    maxLength: 16,
    minLength: 16,
  },
  "user([\\s-_]*(name)){0,1}": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern: /^[a-zA-Z0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "password": {
    type: "text",
    normalization: (s) => s.trim(),
    pattern:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    maxLength: 100,
    minLength: 5,
  },
  "zip[\\s-_]?(code){0,1}": {
    type: "text",
    pattern: /^\d{5}$/,
    maxLength: 5,
    minLength: 5,
  },
  "country[\\s-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}$/,
    maxLength: 2,
    minLength: 2,
  },
  "language[\\s-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}([-_][A-Z]{2}){0,1}$/,
    maxLength: 2,
    minLength: 2,
  },
  "province|city[\\s-_]*(code){0,1}": {
    type: "text",
    pattern: /^[A-Z]{2}$/,
    maxLength: 2,
    minLength: 2,
  },
  "bool(ean)?|y(es)([\\s-_]*or)([\\s-_]*n(o(t)?)?)|binary[\\s-_]*digit|true([\\s-_]*or)([\\s-_]*false))":
    { type: "boolean" },
  "(real|float|double|decimal|numeric|r)?[\\s-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^[+-]?[0-9]+([.,]{0,1}[0-9])?$/,
  },
  "(positive|+)[\\s-_]*(real|float|double|decimal|numeric|r)[\\s-_]*(n(umber)?|°|#)?":
    {
      type: "number",
      pattern: /^(\+)?[1-9]+([.,]{0,1}[0-9])?$/,
      normalization: (s) => s.trim(),
    },
  "(negative|-)[\\s-_]*(real|float|double|decimal|numeric|r)[\\s-_]*(n(umber)?|°|#)?":
    {
      type: "number",
      pattern: /^-[1-9]+([.,]{0,1}[0-9])?$/,
      normalization: (s) => s.trim(),
    },
  "integer[\\s-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^[+-]?[0-9]+$/,
    normalization: (s) => s.trim(),
  },
  "((positive|+)[\\s-_]*integer|natural|n)[\\s-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^(\+)?[1-9]+$/,
    normalization: (s) => s.trim(),
  },
  "(negative|-)[\\s-_]*integer[\\s-_]*(n(umber)?|°|#)?": {
    type: "number",
    pattern: /^-[1-9]+$/,
    normalization: (s) => s.trim(),
  },
  "(geographical)[\\s-_]*coordinate": {
    type: "number",
    pattern: /^[+-]?[0-9]+(\.[0-9]+)?$/,
    normalization: (s) => s.trim(),
  },
  "(geographical)[\\s-_]*coordinates": {
    type: "array",
    pattern: /^[+-]?[0-9]+(\.[0-9]+)?([\s,][+-]?[0-9]+(\.[0-9]+)?)?$/,
    normalization: (s) => s.trim().split(/[\s,]/),
  },
  "hashtag": {
    type: "text",
    pattern: /^#[a-zA-Z0-9_]+$/,
  },
  "facebook[\\s-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "instagram[\\s-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "(x|twitter)[\\s-_]*(id){0,1}": {
    type: "text",
    pattern: /^[0-9]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "youtube[\\s-_]*(id){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "tiktok[\\s-_]*(id){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "mime[\\s-_]*(type){0,1}": {
    type: "text",
    pattern: /^[a-zA-Z0-9_]+\/[a-zA-Z0-9_+-. ]+$/,
    maxLength: 100,
    minLength: 5,
  },
  "image[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^jpg|jpeg|png|gif|webp|svg|tiff|avif|apng|jfif|bmp$/,
  },
  "video[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^mp4|mkv|webm|mov|avi|3gp|flv|wmv|mpeg|mpg|m4v|ogv|ogm|mk3d|gifv|3gpp|3g2|3gpp2|hevc|heic|av1|h264|h265|avchd|heif$/,
  },
  "audio[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^mp3|wav|ogg|flac|aac|wma|webm|m4a|aiff|amr|opus|vorbis|3gpp|3g2|3gpp2|amr|aac|m4a$/,
  },
  "document[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern: /^pdf|doc|docx|odt|rtf|txt|wps$/,
  },
  "text[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^txt|wps|vb|vbs|php|js|css|html|xml|xsl(t)?|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|ts|tsx|vue|jsx$/,
  },
  "programming[\\s-_]*lang(uage)[\\s-_]*file[\\s-_]*(ext(ension)){0,1}": {
    type: "text",
    pattern:
      /^vb|vbs|php|js|css|html|xml|xsl(t)?|json|csv|md|yml|yaml|cs|c|cpp|java|py|rb|sh|pl|go|sql|ini|toml|ts|scss|sass|ts|tsx|vue|jsx$/,
  },
};
 