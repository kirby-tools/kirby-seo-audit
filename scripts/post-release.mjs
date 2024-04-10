import { $, fs } from "zx";

const { name } = await fs.readJson("./package.json");
await $`git archive --format=zip --output=./${name}-$(git describe --tags).zip HEAD`;
