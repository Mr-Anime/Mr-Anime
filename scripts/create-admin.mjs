import { randomUUID, webcrypto } from "node:crypto";
import { spawn } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_-]{3,24}$/u;
const PASSWORD_ITERATIONS = 210_000;

function readHidden(prompt) {
  return new Promise((resolvePrompt, rejectPrompt) => {
    const input = process.stdin;
    if (!input.isTTY || !process.stdout.isTTY) {
      rejectPrompt(new Error("Run this command in an interactive terminal so the password can be entered privately."));
      return;
    }

    let value = "";
    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      process.stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          rejectPrompt(new Error("Admin setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolvePrompt(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = [...value].slice(0, -1).join("");
        } else if (character >= " ") {
          value += character;
        }
      }
    };

    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function passwordHash(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex(salt)}:${hex(new Uint8Array(bits))}`;
}

function executeWrangler(args) {
  return new Promise((resolveCommand, rejectCommand) => {
    const wranglerPath = resolve("node_modules/wrangler/bin/wrangler.js");
    const child = spawn(process.execPath, [wranglerPath, ...args], { stdio: "inherit" });
    child.once("error", rejectCommand);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveCommand();
      else rejectCommand(new Error(`Wrangler failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}.`));
    });
  });
}

async function main() {
  const database = process.argv[2]?.trim();
  if (!database || !/^[\w-]{1,63}$/.test(database)) {
    throw new Error("Provide the D1 database name from wrangler.jsonc: npm run admin:create -- <database-name>");
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let email;
  let username;
  try {
    email = (await terminal.question("Admin email: ")).trim().toLowerCase();
    username = (await terminal.question("Admin username (3-24 letters, numbers, _ or -): ")).trim();
  } finally {
    terminal.close();
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
  if (!USERNAME_PATTERN.test(username)) throw new Error("Enter a valid username.");

  const password = await readHidden("Admin password (not displayed): ");
  const confirmation = await readHidden("Confirm password (not displayed): ");
  if (password !== confirmation) throw new Error("The passwords do not match.");
  if (password.length < 8 || new TextEncoder().encode(password).length > 128) {
    throw new Error("Password must be at least 8 characters and no more than 128 bytes.");
  }

  const hash = await passwordHash(password);
  const emailSql = sqlString(email);
  const sqlPath = join(tmpdir(), `mr-anime-admin-${randomUUID()}.sql`);
  const sql = [
    `INSERT INTO users (email, username, password_hash, role) VALUES (${emailSql}, ${sqlString(username)}, ${sqlString(hash)}, 'admin');`,
    `INSERT INTO profiles (user_id) SELECT id FROM users WHERE email = ${emailSql};`,
  ].join("\n");

  await writeFile(sqlPath, sql, { encoding: "utf8", flag: "wx", mode: 0o600 });
  try {
    await executeWrangler(["d1", "execute", database, "--remote", "--file", sqlPath]);
  } finally {
    await unlink(sqlPath);
  }
  console.log("Admin account created. The password was entered privately and stored as a PBKDF2 hash.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin account setup failed.");
  process.exitCode = 1;
});
