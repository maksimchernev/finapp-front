import fs from "node:fs";
import path from "node:path";

describe("EmptyState", () => {
  test("renders an optional action on the right side of the same banner", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/shared/ui/EmptyState.tsx"),
      "utf8",
    );
    const styles = fs.readFileSync(
      path.resolve(process.cwd(), "src/shared/ui/EmptyState.module.scss"),
      "utf8",
    );

    expect(source).toContain("action?: ReactNode");
    expect(source).toContain("styles.action");
    expect(styles).toMatch(/\.emptyState\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*space-between;/s);
  });
});
