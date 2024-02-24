/**
 * @prototype {string}
 */
function getMD5Hash(this_string){
	const crypto = require('crypto');
	const md5Hash = crypto.createHash('md5');
	md5Hash.update(this_string);
	return md5Value = md5Hash.digest('hex');
}

module.exports = {getMD5Hash:getMD5Hash};