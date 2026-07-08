export class CategoryNotFoundError extends Error {
  constructor(message = "Categoria nao encontrada") {
    super(message);
    this.name = "CategoryNotFoundError";
  }
}

export class DuplicateCategoryNameError extends Error {
  constructor(message = "Ja existe uma categoria com este nome") {
    super(message);
    this.name = "DuplicateCategoryNameError";
  }
}

export class InvalidCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCategoryError";
  }
}
