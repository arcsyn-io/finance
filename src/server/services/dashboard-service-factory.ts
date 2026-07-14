import { dashboardRepository } from "@/server/repositories/dashboard-repository";
import { DashboardService } from "@/server/services/dashboard-service";

export function createDashboardService(): DashboardService {
  return new DashboardService(dashboardRepository);
}
