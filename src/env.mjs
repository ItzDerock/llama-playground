import { z } from "zod";

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  USE_BUILT_IN_LLAMA_SERVER: z
    .literal("true")
    .or(z.literal("false"))
    .or(z.boolean()),
  LLAMA_SERVER_HOST: z.string().min(1).or(z.literal("auto")),
  LLAMA_SERVER_PORT: z.number().int().positive().or(z.literal("auto")),
  LLAMA_MODEL_PATH: z.string().min(1),
  LLAMA_TCP_BIN: z.string().min(1).or(z.literal("auto")),
  PORT: z.string(),
  HOST: z.string(),
});

/**
 * Specify your client-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z.object({
  // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 *
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  USE_BUILT_IN_LLAMA_SERVER: process.env.USE_BUILT_IN_LLAMA_SERVER,
  LLAMA_SERVER_HOST: process.env.LLAMA_SERVER_HOST,
  LLAMA_SERVER_PORT: process.env.LLAMA_SERVER_PORT,
  LLAMA_MODEL_PATH: process.env.LLAMA_MODEL_PATH,
  LLAMA_TCP_BIN: process.env.LLAMA_TCP_BIN,
  PORT: process.env.PORT ?? "3000",
  HOST: process.env.HOST ?? "localhost",
};

// Don't touch the part below
// --------------------------

const merged = server.merge(client);

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

let env = /** @type {MergedOutput} */ (process.env);

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined";

  const parsed = /** @type {MergedSafeParseReturn} */ (
    isServer
      ? merged.safeParse(processEnv) // on server we can validate all env vars
      : client.safeParse(processEnv) // on client we can only validate the ones that are exposed
  );

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`
        );
      return target[/** @type {keyof typeof target} */ (prop)];
    },
  });
}

export { env };
