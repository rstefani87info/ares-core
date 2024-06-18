import datasources from "./datasources.js";
import * as files  from "@ares/files";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

export async function loadSwaggerSetting(aReS) {
  const setting = { paths: {}, components: {} };
  (
    await datasources.initAllDatasources(
      aReS,
      datasources.exportDatasourceQueryAsRESTService,
      true
    )
  ).forEach((datasource) => {
    if (datasource.restRouter && Array.isArray(datasource.restRouter))
      datasource.restRouter.forEach((r) => r(aReS.server));
  });
  return setting;
}

export async function saveSwaggerSetting(aReS, path) {
  const setting = await loadSwaggerSetting(aReS);
  files.setFileContent(path+'/', JSON.stringify(setting, null, 2));
  return true;
}

export function exportDatasourceQueryAsSwaggerSetupService(
  aReS,
  mapper,
  datasource
) {
  asyncConsole.log(
    "datasources",
    " - open REST: {" + mapper.name + ":  " + mapper.path
  );
  aReS.exportRoute(
    datasource.name + "." + mapper.querySetting.name + "." + mapper.name,
    mapper,
    (req, res) => {
      let pathLevel = mapper.path;
      if (!pathLevel.startWith("/")) pathLevel = "/" + pathLevel;

      const pathLevelObject = {
        summary: mapper.summary,
        description: mapper.description,
        operationId:
          datasource.name + "." + mapper.querySetting.name + "." + mapper.name,
        parameters: {},
        responses: mapper.responses,
      };
      for (const k in mapper.parameters) {
        pathLevelObject.parameters["-" + k] = {
          name: k,
          description: mapper.parameters[k].description,
          required: mapper[k].required ?? false,

          schema: {},
        };
        if (
          mapper.parameters[k].type.indexOf("/") +
            mapper.parameters[k].type.indexOf("\\") +
            mapper.parameters[k].type.indexOf(".") <=
          -1
        )
          pathLevelObject.parameters["-" + k].schema.type =
            mapper.parameters[k].type;
        else
          pathLevelObject.parameters["-" + k].schema["$ref"] =
            "#components/schemas/" +
            mapper.parameters[k].type.replaceAll(/\.\\/g, "/");
        if (pathLevel.indexOf("{" + k + "}"))
          pathLevelObject.parameters["-" + k].in = "path";
      }
      for (const m in mapper.methods) {
        setting.paths[pathLevel] = setting.paths[pathLevel] || {};
        setting.paths[pathLevel][m.toLowerCase()] = pathLevelObject;
      }
    }
  );
  asyncConsole.log("datasources", " - }");
}


 

async function generate(language,apiUsername, apiName, apiVersion, apiKey, packageName,specFilePath, outputPath) {
  try {
    
    const specContent = files.getFileContent(specFilePath);

    const endpoint = `https://api.swaggerhub.com/apis/${apiUsername}/${apiName}/${apiVersion}/swagger-codegen/clients/${language}`;
    const requestBody = {
      spec: specContent,
      options: {
        packageName: packageName
      }
    };

    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'  
    };

    const response = await axios.post(endpoint, requestBody, requestOptions);

    console.log('Code generated successfully. Saving ZIP...');

    const zipFilePath = path.join(outputPath, 'generated_code.zip');
    fs.writeFileSync(zipFilePath, response.data);

    console.log('ZIP saved successfully. Decompressing...');

    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: outputPath }))
      .on('close', () => {
        console.log('Decompression complete.');
      });
  } catch (error) {
    console.error('Error generating code:', error);
  }
}

