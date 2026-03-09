import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { ScenarioIndexPage } from '@/views/ScenarioIndex/ScenarioIndexPage';
import { ScenarioDetailsPage } from '@/views/ScenarioDetails/ScenarioDetailsPage';
import { EditExistingPlanPage } from '@/views/EditExistingPlan/EditExistingPlanPage';
import { AddInvestmentPage } from '@/views/AddInvestment/AddInvestmentPage';
import { AddExistingPlanPage } from '@/views/AddExistingPlan/AddExistingPlanPage';
import { EditFeesPage } from '@/views/EditFees/EditFeesPage';
import { AddProposalTypePage } from '@/views/AddProposal/AddProposalTypePage';
import { PlanReviewPage } from '@/views/PlanReview/PlanReviewPage';

export default function App() {
  return (
    <AppProvider>
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
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  );
}
