import { env } from "~/env.mjs";
import LLaMATCPClient from "./adapters/llamacpp";

// https://stackoverflow.com/questions/64093560/can-you-keep-a-postgresql-connection-alive-from-within-a-next-js-api
export function getLLaMAClient() {
  // TODO: in the future, allow multiple adapters like llama.cpp and llama-rs and other similar models.
  if (!("llamaClient" in global)) {
    if (
      env.USE_BUILT_IN_LLAMA_SERVER === "false" &&
      env.LLAMA_SERVER_PORT === "auto"
    ) {
      throw new Error(
        "LLAMA_SERVER_PORT must be set to a port number when USE_BUILT_IN_LLAMA_SERVER is false."
      );
    }

    const LLaMAClient = new LLaMATCPClient(
      env.USE_BUILT_IN_LLAMA_SERVER === "true"
        ? {
            port: env.LLAMA_SERVER_PORT,
            modelPath: env.LLAMA_MODEL_PATH,
            binPath: env.LLAMA_TCP_BIN,
            debug: env.NODE_ENV === "development",
          }
        : {
            host: env.LLAMA_SERVER_HOST,
            port: env.LLAMA_SERVER_PORT as number,
            debug: env.NODE_ENV === "development",
          }
    );

    LLaMAClient.start();

    return ((global as any).llamaClient = LLaMAClient);
  }

  return (global as any).llamaClient as LLaMATCPClient;
}
