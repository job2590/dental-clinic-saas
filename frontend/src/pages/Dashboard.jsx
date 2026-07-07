import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  getDashboardStats, 
  getRevenueData, 
  getLatestPatients,
  getUpcomingAppointments 
} from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPatients: 0, appointmentsToday: 0, monthlyRevenue: 0 });
  const [chartData, setChartData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, revenueData, patientsData, appointmentsData] = await Promise.all([
          getDashboardStats(user.clinic_id),
          getRevenueData(user.clinic_id),
          getLatestPatients(user.clinic_id),
          getUpcomingAppointments(user.clinic_id)
        ]);
        
        setStats(statsData);
        setPatients(patientsData);
        setAppointments(appointmentsData);
        
        setChartData({
          labels: revenueData.labels,
          datasets: [
            {
              label: 'Ingresos ($)',
              data: revenueData.data,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#0d6efd',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: '#0d6efd',
              pointRadius: 4,
              pointHoverRadius: 6,
            }
          ]
        });
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.clinic_id) {
      fetchDashboardData();
    }
  }, [user?.clinic_id]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#212529',
        bodyColor: '#212529',
        borderColor: '#e9ecef',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f8f9fa',
          drawBorder: false,
        },
        ticks: {
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-dark mb-0">Resumen General</h3>
        <button className="btn btn-primary shadow-sm d-flex align-items-center">
          <i className="bi bi-plus-lg me-2"></i> Nueva Cita
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 kpi-card">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="icon-wrapper bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '56px', height: '56px'}}>
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1 fw-semibold small text-uppercase tracking-wide">Total Pacientes</p>
                <h3 className="fw-bold mb-0 text-dark">{stats.totalPatients}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 kpi-card">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="icon-wrapper bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '56px', height: '56px'}}>
                <i className="bi bi-calendar-check-fill fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1 fw-semibold small text-uppercase tracking-wide">Citas Hoy</p>
                <h3 className="fw-bold mb-0 text-dark">{stats.appointmentsToday}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 kpi-card">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="icon-wrapper bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '56px', height: '56px'}}>
                <i className="bi bi-currency-dollar fs-4"></i>
              </div>
              <div>
                <p className="text-muted mb-1 fw-semibold small text-uppercase tracking-wide">Ingresos del Mes</p>
                <h3 className="fw-bold mb-0 text-dark">${stats.monthlyRevenue.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Chart Section */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Evolución de Ingresos</h5>
              <select className="form-select form-select-sm w-auto shadow-none border-light bg-light">
                <option>Últimos 6 meses</option>
                <option>Este año</option>
              </select>
            </div>
            <div className="card-body px-4 pb-4 pt-3" style={{ height: '320px' }}>
              {chartData && <Line data={chartData} options={chartOptions} />}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Próximas Citas</h5>
              <button className="btn btn-sm btn-link text-decoration-none">Ver todas</button>
            </div>
            <div className="card-body px-4 pt-0">
              <div className="d-flex flex-column gap-3 mt-2">
                {appointments.map(app => (
                  <div key={app.id} className="d-flex align-items-center p-3 rounded-3 border border-light bg-light hover-bg-white transition-all cursor-pointer">
                    <div className="bg-white text-primary rounded-3 d-flex flex-column align-items-center justify-content-center fw-bold shadow-sm me-3" style={{width: '48px', height: '48px', fontSize: '0.8rem'}}>
                      <span>{app.time.split(' ')[0]}</span>
                      <span className="text-muted" style={{fontSize: '0.65rem'}}>{app.time.split(' ')[1]}</span>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-semibold text-dark">{app.patient}</h6>
                      <span className={`badge rounded-pill fw-medium ${app.status === 'Confirmada' ? 'bg-success bg-opacity-10 text-success' : app.status === 'En sala' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-warning bg-opacity-10 text-warning'}`}>
                        {app.status}
                      </span>
                    </div>
                    <i className="bi bi-three-dots-vertical text-muted"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Patients */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 pt-4 pb-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Últimos Pacientes Registrados</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted small text-uppercase">
                    <tr>
                      <th className="ps-4 py-3 fw-semibold border-0 rounded-start">Paciente</th>
                      <th className="py-3 fw-semibold border-0">Fecha de Registro</th>
                      <th className="py-3 fw-semibold border-0">Último Tratamiento</th>
                      <th className="pe-4 py-3 fw-semibold border-0 rounded-end text-end">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {patients.map(patient => (
                      <tr key={patient.id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center">
                            <div className="avatar bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '36px', height: '36px'}}>
                              {patient.name.charAt(0)}
                            </div>
                            <span className="fw-medium text-dark">{patient.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted">{patient.date}</td>
                        <td className="py-3">
                          <span className="badge bg-light text-secondary border fw-medium px-2 py-1">
                            {patient.treatment}
                          </span>
                        </td>
                        <td className="pe-4 py-3 text-end">
                          <button className="btn btn-sm btn-light text-primary fw-medium rounded-pill px-3">
                            Ver Perfil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
