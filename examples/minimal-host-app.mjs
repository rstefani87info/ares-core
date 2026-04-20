import aReSInitialize from "@ares/core";
import * as datasourcesModule from "@ares/core/datasources.js";
import * as permissionsModule from "@ares/core/permissions.js";

export function createApp() {
  const aReS = aReSInitialize(
    {
      name: "example-host",
      environments: [{ name: "dev", type: "test", selected: true }],
      config: {
        logging: { debug: false, diagnostics: false },
      },
      policies: {
        permissions: [{ hosts: ["localhost"], allowedResource: ["*"] }],
      },
    },
    { onDuplicate: "replace" }
  );

  aReS.include(datasourcesModule);
  aReS.include(permissionsModule);

  return aReS;
}

