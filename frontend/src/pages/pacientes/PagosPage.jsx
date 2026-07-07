import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatientById } from '../../services/patientService';
import { getTreatmentsByPatient } from '../../services/treatmentService';
import { getPaymentsByPatient, createPayment, deletePayment } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

const PagosPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalCost, setTotalCost] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  
  const [showModal, setShowModal] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: 0,
    metodo: 'Efectivo',
    observacion: ''
  });

  const fetchData = async () => {
    try {
      const pData = await getPatientById(id, user.clinic_id);
      setPatient(pData);
      
      const tData = await getTreatmentsByPatient(id, user.clinic_id);
      // Solo tomamos en cuenta tratamientos no cancelados para la deuda
      const validTreatments = tData.filter(t => t.estado !== 'Cancelado');
      
      const pmtData = await getPaymentsByPatient(id, user.clinic_id);
      setPayments(pmtData);

      // Cálculos
      const tCost = validTreatments.reduce((sum, t) => sum + Number(t.saldo), 0);
      const tPaid = pmtData.reduce((sum, p) => sum + Number(p.monto), 0);

      setTotalCost(tCost);
      setTotalPaid(tPaid);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // Si hay un recibo seteado para imprimir, disparamos el print
    if (receiptToPrint) {
      // Pequeño timeout para asegurar que el DOM pintó el recibo
      setTimeout(() => {
        window.print();
        setReceiptToPrint(null);
      }, 300);
    }
  }, [receiptToPrint]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? (parseFloat(value) || 0) : value
    }));
  };

  const handleOpenModal = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      monto: 0,
      metodo: 'Efectivo',
      observacion: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.monto <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }
    await createPayment(id, formData, user.clinic_id);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (pId) => {
    const result = await Swal.fire({
      title: '¿Eliminar este pago?',
      text: "Esto afectará el saldo del paciente. Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deletePayment(pId, user.clinic_id);
      Swal.fire({ title: '¡Eliminado!', text: 'El registro de pago ha sido borrado.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };

  const handlePrint = (payment) => {
    setReceiptToPrint(payment);
  };

  const saldoPendiente = totalCost - totalPaid;

  const getMethodIcon = (metodo) => {
    switch(metodo) {
      case 'Efectivo': return <i className="bi bi-cash-coin text-success"></i>;
      case 'Transferencia': return <i className="bi bi-bank text-primary"></i>;
      case 'Tarjeta': return <i className="bi bi-credit-card-2-front text-info"></i>;
      case 'QR': return <i className="bi bi-qr-code text-dark"></i>;
      default: return <i className="bi bi-wallet2 text-secondary"></i>;
    }
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
      
      {/* Ocultamos toda la UI estándar cuando se imprime */}
      <div className="no-print">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div className="d-flex align-items-center">
            <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
              <i className="bi bi-arrow-left text-secondary"></i>
            </Link>
            <div>
              <h3 className="fw-bold text-dark mb-1">Estado de Cuenta y Pagos</h3>
              <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span></p>
            </div>
          </div>
          <button onClick={handleOpenModal} className="btn btn-warning shadow-sm d-flex align-items-center fw-bold">
            <i className="bi bi-plus-circle-fill me-2"></i> Registrar Pago
          </button>
        </div>

        {/* KPIs Financieros */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-secondary h-100">
              <div className="card-body p-4 d-flex align-items-center">
                <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                  <i className="bi bi-journal-medical fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Costo Total Tratamientos</p>
                  <h3 className="fw-bold mb-0 text-dark">${totalCost.toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-sm rounded-4 bg-light border-start border-4 border-success h-100">
              <div className="card-body p-4 d-flex align-items-center">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-1 tracking-wide">Total Abonado</p>
                  <h3 className="fw-bold mb-0 text-success">${totalPaid.toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className={`card border-0 shadow-sm rounded-4 border-start border-4 h-100 ${saldoPendiente > 0 ? 'bg-danger bg-opacity-10 border-danger' : 'bg-primary bg-opacity-10 border-primary'}`}>
              <div className="card-body p-4 d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${saldoPendiente > 0 ? 'bg-danger text-white' : 'bg-primary text-white'}`} style={{width: '50px', height: '50px'}}>
                  <i className={`bi fs-4 ${saldoPendiente > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}></i>
                </div>
                <div>
                  <p className={`small fw-bold text-uppercase mb-1 tracking-wide ${saldoPendiente > 0 ? 'text-danger' : 'text-primary'}`}>Saldo Pendiente</p>
                  <h3 className={`fw-bold mb-0 ${saldoPendiente > 0 ? 'text-danger' : 'text-primary'}`}>${Math.max(0, saldoPendiente).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Pagos */}
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-header bg-white border-bottom p-4">
            <h5 className="fw-bold text-dark mb-0"><i className="bi bi-clock-history me-2 text-secondary"></i> Historial de Pagos</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4 py-3 border-0">Fecha</th>
                    <th className="py-3 border-0">Método</th>
                    <th className="py-3 border-0">Observación</th>
                    <th className="py-3 border-0 text-end fw-bold">Monto</th>
                    <th className="pe-4 py-3 border-0 text-end">Recibo / Acciones</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <i className="bi bi-receipt fs-1 d-block mb-2 opacity-50"></i>
                        Aún no se han registrado pagos para este paciente.
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id}>
                        <td className="ps-4 py-3 text-secondary">{new Date(p.fecha).toLocaleDateString()}</td>
                        <td className="py-3 fw-medium d-flex align-items-center gap-2">
                          {getMethodIcon(p.metodo)} {p.metodo}
                        </td>
                        <td className="py-3 text-secondary">{p.observacion || '-'}</td>
                        <td className="py-3 text-end fw-bold text-success">+ ${Number(p.monto).toFixed(2)}</td>
                        <td className="pe-4 py-3 text-end">
                          <button onClick={() => handlePrint(p)} className="btn btn-sm btn-outline-primary me-2 shadow-sm rounded-3 px-3">
                            <i className="bi bi-printer-fill me-1"></i> Imprimir
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-light text-danger rounded-3">
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

        {/* Modal Nuevo Pago */}
        {showModal && (
          <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
            <div className="card border-0 shadow-lg rounded-4 w-100" style={{maxWidth: '500px', animation: 'fadeIn 0.2s ease-out'}}>
              <div className="card-header bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25 p-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-warning-emphasis mb-0">
                  <i className="bi bi-cash-coin me-2"></i> Registrar Pago
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="card-body p-4">
                
                {/* Sugerencia visual */}
                {saldoPendiente > 0 && (
                  <div className="alert alert-danger bg-danger bg-opacity-10 border-0 rounded-3 mb-4 d-flex align-items-center py-2 px-3">
                    <i className="bi bi-info-circle-fill me-2 text-danger"></i>
                    <small className="text-danger fw-semibold">El paciente tiene un saldo pendiente de ${saldoPendiente.toFixed(2)}</small>
                  </div>
                )}

                <form onSubmit={handleSubmit} id="paymentForm">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Fecha</label>
                      <input type="date" className="form-control bg-light" name="fecha" value={formData.fecha} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small fw-semibold">Método de Pago</label>
                      <select className="form-select bg-light fw-medium" name="metodo" value={formData.metodo} onChange={handleChange}>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Tarjeta">Tarjeta (Débito/Crédito)</option>
                        <option value="QR">Pago QR</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-success small fw-bold">Monto Abonado ($)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 text-success fw-bold">$</span>
                        <input type="number" step="0.01" min="0.01" className="form-control bg-white border-start-0 text-success fw-bold fs-5" name="monto" value={formData.monto} onChange={handleChange} required placeholder="0.00" />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small fw-semibold">Observación / N° Referencia (Opcional)</label>
                      <input type="text" className="form-control bg-light" name="observacion" value={formData.observacion} onChange={handleChange} placeholder="Ej. Depósito #12345" />
                    </div>
                  </div>
                </form>
              </div>
              <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-top-0 rounded-bottom-4">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" form="paymentForm" className="btn btn-warning px-4 fw-bold shadow-sm">
                  Guardar Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recibo para Impresión (Sólo visible en @media print si receiptToPrint tiene datos) */}
      {receiptToPrint && (
        <div id="print-section" className="bg-white p-5">
          <div className="text-center mb-5 border-bottom pb-4">
            <h2 className="fw-bold mb-1" style={{color: '#333'}}>CLÍNICA AMANECER</h2>
            <p className="mb-0 text-muted">Odontología Especializada</p>
            <p className="mb-0 text-muted small">Av. Principal 123 - Tel: 555-0192</p>
          </div>
          
          <div className="d-flex justify-content-between mb-5">
            <div>
              <h5 className="fw-bold" style={{color: '#333'}}>RECIBO DE PAGO</h5>
              <p className="mb-1"><strong>Paciente:</strong> {patient?.nombre} {patient?.apellido}</p>
              <p className="mb-1"><strong>CI/DNI:</strong> {patient?.ci || 'N/A'}</p>
            </div>
            <div className="text-end">
              <p className="mb-1"><strong>N° Recibo:</strong> {receiptToPrint.id.substring(receiptToPrint.id.length - 6)}</p>
              <p className="mb-1"><strong>Fecha:</strong> {new Date(receiptToPrint.fecha).toLocaleDateString()}</p>
              <p className="mb-1"><strong>Método:</strong> {receiptToPrint.metodo}</p>
            </div>
          </div>

          <table className="table table-bordered border-dark mb-5">
            <thead className="table-light">
              <tr>
                <th>Descripción</th>
                <th className="text-end">Importe Abonado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-4">
                  Abono a cuenta por tratamientos odontológicos.<br/>
                  <small className="text-muted">{receiptToPrint.observacion ? `Ref: ${receiptToPrint.observacion}` : ''}</small>
                </td>
                <td className="py-4 text-end fs-4 fw-bold align-middle">
                  ${Number(receiptToPrint.monto).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="row mt-5 pt-5">
            <div className="col-6 text-center">
              <hr className="border-dark w-75 mx-auto" style={{borderTopWidth: '2px'}} />
              <p className="fw-bold mt-2">Firma Paciente</p>
            </div>
            <div className="col-6 text-center">
              <hr className="border-dark w-75 mx-auto" style={{borderTopWidth: '2px'}} />
              <p className="fw-bold mt-2">Firma Clínica / Caja</p>
            </div>
          </div>
          
          <div className="text-center mt-5 pt-5">
            <p className="small text-muted"><em>Este documento es un comprobante de pago interno. No válido como factura fiscal.</em></p>
          </div>
        </div>
      )}

      {/* Estilos para Animaciones y CSS Print */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        #print-section { display: none; }
        
        @media print {
          body { background-color: #fff !important; }
          .no-print { display: none !important; }
          .sidebar, .navbar { display: none !important; }
          #print-section { 
            display: block !important; 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            margin: 0;
            padding: 20px !important;
            font-family: Arial, sans-serif !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PagosPage;
