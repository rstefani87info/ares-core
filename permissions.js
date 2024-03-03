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
 * @param {string} [host=null] - The host of the resource (optional)
 * @param {string} [userId=null] - The user ID (optional)
 * @param {string} [userAgent=null] - The user agent (optional)
 * @param {string} [method='ALL'] - The method for resource access (optional, default is 'ALL')
 * @return {boolean} Whether the resource is allowed
 * 
 * @prototype {string}
 */
export function isResourceAllowed(
  id,
  host = null,
  userId = null,
  userAgent = null,
  method = "ALL"
) {
  method = method ? method.toUpperCase() : "ALL";
  id = id.toLowerCase();
  let filteredPermissions = getPermission(host, userId, userAgent).filter(
    (x) =>
      x.allowedResource.indexOf(id) >= 0 &&
      (x.hosts && x.hosts.length > 0
        ? x.hosts.indexOf(host + "") >= 0
        : true) &&
      (x.methods && x.methods.length > 0 && method != "OPERATION"
        ? x.methods.indexOf(host + "") >= 0
        : true)
  );
  return filteredPermissions.length > 0;
}

/**
 * @desc {en} Function to get filtered permissions based on host, userId, and userAgent.
 * @desc {it} Funzione per ottenere le autorizzazioni filtrate in base al host, l'ID utente e l'user agent.
 * @desc {es} Función para obtener las autorizaciones filtradas en base al host, el ID de usuario y el agente de usuario.
 * @desc {fr} Fonction pour obtenir les autorisations filtrées en fonction de l'host, de l'ID d'utilisateur et de l'user agent.
 * @desc {de} Funktion für die gefilterten Berechtigungen basierend auf host, userId und userAgent.
 * @desc {pt} Função para obter as permissoes filtradas baseado em host, userId e userAgent.
 * @desc {zh} 获取基于host，userId和userAgent的过滤权限
 * @desc {ru} Функция для получения отфильтрованных разрешений на основе host, userId и userAgent
 * @desc {ja} host、userIdとuserAgentに基づくフィルタリングされた許可を取得
 * 
 * @param {string} host - The host for which permissions are being filtered
 * @param {string} userId - The user ID for which permissions are being filtered
 * @param {string} userAgent - The user agent for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(host = null, userId = null, userAgent = null) {
  userId = (userId ?? "").match(/^\w+$/g) ? userId : "*";
  userAgent = userAgent ? userAgent : "*";
  let filteredPermissions = permissions.filter(
    (x) =>
      (x.hosts && x.hosts.length > 0
        ? x.hosts.indexOf(host + "") >= 0
        : true) &&
      (x.userAgents && x.userAgents.length > 0
        ? x.userAgents.filter((y) => new RegExp(y).test(userAgent)).length >= 0
        : true) &&
      (x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf(userId + "") >= 0
        : true) &&
      !(x.allowOnlyForUserId && x.allowOnlyForUserId.length > 0
        ? x.allowOnlyForUserId.indexOf("!" + userId) >= 0
        : false)
  );
  return filteredPermissions;
}


