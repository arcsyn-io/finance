import assert from "node:assert/strict";
import test from "node:test";
import { ApplicationContext } from "../server/context/application-context";
import type {
  ConsumptionRepository,
  MonthlyCategoryConsumptionRow,
} from "../server/repositories/consumption-repository";
import { ConsumptionService } from "../server/services/consumption-service";

const context = ApplicationContext.user({
  principalId: "00000000-0000-0000-0000-000000000001",
});

test("consolida consumo por categoria e preserva meses sem movimentos", async () => {
  const rows: MonthlyCategoryConsumptionRow[] = [
    {
      categoryId: "food",
      categoryName: "Alimentacao",
      categoryColor: "red",
      categoryIcon: "Utensils",
      month: "2026-01",
      amountCents: 12500,
    },
    {
      categoryId: "food",
      categoryName: "Alimentacao",
      categoryColor: "red",
      categoryIcon: "Utensils",
      month: "2026-03",
      amountCents: 7500,
    },
    {
      categoryId: "home",
      categoryName: "Moradia",
      categoryColor: "blue",
      categoryIcon: "House",
      month: "2026-03",
      amountCents: 30000,
    },
  ];
  const repository: ConsumptionRepository = {
    listMonthlyByCategory: async () => rows,
  };
  const service = new ConsumptionService(repository);

  const result = await service.getByCategory(context, {
    startDate: "2026-01-15",
    endDate: "2026-03-20",
  });

  assert.deepEqual(result.months, ["2026-01", "2026-02", "2026-03"]);
  assert.equal(result.totalCents, 50000);
  assert.deepEqual(
    result.categories.map((category) => ({
      name: category.name,
      totalCents: category.totalCents,
      percentage: category.percentage,
      monthlyAmountsCents: category.monthlyAmountsCents,
    })),
    [
      {
        name: "Moradia",
        totalCents: 30000,
        percentage: 60,
        monthlyAmountsCents: [0, 0, 30000],
      },
      {
        name: "Alimentacao",
        totalCents: 20000,
        percentage: 40,
        monthlyAmountsCents: [12500, 0, 7500],
      },
    ],
  );
});

test("retorna percentuais zerados quando nao ha consumo", async () => {
  const repository: ConsumptionRepository = {
    listMonthlyByCategory: async () => [],
  };
  const service = new ConsumptionService(repository);

  const result = await service.getByCategory(context, {
    startDate: "2026-07-01",
    endDate: "2026-07-31",
  });

  assert.equal(result.totalCents, 0);
  assert.deepEqual(result.months, ["2026-07"]);
  assert.deepEqual(result.categories, []);
});
