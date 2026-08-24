import React, { useState, useEffect } from 'react';
import { getPatients } from '../services/patientService';
import { getClinicalHistory } from '../services/clinicalHistoryService';
import { useAuth } from '../context/AuthContext';

const PatientSelectorHeader = ({ 
  selectedPatient, 
  onSelectPatient, 
  title = "Seleccionar Paciente",
  moduleName = "Especialidad" 
}) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPatientsList = async () => {
      if (!user?.clinic_id) return;
      try {
        setLoading(true);
        const data = await getPatients(user.clinic_id);
        setPatients(data);
      } catch (err) {
        console.error("Error al cargar pacientes en selector:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientsList();
  }, [user?.clinic_id]);

  const handlePatientChange = async (e) => {
    const patientId = e.target.value;
    if (!patientId) {
      onSelectPatient(null, null);
      return;
    }

    const patient = patients.find(p => String(p.id) === String(patientId));
    if (!patient) return;

    // Intentar buscar la historia clínica general para auto-completar antecedentes
    let generalHistory = null;
    try {
      generalHistory = await getClinicalHistory(patient.id, user.clinic_id);
    } catch (err) {
      console.log("Sin historia clínica general previa para este paciente.");
    }

    onSelectPatient(patient, generalHistory);
  };

  const filteredPatients = patients.filter(p => 
    `${p.nombre} ${p.apellido} ${p.ci}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary bg-opacity-10 border-start border-primary border-4 p-4">
      <div className="row align-items-center g-3">
        <div className="col-md-6">
          <h5 className="fw-bold text-dark mb-1">
            <i className="bi bi-person-badge-fill me-2 text-primary"></i>
            {title} — {moduleName}
          </h5>
          <p className="text-muted small mb-0">
            Vincula un paciente previamente registrado para auto-completar automáticamente sus datos de filiación y antecedentes médicos.
          </p>
        </div>

        <div className="col-md-6">
          {selectedPatient ? (
            <div className="bg-white p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-success mb-1">
                  <i className="bi bi-check-circle me-1"></i> Paciente Vinculado
                </span>
                <h6 className="fw-bold mb-0 text-dark">{selectedPatient.nombre} {selectedPatient.apellido}</h6>
                <small className="text-muted">C.I.: {selectedPatient.ci || 'Sin CI'} | Celular: {selectedPatient.celular || 'N/A'}</small>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary" 
                onClick={() => onSelectPatient(null, null)}
              >
                <i className="bi bi-arrow-repeat me-1"></i> Cambiar
              </button>
            </div>
          ) : (
            <div>
              <label className="form-label text-dark fw-semibold small mb-1">Buscar y Seleccionar Paciente Registrado</label>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              ) : (
                <div className="input-group">
                  <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                  <select 
                    className="form-select bg-white fw-medium"
                    onChange={handlePatientChange}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Selecciona un paciente de la lista --</option>
                    {filteredPatients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} {p.ci ? `(C.I. ${p.ci})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientSelectorHeader;
