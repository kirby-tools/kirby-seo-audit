import { fileURLToPath } from "node:url";

export const rootDir = fileURLToPath(new URL("../../", import.meta.url));
