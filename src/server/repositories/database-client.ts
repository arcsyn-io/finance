import { ApplicationContext } from "../context/application-context";

export function resolveDatabaseClient<TDatabaseClient>(
  context: ApplicationContext,
  defaultClient: TDatabaseClient,
): TDatabaseClient {
  return (
    (context.transaction?.client as TDatabaseClient | undefined) ??
    defaultClient
  );
}
