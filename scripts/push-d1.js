#!/usr/bin/env node
/**
 * Auto DQL / SQL Push Script for Cloudflare D1 Database
 *
 * Usage:
 *   node scripts/push-d1.js [options]
 *
 * Options:
 *   --local          Push / execute queries against local D1 database (default: true if no --remote specified)
 *   --remote         Push / execute queries against remote production Cloudflare D1 database
 *   --database <name> D1 database name specified in wrangler.toml (default: mr-anime-db)
 *   --file <path>    Push/execute a specific SQL/DQL file
 *   --dir <path>     Directory containing SQL files to push (default: d1/migrations)
 *   --query <sql>    Execute an inline DQL query string
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    remote: false,
    local: true,
    database: "mr-anime-db",
    file: null,
    dir: "d1/migrations",
    query: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--remote" || arg === "--prod") {
      options.remote = true;
      options.local = false;
    } else if (arg === "--local") {
      options.local = true;
      options.remote = false;
    } else if (arg === "--database" && i + 1 < args.length) {
      options.database = args[++i];
    } else if (arg === "--file" && i + 1 < args.length) {
      options.file = args[++i];
    } else if (arg === "--dir" && i + 1 < args.length) {
      options.dir = args[++i];
    } else if (arg === "--query" && i + 1 < args.length) {
      options.query = args[++i];
    }
  }

  return options;
}

function getDatabaseNameFromWrangler() {
  const wranglerPath = path.join(process.cwd(), "wrangler.toml");
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, "utf-8");
    const match = content.match(/database_name\s*=\s*["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return "mr-anime-db";
}

function ensureWranglerConfig(databaseName) {
  const wranglerPath = path.join(process.cwd(), "wrangler.toml");
  if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, "utf-8");
    // Check if wrangler.toml has an active [[d1_databases]] block (uncommented)
    const hasUncommentedD1 = /^\[\[d1_databases\]\]/m.test(content);
    if (hasUncommentedD1) {
      return { configFlag: "", cleanup: null };
    }
  }

  // Create temporary config file for wrangler CLI execution
  const tmpConfigPath = path.join(process.cwd(), ".d1-wrangler.tmp.toml");
  const tmpContent = `name = "mr-anime"
compatibility_date = "2026-10-26"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "${databaseName}"
database_id = "00000000-0000-0000-0000-000000000000"
migrations_dir = "d1/migrations"
`;
  fs.writeFileSync(tmpConfigPath, tmpContent, "utf-8");

  return {
    configFlag: `-c "${tmpConfigPath}"`,
    cleanup: () => {
      if (fs.existsSync(tmpConfigPath)) {
        try {
          fs.unlinkSync(tmpConfigPath);
        } catch {}
      }
    },
  };
}

function executeWranglerCommand(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    const stdout = execSync(cmd, { encoding: "utf-8", stdio: "inherit" });
    return { success: true, output: stdout };
  } catch (err) {
    console.error(`❌ Execution failed: ${err.message}`);
    return { success: false, error: err };
  }
}

function main() {
  const opts = parseArgs();
  const dbName = opts.database || getDatabaseNameFromWrangler();
  const flag = opts.remote ? "--remote" : "--local";

  const { configFlag, cleanup } = ensureWranglerConfig(dbName);

  try {
    console.log("=========================================");
    console.log("🚀 Cloudflare D1 Auto DQL/SQL Push Script");
    console.log("=========================================");
    console.log(`Target Database : ${dbName}`);
    console.log(`Environment     : ${opts.remote ? "REMOTE (Production)" : "LOCAL"}`);
    console.log("-----------------------------------------");

    // 1. Inline query execution
    if (opts.query) {
      console.log(`Executing inline query...`);
      const escapedQuery = opts.query.replace(/"/g, '\\"');
      const cmd = `npx wrangler d1 execute ${dbName} ${configFlag} ${flag} --command="${escapedQuery}"`;
      const res = executeWranglerCommand(cmd);
      if (!res.success) process.exit(1);
      console.log("\n✅ Inline query executed successfully.");
      return;
    }

    // 2. Specific file execution
    if (opts.file) {
      const filePath = path.resolve(opts.file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: Specified file not found: ${filePath}`);
        process.exit(1);
      }
      console.log(`Pushing single SQL file: ${opts.file}`);
      const cmd = `npx wrangler d1 execute ${dbName} ${configFlag} ${flag} --file="${filePath}"`;
      const res = executeWranglerCommand(cmd);
      if (!res.success) process.exit(1);
      console.log("\n✅ SQL file pushed successfully.");
      return;
    }

    // 3. Directory scan and push
    const targetDir = path.resolve(opts.dir);
    if (!fs.existsSync(targetDir)) {
      console.error(`⚠️ Directory "${opts.dir}" does not exist. Creating directory...`);
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Please place your .sql migration files in "${opts.dir}".`);
      return;
    }

    const files = fs
      .readdirSync(targetDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log(`ℹ️ No .sql files found in "${opts.dir}". Nothing to push.`);
      return;
    }

    console.log(`Found ${files.length} SQL file(s) in "${opts.dir}":`);
    files.forEach((f) => console.log(` - ${f}`));

    let successCount = 0;
    for (const file of files) {
      const fullPath = path.join(targetDir, file);
      console.log(`\n-----------------------------------------`);
      console.log(`📄 Executing/Pushing: ${file}`);
      const cmd = `npx wrangler d1 execute ${dbName} ${configFlag} ${flag} --file="${fullPath}"`;
      const res = executeWranglerCommand(cmd);
      if (res.success) {
        successCount++;
      } else {
        console.error(`⚠️ Failed to execute ${file}. Stopping execution process.`);
        process.exit(1);
      }
    }

    console.log("\n=========================================");
    console.log(`🎉 Auto DQL Push Complete! (${successCount}/${files.length} succeeded)`);
    console.log("=========================================");
  } finally {
    if (cleanup) cleanup();
  }
}

main();
