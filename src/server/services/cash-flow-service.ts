import type {
  GetAnnualCashFlowCommand,
  UpdateCashFlowConfigCommand,
} from "../commands/cash-flow-commands";
import type { ApplicationContext } from "../context/application-context";
import type {
  AnnualCashFlowDto,
  CashFlowCategoryDto,
  MonthlyCashFlowDto,
} from "../dto/cash-flow-dto";
import type {
  CashFlowAggregateRow,
  CashFlowConfigRecord,
  CashFlowRepository,
} from "../repositories/cash-flow-repository";
import type { UnitOfWork } from "../unit-of-work/unit-of-work";
import { UpdateCashFlowConfigUseCase } from "../usecases/cash-flow/update-cash-flow-config.usecase";

export type CashFlowServiceDependencies = {
  readonly repository: CashFlowRepository;
  readonly unitOfWork: UnitOfWork;
};

type MonthlyAccumulator = {
  receiptsCents: number;
  expensesCents: number;
  nonOperationalCashInCents: number;
  nonOperationalCashOutCents: number;
};

type CategoryAccumulator = {
  readonly categoryId: string | null;
  readonly categoryName: string;
  readonly categoryColor: string | null;
  readonly monthlyAmountsCents: number[];
};

export class CashFlowService {
  private readonly updateCashFlowConfigUseCase: UpdateCashFlowConfigUseCase;

  constructor(private readonly dependencies: CashFlowServiceDependencies) {
    this.updateCashFlowConfigUseCase = new UpdateCashFlowConfigUseCase(
      dependencies.repository,
    );
  }

  async getAnnual(
    context: ApplicationContext,
    command: GetAnnualCashFlowCommand,
  ): Promise<AnnualCashFlowDto> {
    const referenceMonths = annualReferenceMonths(command.year);
    const [rows, configs] = await Promise.all([
      this.dependencies.repository.listAnnualAggregates(context, command),
      this.dependencies.repository.listConfigsByYear(context, command),
    ]);
    const monthlyValues = new Map<string, MonthlyAccumulator>(
      referenceMonths.map((referenceMonth) => [
        referenceMonth,
        createMonthlyAccumulator(),
      ]),
    );
    const monthIndexes = new Map(
      referenceMonths.map((referenceMonth, index) => [referenceMonth, index]),
    );
    const categoryCollections = createCategoryCollections();

    for (const row of rows) {
      const monthly = monthlyValues.get(row.month);
      const monthIndex = monthIndexes.get(row.month);

      if (!monthly || monthIndex === undefined) {
        continue;
      }

      addMonthlyAmount(monthly, row);
      addCategoryAmount(
        selectCategoryCollection(categoryCollections, row),
        row,
        monthIndex,
      );
    }

    const configsByMonth = new Map(
      configs.map((config) => [config.referenceMonth, config]),
    );
    const months = referenceMonths.map((referenceMonth) =>
      buildMonthlyCashFlow(
        referenceMonth,
        monthlyValues.get(referenceMonth) ?? createMonthlyAccumulator(),
        configsByMonth.get(referenceMonth),
      ),
    );

    return {
      year: command.year,
      months,
      operationalIncomeCategories: buildCategoryDtos(
        categoryCollections.operationalIncome,
      ),
      operationalExpenseCategories: buildCategoryDtos(
        categoryCollections.operationalExpense,
      ),
      nonOperationalIncomeCategories: buildCategoryDtos(
        categoryCollections.nonOperationalIncome,
      ),
      nonOperationalExpenseCategories: buildCategoryDtos(
        categoryCollections.nonOperationalExpense,
      ),
    };
  }

  async updateConfig(
    context: ApplicationContext,
    command: UpdateCashFlowConfigCommand,
  ): Promise<void> {
    return this.dependencies.unitOfWork.execute(context, (transactionContext) =>
      this.updateCashFlowConfigUseCase.execute(transactionContext, command),
    );
  }
}

type CategoryCollections = {
  readonly operationalIncome: Map<string, CategoryAccumulator>;
  readonly operationalExpense: Map<string, CategoryAccumulator>;
  readonly nonOperationalIncome: Map<string, CategoryAccumulator>;
  readonly nonOperationalExpense: Map<string, CategoryAccumulator>;
};

function annualReferenceMonths(year: number): string[] {
  return Array.from(
    { length: 12 },
    (_, index) =>
      `${String(year).padStart(4, "0")}-${String(index + 1).padStart(2, "0")}`,
  );
}

function createMonthlyAccumulator(): MonthlyAccumulator {
  return {
    receiptsCents: 0,
    expensesCents: 0,
    nonOperationalCashInCents: 0,
    nonOperationalCashOutCents: 0,
  };
}

function createCategoryCollections(): CategoryCollections {
  return {
    operationalIncome: new Map(),
    operationalExpense: new Map(),
    nonOperationalIncome: new Map(),
    nonOperationalExpense: new Map(),
  };
}

function addMonthlyAmount(
  monthly: MonthlyAccumulator,
  row: CashFlowAggregateRow,
): void {
  if (row.scope === "OPERATIONAL") {
    if (row.direction === "IN") {
      monthly.receiptsCents += row.amountCents;
    } else {
      monthly.expensesCents += row.amountCents;
    }
    return;
  }

  if (row.direction === "IN") {
    monthly.nonOperationalCashInCents += row.amountCents;
  } else {
    monthly.nonOperationalCashOutCents += row.amountCents;
  }
}

function selectCategoryCollection(
  collections: CategoryCollections,
  row: CashFlowAggregateRow,
): Map<string, CategoryAccumulator> {
  if (row.scope === "OPERATIONAL") {
    return row.direction === "IN"
      ? collections.operationalIncome
      : collections.operationalExpense;
  }

  return row.direction === "IN"
    ? collections.nonOperationalIncome
    : collections.nonOperationalExpense;
}

function addCategoryAmount(
  categories: Map<string, CategoryAccumulator>,
  row: CashFlowAggregateRow,
  monthIndex: number,
): void {
  const key = row.categoryId ?? "__uncategorized__";
  const category = categories.get(key) ?? {
    categoryId: row.categoryId,
    categoryName: row.categoryName ?? "Sem categoria",
    categoryColor: row.categoryColor,
    monthlyAmountsCents: Array<number>(12).fill(0),
  };

  category.monthlyAmountsCents[monthIndex] += row.amountCents;
  categories.set(key, category);
}

function buildMonthlyCashFlow(
  referenceMonth: string,
  values: MonthlyAccumulator,
  config?: CashFlowConfigRecord,
): MonthlyCashFlowDto {
  const openingBalanceCents = config?.openingBalanceCents ?? 0;
  const minimumCashCents = config?.minimumCashCents ?? 0;
  const netCashFlowCents = values.receiptsCents - values.expensesCents;
  const closingBalanceCents = openingBalanceCents + netCashFlowCents;

  return {
    referenceMonth,
    receiptsCents: values.receiptsCents,
    expensesCents: values.expensesCents,
    netCashFlowCents,
    openingBalanceCents,
    closingBalanceCents,
    minimumCashCents,
    surplusOrDeficitCents: closingBalanceCents - minimumCashCents,
    nonOperationalCashInCents: values.nonOperationalCashInCents,
    nonOperationalCashOutCents: values.nonOperationalCashOutCents,
    nonOperationalNetCashFlowCents:
      values.nonOperationalCashInCents - values.nonOperationalCashOutCents,
  };
}

function buildCategoryDtos(
  categories: Map<string, CategoryAccumulator>,
): CashFlowCategoryDto[] {
  return [...categories.values()]
    .map<CashFlowCategoryDto>((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryColor: category.categoryColor,
      monthlyAmountsCents: category.monthlyAmountsCents,
      totalCents: category.monthlyAmountsCents.reduce(
        (total, amount) => total + amount,
        0,
      ),
    }))
    .sort(
      (left, right) =>
        right.totalCents - left.totalCents ||
        left.categoryName.localeCompare(right.categoryName, "pt-BR"),
    );
}
