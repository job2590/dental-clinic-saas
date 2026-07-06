import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container bg-light min-vh-100">
      {/* Navbar Minimalista */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm py-3">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold fs-4">
            <i className="bi bi-heart-pulse-fill me-2"></i>
            Dental Clinic Amanecer
          </span>
          
          <div className="d-flex align-items-center">
            <div className="dropdown">
              <button 
                className="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center p-0" 
                type="button" 
                id="userDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <div className="avatar bg-white text-primary rounded-circle me-2 d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '38px', height: '38px' }}>
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <span className="d-none d-md-inline fw-semibold">{user?.name || 'Usuario'}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-3" aria-labelledby="userDropdown">
                <li><h6 className="dropdown-header text-muted">Sesión de: {user?.email}</h6></li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger d-flex align-items-center fw-semibold py-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2 fs-5"></i> Cerrar Sesión
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="container-fluid p-4 mt-2">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card border-0 shadow-sm rounded-4 empty-dashboard-card text-center p-5">
              <div className="card-body py-5 my-5">
                <i className="bi bi-clipboard2-pulse text-primary mb-3 d-block" style={{ fontSize: '5rem', opacity: 0.15 }}></i>
                <h2 className="fw-light mt-4 text-secondary">Bienvenido al Panel de Control</h2>
                <p className="text-muted lead mt-3 px-md-5">Has iniciado sesión correctamente. Selecciona un módulo en el futuro para comenzar a trabajar en el sistema de gestión odontológica.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
