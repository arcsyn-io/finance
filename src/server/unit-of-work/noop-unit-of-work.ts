import { ApplicationContext } from "@/server/context/application-context";
import { UnitOfWork } from "@/server/unit-of-work/unit-of-work";

export class NoopUnitOfWork implements UnitOfWork {
  async execute<T>(
    context: ApplicationContext,
    work: (context: ApplicationContext) => Promise<T>,
  ): Promise<T> {
    return work(context);
  }
}

export const noopUnitOfWork = new NoopUnitOfWork();
