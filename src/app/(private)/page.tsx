import { PersonalFinanceDashboard } from "@/modules/dashboard/components/PersonalFinanceDashboard";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { personalDashboardDtoToViewModel } from "@/server/mappers/dashboard-mapper";
import { createDashboardService } from "@/server/services/dashboard-service-factory";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getCurrentApplicationContext();
  const dashboard = await createDashboardService().get(context, {
    recentEntriesLimit: 6,
  });

  return (
    <PersonalFinanceDashboard
      viewModel={personalDashboardDtoToViewModel(dashboard)}
    />
  );
}
