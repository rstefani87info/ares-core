export function aReSInitialize(aReS) {
  aReS.isResourceAllowed = (id, requestOrParams = {}, stopMode = 0) =>
    isResourceAllowed(aReS, id, requestOrParams, stopMode);
  aReS.getPermission = (...args) => getPermission(aReS, ...args);
}

export default aReSInitialize;

function toArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== undefined && item !== null);
  if (value === undefined || value === null) return [];
  return [value];
}

function normalizeUserId(userId = null) {
  return typeof userId === "string" && /^\w+$/.test(userId) ? userId : "*";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesPattern(pattern, value) {
  const normalizedPattern = String(pattern ?? "").trim();
  const normalizedValue = String(value ?? "");

  if (!normalizedPattern || normalizedPattern === "*") return true;

  if (!normalizedPattern.includes("*")) {
    return normalizedPattern.toLowerCase() === normalizedValue.toLowerCase();
  }

  const regexPattern = `^${escapeRegex(normalizedPattern).replace(/\\\*/g, ".*")}$`;
  return new RegExp(regexPattern, "i").test(normalizedValue);
}

function matchesAny(patterns, value, wildcardValue = null) {
  if (patterns.length === 0) return true;
  if (wildcardValue !== null && value === wildcardValue) return true;
  return patterns.some((pattern) => matchesPattern(pattern, value));
}

function normalizePermissionContext(requestOrParams = {}, userId = null, userAgent = null) {
  if (requestOrParams && typeof requestOrParams === "object" && !Array.isArray(requestOrParams)) {
    return {
      host:
        requestOrParams.ip ??
        requestOrParams.host ??
        requestOrParams.hostname ??
        requestOrParams.headers?.host ??
        null,
      userId:
        requestOrParams.session?.id ??
        requestOrParams.userId ??
        requestOrParams.user?.id ??
        userId,
      userAgent:
        requestOrParams.headers?.["user-agent"] ??
        requestOrParams.userAgent ??
        userAgent ??
        "*",
      method:
        requestOrParams.method ??
        requestOrParams.httpMethod ??
        null
    };
  }

  return {
    host: requestOrParams ?? null,
    userId,
    userAgent: userAgent ?? "*",
    method: null
  };
}

function getPermissionsSource(aReS) {
  const permissions = aReS?.getPolicy?.("permissions");
  return Array.isArray(permissions) ? permissions : [];
}

function matchesResource(permission, resourceId) {
  const resources = toArray(permission.allowedResource ?? permission.resources);
  if (resources.length === 0) return true;
  return resources.some((resource) => matchesPattern(resource, resourceId));
}

function matchesMethod(permission, method) {
  const methods = toArray(permission.methods);
  if (methods.length === 0 || !method) return true;
  return methods.some((allowedMethod) => String(allowedMethod).toUpperCase() === String(method).toUpperCase());
}

/**
 * Check if the resource is allowed based on the provided parameters.
 *
 * @param {object} aReS - The aReS instance
 * @param {string} id - The ID of the resource
 * @param {object|string} [requestOrParams={}] - Request-like object or host value
 * @param {number} [stopMode=0] - 0 returns a boolean, 1 throws, 2 delegates to permissionFail
 * @return {boolean} Whether the resource is allowed
 */
export function isResourceAllowed(
  aReS,
  id,
  requestOrParams = {},
  stopMode = 0
) {
  const resourceId = String(id ?? "").toLowerCase();
  const filteredPermissions = getPermission(aReS, requestOrParams).filter(
    (permission) => matchesResource(permission, resourceId)
  );

  if (stopMode === 0) return filteredPermissions.length > 0;
  if (stopMode === 1 && filteredPermissions.length === 0) {
    throw new Error("Permission denied");
  }
  if (stopMode === 2 && filteredPermissions.length === 0) {
    permissionFail(resourceId, requestOrParams);
  }

  return filteredPermissions.length > 0;
}

/**
 * Function to get filtered permissions based on host, userId and userAgent.
 *
 * @param {object} aReS - The aReS instance
 * @param {object|string} [requestOrParams={}] - Request-like object or host value
 * @param {string} [userId=null] - The user ID for which permissions are being filtered
 * @param {string} [userAgent=null] - The user agent for which permissions are being filtered
 * @return {array} The filtered permissions based on the provided parameters
 */
export function getPermission(aReS, requestOrParams = {}, userId = null, userAgent = null) {
  const permissions = getPermissionsSource(aReS);
  const context = normalizePermissionContext(requestOrParams, userId, userAgent);
  const normalizedUserId = normalizeUserId(context.userId);
  const normalizedUserAgent = context.userAgent ?? "*";
  const normalizedHost = context.host;
  const normalizedMethod = context.method;

  return permissions.filter((permission) => {
    const hosts = toArray(permission.hosts);
    const userAgents = toArray(permission.userAgents);
    const allowOnlyForUserId = toArray(permission.allowOnlyForUserId);
    const dontAllowOnlyForUserId = toArray(permission.dontAllowOnlyForUserId);

    const hostAllowed =
      hosts.length === 0 || normalizedHost === null
        ? true
        : matchesAny(hosts, String(normalizedHost));

    const userAgentAllowed =
      userAgents.length === 0
        ? true
        : matchesAny(userAgents, String(normalizedUserAgent), "*");

    const userAllowed =
      allowOnlyForUserId.length === 0
        ? true
        : allowOnlyForUserId.includes(normalizedUserId);

    const userDenied = dontAllowOnlyForUserId.includes(normalizedUserId);

    return hostAllowed && userAgentAllowed && userAllowed && !userDenied && matchesMethod(permission, normalizedMethod);
  });
}

/**
 * Throws an error indicating that permission has been denied.
 *
 * @param {string} id - The ID of the resource.
 * @param {object} params - Additional parameters.
 * @return {undefined} This function does not return a value.
 */
export function permissionFail(id, params) {
  throw new Error(`Permission denied for resource "${id}"`);
}
