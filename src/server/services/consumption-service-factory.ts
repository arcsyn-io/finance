import { consumptionRepository } from "@/server/repositories/consumption-repository";
import { ConsumptionService } from "@/server/services/consumption-service";

export function createConsumptionService(): ConsumptionService {
  return new ConsumptionService(consumptionRepository);
}
