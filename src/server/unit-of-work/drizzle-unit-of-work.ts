import { db } from "@/db/client";
import {
  ApplicationContext,
  TransactionContext,
} from "../context/application-context";
import { UnitOfWork } from "./unit-of-work";

export type DrizzleDatabase = typeof db;
export type DrizzleTransaction = Parameters<
  Parameters<DrizzleDatabase["transaction"]>[0]
>[0];

export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly database: DrizzleDatabase = db) {}

  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      return work(
        context.withTransaction(new TransactionContext(transaction)),
      );
    });
  }
}

export const unitOfWork = new DrizzleUnitOfWork();
