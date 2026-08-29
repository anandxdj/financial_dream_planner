import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateOpenApiDocument } from "../src/openapi";

const output = resolve(process.cwd(), "../docs/api/openapi.json");
await mkdir(resolve(process.cwd(), "../docs/api"), { recursive: true });
await writeFile(output, `${JSON.stringify(generateOpenApiDocument(), null, 2)}\n`);
