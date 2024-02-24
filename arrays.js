/**
 * @prototype {array} 
 */
function indexOfFilter(this_array,filter){
	const element=this_array.filter(filter)[0]??null;
	if(element) return this_array.indexOf(element);
	return null;
}

module.exports = {indexOfFilter:indexOfFilter};