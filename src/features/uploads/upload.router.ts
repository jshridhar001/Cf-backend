import { fromNodeHeaders } from "better-auth/node";
import { createUploadthing, type FileRouter } from "uploadthing/fastify";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth.js";

const f = createUploadthing();

export const uploadRouter = {
  plantationImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        throw new UploadThingError({
          code: "FORBIDDEN",
          message: "Authentication required",
        });
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(() => {
      // The client sends the returned file URLs on the plantation create request.
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
