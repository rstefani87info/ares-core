import * as filesUtility from "./files.js";
import { DeepL } from "../../../3rdParty.js";
import deepl from 'deepl-node';

/**
 * @desc {en} Class for translation of application string collection
 * @desc {it} Classe per la traduzione della collezione di stringhe dell'applicazione
 * @desc {es} Clase para traducción de la colección de strings de la aplicación
 * @desc {fr} Classe pour la traduction de la collection de chaines d'application

 * @desc {pt} Classe para tradução da coleção de strings da aplicação



 *
 */
export class Dictionary {
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
      languageCode.toLowerCase() + ".json"
    );
    const translation = {};
    const newLang = fromLanguage.toLowerCase();
    const src = this.languages[fromLanguage.toLowerCase()];
    for (const key in src) {
      translation[key] = await  deepl.Translator(authKey)
      .translateText(
        src[key],
        languageCode.toUpperCase()
      );
    }
    filesUtility.setFileContent(newLang, JSON.stringify(languageOut));
  }
}


/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} languageCode
 * @param {function} callback
 * @desc {en} Translate a string by callback
 * @desc {it} Traduci una stringa tramite callback
 * @desc {es} Traducir una cadena por callback
 * @desc {fr} Traduire une chaîne par rappel

 * @desc {pt} Traduzir uma string por callback



 */
export function translateByCallback(this_string, languageCode, callback) {
  deepl.Translator(authKey)
    .translateText(this_string, languageCode.toUpperCase(), deeplConnectionData)
    .then((result) => {
      callback(null, result);
    })
    .catch((error) => {
      console.error(error, "");
    });
}

/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} languageCode
 * @desc {en} Translate a string
 * @desc {it} Traduci una stringa
 * @desc {es} Traducir una cadena
 * @desc {fr} Traduire une chaîne

 * @desc {pt} Traduzir uma string



 *
 */
export async function translate(this_string, languageCode) {
  try {
    let result = await  deepl.Translator(authKey)
    .translateText(
      this_string,
      languageCode.toUpperCase(),
      apiKey
    );
    return result;
  } catch (error) {
    console.error("DeepL Error: " + error);
  }
}
 
