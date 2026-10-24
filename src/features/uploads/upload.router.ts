import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { createUploadthing, type FileRouter } from "uploadthing/fastify";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth.js";

const f = createUploadthing();

async function requireUploadSession(headers: IncomingHttpHeaders) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(headers),
  });

  if (!session) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Authentication required",
    });
  }

  return { userId: session.user.id };
}

export const uploadRouter = {
  plantationImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the plantation request.
    }),
  irrigationImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the irrigation request.
    }),
  rougingImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the rouging request.
    }),
  stripTestImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the strip test request.
    }),
  dehaulmingImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the dehaulming request.
    }),
  fieldVisitImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => requireUploadSession(req.headers))
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the field visit request.
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
