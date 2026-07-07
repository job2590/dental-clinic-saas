import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // Si no hay usuario autenticado, redirigimos al login
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'superadmin') {
    // Superadmin no debe entrar a rutas de clínica, debe ir a su panel global
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
