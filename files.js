const fs = require("fs");
const path = require("path");

/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} pattern
 * @param {boolean} onlyFiles
 * @param {boolean} recoursively
 * @param {array} fileArray
 *
 * @desc {en} Get all files in the directory recursively if required
 * @desc {it} Ottieni tutti i files nel directory ricorsivamente se richiesto
 * @desc {es} Obtiene todos los archivos en el directorio recursivamente si es necesario
 * @desc {fr} Obtient tous les fichiers dans le dossier recursivement si requis
 * @desc {de} Erstellt alle Dateien im Verzeichnis rekursiv, falls erforderlich
 * @desc {pt} Obteve todos os arquivos no diretorio recursivamente se for necessário
 * @desc {zh} 获取指定目录下的所有文件
 * @desc {ru} Возвращает все файлы в директории, если требуется
 * @desc {ja} 指定されたディレクトリのすべてのファイル
 */
function getFilesRecursively(
  this_string,
  pattern,
  onlyFiles = false,
  fileArray = []
) {
  return getFiles(this_string, pattern, onlyFiles, true, fileArray);
}
/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} pattern
 * @param {boolean} onlyFiles
 * @param {boolean} recursively
 * @param {array} fileArray
 *
 * @desc {en} Get all files in the directory
 * @desc {it} Ottieni tutti i files nel directory
 * @desc {es} Obtiene todos los archivos en el directorio
 * @desc {fr} Obtient tous les fichiers dans le dossier
 * @desc {de} Erstellt alle Dateien im Verzeichnis
 * @desc {pt} Obteve todos os arquivos no diretorio
 * @desc {zh} 获取指定目录下的所有文件
 * @desc {ru} Возвращает все файлы в директории
 * @desc {ja} 指定されたディレクトリのすべてのファイル
 */
function getFiles(
  this_string,
  pattern,
  onlyFiles = false,
  recursively = false,
  fileArray = []
) {
  const files = fs.readdirSync(this_string);

  files.forEach((file) => {
    const filePath = path.join(this_string, file);
    const fileStat = fs.statSync(filePath);
    if (
      filePath.match(pattern) &&
      (onlyFiles ? !fileStat.isDirectory() : true)
    ) {
      fileArray.push(filePath);
    }
    if (fileStat.isDirectory() && recursively) {
      fileArray = [
        ...fileArray,
        ...getFiles(
          filePath,
          pattern,
          onlyFiles,
          typeof recursively == "int" ? recursively - 1 : recursively
        ),
      ];
    }
  });

  return fileArray;
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Check if the path is a directory
 * @desc {it} Controlla se il percorso sia una directory
 * @desc {es} Comprueba si la ruta es un directorio
 * @desc {fr} Vérifie si le chemin est un dossier
 * @desc {de} Überprüft, ob der Pfad ein Verzeichnis ist
 * @desc {pt} Verifica se o caminho é um diretório
 * @desc {zh} 检查路径是否为目录
 * @desc {ru} Проверяет, является ли путь директорией
 * @desc {ja} パスがディレクトリですか
 */
function isDirectory(this_string) {
  return fs.statSync(this_string).isDirectory();
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Check if the path is a file
 * @desc {it} Controlla se il percorso sia un file
 * @desc {es} Comprueba si la ruta es un archivo
 * @desc {fr} Vérifie si le chemin est un fichier
 * @desc {de} Überprüft, ob der Pfad ein Datei ist
 * @desc {pt} Verifica se o caminho é um arquivo
 * @desc {zh} 检查路径是否为文件
 * @desc {ru} Проверяет, является ли путь файлом
 * @desc {ja} パスがファイルですか
 */
function isFile(this_string) {
  return !fs.statSync(this_string).isDirectory() && fileExists(this_string);
}
/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} encoding
 *
 * @desc {en} Read file content
 * @desc {it} Leggi il contenuto del file
 * @desc {es} Lee el contenido del archivo
 * @desc {fr} Lire le contenu du fichier
 * @desc {de} Lese Dateiinhalt
 * @desc {pt} Leia o conteúdo do arquivo
 * @desc {zh} 读取文件内容
 * @desc {ru} Читает содержимое файла
 * @desc {ja} ファイルの内容を読み取
 *
 */
function getFileContent(this_string, encoding = "utf-8") {
  try {
    const absolutePath = path.resolve(this_string);
    const content = fs.readFileSync(absolutePath, encoding);
    return content;
  } catch (error) {
    console.error(`Error reading file ${this_string}:`, error.message);
    throw error;
  }
}
/**
 * @prototype {string}
 * @param {string} filePath
 * @param {string} content
 * @param {string} encoding
 *
 * @desc {en} Write file content
 * @desc {it} Scrivi il contenuto del file
 * @desc {es} Escribe el contenido del archivo
 * @desc {fr} Ecrire le contenu du fichier
 * @desc {de} Schreibe Dateiinhalt
 * @desc {pt} Escreva o conteúdo do arquivo
 * @desc {zh} 写入文件内容
 * @desc {ru} Записывает содержимое файл
 * @desc {ja} ファイルの内容を書き込み
 *
 */
async function setFileContent(filePath, content, encoding = "utf-8") {
  try {
    await fs.writeFile(filePath, content, { encoding });
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error.message);
    throw error;
  }
}
/**
 * @prototype {string}
 * @param {string} this_path
 * @param {string} file
 *
 * @desc {en} Get file path based on his parent path
 * @desc {it} Ottieni il percorso del file in base al suo percorso genitore
 * @desc {es} Obtener la ruta del archivo basado en su ruta de padre
 * @desc {fr} Obtenez le chemin du fichier en fonction de son chemin parent
 * @desc {de} Liefert den Dateipfad basierend auf seiner Elternpfad
 * @desc {pt} Obtenha o caminho do arquivo baseado no seu caminho pai
 * @desc {zh} 根据父路径获取文件路径
 * @desc {ru} Возвращает путь к файлу на основе его родительского пути
 * @desc {ja} ディレクトリのパスに基いてファイルのパスを取得
 *
 */
function getFile(this_path, file) {
  return path.join(this_path, file);
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Get file extension
 * 	@desc {it} Ottieni l'estensione del file
 * 	@desc {es} Obtener la extensión del archivo
 * 	@desc {fr} Obtenez l'extension du fichier
 * 	@desc {de} Liefert die Dateiendung
 * 	@desc {pt} Obtenha a extensão do arquivo
 * 	@desc {zh} 获取文件扩展名
 * 	@desc {ru} Возвращает расширение файл
 * 	@desc {ja} ファイルの拡張子を取得
 *
 */
function getFileExtension(this_string) {
  return path.extname(this_string);
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Get file name without extension
 * 	@desc {it} Ottieni il nome del file senza l'estensione
 * 	@desc {es} Obtener el nombre del archivo sin la extensión
 * 	@desc {fr} Obtenez le nom du fichier sans l'extension
 * 	@desc {de} Liefert den Namen der Datei ohne die Erweiterung
 * 	@desc {pt} Obtenha o nome do arquivo sem a extensão
 * 	@desc {zh} 获取文件名（不带扩展名）
 * 	@desc {ru} Возвращает имя файл без расширения
 * 	@desc {ja} ファイル名（拡張子なし）を取得
 */
function getFileName(this_string) {
  return getBaseName(this_string).replace(
    new RegExp("\\." + getFileExtension(this_string) + "$", "i"),
    ""
  );
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Get file name
 * 	@desc {it} Ottieni il nome del file
 * 	@desc {es} Obtener el nombre del archivo
 */
function getBaseName(this_string) {
  return path.basename(this_string);
}
/**
 * @prototype {string}
 * @param {string} this_string
 *
 * @desc {en} Get parent directory
 * @desc {it} Ottieni la directory genitore
 * @desc {es} Obtener el directorio padre
 * @desc {fr} Obtenez le dossier parent
 * @desc {de} Liefert den Ordner
 * @desc {pt} Obtenha o diretório pai
 * @desc {zh} 获取父目录
 * @desc {ru} Возвращает родительский каталог
 * @desc {ja} 親ディレクトリを取得
 */
function getParent(this_string) {
  const parentDir = path.dirname(this_string);
  return path.normalize(parentDir);
}

/**
 * @prototype {string}
 * @param {string} this_string
 * @param {string} referenceDir
 * 
 * @desc {en} Get relative path from this string
 * @desc {it} Ottieni la directory genitore
 * @desc {es} Obtener el directorio padre
 * @desc {fr} Obtenez le dossier parent
 * @desc {de} Liefert den Ordner
 * @desc {pt} Obtenha o diretório pai
 * @desc {zh} 获取父目录
 * @desc {ru} Возвращает родительский каталог
 * @desc {ja} 親ディレクトリを取得
 * 
 */
function getRelativePathFrom(this_string, referenceDir) {
  return path.normalize(path.relative(referenceDir, this_string));
}

/**
 * @prototype {string}
 * @param {string} this_string
 * 
 * @desc {en} Check if file exists
 * @desc {it} Controlla se il file esiste
 * @desc {es} Comprueba si el archivo existe
 * @desc {fr} Vérifie si le fichier existe
 * @desc {de} Überprüft, ob der Datei existiert
 * @desc {pt} Verifica se o arquivo existe
 * @desc {zh} 检查文件是否存在
 * @desc {ru} Проверяет, существует ли файл
 * @desc {ja} ファイルが存在するか
 */
function fileExists(this_string) {
  try {
    const fileStat = fs.statSync(path.normalize(this_string));
    return fileStat.ctime != null;
  } catch (e) {
    return false;
  }
}

module.exports = {
  setFileContent: setFileContent,
  getFile: getFile,
  isDirectory: isDirectory,
  isFile: isFile,
  getFiles: getFiles,
  getFilesRecoursively: getFilesRecoursively,
  getFileContent: getFileContent,
  getFileExtension: getFileExtension,
  getFileName: getFileName,
  getBaseName: getBaseName,
  getParent: getParent,
  getRelativePathFrom: getRelativePathFrom,
  fileExists: fileExists,
};
