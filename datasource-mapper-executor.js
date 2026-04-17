import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import * as advancedConsole from "./console.js";
import { ValidationError } from "./datasource-errors.js";

const mapRequestOrResult = function (request) {
  return request;
};

export async function executeDatasourceRequestMapper(mapper, request) {
  advancedConsole.log(`[DEBUG] execute: start - ${mapper.name}`);
  const params = await prepareParams(mapper, request);

  request = cloneWithMethods(request);
  request.parameters = params;
  advancedConsole.log("in query");

  const response = await runQuery(mapper, request);

  await processResponse(mapper, response, request);

  if (mapper.postExecute && mapper.postExecute instanceof Function) {
    advancedConsole.log(`[DEBUG] execute: postExecute - ${mapper.name}`);
    mapper.postExecute(request, mapper.datasource, response);
  }

  addDebugInfo(mapper, response);
  attachHelpers(mapper, response);

  advancedConsole.log("Mapped results:", response);
  advancedConsole.log(`[DEBUG] execute: end - ${mapper.name}`);

  return response;
}

async function prepareParams(mapper, request) {
  advancedConsole.log(`[DEBUG] _prepareParams: start - ${mapper.name}`);
  const validationRoles =
    mapper.parametersValidationRoles instanceof Function
      ? await mapper.parametersValidationRoles(request, mapper.aReS)
      : {};

  const params = await format(request, validationRoles, mapper.datasource);
  advancedConsole.log(`[DEBUG] _prepareParams: format - ${mapper.name}`, params);
  if (params["€rror"]) {
    advancedConsole.error("aReS Error:", params["€rror"], request.query);
    throw new ValidationError(
      "Formatting and validation error: " + JSON.stringify(params["€rror"]),
      params["€rror"]
    );
  }
  advancedConsole.log(`[DEBUG] _prepareParams: end - ${mapper.name}`, params);
  return params;
}

async function runQuery(mapper, request) {
  advancedConsole.log(`[DEBUG] _runQuery: start - ${mapper.name}`);
  let response = { results: [] };
  if (typeof mapper.query === "string") {
    response = await mapper.datasource.query(request, mapper.query, mapper);
  } else if (typeof mapper.query === "function") {
    response = await mapper.datasource.query(
      request,
      await mapper.query(request, mapper),
      mapper
    );
  }
  if (!response) {
    throw new Error("Query returned no response");
  }
  advancedConsole.log(`[DEBUG] _runQuery: end - ${mapper.name}`, response);
  return response;
}

async function processResponse(mapper, response, request) {
  advancedConsole.log(`[DEBUG] _processResponse: start - ${mapper.name}`);
  if (response["€rror"]) {
    advancedConsole.log(`[DEBUG] _processResponse: error found - ${mapper.name}`);
    return;
  }

  if (
    !response.results ||
    (Array.isArray(response.results) && response.results.length === 0)
  ) {
    advancedConsole.log(`[DEBUG] _processResponse: empty result - ${mapper.name}`);
    mapper.onEmptyResult?.(response, request, mapper.aReS);
    return;
  }

  if (Array.isArray(response.results)) {
    advancedConsole.log(
      `[DEBUG] _processResponse: mapping array (${response.results.length}) - ${mapper.name}`
    );
    for (let i = 0; i < response.results.length; i++) {
      response.results[i] = await mapSingleResult(
        mapper,
        response.results[i],
        i,
        request
      );
    }
  } else {
    advancedConsole.log(
      `[DEBUG] _processResponse: mapping single object - ${mapper.name}`
    );
    response.results = await mapSingleResult(mapper, response.results, 0, request);
  }
  advancedConsole.log(`[DEBUG] _processResponse: end - ${mapper.name}`);
}

async function mapSingleResult(mapper, item, index, request) {
  advancedConsole.log(`[DEBUG] _mapSingleResult: start - ${mapper.name} [${index}]`);
  let result = item;
  if (mapper.mapResult && mapper.mapResult instanceof Function) {
    result = await mapper.mapResult(result, index, request, mapper.aReS);
  } else if (typeof mapper.mapResult !== "function") {
    mapper.mapResult = mapRequestOrResult;
  }
  if (mapper.transformToDTO && mapper.transformToDTO instanceof Function) {
    result = await mapper.transformToDTO(result, index, request, mapper.aReS);
  }
  return result;
}

function addDebugInfo(mapper, response) {
  if (!mapper.aReS.isProduction) {
    response.datasourceName = mapper.datasource.name;
    response.queryName = mapper.name;
    response.query = mapper.query;
  }
}

function attachHelpers(mapper, response) {
  response.getResultsData = () => {
    if (response?.results?.data?.length > 0) {
      if (response.results.data[0]["@type"] === "ares-rest-response") {
        return response.results.data[0].results.results;
      }
      return response.results.data;
    }
    return response.results;
  };
}

