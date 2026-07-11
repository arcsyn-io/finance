export class ImportNotFoundError extends Error {
  constructor() {
    super("Importacao nao encontrada");
    this.name = "ImportNotFoundError";
  }
}

export class InvalidImportError extends Error {
  constructor(message = "Importacao invalida") {
    super(message);
    this.name = "InvalidImportError";
  }
}
