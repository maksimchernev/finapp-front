import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("alias config", () => {
  it("uses a filesystem path for the Vite @ alias", () => {
    const viteConfig = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    const tsConfig = readFileSync(join(process.cwd(), "tsconfig.json"), "utf8");

    expect(viteConfig).toContain('fileURLToPath(new URL("./src", import.meta.url))');
    expect(viteConfig).not.toContain('"@": "/src"');
    expect(tsConfig).toContain('"@/*": ["./src/*"]');
    expect(tsConfig).toContain('"include": ["src", "test"]');
  });
});
