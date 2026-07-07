import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatients, deletePatient } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import { getSecureUrl } from '../../services/storageService';

const PatientAvatar = ({ patient }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (patient.foto_url) {
      if (patient.foto_url.startsWith('http')) {
        setUrl(patient.foto_url);
      } else {
        getSecureUrl('patient-photos', patient.foto_url).then(signedUrl => {
          if (signedUrl) setUrl(signedUrl);
        });
      }
    }
  }, [patient.foto_url]);

  return url ? (
    <img src={url} alt="Foto" className="w-100 h-100 rounded-circle object-fit-cover" />
  ) : (
    patient.nombre ? patient.nombre.charAt(0) : 'P'
  );
};

const PacientesList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatients(user.clinic_id);
      setPatients(data);
    } catch (error) {
      console.error("Error al obtener pacientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `¿Eliminar al paciente ${name}?`,
      text: "Esta acción no se puede deshacer y eliminará su ficha permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deletePatient(id, user.clinic_id);
        setPatients(patients.filter(p => p.id !== id));
        Swal.fire({ title: '¡Eliminado!', text: 'El paciente ha sido borrado exitosamente.', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (error) {
        console.error("Error al eliminar paciente:", error);
      }
    }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nombre || '').toLowerCase().includes(term) ||
      (p.apellido || '').toLowerCase().includes(term) ||
      (p.ci || '').toLowerCase().includes(term) ||
      (p.codigo || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="container-fluid p-0">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Pacientes</h3>
          <p className="text-muted mb-0">Gestiona la información de todos los pacientes de la clínica.</p>
        </div>
        <Link to="/pacientes/nuevo" className="btn btn-primary shadow-sm d-flex align-items-center">
          <i className="bi bi-person-plus-fill me-2"></i> Nuevo Paciente
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 pt-4 pb-2 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div className="input-group" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input 
              type="text" 
              className="form-control border-start-0 bg-light shadow-none" 
              placeholder="Buscar por nombre, apellido, CI o código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-muted small fw-medium">
            Mostrando {filteredPatients.length} pacientes
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4 py-3 fw-semibold border-0">Código</th>
                  <th className="py-3 fw-semibold border-0">Paciente</th>
                  <th className="py-3 fw-semibold border-0">Documento (CI)</th>
                  <th className="py-3 fw-semibold border-0">Contacto</th>
                  <th className="py-3 fw-semibold border-0">Última Visita</th>
                  <th className="pe-4 py-3 fw-semibold border-0 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Cargando pacientes...
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
                      No se encontraron pacientes registrados.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(patient => (
                    <tr key={patient.id}>
                      <td className="ps-4 py-3 text-secondary fw-medium">{patient.codigo}</td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold me-3" style={{width: '40px', height: '40px'}}>
                            <PatientAvatar patient={patient} />
                          </div>
                          <div>
                            <span className="fw-bold text-dark d-block">{patient.nombre} {patient.apellido}</span>
                            <span className="text-muted small">{patient.edad} años</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-secondary">{patient.ci}</td>
                      <td className="py-3">
                        <span className="d-block text-dark small"><i className="bi bi-telephone-fill text-muted me-1"></i> {patient.celular || 'N/A'}</span>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-light text-secondary border fw-medium px-2 py-1">
                          {new Date(patient.fecha_registro).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="btn-group shadow-sm rounded-pill">
                          <Link to={`/pacientes/${patient.id}`} className="btn btn-sm btn-light border-end text-primary" title="Ver Perfil">
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link to={`/pacientes/editar/${patient.id}`} className="btn btn-sm btn-light border-end text-secondary" title="Editar">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button onClick={() => handleDelete(patient.id, patient.nombre)} className="btn btn-sm btn-light text-danger" title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
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

export default PacientesList;
