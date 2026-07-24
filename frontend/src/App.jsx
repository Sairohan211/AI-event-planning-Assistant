import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Load Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventRequirementForm from './pages/EventRequirementForm';
import EventDetail from './pages/EventDetail';
import AIPage from './pages/AIPage';
import HistoryPage from './pages/HistoryPage';
import UserProfile from './pages/UserProfile';

// Route guard for authenticated areas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-650 rounded-full animate-spin"></div>
        <p className="text-xs mt-3">Establishing session security...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Simple Layout wrapper including responsive navigation
const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full relative z-10">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500 relative z-10">
        &copy; {new Date().getFullYear()} AuraPlan - Powered by Gemini AI. All rights reserved.
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Event and Academy routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/events/new" element={
            <ProtectedRoute>
              <AppLayout>
                <EventRequirementForm />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/events/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <EventDetail />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/academy" element={
            <ProtectedRoute>
              <AppLayout>
                <AIPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/history" element={
            <ProtectedRoute>
              <AppLayout>
                <HistoryPage />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <AppLayout>
                <UserProfile />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
