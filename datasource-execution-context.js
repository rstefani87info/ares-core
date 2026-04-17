const REQUEST_RUNTIME_CONTEXT_KEY = Symbol("aReS.datasource.requestContext");
let fallbackSessionIdCounter = 0;

function normalizeRequest(request) {
  return request && typeof request === "object" ? request : {};
}

export function resolveRequestRuntimeContext(request) {
  const normalizedRequest = normalizeRequest(request);
  const existingContext = normalizedRequest[REQUEST_RUNTIME_CONTEXT_KEY] ?? {};
  const sessionIdCandidate =
    normalizedRequest.session?.id ??
    normalizedRequest.sessionId ??
    normalizedRequest.headers?.["x-session-id"] ??
    existingContext.sessionId;

  const sessionId =
    sessionIdCandidate !== undefined &&
    sessionIdCandidate !== null &&
    `${sessionIdCandidate}`.trim() !== ""
      ? String(sessionIdCandidate)
      : `anonymous-${++fallbackSessionIdCounter}`;

  const context = {
    ...existingContext,
    sessionId,
  };

  normalizedRequest[REQUEST_RUNTIME_CONTEXT_KEY] = context;
  return { request: normalizedRequest, sessionId };
}

export function isDatasourceAllowed(aReS, datasourceName, request) {
  if (typeof aReS?.isResourceAllowed !== "function") {
    return true;
  }

  return aReS.isResourceAllowed(datasourceName, request);
}

export function getSessionLogLabel(sessionId) {
  return String(sessionId).substring(0, 10) + "...";
}
