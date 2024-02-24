import { deeplConnectionData } from 'third-party-api';
const filesUtility = require('./files');
const deepl = require('./deepl-translator');

class Dictionary {
  constructor(directory) {
    this.languages = {};
    this.directory = directory;

    const files = filesUtility.getFiles(directory, /^[\w-]+\.json$/i, true);
    files.forEach((file) => {
      const fileContent = filesUtility.getFileContent(file);
      const object = JSON.parse(fileContent);
      this.languages[filesUtility.getFileName(file).toLowerCase()] = object;
    });
  }

  async installLanguage(languageCode, fromLanguage) {
    const languageOut = filesUtility.getFile(
      this.directory,
      languageCode.toLowerCase() + '.json',
    );
    const translation = {};
    const newLang = fromLanguage.toLowerCase();
    const src = this.languages[fromLanguage.toLowerCase()];
    for (const key in src) {
      translation[key] = await deepl.translate(
        src[key],
        languageCode.toUpperCase(),
      );
    }
    filesUtility.setFileContent(newLang, JSON.stringify(languageOut));
  }
}

module.exports = { Dictionary };
/**
 * @prototype {string}
 */
function translateByCallback(
	this_string,
	languageCode,
	callback,
) {
	require('deepl')
		.translate(this_string, languageCode.toUpperCase(), deeplConnectionData)
		.then((result) => {
			callback(null, result);
		})
		.catch((error) => {
			console.error(error, '');
		});
}

/**
 * @prototype {string}
 */
async function translate(this_string,languageCode) {
  try {
     
    let result = await deepl.translate(this_string, languageCode.toUpperCase(), apiKey);
    return result;  
  } catch (error) {
    console.error('Deepl Error: '+error);
  }
}

module.exports = { translate:translate,translateByCallback:translateByCallback , Dictionary:Dictionary};