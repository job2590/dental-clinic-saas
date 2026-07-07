import React, { useState, useEffect } from 'react';
import { getGlobalStats } from '../../services/superAdminService';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getGlobalStats();
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Panel de Control SaaS</h2>
        <p className="text-muted mb-0">Vista general de todas las clínicas y usuarios</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-primary h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-building fs-4"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Clínicas Registradas</p>
                <h3 className="fw-bold mb-0 text-dark">{stats?.totalClinics || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-success h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-check-circle-fill fs-4"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Clínicas Activas</p>
                <h3 className="fw-bold mb-0 text-success">{stats?.activeClinics || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-danger h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Clínicas Suspendidas</p>
                <h3 className="fw-bold mb-0 text-danger">{stats?.suspendedClinics || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-info h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Usuarios Totales</p>
                <h3 className="fw-bold mb-0 text-info">{stats?.totalUsers || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-5 text-center">
              <i className="bi bi-globe display-1 text-primary opacity-25 mb-3"></i>
              <h4 className="fw-bold text-dark">Bienvenido al Panel Global</h4>
              <p className="text-muted mb-0">Usa el menú lateral para gestionar las clínicas y sus administradores.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
