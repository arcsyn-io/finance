import { ApplicationContext } from "../context/application-context";

export interface UnitOfWork {
  execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T>;
}
