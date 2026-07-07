import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TopNavbar = ({ toggleSidebar }) => {
  const { user, clinic, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand bg-white border-bottom border-light px-4 py-2 w-100 z-1">
      <button 
        className="btn btn-light bg-transparent border-0 me-3 shadow-none toggle-btn" 
        onClick={toggleSidebar}
      >
        <i className="bi bi-list fs-4 text-secondary"></i>
      </button>

      <div className="d-flex align-items-center ms-auto">
        <button 
          onClick={toggleTheme}
          className="btn btn-light bg-transparent border-0 me-2 shadow-none toggle-btn"
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <i className={`bi fs-5 ${isDarkMode ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-secondary'}`}></i>
        </button>

        <button className="btn btn-light bg-transparent border-0 me-3 position-relative shadow-none toggle-btn">
          <i className="bi bi-bell fs-5 text-secondary"></i>
          <span className="position-absolute top-25 start-75 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
        </button>

        <div className="dropdown">
          <button 
            className="btn btn-light bg-transparent border-0 d-flex align-items-center p-1 rounded-pill shadow-none" 
            type="button" 
            data-bs-toggle="dropdown"
          >
            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: '36px', height: '36px' }}>
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="d-none d-md-flex flex-column text-start ms-2 me-3 lh-sm">
              <span className="fw-semibold text-dark fs-6">{user?.name || 'Usuario'}</span>
              <span className="text-muted" style={{fontSize: '0.75rem'}}>{clinic?.nombre || 'Clínica'}</span>
            </div>
            <i className="bi bi-chevron-down text-muted small me-2 d-none d-md-inline"></i>
          </button>
          
          <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
            <li><h6 className="dropdown-header text-muted">{user?.email}</h6></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item d-flex align-items-center py-2 text-secondary">
                <i className="bi bi-person me-3"></i> Mi Perfil
              </button>
            </li>
            <li>
              <button className="dropdown-item d-flex align-items-center py-2 text-secondary">
                <i className="bi bi-gear me-3"></i> Configuración
              </button>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger d-flex align-items-center py-2 fw-semibold" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-3"></i> Cerrar Sesión
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
