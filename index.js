/**
 * @author Roberto Stefani
 * @license MIT
 * A collection of base utilities of aReS framework.
 */
import * as arrays from "./arrays.js";
import * as console from "./console.js";
import * as crypto from "./crypto.js";
import * as dataDescriptor from "./dataDescriptors.js";
import * as datasources from "./datasources.js";
import * as dates from "./dates.js";
import * as i18n from "./i18n.js";
import * as numbers from "./numbers.js";
import * as objects from "./objects.js";
import * as permissions from "./permissions.js";
// import * as prototype from "./prototype.js";
import * as regex from "./regex.js";
import * as scripts from "./scripts.js";
import * as text from "./text.js";
import * as url from "./url.js";
import * as xhr from "./xhr.js";

import appSetup from "../../../app.js";

const idMap = { idKeyMap:{}, hashKeyMap:{} };
const aReS =  {
  arrays,
  console,
  crypto,
  dataDescriptor,
  datasources,
  dates,
  i18n,
  numbers,
  objects,
  permissions,
  // prototype,
  regex,
  scripts,
  text,
  url,
  xhr,
  appSetup,
  isProduction: function() {
    return appSetup.environments.find(x=>x.type.toLowerCase()=='production' && x.selected)!== undefined;
  },
  getIdMap:function(){
    return idMap;
  }
};

export default aReS;
