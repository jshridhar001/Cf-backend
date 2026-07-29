import "fastify";
import type { auth } from "../lib/auth.js";

type Session = typeof auth.$Infer.Session;

declare module "fastify" {
  interface FastifyRequest {
    user?: Session["user"];
    session?: Session["session"];
  }
}
