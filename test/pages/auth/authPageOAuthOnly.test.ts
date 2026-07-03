import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("auth page providers", () => {
  it("renders provider sign-in links without a direct token entrypoint", () => {
    const authPage = readFileSync(join(process.cwd(), "src/pages/auth/ui/AuthPage.tsx"), "utf8");
    const appRoot = readFileSync(join(process.cwd(), "src/app/App.tsx"), "utf8");
    const frontReadme = readFileSync(join(process.cwd(), "README.md"), "utf8");
    const quickstart = readFileSync(join(process.cwd(), "../bend/QUICKSTART.md"), "utf8");

    expect(authPage).toContain("authUrls.google");
    expect(authPage).toContain("authUrls.yandex");
    expect(authPage).not.toContain("onToken");
    expect(authPage).not.toContain("<input");
    expect(appRoot).toContain("<AuthPage error={session.error} />");

    expect(frontReadme).not.toContain("QUICKSTART.md");
    expect(quickstart).toContain("## Настройка OAuth (опционально)");
  });
});
