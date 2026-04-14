import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardHub from './pages/DashboardHub';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { currentUser } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardHub />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
