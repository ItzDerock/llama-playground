import { defineConfig, Options } from "tsup";

const opts: Options = {
  platform: "node",
  format: ["cjs"],
  treeshake: true,
  clean: true,
  sourcemap: true,
};

export default defineConfig([
  {
    entryPoints: ["src/server/index.ts"],
    ...opts,
  },
]);
