import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatientById } from '../../services/patientService';
import { getTreatmentsByPatient, createTreatment, updateTreatment, deleteTreatment } from '../../services/treatmentService';
import { useAuth } from '../../context/AuthContext';

const TratamientosPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    pieza: '',
    diagnostico: '',
    tratamiento: '',
    costo: 0,
    descuento: 0,
    saldo: 0,
    estado: 'Pendiente'
  });

  const fetchTreatments = async () => {
    try {
      const pData = await getPatientById(id, user.clinic_id);
      setPatient(pData);
      const tData = await getTreatmentsByPatient(id, user.clinic_id);
      setTreatments(tData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Manejo de cambios y cálculo automático del saldo
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let parsedValue = value;
    if (name === 'costo' || name === 'descuento') {
      parsedValue = parseFloat(value) || 0;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: parsedValue };
      if (name === 'costo' || name === 'descuento') {
        newData.saldo = Math.max(0, newData.costo - newData.descuento);
      }
      return newData;
    });
  };

  const handleOpenModal = (treatment = null) => {
    if (treatment) {
      setFormData(treatment);
      setIsEditing(true);
      setEditingId(treatment.id);
    } else {
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        pieza: '',
        diagnostico: '',
        tratamiento: '',
        costo: 0,
        descuento: 0,
        saldo: 0,
        estado: 'Pendiente'
      });
      setIsEditing(false);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateTreatment(editingId, formData, user.clinic_id);
      } else {
        await createTreatment(id, formData, user.clinic_id);
      }
      setShowModal(false);
      fetchTreatments();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (tId) => {
    const result = await Swal.fire({
      title: '¿Eliminar Tratamiento?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteTreatment(tId, user.clinic_id);
      Swal.fire({ title: '¡Eliminado!', text: 'El tratamiento ha sido borrado.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchTreatments();
    }
  };

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'Pendiente': return <span className="badge bg-secondary">Pendiente</span>;
      case 'En proceso': return <span className="badge bg-primary">En proceso</span>;
      case 'Finalizado': return <span className="badge bg-success">Finalizado</span>;
      case 'Cancelado': return <span className="badge bg-danger">Cancelado</span>;
      default: return <span className="badge bg-light text-dark">{estado}</span>;
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
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center">
          <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Plan de Tratamientos</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span></p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-sm d-flex align-items-center">
          <i className="bi bi-plus-circle-fill me-2"></i> Nuevo Tratamiento
        </button>
      </div>

      {/* Tabla Profesional */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4 py-3 border-0">Fecha</th>
                  <th className="py-3 border-0">Pieza</th>
                  <th className="py-3 border-0">Diagnóstico</th>
                  <th className="py-3 border-0">Tratamiento</th>
                  <th className="py-3 border-0 text-end">Costo</th>
                  <th className="py-3 border-0 text-end">Desc.</th>
                  <th className="py-3 border-0 text-end fw-bold">Saldo</th>
                  <th className="py-3 border-0 text-center">Estado</th>
                  <th className="pe-4 py-3 border-0 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {treatments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      <i className="bi bi-journal-medical fs-1 d-block mb-2 opacity-50"></i>
                      No hay tratamientos registrados para este paciente.
                    </td>
                  </tr>
                ) : (
                  treatments.map(t => (
                    <tr key={t.id}>
                      <td className="ps-4 py-3 text-secondary">{new Date(t.fecha).toLocaleDateString()}</td>
                      <td className="py-3 fw-medium">{t.pieza || 'General'}</td>
                      <td className="py-3 text-secondary">{t.diagnostico}</td>
                      <td className="py-3 fw-bold text-dark">{t.tratamiento}</td>
                      <td className="py-3 text-end text-muted">${Number(t.costo).toFixed(2)}</td>
                      <td className="py-3 text-end text-danger">-${Number(t.descuento).toFixed(2)}</td>
                      <td className="py-3 text-end fw-bold text-primary">${Number(t.saldo).toFixed(2)}</td>
                      <td className="py-3 text-center">{getStatusBadge(t.estado)}</td>
                      <td className="pe-4 py-3 text-end">
                        <button onClick={() => handleOpenModal(t)} className="btn btn-sm btn-light text-secondary me-2">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="btn btn-sm btn-light text-danger">
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

      {/* Modal Custom (Overlay) */}
      {showModal && (
        <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
          <div className="card border-0 shadow-lg rounded-4 w-100" style={{maxWidth: '600px', animation: 'fadeIn 0.2s ease-out'}}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-primary mb-0">
                <i className="bi bi-journal-medical me-2"></i> 
                {isEditing ? 'Editar Tratamiento' : 'Registrar Tratamiento'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} id="treatmentForm">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Fecha</label>
                    <input type="date" className="form-control bg-light" name="fecha" value={formData.fecha} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Pieza Dental (FDI)</label>
                    <input type="text" className="form-control bg-light" name="pieza" placeholder="Ej: 18, 45 o General" value={formData.pieza} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Diagnóstico</label>
                    <input type="text" className="form-control bg-light" name="diagnostico" value={formData.diagnostico} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Tratamiento a Realizar</label>
                    <input type="text" className="form-control bg-light" name="tratamiento" value={formData.tratamiento} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Costo ($)</label>
                    <input type="number" step="0.01" min="0" className="form-control bg-light" name="costo" value={formData.costo} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Descuento ($)</label>
                    <input type="number" step="0.01" min="0" className="form-control bg-light" name="descuento" value={formData.descuento} onChange={handleChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-primary small fw-bold">Saldo Total ($)</label>
                    <input type="number" className="form-control bg-white fw-bold text-primary border-primary" name="saldo" value={formData.saldo} readOnly disabled />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Estado del Tratamiento</label>
                    <select className="form-select bg-light" name="estado" value={formData.estado} onChange={handleChange}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Finalizado">Finalizado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-top-0 rounded-bottom-4">
              <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" form="treatmentForm" className="btn btn-primary px-4 fw-medium shadow-sm">
                Guardar Tratamiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilo para animación rápida */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TratamientosPage;
