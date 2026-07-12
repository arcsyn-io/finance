import type { GetConsumptionByCategoryCommand } from "@/server/commands/consumption-commands";
import type { ApplicationContext } from "@/server/context/application-context";
import type {
  CategoryConsumptionDto,
  ConsumptionByCategoryDto,
} from "@/server/dto/consumption-dto";
import type { ConsumptionRepository } from "@/server/repositories/consumption-repository";

type CategoryAccumulator = Omit<
  CategoryConsumptionDto,
  "totalCents" | "percentage" | "monthlyAmountsCents"
> & {
  readonly amountsByMonth: Map<string, number>;
};

export class ConsumptionService {
  constructor(private readonly repository: ConsumptionRepository) {}

  async getByCategory(
    context: ApplicationContext,
    command: GetConsumptionByCategoryCommand,
  ): Promise<ConsumptionByCategoryDto> {
    const rows = await this.repository.listMonthlyByCategory(context, command);
    const months = monthsBetween(command.startDate, command.endDate);
    const categories = new Map<string, CategoryAccumulator>();

    for (const row of rows) {
      const category = categories.get(row.categoryId) ?? {
        categoryId: row.categoryId,
        name: row.categoryName,
        color: row.categoryColor,
        icon: row.categoryIcon,
        amountsByMonth: new Map<string, number>(),
      };
      category.amountsByMonth.set(
        row.month,
        (category.amountsByMonth.get(row.month) ?? 0) + row.amountCents,
      );
      categories.set(row.categoryId, category);
    }

    const totalCents = rows.reduce((total, row) => total + row.amountCents, 0);
    const result = [...categories.values()]
      .map<CategoryConsumptionDto>((category) => {
        const monthlyAmountsCents = months.map(
          (month) => category.amountsByMonth.get(month) ?? 0,
        );
        const categoryTotal = monthlyAmountsCents.reduce(
          (total, amount) => total + amount,
          0,
        );
        return {
          categoryId: category.categoryId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          totalCents: categoryTotal,
          percentage: totalCents === 0 ? 0 : (categoryTotal / totalCents) * 100,
          monthlyAmountsCents,
        };
      })
      .sort((left, right) => right.totalCents - left.totalCents);

    return {
      ...command,
      months,
      totalCents,
      categories: result,
    };
  }
}

function monthsBetween(startDate: string, endDate: string): string[] {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [endYear, endMonth] = endDate.split("-").map(Number);
  const current = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonth - 1, 1));
  const months: string[] = [];

  while (current <= end) {
    months.push(
      `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, "0")}`,
    );
    current.setUTCMonth(current.getUTCMonth() + 1);
  }

  return months;
}
