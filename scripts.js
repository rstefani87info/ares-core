/**
 * @author Roberto Stefani
 * @license MIT
 */

/**
 * @prototype {string}
 */
export async function getFunctionsFromFile(this_string) {
  const file = this_string;
  const script = await import('file://'+ import.meta.resolve(file));
  return Object.getOwnPropertyNames(script)
    .map((n) => script[n])
    .filter((x) => typeof x == "function");
}
/**
 * @prototype {function}
 */
export function getDocklet(this_function) {
  const fnString = this_function.toString();
  const commentRegex = /\/\*\*([\s\S]*?)\*\//;
  const match = fnString.match(commentRegex);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    return null;
  }
}

/**
 * @prototype {function}
 * @param {function}
 * @returns {array}
 * @desc {en} Get docklet annotations from function.
 * @desc {it} Ottieni le annotazioni docklet dal
 * @desc {es} Obtener anotaciones docklet de la
 * @desc {fr} Obtenez les annotations docklet de la
 * @desc {de} Erhalte docklet Annotationen aus der
 * @desc {pt} Obtenha as anotações docklet da
 * @desc {zh} 获取函数的 docklet 注释
 * @desc {ru} Получить аннотации docklet из функции
 * @desc {ja} 関数の docklet 注釈を取得
 *
 *
 */

export function getDockletAnnotations(this_function) {
  const s = getDocklet(this_function) ?? "";
  if (s) {
    const annotations = [];
    var last = { annotation: "commonDescription", description: "" };

    for (const l of s.split("\n")) {
      var description = (
        l.match(/^[\s\/*]*\s*(?<description>.*)/)[0] ?? ""
      ).trim();
      var match = l.match(
        /\*\s*@(?<annotation>\w+)(\s*\{(?<type>([^@]|\s)+)*\}){0,1}(\s+(?<name>\w+)){0,1}([\s\-]+(?<description>[\s\S]*)+){0,}/gi
      );
      if (match) {
        const { annotation, type, name, description } = match.groups;
        last = {
          annotation: annotation.trim(),
          type: type.trim(),
          name: name.trim(),
          description: description.trim(),
        };
        annotations.push(last);
      } else last.description += description ? "\n" + description : "";
    }
    return annotations;
  }
  return [];
}
/**
 * @prototype {function} getParameters
 * @param {function}
 * @returns {array}
 * @desc {en} Get function parameters
 * @desc {it} Ottieni i parametri della funzione
 * @desc {es} Obtener los parámetros de la función
 * @desc {fr} Obtenez les paramètres de la fonction
 * @desc {de} Liefert die Funktionsparameter
 * @desc {pt} Obtenha os parâmetros da função
 * @desc {zh} 获取函数参数
 * @desc {ru} Получить параметры функции
 * @desc {ja} 関数のパラメータを取得
 *
 */
export function getFunctionParameters(this_function) {
  const parameters = [];
  const s = f.toString();
  const { params } = s.match(
    /^\s*function\s*\w+\s*\((?<params>.*)\)\s*\{.*$/gm
  ).groups;
  const tokens = params.split(params);
  for (t of tokens) {
    const { commentLeft, multiple, name, value, commentRight } = t.match(
      /(?<commentLeft>\/\*.*\*\/)*\s*(?<multiple>[.]{3}){0,1}\s*(?<name>\w+)\s*(=\s*(?<value>".*"|'.*'|(\w)+))(?<commentRight>\/\*.*\*\/)*\s*/gi
    ).groups;
    parameters.push({
      name: name,
      defaultValue: value,
      multiple: multiple,
      commentLeft: commentLeft,
      commentRight: commentRight,
    });
  }
  return parameters;
}
/**
 * @prototype {function}
 * @param {function} this_function
 * @param {string} alias
 * @returns {function}
 * @desc {en} Create facade function
 * @desc {it} Crea una funzione facade
 * @desc {es} Crear una función de fachada
 * @desc {fr} Creer une fonction de façade
 * @desc {de} Erzeuge eine Facade-Funktion
 * @desc {pt} Criar uma função de fachada
 * @desc {zh} 创建函数
 * @desc {ru} Создать функцию фасада
 * 	@desc {ja} 関数のFacadeを作成
 *
 */
export function facade(this_function, alias = null) {
  const functionName = getFunctionName(this_function);
  if (functionName) {
    const params = getFunctionParameters(this_function);
    return new Function(
      "(" +
        params
          .filter((p) => !p.name.match(/^this_[\w]+$/))
          .map(
            (p) =>
              p.commentLeft ??
              "" + " " + p.multiple ??
              "" +
                p.name +
                (p.defaultValue ? "=" + p.defaultValue : "") +
                " " +
                p.commentRight
          )
          .join(",") +
        ")=>" +
        functionName +
        "(" +
        params.join(",") +
        ")"
    );
  }
}
/**
 * @prototype {function}
 * @param {function} this_function
 * @param {string} type
 * @param {string} alias
 * @returns {function}
 * 
 * @desc {en} Create facade function into prototype
 * @desc {it} Crea una funzione facade nel prototype
 * @desc {es} Crear una función de fachada en el prototype
 * @desc {fr} Creer une fonction de façade dans le prototype
 * @desc {de} Erzeuge eine Facade-Funktion in dem Prototype
 * @desc {pt} Criar uma função de fachada no prototype
 * @desc {zh} 创建函数到 prototype
 * @desc {ru} Создать функцию фасада в прототипе
 * 	@desc {ja} 関数のPrototypeにFacadeを作成
 * 
 */
export function facadeOnPrototype(this_function, type, alias = null) {
  return facadeOnObject(
    this_function,
    scriptsUtility.getTypeByName(pa.type).prototype,
    alias
  );
}
/**
 * @prototype {function}
 * @param {function} this_function
 * @param {object} object
 * @param {string} alias
 * @returns {function}
 * 
 * @desc {en} Create facade function into object
 * @desc {it} Crea una funzione facade nell'oggetto
 * @desc {es} Crear una función de fachada en el objeto
 * @desc {fr} Creer une fonction de façade dans l'objet
 * @desc {de} Erzeuge eine Facade-Funktion in dem Objekt
 * @desc {pt} Criar uma função de fachada no objeto
 * @desc {zh} 创建函数到对象
 * @desc {ru} Создать функцию фасада в объекте
 * 	@desc {ja} 関数のオブジェクトにFacadeを作成
 * 
 */
export function facadeOnObject(this_function, object, alias = null) {
  const functionName = getFunctionName(this_function);
  if (functionName) {
    const name = alias ? alias : functionName;
    object[name] = facade(this_function, alias);
	return object[name];
  }
  return null;
}
/**
 * @prototype {string} reflect
 * @param {string} this_string
 * 
 * @desc {en} Reflecta js type
 * @desc {it} Refletta il tipo js
 * @desc {es} Reflejar el tipo js
 * @desc {fr} Réflechir le type js
 * @desc {de} Reflektiere js-Typ
 * @desc {pt} Refletir o tipo js
 * @desc {zh} 反射js类型
 * @desc {ru} Отражение типа js
 * 	@desc {ja} jsの型を反映
 * 
 */
export function getTypeByName(this_string) {
  return global[this_string] || window[this_string];
}
/**
 * @prototype {function} getName
 * @param {function} this_function
 * 	@returns {string}
 * 
 * @desc {en} Get function name
 * @desc {it} Ottieni il nome della funzione
 * @desc {es} Obtener el nombre de la función
 * @desc {fr} Obtenez le nom de la fonction
 * @desc {de} Liefert den Namen der Funktion
 * @desc {pt} Obtenha o nome da função
 * @desc {zh} 获取函数名
 * @desc {ru} Получить имя функции
 * 	@desc {ja} 関数名を取得
 */
export function getFunctionName(this_function) {
  const f = this_function.toString().match(/function\s*([^\s(]+)\s*\(/);
  return f && f.length > 0 ? f[1] : null;
}

/**
 * @desc {en} Wait import promise not asynchronously
 * @desc {it} Aspetta la promise di importazione non asincronamente
 * @desc {es} Esperar la promise de importación no asíncronamente
 * @desc {fr} Attendez la promise d'importation non asynchrone
 * @desc {de} Warten Sie auf die importierende Promise nicht asynchron
 * @desc {pt} Espere a promise de importação não assíncrona
 * @desc {zh} 等待导入Promise不是异步的
 * @desc {ru} Ожидание промиса импорта не асинхронно
 * @desc {ja} 非同期のインポートPromiseを待機
 * 
 * @prototype {string} waitImportPromise
 * 
 * @param {*} modulePath 
 * @returns {Promise}
 */
export function waitImportPromise(modulePath) {
  let ret = null;
  const p = new Promise(async (resolve, reject) => {
    try {
        const module = await import(modulePath);
        const expectedImport = module.default;
        resolve(expectedImport);
    } catch (error) {
        reject(error);
    }
  }).then((data) => {
     ret = data
     return ret;
  }).catch((error) => {
    ret=false;
    throw new Error(error);
  });
  while (ret===null) {
     setTimeout(()=>{}, 100);
  }
   return p;
}
