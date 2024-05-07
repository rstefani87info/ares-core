 import permissions from "../../../permissionData.json" assert { type: "json" };

/**
 * @desc {en} Check if the resource is allowed based on the provided parameters.
 * @desc {it} Controlla se il riferimento è consentito in base ai parametri forniti.
 * @desc {es} Comprueba si el recurso esiste en base a los parametros proporcionados.
 * @desc {fr} Vérifie si la ressource est autorisée en fonction des paramètres fournis.
 * @desc {de} Überprüft, ob die Ressource zulässig ist, basierend auf den angegebenen Parametern.
 * @desc {pt} Verifica se o recurso é permitido baseado em parâmetros fornecidos.
 * @desc {zh} 检查指定参数是否允许访问资源
 * @desc {ru} Проверяет, разрешено ли ресурс в зависимости от параметров
 * @desc {ja} 指定されたパラメータを基にリソースを許可するかを確認
 *
 * @param {string} id - The ID of the resource
 * @param {string} [userId=null] - The user ID (optional)
 * @return {boolean} Whether the resource is allowed
 * 
 * @prototype {string}
 */

export function isResourceAllowed(
  id,
  {userId = null}, stopMode = 0
) {
  id = id.toLowerCase();
  let filteredPermissions = getPermission(userId).filter(
    (x) =>  x.allowedResource.indexOf(id) >= 0  
  );
  if(stopMode===0 ) return filteredPermissions.length > 0;
  if(stopMode===1 && filteredPermissions.length === 0) throw new Error("Permission denied");
  return filteredPermissions.length > 0;
}

/**
 * @desc {en} Function to get filtered permissions based on userId.
 * @desc {it} Funzione per ottenere le autorizzazioni filtrate in base all'ID dell'utente.
 * @desc {es} Función para obtener las autorizaciones filtradas en base al ID de usuario.
 * @desc {fr} Fonction pour obtenir les autorisations filtrées en fonction de l'ID de l'utilisateur.
 * @desc {de} Funktion für die gefilterten Berechtigungen basierend auf UserId.
 * @desc {pt} Função para obter as permissoes filtradas baseado no ID do usuário.
 * @desc {zh} 获取指定用户 ID 的过滤后的权限
 * @desc {ru} Функция для получения отфильтрованных разрешений, основываясь на ID пользователя
 * @desc {ja} ユーザーIDを基にフィルタリングされた権限を取得
 * 
 * 
 * @param {string} userId - The user ID for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(userId = null) {
  userId = (userId ?? "").match(/^\w+$/g) ? userId : "*";
  let filteredPermissions = permissions.filter(
    (x) =>
      (x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf(userId + "") >= 0
        : true) &&
      !(x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf("!" + userId) >= 0
        : false)
  );
  return filteredPermissions;
}

/**
 * @desc {en} Throws an error indicating that permission has been denied.
 * @desc {it} Genera un errore che indica che l'autorizzazione è stata negata.
 * @desc {es} Genera un error que indica que la autorización ha sido denegada.
 * @desc {fr} Envoie une erreur indiquant que la permission a été dés
 * @desc {de} Gibt eine Fehlernachricht mit dem Hinweis, dass die Berechtigung abgelehnt wurde.
 * @desc {pt} Gera um erro que indica que a permissão foi negada.
 * @desc {zh} 抛出错误表示拒绝访问
 * @desc {ru} Генерирует ошибку, сообщающую, что разрешение было отклонено
 * @desc {ja} 権限を拒否するためのエラーを送信
 *
 * @param {string} id - The ID of the resource.
 * @param {object} params - Additional parameters.
 * @return {undefined} This function does not return a value.
 */
export function permissionFail(id,params) {
  throw new Error("Permission denied");
}
export default permissions;
