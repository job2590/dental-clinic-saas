import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPatientById } from '../../services/patientService';
import { getClinicalHistory, saveClinicalHistory } from '../../services/clinicalHistoryService';
import { getClinicById } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';

const HistoriaClinicaForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('motivo');

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
    plan_tratamiento: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pData = await getPatientById(id, user.clinic_id);
        setPatient(pData);
        const cData = await getClinicById(user.clinic_id);
        setClinic(cData);
        
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await saveClinicalHistory(id, formData, user.clinic_id);
      navigate(`/pacientes/${id}`);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5 d-print-none">
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
      
      {/* VISTA WEB NORMAL (d-print-none oculta todo este bloque al imprimir) */}
      <div className="d-print-none">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
              <i className="bi bi-arrow-left text-secondary"></i>
            </Link>
            <div>
              <h3 className="fw-bold text-dark mb-1">Historia Clínica Odontológica</h3>
              <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span> | CI: {patient?.ci}</p>
            </div>
          </div>
          <button onClick={handlePrint} className="btn btn-outline-secondary fw-bold shadow-sm">
            <i className="bi bi-printer me-2"></i> Descargar PDF / Imprimir
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-4 overflow-hidden">
          
          <div className="card-header bg-light p-0 border-0">
            <ul className="nav nav-tabs border-0 flex-nowrap overflow-auto custom-scrollbar">
              {renderTab('motivo', '1. Consulta', 'bi-chat-left-text')}
              {renderTab('medicos', '2. Ant. Médicos', 'bi-heart-pulse')}
              {renderTab('odontologicos', '3. Ant. Odontológicos', 'bi-tooth')}
              {renderTab('examen', '4. Examen', 'bi-clipboard2-pulse')}
              {renderTab('diagnostico', '5. Diagnóstico', 'bi-file-medical')}
            </ul>
          </div>

          <div className="card-body p-4 p-md-5 bg-white min-vh-50">
            
            {/* TAB 1 */}
            <div className={activeTab === 'motivo' ? 'd-block' : 'd-none'}>
              <h5 className="fw-bold text-primary mb-4">II. Motivo de Consulta y III. Enfermedad Actual</h5>
              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Motivo de consulta principal</label>
                <textarea className="form-control bg-light" name="motivo_consulta" rows="2" value={formData.motivo_consulta} onChange={handleChange}></textarea>
              </div>
              <div>
                <label className="form-label text-muted fw-semibold small">Descripción de la enfermedad actual</label>
                <textarea className="form-control bg-light" name="enfermedad_actual" rows="4" value={formData.enfermedad_actual} onChange={handleChange}></textarea>
              </div>
            </div>

            {/* TAB 2 */}
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

            {/* TAB 3 */}
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

            {/* TAB 4 */}
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

            {/* TAB 5 */}
            <div className={activeTab === 'diagnostico' ? 'd-block' : 'd-none'}>
              <h5 className="fw-bold text-primary mb-4">VII. Exámenes, VIII. Diagnóstico y IX. Tratamiento</h5>
              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Exámenes complementarios requeridos</label>
                <textarea className="form-control bg-light" name="examenes" rows="2" value={formData.examenes} onChange={handleChange}></textarea>
              </div>
              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Diagnóstico Clínico</label>
                <textarea className="form-control bg-light" name="diagnostico" rows="3" value={formData.diagnostico} onChange={handleChange}></textarea>
              </div>
              <div>
                <label className="form-label text-muted fw-semibold small">Plan de Tratamiento Propuesto</label>
                <textarea className="form-control bg-light" name="plan_tratamiento" rows="5" value={formData.plan_tratamiento} onChange={handleChange}></textarea>
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


      {/* =========================================
          VISTA DE IMPRESIÓN (PDF)
          Solo visible al presionar "Imprimir"
      ============================================= */}
      <div className="d-none d-print-block print-container bg-white text-dark w-100 h-100 position-absolute top-0 start-0 z-3 p-4" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
        
        {/* Encabezado Profesional */}
        <div className="border-bottom border-2 border-dark pb-3 mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>{clinic?.nombre || 'Clínica Dental'}</h2>
            <p className="mb-0 text-muted">{clinic?.direccion || ''}</p>
            <p className="mb-0 text-muted">{clinic?.telefono || ''} | {clinic?.correo || ''}</p>
          </div>
          <div className="text-end">
            <h4 className="fw-bold text-dark mb-1">HISTORIA CLÍNICA</h4>
            <p className="mb-0 fw-bold">Fecha: <span className="fw-normal">{new Date().toLocaleDateString()}</span></p>
          </div>
        </div>

        {/* Datos del Paciente */}
        <div className="mb-4">
          <div className="bg-light border border-dark border-opacity-25 p-2 px-3 fw-bold mb-2 uppercase" style={{ fontSize: '14px' }}>I. DATOS DEL PACIENTE</div>
          <div className="row g-2 px-2" style={{ fontSize: '14px' }}>
            <div className="col-8"><strong>Nombre:</strong> {patient?.nombre} {patient?.apellido}</div>
            <div className="col-4"><strong>CI:</strong> {patient?.ci}</div>
            <div className="col-4"><strong>Fecha Nac.:</strong> {patient?.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString() : '-'}</div>
            <div className="col-4"><strong>Sexo:</strong> {patient?.sexo || '-'}</div>
            <div className="col-4"><strong>Celular:</strong> {patient?.celular || '-'}</div>
            <div className="col-12"><strong>Dirección:</strong> {patient?.direccion || '-'}</div>
          </div>
        </div>

        {/* Motivo de Consulta y Enfermedad Actual */}
        <div className="mb-4">
          <div className="bg-light border border-dark border-opacity-25 p-2 px-3 fw-bold mb-2" style={{ fontSize: '14px' }}>II. MOTIVO DE CONSULTA Y ENFERMEDAD ACTUAL</div>
          <div className="px-2" style={{ fontSize: '14px' }}>
            <p className="mb-1"><strong>Motivo:</strong> {formData.motivo_consulta || 'No especificado'}</p>
            <p className="mb-0"><strong>Enfermedad Actual:</strong> {formData.enfermedad_actual || 'No especificada'}</p>
          </div>
        </div>

        {/* Antecedentes Médicos */}
        <div className="mb-4">
          <div className="bg-light border border-dark border-opacity-25 p-2 px-3 fw-bold mb-2" style={{ fontSize: '14px' }}>III. ANTECEDENTES MÉDICOS</div>
          <div className="px-2" style={{ fontSize: '14px' }}>
            <div className="d-flex flex-wrap gap-3 mb-2">
              <span><strong>Diabetes:</strong> {formData.diabetes ? 'Sí' : 'No'}</span>
              <span><strong>Hipertensión:</strong> {formData.hipertension ? 'Sí' : 'No'}</span>
              <span><strong>E. Cardíacas:</strong> {formData.cardiacas ? 'Sí' : 'No'}</span>
              <span><strong>E. Respiratorias:</strong> {formData.respiratorias ? 'Sí' : 'No'}</span>
              <span><strong>T. Hemorrágicos:</strong> {formData.hemorragicos ? 'Sí' : 'No'}</span>
              <span><strong>Hepatitis:</strong> {formData.hepatitis ? 'Sí' : 'No'}</span>
              <span><strong>VIH:</strong> {formData.vih ? 'Sí' : 'No'}</span>
              <span><strong>Embarazo:</strong> {formData.embarazo ? 'Sí' : 'No'}</span>
            </div>
            <p className="mb-1"><strong>Alergias:</strong> {formData.alergias || 'Ninguna'}</p>
            <p className="mb-1"><strong>Medicamentos:</strong> {formData.medicamentos || 'Ninguno'}</p>
            <p className="mb-1"><strong>Cirugías Previas:</strong> {formData.cirugias || 'Ninguna'}</p>
            <p className="mb-0"><strong>Otros Antecedentes:</strong> {formData.otros_antecedentes || 'Ninguno'}</p>
          </div>
        </div>

        {/* Diagnóstico y Tratamiento */}
        <div className="mb-5">
          <div className="bg-light border border-dark border-opacity-25 p-2 px-3 fw-bold mb-2" style={{ fontSize: '14px' }}>IV. DIAGNÓSTICO Y PLAN DE TRATAMIENTO</div>
          <div className="px-2" style={{ fontSize: '14px' }}>
            <p className="mb-2"><strong>Exámenes Complementarios:</strong> {formData.examenes || 'Ninguno'}</p>
            <p className="mb-2"><strong>Diagnóstico Clínico:</strong><br/>{formData.diagnostico || 'No especificado'}</p>
            <p className="mb-0"><strong>Plan de Tratamiento:</strong><br/><span style={{ whiteSpace: 'pre-line' }}>{formData.plan_tratamiento || 'No especificado'}</span></p>
          </div>
        </div>

        {/* Consentimiento y Firmas Físicas */}
        <div className="mt-5 pt-3" style={{ pageBreakInside: 'avoid' }}>
          <div className="bg-light border border-dark border-opacity-25 p-2 px-3 fw-bold mb-3 text-center" style={{ fontSize: '14px' }}>V. CONSENTIMIENTO INFORMADO</div>
          <p className="text-justify mb-5" style={{ fontSize: '12px', lineHeight: '1.5' }}>
            Declaro haber recibido información clara, veraz y suficiente acerca de mi estado de salud bucal, mi diagnóstico, el plan de tratamiento propuesto, sus alternativas, riesgos y beneficios esperados. Asimismo, declaro que todos los datos proporcionados en mis antecedentes médicos son ciertos. Autorizo libre y voluntariamente a los profesionales de {clinic?.nombre || 'la Clínica'} a realizar los procedimientos y tratamientos descritos.
          </p>
          
          <div className="row text-center mt-5 pt-5">
            <div className="col-6">
              <div className="border-top border-dark mx-auto" style={{ width: '80%' }}></div>
              <p className="mt-2 mb-0 fw-bold" style={{ fontSize: '14px' }}>Firma del Paciente</p>
              <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>CI: {patient?.ci}</p>
            </div>
            <div className="col-6">
              <div className="border-top border-dark mx-auto" style={{ width: '80%' }}></div>
              <p className="mt-2 mb-0 fw-bold" style={{ fontSize: '14px' }}>Firma y Sello del Odontólogo</p>
              <p className="mb-0 text-muted" style={{ fontSize: '12px' }}>Profesional Tratante</p>
            </div>
          </div>
        </div>

      </div>
      {/* FIN VISTA DE IMPRESIÓN */}

    </div>
  );
};

export default HistoriaClinicaForm;
