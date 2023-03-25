import fastify from "fastify";
import fastifyNextJS from "./plugins/next";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import "dotenv/config";
import { env } from "~/env.mjs";
import { appRouter } from "./api/root";
import { createTRPCContext } from "./api/trpc";
import ws from "@fastify/websocket";
import path from "path";
import { fastifyStatic } from "@fastify/static";

// create fastify app
export const app = fastify({
  // prevent errors during large batch requests
  maxParamLength: 5000,
});

// register the next.js plugin
app.register(fastifyNextJS, {
  dev: env.NODE_ENV !== "production",
  dir: ".",
});

// serve static files in /public
app.register(fastifyStatic, {
  root: path.join(__dirname, "..", "public"),
  prefix: "/public/",
});

// register ws for websocket support
// needed for subscriptions
app.register(ws);

// register the trpc plugin
app.register(fastifyTRPCPlugin, {
  prefix: "/api/trpc",
  useWSS: true,
  trpcOptions: {
    router: appRouter,
    createContext: createTRPCContext,
  },
});

// pass to next.js if no route is defined
app.addHook("onRequest", (req, rep, done) => {
  // if a route is defined, skip
  if (req.routerPath) {
    return done();
  }

  // if it's a websocket request, skip
  if (req.headers.connection === "Upgrade") {
    return done();
  }

  // if it's requesting a static file, skip
  if (req.url.startsWith("/public/")) {
    return done();
  }

  if (req.url === "/") app.nextHandle(req.raw, rep.raw);
});

// start the server
app.listen({ port: parseInt(env.PORT), host: env.HOST }).then((address) => {
  console.log(`🚀 Server ready at ${address}`);
});