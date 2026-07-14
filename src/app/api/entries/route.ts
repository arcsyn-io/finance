import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createEntryJson,
  listEntriesJson,
} from "@/server/controllers/entry-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createEntryService } from "@/server/services/entry-service-factory";

export async function GET(request: Request) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await listEntriesJson({
    context,
    service: createEntryService(),
    query: parseEntriesQuery(new URL(request.url).searchParams),
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(request: Request) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await createEntryJson({
    context,
    service: createEntryService(),
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
    revalidatePath("/wallets");
    revalidatePath("/analysis/cash-flow");
  }

  return NextResponse.json(response.body, { status: response.status });
}

function parseEntriesQuery(searchParams: URLSearchParams) {
  return {
    startDate: valueOrUndefined(searchParams.get("startDate")),
    endDate: valueOrUndefined(searchParams.get("endDate")),
    walletIds: listParam(searchParams, "walletIds"),
    categoryIds: listParam(searchParams, "categoryIds"),
    natures: listParam(searchParams, "natures"),
    economicEvents: listParam(searchParams, "economicEvents"),
    includeDeleted: searchParams.get("includeDeleted") === "true",
  };
}

function valueOrUndefined(value: string | null): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function listParam(
  searchParams: URLSearchParams,
  key: string,
): string[] | undefined {
  const values = [
    ...searchParams.getAll(key),
    ...searchParams.getAll(`${key}[]`),
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}
