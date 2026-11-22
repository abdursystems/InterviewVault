import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecoveryPlanPage from './pages/RecoveryPlanPage';
import QuestionsPage from './pages/QuestionsPage';
import QuestionWorkspacePage from './pages/QuestionWorkspacePage';
import HistoryPage from './pages/HistoryPage';
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminSubtopics from './pages/admin/AdminSubtopics';
import AdminUsers from './pages/admin/AdminUsers';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Restoring session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/recovery-plan"
              element={
                <RequireAuth>
                  <RecoveryPlanPage />
                </RequireAuth>
              }
            />
            <Route
              path="/questions"
              element={
                <RequireAuth>
                  <QuestionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/questions/:id"
              element={
                <RequireAuth>
                  <QuestionWorkspacePage />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <HistoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="subtopics" element={<AdminSubtopics />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
