import fastify from "fastify";
import sensible from "@fastify/sensible";
import cors from "@fastify/cors";
import formBody from "@fastify/formbody";
import dotenv from "dotenv";

import { registerRoutes } from "./routes/index.js";

dotenv.config();

async function start() {
  const server = fastify({
    logger: process.env.NODE_ENV !== "test"
  });

  await server.register(sensible);
  await server.register(cors, {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true
  });
  await server.register(formBody);

  registerRoutes(server);

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";

  try {
    const address = await server.listen({ port, host });
    server.log.info(`Server listening on ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void start();
