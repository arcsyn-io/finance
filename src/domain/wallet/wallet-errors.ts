export class WalletNotFoundError extends Error {
  constructor(message = "Carteira nao encontrada") {
    super(message);
    this.name = "WalletNotFoundError";
  }
}

export class DuplicateWalletNameError extends Error {
  constructor(message = "Ja existe uma carteira com este nome") {
    super(message);
    this.name = "DuplicateWalletNameError";
  }
}

export class InvalidWalletError extends Error {
  constructor(message = "Carteira invalida") {
    super(message);
    this.name = "InvalidWalletError";
  }
}
