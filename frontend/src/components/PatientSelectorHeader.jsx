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
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchPatientsList = async () => {
      if (!user?.clinic_id) return;
      try {
        setLoading(true);
        const data = await getPatients(user.clinic_id);
        setPatients(data || []);
      } catch (err) {
        console.error("Error al cargar pacientes en selector:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientsList();
  }, [user?.clinic_id]);

  const handleSelect = async (patient) => {
    setShowDropdown(false);
    setSearchTerm('');
    if (!patient) {
      onSelectPatient(null, null);
      return;
    }

    // Intentar buscar la historia clínica general para auto-completar antecedentes
    let generalHistory = null;
    try {
      generalHistory = await getClinicalHistory(patient.id, user.clinic_id);
    } catch (err) {
      console.log("Sin historia clínica general previa para este paciente.");
    }

    onSelectPatient(patient, generalHistory);
  };

  const filteredPatients = patients.filter(p => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase();
    const ci = (p.ci || '').toLowerCase();
    return fullName.includes(term) || ci.includes(term);
  });

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4 bg-primary bg-opacity-10 border-start border-primary border-4 p-4">
      <div className="row align-items-center g-3">
        <div className="col-md-6">
          <h5 className="fw-bold text-dark mb-1">
            <i className="bi bi-person-badge-fill me-2 text-primary"></i>
            {title} — {moduleName}
          </h5>
          <p className="text-muted small mb-0">
            Busca y vincula un paciente por <strong>Nombre</strong> o <strong>C.I.</strong> para auto-completar sus datos clínicos.
          </p>
        </div>

        <div className="col-md-6">
          {selectedPatient ? (
            <div className="bg-white p-3 rounded-3 shadow-sm border d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-success mb-1">
                  <i className="bi bi-check-circle-fill me-1"></i> Paciente Vinculado
                </span>
                <h6 className="fw-bold mb-0 text-dark">{selectedPatient.nombre} {selectedPatient.apellido}</h6>
                <small className="text-muted">C.I.: <strong>{selectedPatient.ci || 'Sin CI'}</strong> | Celular: {selectedPatient.celular || 'N/A'}</small>
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
            <div className="position-relative">
              <label className="form-label text-dark fw-semibold small mb-1">
                Buscar Paciente por Nombre o Número de C.I.
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-primary"></i>
                </span>
                <input 
                  type="text" 
                  className="form-control bg-white border-start-0 ps-0" 
                  placeholder="Escribe el nombre o CI del paciente..."
                  value={searchTerm}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  disabled={loading}
                />
                {searchTerm && (
                  <button 
                    className="btn btn-outline-secondary bg-white border-start-0" 
                    type="button" 
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              {/* Dropdown flotante con resultados en tiempo real */}
              {showDropdown && (
                <div 
                  className="position-absolute w-100 bg-white rounded-3 shadow-lg border mt-1 z-3 overflow-auto" 
                  style={{ maxHeight: '250px' }}
                >
                  <div className="p-2 border-bottom bg-light d-flex justify-content-between align-items-center">
                    <small className="text-muted fw-bold">
                      {filteredPatients.length} paciente(s) encontrado(s)
                    </small>
                    <button 
                      type="button" 
                      className="btn-close btn-close-sm" 
                      onClick={() => setShowDropdown(false)}
                      style={{ fontSize: '0.7rem' }}
                    ></button>
                  </div>
                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      No se encontraron pacientes con "{searchTerm}".
                    </div>
                  ) : (
                    <div className="list-group list-group-flush">
                      {filteredPatients.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          className="list-group-item list-group-item-action text-start p-2 px-3 d-flex justify-content-between align-items-center"
                          onClick={() => handleSelect(p)}
                        >
                          <div>
                            <div className="fw-bold text-dark">{p.nombre} {p.apellido}</div>
                            <small className="text-muted">C.I.: {p.ci || 'Sin CI'} | Tel: {p.celular || 'N/A'}</small>
                          </div>
                          <span className="badge bg-primary rounded-pill">Vincular</span>
                        </button>
                      ))}
                    </div>
                  )}
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
