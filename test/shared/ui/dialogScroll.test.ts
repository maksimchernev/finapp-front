import { resetDialogScroll } from "@/shared/ui/Dialog";
import fs from "node:fs";
import path from "node:path";

describe("Dialog scroll behavior", () => {
  it("resets the page and dialog scroll positions when a modal opens", () => {
    const page = {
      scrollTo: jest.fn(),
    };
    const dialog = {
      scrollLeft: 18,
      scrollTo: jest.fn(),
      scrollTop: 240,
    };

    resetDialogScroll(dialog, page);

    expect(page.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });
    expect(dialog.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });
    expect(dialog.scrollLeft).toBe(0);
    expect(dialog.scrollTop).toBe(0);
  });

  it("can preserve the page position while resetting the dialog scroll", () => {
    const page = {
      scrollTo: jest.fn(),
    };
    const dialog = {
      scrollLeft: 18,
      scrollTo: jest.fn(),
      scrollTop: 240,
    };

    resetDialogScroll(dialog, page, false);

    expect(page.scrollTo).not.toHaveBeenCalled();
    expect(dialog.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });
    expect(dialog.scrollLeft).toBe(0);
    expect(dialog.scrollTop).toBe(0);
  });

  it("animates the shared backdrop and dialog with restrained motion", () => {
    const source = readSource("src/shared/ui/Dialog.tsx");

    expect(source).toContain("<motion.div");
    expect(source).toContain("<motion.section");
    expect(source).toContain("transition={{ duration: 0.18 }}");
    expect(source).toContain("scale: 0.96, y: 12");
    expect(source).toContain('type: "spring"');
    expect(source).toContain("stiffness: 420");
    expect(source).toContain("damping: 36");
    expect(source).toContain("bounce: 0");
  });

  it.each([
    "src/pages/upload/ui/ManualTransactionDialog.tsx",
    "src/pages/banks/ui/BanksPage.tsx",
    "src/pages/categories/ui/CategoriesPage.tsx",
    "src/pages/transactions/ui/TransactionsPage.tsx",
    "src/pages/settings/ui/SettingsPage.tsx",
  ])("keeps conditional dialogs mounted for exit motion in %s", (file) => {
    const source = readSource(file);

    expect(source).toContain('import { AnimatePresence } from "motion/react"');
    expect(source).toContain("<AnimatePresence");
    expect(source).toContain("</AnimatePresence>");
  });
});

function readSource(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), "utf8");
}
