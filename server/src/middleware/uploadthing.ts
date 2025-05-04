import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {};

f({}).middleware(({ req }) => {
  return {};
});
