import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGate from './components/AdminGate';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SemesterCalc from './pages/SemesterCalc';
import GoalTracker from './pages/GoalTracker';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminStudents from './pages/admin/AdminStudents';

function RootRedirect() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark">
        <div className="spinner" />
      </div>
    );
  }

  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Main Application Layout (Publicly accessible) */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Protected Student routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="student">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/semester" element={<SemesterCalc />} />
              <Route path="/goal-tracker" element={<GoalTracker />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* Admin routes */}
            <Route
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminGate>
                    <Layout />
                  </AdminGate>
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/subjects" element={<AdminSubjects />} />
              <Route path="/admin/students" element={<AdminStudents />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
