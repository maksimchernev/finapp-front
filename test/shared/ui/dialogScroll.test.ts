import { resetDialogScroll } from "@/shared/ui/Dialog";

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
});
