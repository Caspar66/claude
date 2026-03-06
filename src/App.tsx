import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { ScenarioIndexPage } from '@/views/ScenarioIndex/ScenarioIndexPage';
import { ScenarioDetailsPage } from '@/views/ScenarioDetails/ScenarioDetailsPage';
import { EditExistingPlanPage } from '@/views/EditExistingPlan/EditExistingPlanPage';

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
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  );
}
