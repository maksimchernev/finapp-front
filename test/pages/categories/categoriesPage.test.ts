import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Category } from "@/entities/category/model/types";
import { CategoriesPage } from "@/pages/categories/ui/CategoriesPage";

jest.mock("@/pages/categories/ui/CategoriesPage.module.scss", () =>
  new Proxy(
    {},
    {
      get: (_, key) => String(key),
    },
  ),
);

jest.mock("@/shared/ui/PageHeader.module.scss", () =>
  new Proxy(
    {},
    {
      get: (_, key) => String(key),
    },
  ),
);

jest.mock("@/entities/category/ui/CategoryIcon", () => ({
  CategoryIcon: ({ icon }: { icon: string }) =>
    React.createElement("span", null, icon),
}));

jest.mock("@/shared/ui/EmptyState", () => ({
  EmptyState: ({ text }: { text: string }) => React.createElement("div", null, text),
}));

describe("CategoriesPage", () => {
  it("renders expense categories with a protected system marker and user-category marker", () => {
    const html = renderToStaticMarkup(
      React.createElement(CategoriesPage, {
        categories,
        onCreateCategory: async () => categories[1],
        onDeleteCategory: async () => undefined,
        onUpdateCategory: async () => categories[1],
      }),
    );

    expect(html).toContain("Категории");
    expect(html).toContain("Расход");
    expect(html).toContain("Продукты");
    expect(html).toContain("Системная");
    expect(html).toContain("Питомец");
    expect(html).toContain("Можно удалить");
    expect(html).not.toContain("Зарплата");
  });
});

const categories: Category[] = [
  {
    bgColor: "#FAECE7",
    color: "#D85A30",
    icon: "shopping-cart",
    id: "groceries",
    isDefault: true,
    keywords: ["vkusvill", "pyaterochka"],
    name: "groceries",
    nameRu: "Продукты",
    type: "expense",
    userId: null,
  },
  {
    bgColor: "#E4EEE5",
    color: "#244C38",
    icon: "shopping-cart",
    id: "pets",
    isDefault: false,
    keywords: ["vet"],
    name: "user_user-a_pets",
    nameRu: "Питомец",
    type: "expense",
    userId: "user-a",
  },
  {
    bgColor: "#EAF3DE",
    color: "#639922",
    icon: "cash",
    id: "salary",
    isDefault: true,
    keywords: ["salary"],
    name: "salary",
    nameRu: "Зарплата",
    type: "income",
    userId: null,
  },
];
