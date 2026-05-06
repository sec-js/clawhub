#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

type Options = {
  port: string;
  envFile: string | null;
  seed: boolean;
  seedOnly: boolean;
};

const DEFAULT_ENV_SOURCES = [
  ".env.local",
  "/Users/patrickerichsen/Git/openclaw/clawhub/.env.local",
];

function parseArgs(argv: string[]): Options {
  const options: Options = {
    port: "3000",
    envFile: process.env.CLAWHUB_ENV_FILE ?? null,
    seed: false,
    seedOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--seed") {
      options.seed = true;
    } else if (arg === "--seed-only") {
      options.seed = true;
      options.seedOnly = true;
    } else if (arg === "--port") {
      options.port = argv[index + 1] ?? options.port;
      index += 1;
    } else if (arg.startsWith("--port=")) {
      options.port = arg.slice("--port=".length);
    } else if (arg === "--env-file") {
      options.envFile = argv[index + 1] ?? options.envFile;
      index += 1;
    } else if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
    }
  }

  return options;
}

function findEnvFile(explicit: string | null) {
  const candidates = explicit ? [explicit] : DEFAULT_ENV_SOURCES;
  return candidates
    .map((candidate) => resolve(candidate))
    .find((candidate) => existsSync(candidate));
}

function parseEnv(text: string) {
  const env: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function loadEnv(envFile: string) {
  const parsed = parseEnv(await readFile(envFile, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
  return parsed;
}

async function isReachable(url: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function run(command: string, args: string[], extraEnv: Record<string, string | undefined>) {
  return (
    spawnSync(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: "inherit",
    }).status ?? 1
  );
}

async function main() {
  const options = parseArgs(Bun.argv.slice(2));
  const envFile = findEnvFile(options.envFile);
  if (!envFile) {
    console.error(
      "Could not find .env.local. Pass --env-file <path> or set CLAWHUB_ENV_FILE to the canonical checkout env.",
    );
    process.exit(1);
  }

  await loadEnv(envFile);

  const convexUrl = process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.error(`${basename(envFile)} is missing VITE_CONVEX_URL.`);
    process.exit(1);
  }

  if (!existsSync("node_modules/.bin/vite")) {
    console.log("Installing dependencies for this worktree...");
    const installStatus = run("bun", ["install"], {});
    if (installStatus !== 0) process.exit(installStatus);
  }

  const convexReady = await isReachable(convexUrl);
  if (!convexReady) {
    console.error(`Convex is not reachable at ${convexUrl}.`);
    console.error("Start the local backend first with: bunx convex dev --typecheck=disable");
    console.error(`Using env file: ${envFile}`);
    process.exit(1);
  }

  if (options.seed) {
    console.log("Seeding sample skills...");
    const seedStatus = run("bunx", ["convex", "run", "--no-push", "devSeed:seedNixSkills"], {});
    if (seedStatus !== 0) process.exit(seedStatus);

    const statsStatus = run(
      "bunx",
      ["convex", "run", "--no-push", "statsMaintenance:updateGlobalStatsAction"],
      {},
    );
    if (statsStatus !== 0) process.exit(statsStatus);
  }

  if (options.seedOnly) return;

  console.log(`Starting ClawHub from ${process.cwd()}`);
  console.log(`Using env file: ${envFile}`);
  process.exit(run("bun", ["--bun", "vite", "dev", "--port", options.port], {}));
}

await main();
