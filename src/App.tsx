import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/context/AppContext';
import { WealthSolverProvider } from '@/context/WealthSolverContext';
import { AppShell } from '@/components/layout/AppShell';
import { ManagementPortalShell } from '@/components/layout/ManagementPortalShell';
import { ScenarioIndexPage } from '@/views/ScenarioIndex/ScenarioIndexPage';
import { ScenarioDetailsPage } from '@/views/ScenarioDetails/ScenarioDetailsPage';
import { EditExistingPlanPage } from '@/views/EditExistingPlan/EditExistingPlanPage';
import { AddInvestmentPage } from '@/views/AddInvestment/AddInvestmentPage';
import { AddExistingPlanPage } from '@/views/AddExistingPlan/AddExistingPlanPage';
import { EditFeesPage } from '@/views/EditFees/EditFeesPage';
import { AddProposalTypePage } from '@/views/AddProposal/AddProposalTypePage';
import { PlanReviewPage } from '@/views/PlanReview/PlanReviewPage';
import { PlanListPage } from '@/views/WealthSolver/PlanListPage';
import { PlanDetailPage } from '@/views/WealthSolver/PlanDetailPage';
import { InvestmentDataPage } from '@/views/WealthSolver/InvestmentDataPage';
import { AddPlanPage } from '@/views/WealthSolver/AddPlanPage';
import { DerivePlanPage } from '@/views/WealthSolver/DerivePlanPage';
import { InvestmentResearchPage } from '@/views/ManagementPortal/InvestmentResearchPage';
import { InsuranceResearchPage } from '@/views/InsuranceResearch/InsuranceResearchPage';

export default function App() {
  return (
    <AppProvider>
      <WealthSolverProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<Navigate to="/scenarios" replace />} />
                <Route path="scenarios" element={<ScenarioIndexPage />} />
                <Route path="scenarios/:scenarioId" element={<ScenarioDetailsPage />} />
                <Route
                  path="scenarios/:scenarioId/plan/:platformId/edit"
                  element={<EditExistingPlanPage />}
                />
                <Route
                  path="scenarios/:scenarioId/plan/:platformId/investments/add"
                  element={<AddInvestmentPage />}
                />
                <Route
                  path="scenarios/:scenarioId/plan/:platformId/fees"
                  element={<EditFeesPage />}
                />
                <Route
                  path="scenarios/:scenarioId/proposals/:proposalId/fees/:platformId"
                  element={<EditFeesPage />}
                />
                <Route
                  path="scenarios/:scenarioId/add-existing"
                  element={<AddExistingPlanPage />}
                />
                <Route
                  path="scenarios/:scenarioId/add-proposal"
                  element={<AddProposalTypePage />}
                />
                <Route
                  path="scenarios/:scenarioId/proposals/plan-review/new"
                  element={<PlanReviewPage />}
                />
                <Route
                  path="scenarios/:scenarioId/proposals/plan-review/:proposalId"
                  element={<PlanReviewPage />}
                />

                {/* WealthSolver — Research */}
                <Route path="research/plans" element={<PlanListPage />} />
                <Route path="research/plans/new" element={<AddPlanPage />} />
                <Route path="research/plans/:planId/derive" element={<DerivePlanPage />} />
                <Route path="research/plans/:planId" element={<PlanDetailPage />} />
                <Route path="research/investment-data" element={<InvestmentDataPage />} />
                <Route
                  path="scenarios/:scenarioId/research/insurance"
                  element={<InsuranceResearchPage />}
                />
              </Route>

              {/* Management Portal */}
              <Route path="/management" element={<ManagementPortalShell />}>
                <Route index element={<Navigate to="/management/reference-data/investment-research" replace />} />
                <Route path="reference-data/investment-research" element={<InvestmentResearchPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WealthSolverProvider>
    </AppProvider>
  );
}
