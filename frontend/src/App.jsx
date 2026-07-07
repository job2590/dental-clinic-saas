import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PacientesList from './pages/pacientes/PacientesList';
import PacienteForm from './pages/pacientes/PacienteForm';
import PacienteProfile from './pages/pacientes/PacienteProfile';
import HistoriaClinicaForm from './pages/pacientes/HistoriaClinicaForm';
import OdontogramaPage from './pages/pacientes/OdontogramaPage';
import TratamientosPage from './pages/pacientes/TratamientosPage';
import PagosPage from './pages/pacientes/PagosPage';
import RadiografiasPage from './pages/pacientes/RadiografiasPage';
import AgendaPage from './pages/AgendaPage';
import CajaPage from './pages/CajaPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ClinicsList from './pages/superadmin/ClinicsList';
import ClinicUsersList from './pages/superadmin/ClinicUsersList';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Módulo de Pacientes */}
            <Route path="/pacientes" element={<PacientesList />} />
            <Route path="/pacientes/nuevo" element={<PacienteForm />} />
            <Route path="/pacientes/editar/:id" element={<PacienteForm />} />
            <Route path="/pacientes/:id" element={<PacienteProfile />} />
            <Route path="/pacientes/:id/historia-clinica" element={<HistoriaClinicaForm />} />
            <Route path="/pacientes/:id/odontograma" element={<OdontogramaPage />} />
            <Route path="/pacientes/:id/tratamientos" element={<TratamientosPage />} />
            <Route path="/pacientes/:id/pagos" element={<PagosPage />} />
            <Route path="/pacientes/:id/radiografias" element={<RadiografiasPage />} />
            
            {/* Otras Rutas */}
            <Route path="/citas" element={<AgendaPage />} />
            <Route path="/caja" element={<CajaPage />} />
            <Route path="/perfil" element={<UserProfile />} />
          </Route>
          
          <Route element={<SuperAdminRoute><Layout /></SuperAdminRoute>}>
            <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/superadmin/clinics" element={<ClinicsList />} />
            <Route path="/superadmin/clinics/:clinicId/users" element={<ClinicUsersList />} />
            <Route path="/superadmin/perfil" element={<UserProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
