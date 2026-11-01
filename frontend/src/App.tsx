import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { AcademicPage } from './pages/AcademicPage';
import { StudentsPage } from './pages/StudentsPage';
import { GradesPage } from './pages/GradesPage';
import { AttendancePage } from './pages/AttendancePage';
import { KardexPage } from './pages/KardexPage';
import { SchedulePage } from './pages/SchedulePage';
import { CentralizerReportsPage } from './pages/CentralizerReportsPage';
import { AuditPage } from './pages/AuditPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterSchoolPage } from './pages/RegisterSchoolPage';
import { BillingPage } from './pages/BillingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xs font-semibold text-slate-500 animate-pulse">
          Cargando entorno seguro...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas SaaS */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/planes" element={<LandingPage />} />
          <Route path="/registro-colegio" element={<RegisterSchoolPage />} />
          <Route path="/onboarding" element={<RegisterSchoolPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="institutions" element={<InstitutionsPage />} />
            <Route path="academic" element={<AcademicPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="grades" element={<GradesPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="kardex" element={<KardexPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="reports" element={<CentralizerReportsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
