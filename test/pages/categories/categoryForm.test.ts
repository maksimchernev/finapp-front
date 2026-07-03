import type { Category } from "@/entities/category/model/types";
import {
  addCategoryKeyword,
  canEditCategory,
  createCategoryForm,
  removeCategoryKeyword,
  toCategoryPayload,
} from "@/pages/categories/lib/categoryForm";

describe("category form helpers", () => {
  it("creates a blank user-category form for the active type", () => {
    expect(createCategoryForm("income")).toEqual({
      bgColor: "#E1F5EE",
      color: "#1D9E75",
      icon: "cash",
      keywords: [],
      nameRu: "",
      type: "income",
    });
  });

  it("prefills the form from an existing category", () => {
    expect(createCategoryForm("expense", category)).toEqual({
      bgColor: "#FAECE7",
      color: "#D85A30",
      icon: "shopping-cart",
      keywords: ["vkusvill", "pyaterochka"],
      nameRu: "Продукты",
      type: "expense",
    });
  });

  it("normalizes keyword chips and skips duplicates", () => {
    const form = createCategoryForm("expense", category);

    expect(addCategoryKeyword(form, "  VKUSVILL  ").keywords).toEqual([
      "vkusvill",
      "pyaterochka",
    ]);
    expect(addCategoryKeyword(form, " Перекресток ").keywords).toEqual([
      "vkusvill",
      "pyaterochka",
      "перекресток",
    ]);
    expect(removeCategoryKeyword(form, "vkusvill").keywords).toEqual([
      "pyaterochka",
    ]);
  });

  it("creates a clean API payload", () => {
    expect(
      toCategoryPayload({
        ...createCategoryForm("expense"),
        keywords: ["  Vet  ", "vet", " Корм "],
        nameRu: "  Питомец  ",
      }),
    ).toEqual({
      bgColor: "#FAECE7",
      color: "#D85A30",
      icon: "shopping-cart",
      keywords: ["vet", "корм"],
      nameRu: "Питомец",
      type: "expense",
    });
  });

  it("allows editing only new and user-created categories", () => {
    expect(canEditCategory(null)).toBe(true);
    expect(canEditCategory(category)).toBe(false);
    expect(canEditCategory({ ...category, isDefault: undefined })).toBe(false);
    expect(
      canEditCategory({
        ...category,
        id: "pets",
        isDefault: false,
        name: "user_user-a_pets",
        nameRu: "Питомец",
        userId: "user-a",
      }),
    ).toBe(true);
  });
});

const category: Category = {
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
};
