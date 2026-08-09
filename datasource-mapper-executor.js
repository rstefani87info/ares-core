import {whenOrException} from "./flow.js";
import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import * as advancedConsole from "./console.js";
import { ValidationError } from "./datasource-errors.js";


const mapRequestOrResult = function (request) {
  return request;
};

export async function executeDatasourceRequestMapper(mapper, request) {
  advancedConsole.debug(`[DEBUG] execute: start - ${mapper.name}`);
  const params = await prepareParams(mapper, request);

  request = cloneWithMethods(request);
  request.parameters = params;
  advancedConsole.debug("in query");

  const response = await runQuery(mapper, request);

  await processResponse(mapper, response, request);

  if (mapper.postExecute && mapper.postExecute instanceof Function) {
    advancedConsole.debug(`[DEBUG] execute: postExecute - ${mapper.name}`);
    mapper.postExecute(request, mapper.datasource, response);
  }

  addDebugInfo(mapper, response);
  attachHelpers(mapper, response);

  advancedConsole.debug(`[DEBUG] execute: end - ${mapper.name}`);

  return response;
}

async function prepareParams(mapper, request) {
  const validationRoles =
    mapper.parametersValidationRoles instanceof Function
      ? await mapper.parametersValidationRoles(request, mapper.aReS)
      : {};

  const params = await format(request, validationRoles, mapper.datasource);
  advancedConsole.debug(`[DEBUG] _prepareParams: format - ${mapper.name}`, params);
  if (params["€rror"]) {
    advancedConsole.error("aReS Error:", params["€rror"], request.query);
    throw new ValidationError(
      "Formatting and validation error: " + JSON.stringify(params["€rror"]),
      params["€rror"]
    );
  }
  return params;
}

async function runQuery(mapper, request) {
  advancedConsole.debug(`[DEBUG] _runQuery: start - ${mapper.name}`);
  let response = { results: [] };
  let query = mapper.query;
  if (typeof query === "function") {
    query = query(request, mapper);
    if(query instanceof Promise){
      query = await query;
    }
  }

  response = await whenOrException( 
    () => mapper.datasource.query(request, query, mapper), 
    null , 
    "query_returned_no_response", 
    null,
    advancedConsole);
    
    advancedConsole.debug(`[DEBUG] _runQuery: end - ${mapper.name}`, response);
  return response;
}

async function processResponse(mapper, response, request) {
  advancedConsole.debug(`[DEBUG] _processResponse: start - ${mapper.name}`);
  if (response["€rror"]) {
    advancedConsole.debug(`[DEBUG] _processResponse: error found - ${mapper.name}`);
    return;
  }

  if (
    !response.results ||
    (Array.isArray(response.results) && response.results.length === 0)
  ) {
    advancedConsole.debug(`[DEBUG] _processResponse: empty result - ${mapper.name}`);
    mapper.onEmptyResult?.(response, request, mapper.aReS);
    return;
  }

  if (Array.isArray(response.results)) {
    advancedConsole.debug(
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
    advancedConsole.debug(
      `[DEBUG] _processResponse: mapping single object - ${mapper.name}`
    );
    response.results = await mapSingleResult(mapper, response.results, 0, request);
  }
  advancedConsole.debug(`[DEBUG] _processResponse: end - ${mapper.name}`);
}

async function mapSingleResult(mapper, item, index, request) {
  advancedConsole.debug(`[DEBUG] _mapSingleResult: start - ${mapper.name} [${index}]`);
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
