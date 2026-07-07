import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getAllPayments, deletePayment } from '../services/paymentService';
import { getPatients } from '../services/patientService';
import { useAuth } from '../context/AuthContext';

const CajaPage = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // KPIs
  const [ingresosHoy, setIngresosHoy] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);

  const fetchData = async () => {
    try {
      const pts = await getPatients(user.clinic_id);
      setPatients(pts);

      const pmtData = await getAllPayments(user.clinic_id);
      setPayments(pmtData);

      // Calcular KPIs
      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const añoActual = hoy.getFullYear();
      const diaActual = hoy.getDate();

      let tHoy = 0;
      let tMes = 0;

      pmtData.forEach(p => {
        const fechaPago = new Date(p.fecha);
        const monto = Number(p.monto);
        
        if (fechaPago.getFullYear() === añoActual && fechaPago.getMonth() === mesActual) {
          tMes += monto;
          // Asumimos timezone local para simplificar el mock
          if (fechaPago.getDate() === diaActual) {
            tHoy += monto;
          }
        }
      });

      setIngresosHoy(tHoy);
      setIngresosMes(tMes);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (pId) => {
    const result = await Swal.fire({
      title: '¿Anular transacción?',
      text: "Se eliminará este pago de la caja global y de la ficha del paciente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deletePayment(pId, user.clinic_id);
      Swal.fire({ title: '¡Anulada!', text: 'La transacción ha sido eliminada.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };

  const getMethodIcon = (metodo) => {
    switch(metodo) {
      case 'Efectivo': return <i className="bi bi-cash-coin text-success"></i>;
      case 'Transferencia': return <i className="bi bi-bank text-primary"></i>;
      case 'Tarjeta': return <i className="bi bi-credit-card-2-front text-info"></i>;
      case 'QR': return <i className="bi bi-qr-code text-dark"></i>;
      default: return <i className="bi bi-wallet2 text-secondary"></i>;
    }
  };

  const getPatientName = (pacienteId) => {
    const pt = patients.find(p => String(p.id) === String(pacienteId));
    return pt ? `${pt.nombre} ${pt.apellido}` : 'Paciente Desconocido';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Caja y Flujo de Ingresos</h2>
          <p className="text-muted mb-0">Monitor global de pagos realizados por los pacientes.</p>
        </div>
      </div>

      {/* KPIs Financieros */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-success h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-4 shadow-sm" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-graph-up-arrow fs-3"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Ingresos Hoy</p>
                <h2 className="fw-bold mb-0 text-success">${ingresosHoy.toFixed(2)}</h2>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-primary h-100">
            <div className="card-body p-4 d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-4 shadow-sm" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-wallet2 fs-3"></i>
              </div>
              <div>
                <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Ingresos del Mes</p>
                <h2 className="fw-bold mb-0 text-primary">${ingresosMes.toFixed(2)}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Historial General */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-bottom p-4">
          <h5 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-secondary"></i> Historial Global de Transacciones</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4 py-3 border-0">Nº Recibo</th>
                  <th className="py-3 border-0">Fecha</th>
                  <th className="py-3 border-0">Paciente</th>
                  <th className="py-3 border-0">Método</th>
                  <th className="py-3 border-0">Ref / Obs</th>
                  <th className="py-3 border-0 text-end fw-bold">Monto</th>
                  <th className="pe-4 py-3 border-0 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
                      No hay transacciones registradas en el sistema.
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id}>
                      <td className="ps-4 py-3 text-secondary font-monospace small">
                        #{p.id.substring(p.id.length - 6)}
                      </td>
                      <td className="py-3 text-secondary">{new Date(p.fecha).toLocaleDateString()}</td>
                      <td className="py-3 fw-bold">
                        <Link to={`/pacientes/${p.paciente_id}`} className="text-decoration-none text-dark">
                          {getPatientName(p.paciente_id)}
                        </Link>
                      </td>
                      <td className="py-3 fw-medium d-flex align-items-center gap-2">
                        {getMethodIcon(p.metodo)} {p.metodo}
                      </td>
                      <td className="py-3 text-secondary">{p.observacion || '-'}</td>
                      <td className="py-3 text-end fw-bold text-success">+ ${Number(p.monto).toFixed(2)}</td>
                      <td className="pe-4 py-3 text-end">
                        <Link to={`/pacientes/${p.paciente_id}/pagos`} className="btn btn-sm btn-outline-primary me-2 shadow-sm rounded-3 px-3" title="Ir a Cuenta">
                          <i className="bi bi-box-arrow-in-right"></i>
                        </Link>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-light text-danger rounded-3" title="Anular Transacción">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default CajaPage;
