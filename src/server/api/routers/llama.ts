import { observable } from "@trpc/server/observable";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getLLaMAClient } from "~/server/llama";
import { randomUUID } from "crypto";
import { generating, events, clients } from "~/server/api/shared";
import { z } from "zod";
import { WSMessageType, WSMessage } from "../types";

export const llamaRouter = createTRPCRouter({
  status: publicProcedure.query(() => {
    const client = getLLaMAClient();

    return {
      status: client.state,
    };
  }),

  subscription: publicProcedure.subscription(() => {
    return observable<WSMessage>((emit) => {
      // each client gets a unique UUID so we can keep track of them
      const uuid = randomUUID();

      // send the client their UUID
      emit.next({
        type: WSMessageType.IDENTITY,
        data: uuid,
      });

      // register this client
      clients.add(uuid);

      // create a callback function
      function completion(id: string, completion: string) {
        if (id === uuid) {
          emit.next({
            type: WSMessageType.COMPLETION,
            data: completion,
          });
        }
      }

      // done callback
      function done(id: string) {
        if (id === uuid) {
          emit.next({
            type: WSMessageType.REQUEST_COMPLETE,
            data: "",
          });
        }
      }

      // register callbacks
      events.incrementMaxListeners(2);
      events.on("generate", completion);
      events.on("generate:done", done);

      // handle disconnects
      return () => {
        // remove the client from the clients set
        clients.delete(uuid);

        // remove the callbacks
        events.off("generate", completion);
        events.off("generate:done", done);

        // decrement the max listeners
        events.decrementMaxListeners(2);

        // remove the client from the generating if they are generating
        if (generating.has(uuid)) {
          generating.delete(uuid);
          events.emit("generate:cancel", uuid);
        }
      };
    });
  }),

  startGeneration: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        options: z.object({
          "--seed": z.string().optional(),
          "--threads": z.number().optional(),
          "--n_predict": z.number().optional(),
          "--top_k": z.number().optional(),
          "--top_p": z.number().optional(),
          "--repeat_last_n": z.number().optional(),
          "--repeat_penalty": z.number().optional(),
          "--ctx_size": z.number().optional(),
          "--ignore-eos": z.boolean().optional(),
          "--memory_f16": z.boolean().optional(),
          "--temp": z.number().optional(),
          "--n_parts": z.number().optional(),
          "--batch_size": z.number().optional(),
          "--perplexity": z.number().optional(),
        }),
        uuid: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // validate uuid
      if (!clients.has(input.uuid)) {
        throw new Error("Invalid UUID");
      }

      // check if the client is already generating
      if (generating.has(input.uuid)) {
        throw new Error("Client is already generating");
      }

      // set the client's generating state to true
      generating.add(input.uuid);

      // start generation
      const client = getLLaMAClient();
      const { stream, cancel } = await client.complete(
        input.prompt,
        input.options
      );

      // forward the generated tokens to the client
      stream.on("data", (data) => {
        events.emit("generate", input.uuid, data.toString());
      });

      // handle cancel
      function cancelRequest(id: string) {
        if (id === input.uuid) {
          cancel();
        }
      }

      // increment the max listeners
      events.incrementMaxListeners(1);
      events.on("generate:cancel", cancelRequest);

      // when the client is done generating, set the client's generating state to false
      stream.on("end", () => {
        generating.delete(input.uuid);

        // send the client a message saying that generation is complete
        events.emit("generate:done", input.uuid);

        // clean up
        events.off("generate:cancel", cancelRequest);
        events.decrementMaxListeners(1);
      });
    }),

  cancelGeneration: publicProcedure
    .input(
      z.object({
        uuid: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // validate uuid
      if (!clients.has(input.uuid)) {
        throw new Error("Invalid UUID");
      }

      // check if the client is already generating
      if (!generating.has(input.uuid)) {
        throw new Error("Client is not generating");
      }

      // cancel generation
      events.emit("generate:cancel", input.uuid);
    }),
});
