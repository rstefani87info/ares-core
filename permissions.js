 import permissions from "../../../permissionData.json" assert { type: "json" };

/**
 * Check if the resource is allowed based on the provided parameters.
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
 * Function to get filtered permissions based on userId.
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
 * Throws an error indicating that permission has been denied.
 *
 * @param {string} id - The ID of the resource.
 * @param {object} params - Additional parameters.
 * @return {undefined} This function does not return a value.
 */
export function permissionFail(id,params) {
  throw new Error("Permission denied");
}
export default permissions;
