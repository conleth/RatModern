import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./routes/ProtectedRoute";
import { ChecklistPage } from "./pages/ChecklistPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { QuestionnairePage } from "./pages/QuestionnairePage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checklist"
        element={
          <ProtectedRoute>
            <ChecklistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/questionnaire"
        element={
          <ProtectedRoute>
            <QuestionnairePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
