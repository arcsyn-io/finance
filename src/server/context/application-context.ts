export type PrincipalType = "user" | "system";

export type ApplicationPrincipal = {
  readonly type: PrincipalType;
  readonly id: string;
};

export type UserApplicationPrincipal = ApplicationPrincipal & {
  readonly type: "user";
};

export type ApplicationContextProps = {
  readonly principal: ApplicationPrincipal;
  readonly transaction?: TransactionContext;
  readonly correlationId?: string;
  readonly now?: Date;
};

export type UserApplicationContextProps = {
  readonly principalId: string;
  readonly correlationId?: string;
  readonly now?: Date;
};

export type SystemApplicationContextProps = {
  readonly principalId?: string;
  readonly correlationId?: string;
  readonly now?: Date;
};

export class AuthenticationRequiredError extends Error {
  constructor(message = "Operacao requer usuario autenticado.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export class TransactionContext<TClient = unknown> {
  constructor(readonly client: TClient) {}
}

export class ApplicationContext {
  readonly principal: ApplicationPrincipal;
  readonly transaction?: TransactionContext;
  readonly correlationId?: string;
  readonly now: Date;

  constructor(props: ApplicationContextProps) {
    this.principal = props.principal;
    this.transaction = props.transaction;
    this.correlationId = props.correlationId;
    this.now = props.now ?? new Date();
  }

  static user(props: UserApplicationContextProps): ApplicationContext {
    return new ApplicationContext({
      principal: {
        type: "user",
        id: props.principalId,
      },
      correlationId: props.correlationId,
      now: props.now,
    });
  }

  static system(props: SystemApplicationContextProps = {}): ApplicationContext {
    return new ApplicationContext({
      principal: {
        type: "system",
        id: props.principalId ?? "system",
      },
      correlationId: props.correlationId,
      now: props.now,
    });
  }

  requireUserPrincipal(): UserApplicationPrincipal {
    if (this.principal.type !== "user") {
      throw new AuthenticationRequiredError();
    }

    return this.principal as UserApplicationPrincipal;
  }

  withTransaction(transaction: TransactionContext): ApplicationContext {
    return new ApplicationContext({
      principal: this.principal,
      correlationId: this.correlationId,
      now: this.now,
      transaction,
    });
  }

  withoutTransaction(): ApplicationContext {
    return new ApplicationContext({
      principal: this.principal,
      correlationId: this.correlationId,
      now: this.now,
    });
  }
}
