import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { User } from "@/entities/user/model/types";
import { RecognitionMethodSwitch } from "@/pages/settings/ui/RecognitionMethodSwitch";

jest.mock("@/pages/settings/ui/RecognitionMethodSwitch/RecognitionMethodSwitch.module.scss", () => ({}));
jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn() }));
jest.mock("motion/react", () => ({ AnimatePresence: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/shared/ui/Dialog", () => ({ Dialog: ({ children, ariaLabelledBy }: { children: React.ReactNode; ariaLabelledBy: string }) => React.createElement("section", { role: "dialog", "aria-labelledby": ariaLabelledBy }, children) }));
jest.mock("@/pages/settings/ui/RecognitionConsentDialog/RecognitionConsentDialog.module.scss", () => ({}));

const user: User = { id: "user", email: "test@example.com", name: "Test", avatar: null, provider: "manual", aiTestAccess: true };

describe("profile recognition switch", () => {
  const state: unknown[] = [];
  let cursor = 0;
  beforeEach(() => {
    state.length = 0;
    jest.mocked(React.useState).mockImplementation(((initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (next: unknown) => { state[index] = next; }];
    }) as typeof React.useState);
  });

  function render(profile: User, onChange = jest.fn().mockResolvedValue(undefined)) {
    cursor = 0;
    const element = RecognitionMethodSwitch({ user: profile, onChange });
    return { html: renderToStaticMarkup(element), element, onChange };
  }

  function find(element: React.ReactNode, predicate: (props: Record<string, unknown>) => boolean): Record<string, unknown> {
    if (!React.isValidElement(element)) throw new Error("Missing control");
    const props = element.props as Record<string, unknown>;
    if (predicate(props)) return props;
    for (const child of React.Children.toArray(props.children as React.ReactNode)) {
      try { return find(child, predicate); } catch { /* Search next child. */ }
    }
    throw new Error("Missing control");
  }

  it("opens a consent dialog when AI is selected without saved consent", () => {
    const { html, element } = render(user);
    expect(find(element, (props) => props.value === "tesseract").checked).toBe(true);
    expect(find(element, (props) => props.value === "ai").disabled).toBe(false);
    expect(html).toContain("OpenAI");
    const onChange = jest.fn();
    const initial = render(user, onChange);
    (find(initial.element, (props) => props.value === "ai").onChange as Function)();
    const opened = render(user, onChange);
    expect(opened.html).toContain('role="dialog"');
    expect(find(opened.element, (props) => props.value === "tesseract").checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not offer cloud access to new accounts", () => {
    const { element, html } = render({ ...user, aiTestAccess: false });
    expect(find(element, (props) => props.value === "ai").disabled).toBe(true);
    expect(html).toContain("AI доступен только участникам тестирования");
  });

  it("saves AI only after consent and disables controls during the save", async () => {
    let complete!: () => void;
    const onChange = jest.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const initial = render(user, onChange);
    (find(initial.element, (props) => props.value === "ai").onChange as Function)();
    const opened = render(user, onChange);
    (find(opened.element, (props) => typeof props.onConfirm === "function").onConfirm as Function)();
    expect(onChange).toHaveBeenCalledWith("ai", true);
    const saving = render(user, onChange);
    expect(find(saving.element, (props) => props["aria-describedby"] === "recognition-privacy").disabled).toBe(true);
    complete();
    await Promise.resolve();
  });

  it("preserves cloud consent when switching to Tesseract", async () => {
    const profile = { ...user, preferences: { defaultCurrency: "RUB", recognitionMethod: "ai" as const, aiRecognitionConsent: true } };
    const { element, onChange } = render(profile);
    (find(element, (props) => props.value === "tesseract").onChange as Function)();
    expect(onChange).toHaveBeenCalledWith("tesseract", undefined);
    await Promise.resolve();
  });

  it("keeps the saved method and displays a failed save", async () => {
    const onChange = jest.fn().mockRejectedValue(new Error("AI отключён"));
    const initial = render(user, onChange);
    (find(initial.element, (props) => props.value === "ai").onChange as Function)();
    const opened = render(user, onChange);
    (find(opened.element, (props) => typeof props.onConfirm === "function").onConfirm as Function)();
    await Promise.resolve();
    const { html, element } = render(user, onChange);
    expect(find(element, (props) => props.value === "tesseract").checked).toBe(true);
    expect(html).toContain('role="alert"');
    expect(html).toContain("AI отключён");
  });

  it("cancelling consent leaves the selected method and account unchanged", () => {
    const onChange = jest.fn();
    const initial = render(user, onChange);
    (find(initial.element, (props) => props.value === "ai").onChange as Function)();
    const opened = render(user, onChange);
    (find(opened.element, (props) => typeof props.onConfirm === "function").onClose as Function)();
    const closed = render(user, onChange);
    expect(closed.html).not.toContain('role="dialog"');
    expect(find(closed.element, (props) => props.value === "tesseract").checked).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("saved consent allows immediate AI activation without another dialog", async () => {
    const profile = { ...user, preferences: { defaultCurrency: "RUB", recognitionMethod: "tesseract" as const, aiRecognitionConsent: true } };
    const { element, onChange } = render(profile);
    (find(element, (props) => props.value === "ai").onChange as Function)();
    expect(onChange).toHaveBeenCalledWith("ai", undefined);
    await Promise.resolve();
    expect(render(profile, onChange).html).not.toContain('role="dialog"');
  });
});
