/**
 * @prototype {array} 
 * @param {array} this_array
 * @param {function} filter
 * @returns {number}
 * @desc {en} Get the index of an element in an array
 * @desc {it} Ottieni l'indice di un elemento in un array
 * @desc {es} Obtener el indice de un elemento en un array
 * @desc {fr} Trouver l'indice d'un élément dans un array
 * @desc {de} Finde das Element in einem Array
 * @desc {pt} Obter o índice de um elemento em um array
 * @desc {zh} 获取数组中元素的索引
 * @desc {ru} Найти индекс элемента в массиве
 * @desc {ja} 配列の要素のインデックスを取得
 * 
 */
export function indexOfFilter(this_array,filter){
	const element=this_array.filter(filter)[0]??null;
	if(element) return this_array.indexOf(element);
	return null;
}
