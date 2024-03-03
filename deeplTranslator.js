import * as filesUtility from "./files.js";
import { DeepL } from "../../../3rdParty.js";
import deepl from 'deepl-node';

/**
 * @desc {en} Class for translation of application string collection
 * @desc {it} Classe per la traduzione della collezione di stringhe dell'applicazione
 * @desc {es} Clase para traducción de la colección de strings de la aplicación
 * @desc {fr} Classe pour la traduction de la collection de chaines d'application
 * @desc {de} Klasse für die Umschreibung der Application String Collection
 * @desc {pt} Classe para tradução da coleção de strings da aplicação
 * @desc {zh} 用于应用程序字符串集的翻译
 * @desc {ru} Класс для перевода коллекции строк приложения
 * @desc {ja} アプリケーション文字列コレクションの翻訳
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
 * @desc {de} Umschreiben einer Zeichenkette mit Callback
 * @desc {pt} Traduzir uma string por callback
 * @desc {zh} 通过回调翻译字符串
 * @desc {ru} Переводить строку по колбеку
 * @desc {ja} コールバックで文字列を翻訳
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
 * @desc {de} Umschreiben einer Zeichenkette
 * @desc {pt} Traduzir uma string
 * @desc {zh} 翻译字符串
 * @desc {ru} Переводить строку
 * @desc {ja} 文字列を翻訳
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
 
