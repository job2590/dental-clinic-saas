import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPatientById, deletePatient } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import { getSecureUrl } from '../../services/storageService';

const PacienteProfile = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await getPatientById(id, user.clinic_id);
        setPatient(data);
        if (data.foto_url) {
          const signedUrl = await getSecureUrl('patient-photos', data.foto_url);
          if (signedUrl) setPreviewUrl(signedUrl);
        }
      } catch (error) {
        console.error("Paciente no encontrado:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al paciente ${patient.nombre}?`)) {
      await deletePatient(id, user.clinic_id);
      navigate('/pacientes');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">Paciente no encontrado</h4>
        <Link to="/pacientes" className="btn btn-primary mt-3">Volver a la lista</Link>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Link to="/pacientes" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-0">Ficha del Paciente</h3>
            <span className="badge bg-primary bg-opacity-10 text-primary mt-1 border border-primary border-opacity-25">{patient.codigo}</span>
          </div>
        </div>
        <div className="btn-group shadow-sm">
          <Link to={`/pacientes/editar/${patient.id}`} className="btn btn-light text-secondary border-end">
            <i className="bi bi-pencil me-2"></i> Editar
          </Link>
          <button onClick={handleDelete} className="btn btn-light text-danger">
            <i className="bi bi-trash me-2"></i> Eliminar
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Perfil Básico */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 text-center">
              <div className="avatar-wrapper mb-4 position-relative d-inline-block">
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex flex-column align-items-center justify-content-center mx-auto border border-4 border-white shadow-sm" style={{width: '140px', height: '140px', fontSize: '3rem'}}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Perfil" className="w-100 h-100 rounded-circle object-fit-cover" />
                  ) : (
                    patient.nombre.charAt(0)
                  )}
                </div>
              </div>
              <h4 className="fw-bold text-dark mb-1">{patient.nombre} {patient.apellido}</h4>
              <p className="text-muted mb-3">{patient.profesion || 'Sin profesión registrada'}</p>
              
              <div className="d-flex justify-content-center gap-2 mb-4">
                <a href={`https://wa.me/${patient.whatsapp?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-light rounded-circle text-success" title="WhatsApp" style={{width:'40px', height:'40px', padding: '0.4rem'}}>
                  <i className="bi bi-whatsapp fs-5"></i>
                </a>
                <a href={`tel:${patient.celular}`} className="btn btn-light rounded-circle text-primary" title="Llamar" style={{width:'40px', height:'40px', padding: '0.4rem'}}>
                  <i className="bi bi-telephone-fill fs-5"></i>
                </a>
                <a href={`mailto:${patient.correo}`} className="btn btn-light rounded-circle text-danger" title="Correo" style={{width:'40px', height:'40px', padding: '0.4rem'}}>
                  <i className="bi bi-envelope-fill fs-5"></i>
                </a>
              </div>

              <div className="border-top pt-4 text-start">
                <h6 className="fw-bold text-secondary mb-3">Información General</h6>
                <div className="mb-2">
                  <span className="text-muted small d-block">Documento (CI)</span>
                  <span className="fw-medium text-dark">{patient.ci}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted small d-block">Edad</span>
                  <span className="fw-medium text-dark">{patient.edad || 'No calculada'} años <small className="text-muted">({new Date(patient.fecha_nacimiento).toLocaleDateString()})</small></span>
                </div>
                <div className="mb-2">
                  <span className="text-muted small d-block">Sexo</span>
                  <span className="fw-medium text-dark">{patient.sexo || '-'}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted small d-block">Estado Civil</span>
                  <span className="fw-medium text-dark">{patient.estado_civil || '-'}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted small d-block">Fecha de Registro</span>
                  <span className="fw-medium text-dark">{new Date(patient.fecha_registro).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalles */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
              <ul className="nav nav-tabs card-header-tabs border-bottom-0 gap-3">
                <li className="nav-item">
                  <a className="nav-link active fw-bold text-primary border-0 border-bottom border-primary border-3 bg-transparent px-1 pb-3" href="#">Datos de Contacto y Médicos</a>
                </li>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-secondary border-0 bg-transparent px-1 pb-3" to={`/pacientes/${patient.id}/historia-clinica`}>Historia Clínica <i className="bi bi-folder2-open ms-1"></i></Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-secondary border-0 bg-transparent px-1 pb-3" to={`/pacientes/${patient.id}/odontograma`}>Odontograma <i className="bi bi-tooth ms-1"></i></Link>
                </li>
              </ul>
            </div>
            <div className="card-body p-4 p-md-5">
              <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-geo-alt me-2 text-primary"></i> Contacto y Ubicación</h6>
              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <span className="text-muted small d-block mb-1">Dirección Completa</span>
                  <span className="fw-medium text-dark d-block bg-light p-2 rounded">{patient.direccion || 'No especificada'}</span>
                </div>
                <div className="col-md-3">
                  <span className="text-muted small d-block mb-1">Ciudad</span>
                  <span className="fw-medium text-dark d-block bg-light p-2 rounded">{patient.ciudad || '-'}</span>
                </div>
                <div className="col-md-3">
                  <span className="text-muted small d-block mb-1">Departamento</span>
                  <span className="fw-medium text-dark d-block bg-light p-2 rounded">{patient.departamento || '-'}</span>
                </div>
              </div>

              <h6 className="fw-bold text-secondary mb-3"><i className="bi bi-clipboard2-pulse me-2 text-primary"></i> Datos Clínicos Iniciales</h6>
              <div className="row g-4 mb-4">
                <div className="col-12">
                  <span className="text-muted small d-block mb-1">Contacto de Emergencia</span>
                  <span className="fw-medium text-dark d-block bg-light p-2 rounded">{patient.contacto_emergencia || 'No registrado'}</span>
                </div>
                <div className="col-12">
                  <span className="text-muted small d-block mb-1">Observaciones Generales</span>
                  <div className="bg-light p-3 rounded fw-medium text-dark min-h-100">
                    {patient.observaciones || 'No hay observaciones adicionales para este paciente.'}
                  </div>
                </div>
              </div>

              <div className="alert border border-primary shadow-sm rounded-4 mt-5 bg-white d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-clipboard2-pulse fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Historia Clínica Digital</h6>
                    <p className="mb-0 small text-muted">Gestiona el motivo de consulta, antecedentes, exámenes y firma el consentimiento.</p>
                  </div>
                </div>
                <Link to={`/pacientes/${patient.id}/historia-clinica`} className="btn btn-primary px-4 fw-medium shadow-sm">
                  Abrir Ficha Clínica
                </Link>
              </div>

              <div className="alert border border-info shadow-sm rounded-4 mt-3 bg-white d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-tooth fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Odontograma Interactivo</h6>
                    <p className="mb-0 small text-muted">Evalúa y registra visualmente el estado dental (32 piezas).</p>
                  </div>
                </div>
                <Link to={`/pacientes/${patient.id}/odontograma`} className="btn btn-info text-white px-4 fw-medium shadow-sm">
                  Abrir Odontograma
                </Link>
              </div>

              <div className="alert border border-success shadow-sm rounded-4 mt-3 bg-white d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-journal-medical fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Plan de Tratamientos</h6>
                    <p className="mb-0 small text-muted">Registra los tratamientos a realizar, presupuestos y saldos.</p>
                  </div>
                </div>
                <Link to={`/pacientes/${patient.id}/tratamientos`} className="btn btn-success text-white px-4 fw-medium shadow-sm">
                  Abrir Tratamientos
                </Link>
              </div>

              <div className="alert border border-warning shadow-sm rounded-4 mt-3 bg-white d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-wallet2 fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Estado de Cuenta y Pagos</h6>
                    <p className="mb-0 small text-muted">Abona tratamientos, revisa deudas y genera recibos.</p>
                  </div>
                </div>
                <Link to={`/pacientes/${patient.id}/pagos`} className="btn btn-warning text-dark px-4 fw-bold shadow-sm">
                  Abrir Pagos
                </Link>
              </div>

              <div className="alert border border-dark shadow-sm rounded-4 mt-3 bg-white d-flex align-items-center justify-content-between p-4">
                <div className="d-flex align-items-center">
                  <div className="bg-dark bg-opacity-10 text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-images fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Centro de Imágenes Clínicas</h6>
                    <p className="mb-0 small text-muted">Sube radiografías panorámicas, CBCT y fotos del paciente.</p>
                  </div>
                </div>
                <Link to={`/pacientes/${patient.id}/radiografias`} className="btn btn-dark text-white px-4 fw-medium shadow-sm">
                  Abrir Galería
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacienteProfile;
