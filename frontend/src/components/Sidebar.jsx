import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen }) => {
  const { user, clinic } = useAuth();

  return (
    <aside className={`sidebar bg-white shadow-sm border-end transition-all ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-brand p-4 d-flex align-items-center border-bottom border-light">
        {clinic?.logo && user?.role !== 'superadmin' ? (
          <img src={clinic.logo} alt="Logo" className="rounded-circle me-2 object-fit-cover shadow-sm" style={{width: '32px', height: '32px'}} />
        ) : (
          <i className={`bi ${user?.role === 'superadmin' ? 'bi-globe' : 'bi-heart-pulse-fill'} text-primary fs-3 me-2`}></i>
        )}
        {isOpen && <span className="fs-5 fw-bold text-nowrap text-dark text-truncate" style={{maxWidth: '180px'}}>{user?.role === 'superadmin' ? 'SaaS Admin' : (clinic?.nombre || 'Clinic Amanecer')}</span>}
      </div>
      
      <ul className="nav flex-column mt-3 px-3">
        {user?.role === 'superadmin' ? (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/superadmin/dashboard" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-pie-chart-fill fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Global Stats</span>}
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/superadmin/clinics" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-building fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Clínicas</span>}
              </NavLink>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/dashboard" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-grid-1x2-fill fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Dashboard</span>}
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/pacientes" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-people-fill fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Pacientes</span>}
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/citas" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-calendar-event-fill fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Citas</span>}
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/caja" className={({isActive}) => `nav-link rounded d-flex align-items-center px-3 py-2 ${isActive ? 'bg-primary text-white shadow-sm' : 'text-secondary hover-bg'}`}>
                <i className="bi bi-cash-coin fs-5"></i>
                {isOpen && <span className="ms-3 fw-semibold">Caja</span>}
              </NavLink>
            </li>
          </>
        )}
      </ul>
      
      <div className="sidebar-footer mt-auto p-4 border-top border-light">
        <small className="text-muted d-block text-center fw-medium">
          {isOpen ? 'v1.0.0 - Clínicas' : 'v1.0'}
        </small>
      </div>
    </aside>
  );
};

export default Sidebar;
