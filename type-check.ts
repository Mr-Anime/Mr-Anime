const ts = require("typescript");
const fs = require("fs");

function runTypecheck() {
  const projectDir = __dirname;
  const configPath = `${projectDir}/tsconfig.json`;
  const configContent = fs.readFileSync(configPath, "utf8");

  const options = ts.parseConfigFileText(
    configPath,
    {}, // host
    configContent,
    projectDir,
    undefined,
    undefined,
    {
      commentText: "no",
    }
  );

  if (options.errors.length > 0) {
    console.log("TypeScript Configuration Errors:");
    options.errors.forEach((error: any) => {
      console.log(`${error.code}: ${error.message}`);
    });
    process.exit(1);
  }

  const program = ts.createProgram(
    options.fileNames || [],
    options.options,
    require("module").createFromFilename(
      `${projectDir}/index.ts`
    )
  );

  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    console.log("TypeScript Type Check Errors:");
    diagnostics.forEach((diagnostic: any) => {
      console.log(`${ts.default.formatDiagnosticMessage(
        ts.sys,
        diagnostic,
        ts.formatCodeOptionsFromConfigData(options.options),
        { space: 2 }
      )}`);
    });
    process.exit(1);
  }

  console.log("TypeScript type check passed!");
}

runTypecheck();