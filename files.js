const fs = require('fs');
const path = require('path');

/**
 * @prototype {string} 
 */
function getFilesRecoursively(this_string, pattern, onlyFiles = false, fileArray = []) {
	return getFiles(this_string, pattern, onlyFiles, true, fileArray);
}
/**
 * @prototype {string} 
 */
function getFiles(this_string, pattern, onlyFiles = false, recoursively = false, fileArray = []) {
	const files = fs.readdirSync(this_string);

	files.forEach(file => {

		const filePath = path.join(this_string, file);
		const fileStat = fs.statSync(filePath);
		if (filePath.match(pattern) && (onlyFiles ? !fileStat.isDirectory() : true)) {
			fileArray.push(filePath);
		}
		if (fileStat.isDirectory() && recoursively) {
			fileArray = [...fileArray, ...getFiles(filePath, pattern, onlyFiles, (typeof recoursively == 'int' ? recoursively - 1 : recoursively))];
		}
	});

	return fileArray;
}
/**
 * @prototype {string} 
 */
function isDirectory(this_string) {
	return fs.statSync(this_string).isDirectory();
}
/**
 * @prototype {string} 
 */
function isFile(this_string) {
	return !fs.statSync(this_string).isDirectory() && fileExists(this_string);
}
/**
 * @prototype {string} 
 */
function getFileContent(this_string, encoding = 'utf-8') {
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
 */
async function setFileContent(filePath, content, encoding = 'utf-8') {
  try {
    await fs.writeFile(filePath, content, { encoding });
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error.message);
    throw error;
  }
}
/**
 * @prototype {string} 
 */
function getFile(this_path,file) {
	return path.join(this_path,file);
}
/**
 * @prototype {string} 
 */
function getFileExtension(this_string) {
	return path.extname(this_string);
}
/**
 * @prototype {string} 
 */
function getFileName(this_string) {
	return getBaseName(this_string).replace(new RegExp('\\.' + getFileExtension(this_string) + '$', 'i'), '');
}
/**
 * @prototype {string} 
 */
function getBaseName(this_string) {
	return path.basename(this_string);
}
/**
 * @prototype {string} 
 */
function getParent(this_string) {
	const parentDir = path.dirname(this_string);
	return path.normalize(parentDir);
}

/**
 * @prototype {string} 
 */
function getRelativePathFrom(this_string, referenceDir) {
	return path.normalize(path.relative(referenceDir, this_string));
}

/**
 * @prototype {string} 
 */
function fileExists(this_string) {
	try {
		const fileStat = fs.statSync(path.normalize(this_string));
		return fileStat.ctime != null;
	} catch (e) { return false; }
}


module.exports = {setFileContent:setFileContent,getFile:getFile, isDirectory: isDirectory, isFile: isFile, getFiles: getFiles, getFilesRecoursively: getFilesRecoursively, getFileContent: getFileContent, getFileExtension: getFileExtension, getFileName: getFileName, getBaseName: getBaseName, getParent: getParent, getRelativePathFrom: getRelativePathFrom, fileExists: fileExists };
