import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const checkedRoots = ["src", "test"];
const sourceExtensions = [".ts", ".tsx"];
const relativeImportPattern = /\b(?:import|export)\b(?:\s+[^'";]*?\bfrom\s*)?\s*["'](\.{1,2}\/[^"']+)["']/g;

describe("import style", () => {
  it("does not use relative import paths in TypeScript files", () => {
    const violations = findSourceFiles(process.cwd(), checkedRoots)
      .flatMap((filePath) => {
        const source = readFileSync(filePath, "utf8");
        const matches = [...source.matchAll(relativeImportPattern)];

        return matches.map((match) => `${relative(process.cwd(), filePath)} -> ${match[1]}`);
      });

    expect(violations).toEqual([]);
  });
});

function findSourceFiles(rootDir: string, roots: string[]) {
  return roots.flatMap((root) => walk(join(rootDir, root)));
}

function walk(pathname: string): string[] {
  const stat = statSync(pathname);

  if (stat.isFile()) {
    return sourceExtensions.some((extension) => pathname.endsWith(extension)) ? [pathname] : [];
  }

  return readdirSync(pathname).flatMap((child) => walk(join(pathname, child)));
}
