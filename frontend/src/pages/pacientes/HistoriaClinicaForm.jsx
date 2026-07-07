import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { getPatientById } from '../../services/patientService';
import { getClinicalHistory, saveClinicalHistory } from '../../services/clinicalHistoryService';
import { useAuth } from '../../context/AuthContext';

const HistoriaClinicaForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('motivo');

  // Referencias para los Canvas de Firma
  const sigCanvasPaciente = useRef({});
  const sigCanvasOdontologo = useRef({});

  // Estado del formulario
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    enfermedad_actual: '',
    // Antecedentes Médicos
    diabetes: false,
    hipertension: false,
    cardiacas: false,
    respiratorias: false,
    hemorragicos: false,
    hepatitis: false,
    vih: false,
    embarazo: false,
    alergias: '',
    medicamentos: '',
    cirugias: '',
    otros_antecedentes: '',
    // Odontológicos
    ultima_visita: '',
    cepillado: '',
    hilo_dental: false,
    habitos: '',
    tratamientos_previos: '',
    // Clínico Extraoral
    simetria_facial: '',
    atm: '',
    ganglios: '',
    labios: '',
    // Clínico Intraoral
    mucosa: '',
    lengua: '',
    piso_boca: '',
    paladar: '',
    encias: '',
    higiene_oral: '',
    caries: '',
    restauraciones: '',
    movilidad: '',
    oclusion: '',
    // Exámenes
    examenes: '',
    diagnostico: '',
    plan_tratamiento: '',
    // Firmas
    firma_paciente: '',
    firma_odontologo: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pData = await getPatientById(id, user.clinic_id);
        setPatient(pData);
        const hcData = await getClinicalHistory(id, user.clinic_id);
        if (hcData) {
          setFormData(hcData);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user.clinic_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClearSignature = (ref) => {
    ref.current.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Extraer firmas si existen
    const finalData = { ...formData };
    if (sigCanvasPaciente.current && !sigCanvasPaciente.current.isEmpty()) {
      finalData.firma_paciente = sigCanvasPaciente.current.getTrimmedCanvas().toDataURL('image/png');
    }
    if (sigCanvasOdontologo.current && !sigCanvasOdontologo.current.isEmpty()) {
      finalData.firma_odontologo = sigCanvasOdontologo.current.getTrimmedCanvas().toDataURL('image/png');
    }

    try {
      await saveClinicalHistory(id, finalData, user.clinic_id);
      navigate(`/pacientes/${id}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const renderTab = (tabId, label, icon) => (
    <li className="nav-item flex-grow-1 text-center" role="presentation">
      <button 
        className={`nav-link w-100 py-3 fw-semibold ${activeTab === tabId ? 'active text-primary bg-white border-bottom-0 shadow-sm rounded-top' : 'text-muted bg-light border-0'}`} 
        onClick={() => setActiveTab(tabId)}
        type="button"
      >
        <i className={`bi ${icon} me-2 d-none d-md-inline`}></i>
        {label}
      </button>
    </li>
  );

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex align-items-center mb-4">
        <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
          <i className="bi bi-arrow-left text-secondary"></i>
        </Link>
        <div>
          <h3 className="fw-bold text-dark mb-1">Historia Clínica Odontológica</h3>
          <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span> | CI: {patient?.ci}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-4 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="card-header bg-light p-0 border-0">
          <ul className="nav nav-tabs border-0 flex-nowrap overflow-auto custom-scrollbar">
            {renderTab('motivo', '1. Consulta', 'bi-chat-left-text')}
            {renderTab('medicos', '2. Ant. Médicos', 'bi-heart-pulse')}
            {renderTab('odontologicos', '3. Ant. Odontológicos', 'bi-tooth')}
            {renderTab('examen', '4. Examen', 'bi-clipboard2-pulse')}
            {renderTab('diagnostico', '5. Diagnóstico', 'bi-file-medical')}
            {renderTab('consentimiento', '6. Firmas', 'bi-pen')}
          </ul>
        </div>

        <div className="card-body p-4 p-md-5 bg-white min-vh-50">
          
          {/* TAB 1: Motivo de Consulta */}
          <div className={activeTab === 'motivo' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">II. Motivo de Consulta y III. Enfermedad Actual</h5>
            <div className="mb-4">
              <label className="form-label text-muted fw-semibold small">Motivo de consulta principal <span className="text-danger">*</span></label>
              <textarea className="form-control bg-light" name="motivo_consulta" rows="2" required value={formData.motivo_consulta} onChange={handleChange}></textarea>
            </div>
            <div>
              <label className="form-label text-muted fw-semibold small">Descripción de la enfermedad actual</label>
              <textarea className="form-control bg-light" name="enfermedad_actual" rows="4" value={formData.enfermedad_actual} onChange={handleChange}></textarea>
            </div>
          </div>

          {/* TAB 2: Antecedentes Médicos */}
          <div className={activeTab === 'medicos' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">IV. Antecedentes Médicos</h5>
            
            <div className="row g-4 mb-5 bg-light p-3 rounded-4">
              <div className="col-12"><h6 className="fw-bold text-secondary mb-0">Enfermedades Sistémicas</h6></div>
              
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="diabetes" checked={formData.diabetes} onChange={handleChange} />
                  <label className="form-check-label">Diabetes</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="hipertension" checked={formData.hipertension} onChange={handleChange} />
                  <label className="form-check-label">Hipertensión</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="cardiacas" checked={formData.cardiacas} onChange={handleChange} />
                  <label className="form-check-label">E. Cardíacas</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="respiratorias" checked={formData.respiratorias} onChange={handleChange} />
                  <label className="form-check-label">E. Respiratorias</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="hemorragicos" checked={formData.hemorragicos} onChange={handleChange} />
                  <label className="form-check-label">T. Hemorrágicos</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="hepatitis" checked={formData.hepatitis} onChange={handleChange} />
                  <label className="form-check-label">Hepatitis</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="vih" checked={formData.vih} onChange={handleChange} />
                  <label className="form-check-label">VIH</label>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" name="embarazo" checked={formData.embarazo} onChange={handleChange} />
                  <label className="form-check-label">Embarazo</label>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Alergias conocidas</label>
                <textarea className="form-control bg-light" name="alergias" rows="2" value={formData.alergias} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Medicamentos que consume</label>
                <textarea className="form-control bg-light" name="medicamentos" rows="2" value={formData.medicamentos} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Cirugías previas</label>
                <textarea className="form-control bg-light" name="cirugias" rows="2" value={formData.cirugias} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Otros antecedentes de importancia</label>
                <textarea className="form-control bg-light" name="otros_antecedentes" rows="2" value={formData.otros_antecedentes} onChange={handleChange}></textarea>
              </div>
            </div>
          </div>

          {/* TAB 3: Antecedentes Odontológicos */}
          <div className={activeTab === 'odontologicos' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">V. Antecedentes Odontológicos</h5>
            <div className="row g-4">
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Última visita al odontólogo</label>
                <input type="text" className="form-control bg-light" name="ultima_visita" placeholder="Ej: Hace 6 meses" value={formData.ultima_visita} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Frecuencia de cepillado</label>
                <select className="form-select bg-light" name="cepillado" value={formData.cepillado} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="1 vez al día">1 vez al día</option>
                  <option value="2 veces al día">2 veces al día</option>
                  <option value="3+ veces al día">3+ veces al día</option>
                  <option value="Irregular">Irregular</option>
                </select>
              </div>
              <div className="col-md-4 d-flex align-items-center">
                <div className="form-check form-switch mt-md-4">
                  <input className="form-check-input" type="checkbox" name="hilo_dental" checked={formData.hilo_dental} onChange={handleChange} />
                  <label className="form-check-label fw-medium text-dark">Uso de hilo dental regular</label>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Hábitos (bruxismo, fumar, alcohol, etc.)</label>
                <textarea className="form-control bg-light" name="habitos" rows="2" value={formData.habitos} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Tratamientos odontológicos previos</label>
                <textarea className="form-control bg-light" name="tratamientos_previos" rows="2" value={formData.tratamientos_previos} onChange={handleChange}></textarea>
              </div>
            </div>
          </div>

          {/* TAB 4: Examen Clínico */}
          <div className={activeTab === 'examen' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">VI. Examen Clínico</h5>
            
            <h6 className="fw-bold text-secondary mb-3 pb-2 border-bottom">Examen Extraoral</h6>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Simetría facial</label>
                <input type="text" className="form-control bg-light" name="simetria_facial" value={formData.simetria_facial} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Ganglios</label>
                <input type="text" className="form-control bg-light" name="ganglios" value={formData.ganglios} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">ATM</label>
                <input type="text" className="form-control bg-light" name="atm" value={formData.atm} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Labios</label>
                <input type="text" className="form-control bg-light" name="labios" value={formData.labios} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold text-secondary mb-3 pb-2 border-bottom">Examen Intraoral</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Mucosa oral</label>
                <input type="text" className="form-control bg-light" name="mucosa" value={formData.mucosa} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Lengua</label>
                <input type="text" className="form-control bg-light" name="lengua" value={formData.lengua} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Piso de boca</label>
                <input type="text" className="form-control bg-light" name="piso_boca" value={formData.piso_boca} onChange={handleChange} />
              </div>
              
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Paladar</label>
                <input type="text" className="form-control bg-light" name="paladar" value={formData.paladar} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Encías</label>
                <input type="text" className="form-control bg-light" name="encias" value={formData.encias} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Higiene oral</label>
                <select className="form-select bg-light" name="higiene_oral" value={formData.higiene_oral} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Deficiente">Deficiente</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Caries</label>
                <input type="text" className="form-control bg-light" name="caries" value={formData.caries} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Restauraciones</label>
                <input type="text" className="form-control bg-light" name="restauraciones" value={formData.restauraciones} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Movilidad dental</label>
                <input type="text" className="form-control bg-light" name="movilidad" value={formData.movilidad} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Oclusión</label>
                <input type="text" className="form-control bg-light" name="oclusion" value={formData.oclusion} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* TAB 5: Diagnóstico y Plan */}
          <div className={activeTab === 'diagnostico' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">VII. Exámenes, VIII. Diagnóstico y IX. Tratamiento</h5>
            <div className="mb-4">
              <label className="form-label text-muted fw-semibold small">Exámenes complementarios requeridos</label>
              <textarea className="form-control bg-light" name="examenes" rows="2" placeholder="Radiografía periapical, Panorámica, etc." value={formData.examenes} onChange={handleChange}></textarea>
            </div>
            <div className="mb-4">
              <label className="form-label text-muted fw-semibold small">Diagnóstico Clínico <span className="text-danger">*</span></label>
              <textarea className="form-control bg-light" name="diagnostico" rows="3" value={formData.diagnostico} onChange={handleChange}></textarea>
            </div>
            <div>
              <label className="form-label text-muted fw-semibold small">Plan de Tratamiento Propuesto</label>
              <textarea className="form-control bg-light" name="plan_tratamiento" rows="5" placeholder="1° ...&#10;2° ...&#10;3° ..." value={formData.plan_tratamiento} onChange={handleChange}></textarea>
            </div>
          </div>

          {/* TAB 6: Consentimiento Informado */}
          <div className={activeTab === 'consentimiento' ? 'd-block' : 'd-none'}>
            <h5 className="fw-bold text-primary mb-4">X. Consentimiento Informado</h5>
            
            <div className="bg-light p-4 rounded-4 mb-4 text-secondary small fst-italic border">
              "Declaro haber recibido información sobre mi diagnóstico, el tratamiento propuesto, sus beneficios, riesgos y alternativas. Autorizo a los profesionales de Clínica Amanecer a llevar a cabo los procedimientos descritos en el plan de tratamiento."
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="border rounded-4 bg-light overflow-hidden">
                  <div className="bg-white px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark small">Firma del Paciente</span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleClearSignature(sigCanvasPaciente)}>Limpiar</button>
                  </div>
                  {formData.firma_paciente && !sigCanvasPaciente.current?.isEmpty ? (
                    <div className="p-3 bg-white text-center">
                      <img src={formData.firma_paciente} alt="Firma Paciente" className="img-fluid" style={{maxHeight: '150px'}} />
                      <div className="mt-2 text-success small"><i className="bi bi-check-circle-fill me-1"></i> Firmado previamente</div>
                    </div>
                  ) : (
                    <SignatureCanvas 
                      ref={sigCanvasPaciente}
                      penColor="blue"
                      canvasProps={{className: 'w-100 bg-white', style: {height: '150px'}}} 
                    />
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="border rounded-4 bg-light overflow-hidden">
                  <div className="bg-white px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-dark small">Firma y Sello del Odontólogo</span>
                    <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => handleClearSignature(sigCanvasOdontologo)}>Limpiar</button>
                  </div>
                  {formData.firma_odontologo && !sigCanvasOdontologo.current?.isEmpty ? (
                    <div className="p-3 bg-white text-center">
                      <img src={formData.firma_odontologo} alt="Firma Odontólogo" className="img-fluid" style={{maxHeight: '150px'}} />
                      <div className="mt-2 text-success small"><i className="bi bi-check-circle-fill me-1"></i> Firmado previamente</div>
                    </div>
                  ) : (
                    <SignatureCanvas 
                      ref={sigCanvasOdontologo}
                      penColor="black"
                      canvasProps={{className: 'w-100 bg-white', style: {height: '150px'}}} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="card-footer bg-white border-top-0 p-4 d-flex justify-content-between align-items-center">
          <div className="text-muted small">
            <i className="bi bi-info-circle me-1"></i> Revisa todas las pestañas antes de guardar.
          </div>
          <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> Guardando Ficha...</>
            ) : (
              <><i className="bi bi-save me-2"></i> Guardar Historia Clínica</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default HistoriaClinicaForm;
