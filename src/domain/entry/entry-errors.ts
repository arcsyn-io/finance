export class EntryNotFoundError extends Error {
  constructor(message = "Lancamento nao encontrado") {
    super(message);
    this.name = "EntryNotFoundError";
  }
}

export class InvalidEntryError extends Error {
  constructor(message = "Lancamento invalido") {
    super(message);
    this.name = "InvalidEntryError";
  }
}
