import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AmountInput } from "@/shared/ui/AmountInput";

jest.mock("@/shared/ui/AmountInput.module.scss", () => ({
  input: "input",
  root: "root",
  sign: "sign",
}));

describe("AmountInput", () => {
  it("renders an unsigned decimal field with a compact sign button", () => {
    const html = renderToStaticMarkup(
      React.createElement(AmountInput, {
        negative: true,
        value: "123,45",
        onNegativeChange: () => undefined,
        onValueChange: () => undefined,
      }),
    );

    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="123,45"');
    expect(html).toContain('aria-label="Сделать доходом"');
    expect(html).toContain(">−</button>");
  });

  it("reports sign and text changes", () => {
    const onNegativeChange = jest.fn();
    const onValueChange = jest.fn();
    const field = AmountInput({
      negative: false,
      value: "",
      onNegativeChange,
      onValueChange,
    }) as React.ReactElement<{ children: React.ReactNode }>;
    const [signButton, input] = React.Children.toArray(field.props.children) as [
      React.ReactElement<{ onClick: () => void }>,
      React.ReactElement<{
        onChange: (event: { target: { value: string } }) => void;
      }>,
    ];

    signButton.props.onClick();
    input.props.onChange({ target: { value: "10,50" } });

    expect(onNegativeChange).toHaveBeenCalledWith(true);
    expect(onValueChange).toHaveBeenCalledWith("10,50");
  });
});
