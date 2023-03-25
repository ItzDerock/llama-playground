#!/usr/bin/env zx
import "dotenv/config";
import "zx/globals";
import os from "os";
import path from "path";
import { env } from "../src/env.mjs";

// don't run if user is providing their own server.
if (!env.USE_BUILT_IN_LLAMA_SERVER) process.exit(0);

// check if user is providing their own binary
if (env.LLAMA_TCP_BIN != "auto") {
  if (!fs.existsSync(env.LLAMA_TCP_BIN)) {
    console.error(
      `❌ LLAMA_TCP_BIN is set to '${env.LLAMA_TCP_BIN}' but that file doesn't exist.`
    );
    process.exit(1);
  }

  process.exit(0);
}

// check if llama.cpp's tcp_server is already built
if (fs.existsSync("./bin/") && fs.existsSync("./bin/main")) {
  console.log(chalk.green("✅ Llama.cpp's tcp_server is already built."));
  process.exit(0);
}

// clone and build the repo
const { path: tempDir, delete: deleteTempDir } = createTempDir();
console.log(
  chalk.gray(
    `🔃 (1/4) Created temporary directory at "${chalk.green(
      tempDir
    )}". Cloning repo...`
  )
);

// clone the repo
await $`git clone --depth 1 --branch tcp_server https://github.com/ggerganov/llama.cpp ${tempDir}`;
console.log(
  chalk.gray(`🔃 (2/4) Cloned llama.cpp's tcp_server branch to ${tempDir}`)
);

// build the repo
console.log(chalk.gray(`🔃 (3/4) Building llama.cpp's tcp_server...`));
try {
  await $`cd ${tempDir} && make -j`;
} catch (error) {
  console.error(
    chalk.red(`❌ Failed to build llama.cpp's tcp_server! Error: ${error}`)
  );
  console.error(`🗑️ Cleaning up...`);
  deleteTempDir();
  process.exit(1);
}

// copy the binary to the bin folder
console.log(chalk.gray(`🔃 (4/4) Copying binary to ./bin/main...`));
fs.mkdirSync("./bin/");
fs.copyFileSync(path.join(tempDir, "main"), "./bin/main");

// done
console.log(chalk.green("✅ Built llama.cpp's tcp_server! Cleaning up..."));
deleteTempDir();

/**
 * Creates a temporary directory and returns that directory's path and a function to delete it.
 * @returns {{ path: string;  delete: () => void; }}
 */
function createTempDir() {
  const random = Math.random().toString(36).substring(2, 15);
  const tempDir = path.join(os.tmpdir(), `llama-playground-tmp-${random}`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
    return {
      path: tempDir,
      delete: () => fs.removeSync(tempDir),
    };
  }

  return createTempDir();
}
