import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import PatientSelectorHeader from '../../components/PatientSelectorHeader';
import SignaturePadModal from '../../components/SignaturePadModal';
import ClinicalImageGallery from '../../components/ClinicalImageGallery';
import { 
  getOrthodonticRecordById, 
  saveOrthodonticRecord, 
  getOrthodonticImages, 
  uploadOrthodonticImage, 
  deleteOrthodonticImage 
} from '../../services/orthodonticsService';
import { generateOrthodonticPdf } from '../../services/specialtyPdfService';
import { getPatientById } from '../../services/patientService';

const OrtodonciaForm = () => {
  const { user, clinic } = useAuth();
  const { id } = useParams(); // si viene id de expediente o paciente
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordImages, setRecordImages] = useState([]);

  // Estado completo del formulario
  const [formData, setFormData] = useState({
    id: null,
    patient_id: '',
    patient_name: '',
    age: '',
    gender: 'Femenino',
    birth_date: '',
    occupation: '',
    phone: '',
    consultation_date: new Date().toISOString().split('T')[0],

    // Motivo de consulta
    consultation_reasons: [],
    consultation_other: '',

    // Antecedentes médicos
    systemic_diseases: [],
    systemic_other: '',
    has_allergies: false,
    allergies_detail: '',
    takes_medications: false,
    medications_detail: '',
    has_surgeries: false,
    surgeries_detail: '',
    has_hospitalizations: false,
    hospitalizations_detail: '',

    // Antecedentes odontológicos
    previous_orthodontics: false,
    extractions: false,
    dental_trauma: false,
    bruxism: false,

    // Hábitos
    habits: [],
    habits_other: '',

    // Examen extraoral
    profile: 'Recto',
    facial_symmetry: 'Simétrica',
    lip_competence: 'Competente',
    smile_type: 'Media',

    // Examen intraoral
    oral_hygiene: 'Buena',
    periodontal_status: 'Sano',
    molar_relation: 'Clase I',
    canine_relation: 'Clase I',
    overjet: 'Normal',
    overbite: 'Normal',
    midline: 'Coincidente',
    crowding: 'Leve',
    has_diastemas: false,
    crossbite: 'No',

    // Exámenes complementarios
    complementary_exams: [],

    // Diagnóstico y tratamiento
    diagnosis: '',
    treatment_plan: '',
    observations: '',

    // Consentimiento
    consent_given: true,
    consent_holder_name: '',
    consent_holder_ci: '',
    tutor_name: '',
    patient_signature_url: '',
    dentist_signature_url: '',
    consent_location: 'La Paz',
    consent_date: new Date().toISOString().split('T')[0]
  });

  // Cargar registro existente si viene :id
  useEffect(() => {
    const loadExistingRecord = async () => {
      if (!id || !user?.clinic_id) return;
      try {
        setLoading(true);
        const record = await getOrthodonticRecordById(id, user.clinic_id);
        if (record) {
          setFormData(record);
          const patient = await getPatientById(record.patient_id, user.clinic_id);
          setSelectedPatient(patient);
          const imgs = await getOrthodonticImages(record.id, user.clinic_id);
          setRecordImages(imgs);
        }
      } catch (err) {
        console.error("Error al cargar expediente:", err);
      } finally {
        setLoading(false);
      }
    };
    loadExistingRecord();
  }, [id, user?.clinic_id]);

  // Manejador de Vinculación y Auto-llenado inteligente
  const handleSelectPatient = (patient, generalHistory) => {
    setSelectedPatient(patient);
    if (!patient) {
      setFormData(prev => ({ ...prev, patient_id: '', patient_name: '' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      age: patient.edad || prev.age,
      gender: patient.sexo || prev.gender,
      birth_date: patient.fecha_nacimiento || prev.birth_date,
      phone: patient.celular || prev.phone,
      consent_holder_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      consent_holder_ci: patient.ci || '',

      // Auto-llenado desde Historia Clínica General si existe
      has_allergies: generalHistory?.alergias ? true : prev.has_allergies,
      allergies_detail: generalHistory?.alergias || prev.allergies_detail,
      takes_medications: generalHistory?.medicamentos ? true : prev.takes_medications,
      medications_detail: generalHistory?.medicamentos || prev.medications_detail,
      has_surgeries: generalHistory?.cirugias ? true : prev.has_surgeries,
      surgeries_detail: generalHistory?.cirugias || prev.surgeries_detail,
      systemic_diseases: [
        ...(generalHistory?.diabetes ? ['Diabetes'] : []),
        ...(generalHistory?.hipertension ? ['Hipertensión'] : []),
        ...(generalHistory?.cardiacas ? ['Cardiopatía'] : []),
        ...(generalHistory?.respiratorias ? ['Asma'] : [])
      ]
    }));

    Swal.fire({
      title: '¡Paciente Vinculado!',
      text: 'Los datos personales y antecedentes fueron precargados.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleTextChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayCheckboxChange = (category, option) => {
    setFormData(prev => {
      const currentList = Array.isArray(prev[category]) ? prev[category] : [];
      const updated = currentList.includes(option)
        ? currentList.filter(item => item !== option)
        : [...currentList, option];
      return { ...prev, [category]: updated };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.patient_id) {
      Swal.fire('Atención', 'Por favor selecciona o vincula un paciente primero.', 'warning');
      return;
    }

    try {
      setSaving(true);
      const savedRecord = await saveOrthodonticRecord(formData, user.clinic_id);
      setFormData(savedRecord);

      Swal.fire({
        title: '¡Expediente Guardado!',
        text: 'La Historia Clínica de Ortodoncia ha sido almacenada correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      if (!formData.id) {
        navigate(`/ortodoncia/editar/${savedRecord.id}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el expediente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (file, caption) => {
    if (!formData.id) {
      Swal.fire('Guardar Primero', 'Guarda el expediente antes de adjuntar imágenes.', 'info');
      return;
    }
    const newImg = await uploadOrthodonticImage(file, formData.id, formData.patient_id, user.clinic_id, caption);
    setRecordImages(prev => [newImg, ...prev]);
  };

  const handleDeleteImage = async (imageId) => {
    await deleteOrthodonticImage(imageId, user.clinic_id);
    setRecordImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleExportPdf = async () => {
    if (!selectedPatient && formData.patient_id) {
      const p = await getPatientById(formData.patient_id, user.clinic_id);
      await generateOrthodonticPdf(formData, p, clinic);
    } else {
      await generateOrthodonticPdf(formData, selectedPatient, clinic);
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
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Link to="/ortodoncia" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Ficha de Ortodoncia</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold text-primary">{formData.patient_name || 'Sin seleccionar'}</span></p>
          </div>
        </div>
        <div className="d-flex gap-2">
          {formData.id && (
            <button type="button" onClick={handleExportPdf} className="btn btn-outline-danger fw-bold shadow-sm">
              <i className="bi bi-file-pdf me-1"></i> Descargar PDF
            </button>
          )}
          <button type="button" onClick={handleSubmit} className="btn btn-primary fw-bold shadow-sm" disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            Guardar Ficha
          </button>
        </div>
      </div>

      {/* Header Seleccionador de Pacientes con Auto-llenado */}
      <PatientSelectorHeader 
        selectedPatient={selectedPatient} 
        onSelectPatient={handleSelectPatient}
        moduleName="Ortodoncia"
      />

      {/* Navegación por Pasos del Formulario */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-light p-0 border-0">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link py-3 rounded-0 fw-semibold ${currentStep === 1 ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setCurrentStep(1)}
              >
                <i className="bi bi-1-circle me-2"></i> 1. Datos y Anamnesis
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link py-3 rounded-0 fw-semibold ${currentStep === 2 ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setCurrentStep(2)}
              >
                <i className="bi bi-2-circle me-2"></i> 2. Evaluación Clínica
              </button>
            </li>
            <li className="nav-item">
              <button 
                type="button" 
                className={`nav-link py-3 rounded-0 fw-semibold ${currentStep === 3 ? 'active bg-primary text-white' : 'text-muted'}`}
                onClick={() => setCurrentStep(3)}
              >
                <i className="bi bi-3-circle me-2"></i> 3. Consentimiento y Firmas
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body p-4 p-md-5 bg-white">
          {/* PASO 1: Datos y Anamnesis */}
          {currentStep === 1 && (
            <div>
              <h5 className="fw-bold text-primary mb-4">I. Motivo de Consulta y Antecedentes Ortodóncicos</h5>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Motivos Principales de Consulta</label>
                <div className="row g-3 bg-light p-3 rounded-4">
                  {["Estética", "Apiñamiento", "Separación entre dientes", "Mordida cruzada", "Mordida abierta", "Mordida profunda", "Dificultad para masticar"].map(opt => (
                    <div className="col-6 col-md-4" key={opt}>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={(formData.consultation_reasons || []).includes(opt)}
                          onChange={() => handleArrayCheckboxChange('consultation_reasons', opt)}
                        />
                        <label className="form-check-label small">{opt}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h6 className="fw-bold text-secondary mb-3">Antecedentes Médicos y Hábitos</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" name="has_allergies" checked={formData.has_allergies} onChange={handleTextChange} />
                    <label className="form-check-label fw-medium">¿Presenta Alergias?</label>
                  </div>
                  {formData.has_allergies && (
                    <input type="text" className="form-control bg-light" name="allergies_detail" placeholder="Especificar alergias..." value={formData.allergies_detail} onChange={handleTextChange} />
                  )}
                </div>

                <div className="col-md-6">
                  <div className="form-check form-switch mb-2">
                    <input className="form-check-input" type="checkbox" name="takes_medications" checked={formData.takes_medications} onChange={handleTextChange} />
                    <label className="form-check-label fw-medium">¿Consume Medicamentos habituales?</label>
                  </div>
                  {formData.takes_medications && (
                    <input type="text" className="form-control bg-light" name="medications_detail" placeholder="Especificar medicamentos..." value={formData.medications_detail} onChange={handleTextChange} />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Hábitos Nocivos Identificados</label>
                <div className="row g-3 bg-light p-3 rounded-4">
                  {["Respiración bucal", "Succión digital", "Deglución atípica", "Onicofagia", "Interposición lingual", "Morder objetos", "Ninguno"].map(h => (
                    <div className="col-6 col-md-4" key={h}>
                      <div className="form-check">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={(formData.habits || []).includes(h)}
                          onChange={() => handleArrayCheckboxChange('habits', h)}
                        />
                        <label className="form-check-label small">{h}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setCurrentStep(2)}>
                  Siguiente: Evaluación Clínica <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: Evaluación Clínica */}
          {currentStep === 2 && (
            <div>
              <h5 className="fw-bold text-primary mb-4">II. Examen Extraoral e Intraoral</h5>

              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Perfil Facial</label>
                  <select className="form-select bg-light" name="profile" value={formData.profile} onChange={handleTextChange}>
                    <option value="Recto">Recto</option>
                    <option value="Convexo">Convexo</option>
                    <option value="Cóncavo">Cóncavo</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Simetría Facial</label>
                  <select className="form-select bg-light" name="facial_symmetry" value={formData.facial_symmetry} onChange={handleTextChange}>
                    <option value="Simétrica">Simétrica</option>
                    <option value="Asimétrica">Asimétrica</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Competencia Labial</label>
                  <select className="form-select bg-light" name="lip_competence" value={formData.lip_competence} onChange={handleTextChange}>
                    <option value="Competente">Competente</option>
                    <option value="Incompetente">Incompetente</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Relación Molar</label>
                  <select className="form-select bg-light" name="molar_relation" value={formData.molar_relation} onChange={handleTextChange}>
                    <option value="Clase I">Clase I</option>
                    <option value="Clase II">Clase II</option>
                    <option value="Clase III">Clase III</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Overjet (Entrecruzamiento H.)</label>
                  <select className="form-select bg-light" name="overjet" value={formData.overjet} onChange={handleTextChange}>
                    <option value="Normal">Normal</option>
                    <option value="Aumentado">Aumentado</option>
                    <option value="Disminuido">Disminuido</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Overbite (Entrecruzamiento V.)</label>
                  <select className="form-select bg-light" name="overbite" value={formData.overbite} onChange={handleTextChange}>
                    <option value="Normal">Normal</option>
                    <option value="Profunda">Profunda</option>
                    <option value="Abierta">Abierta</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Apiñamiento</label>
                  <select className="form-select bg-light" name="crowding" value={formData.crowding} onChange={handleTextChange}>
                    <option value="No presenta">No presenta</option>
                    <option value="Leve">Leve</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Severo">Severo</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Diagnóstico Ortodóncico Definitivo</label>
                <textarea className="form-control bg-light" name="diagnosis" rows="3" placeholder="Descripción del diagnóstico cefalométrico y clínico..." value={formData.diagnosis} onChange={handleTextChange}></textarea>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Plan de Tratamiento Propuesto</label>
                <textarea className="form-control bg-light" name="treatment_plan" rows="3" placeholder="Fases de alineación, nivelación, biomecánica y retención..." value={formData.treatment_plan} onChange={handleTextChange}></textarea>
              </div>

              <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setCurrentStep(1)}>
                  <i className="bi bi-arrow-left me-2"></i> Anterior
                </button>
                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setCurrentStep(3)}>
                  Siguiente: Consentimiento y Firmas <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Consentimiento y Firmas */}
          {currentStep === 3 && (
            <div>
              <h5 className="fw-bold text-primary mb-3">III. Consentimiento Informado Digital de Ortodoncia</h5>

              <div className="bg-light p-4 rounded-4 border mb-4 text-secondary small">
                <h6 className="fw-bold text-dark mb-2">Puntos del Acuerdo Legal del Tratamiento:</h6>
                <ol className="mb-0 ps-3">
                  <li><strong>Objetivo:</strong> Corrección de la posición dental, oclusión y estética facial.</li>
                  <li><strong>Duración:</strong> Estimada en meses de acuerdo al plan clínico acordado.</li>
                  <li><strong>Molestias:</strong> Dolor leve o sensibilidad las primeras 48 horas post-ajuste.</li>
                  <li><strong>Higiene:</strong> Obligación de usar cepillos interdentales y cumplir con la profilaxis.</li>
                  <li><strong>Cuidado de Aparatos:</strong> Evitar alimentos duros o pegajosos que desprendan brackets.</li>
                  <li><strong>Retención:</strong> Uso obligatorio de retenedores al finalizar para evitar recidivas.</li>
                  <li><strong>Responsabilidad:</strong> Asistencia puntual a las citas de control mensual.</li>
                  <li><strong>Autorización:</strong> Toma de fotografías clínicas para seguimiento y expediente.</li>
                </ol>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">Nombre del Paciente / Declarante</label>
                  <input type="text" className="form-control bg-light" name="consent_holder_name" value={formData.consent_holder_name} onChange={handleTextChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">C.I. del Declarante</label>
                  <input type="text" className="form-control bg-light" name="consent_holder_ci" value={formData.consent_holder_ci} onChange={handleTextChange} />
                </div>
              </div>

              {/* Canvas de Firmas Digitales */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <SignaturePadModal 
                    title="Firma Paciente"
                    label="Firma del Paciente / Tutor Legal"
                    initialSignature={formData.patient_signature_url}
                    onSave={(url) => setFormData(prev => ({ ...prev, patient_signature_url: url }))}
                    onClear={() => setFormData(prev => ({ ...prev, patient_signature_url: '' }))}
                  />
                </div>
                <div className="col-md-6">
                  <SignaturePadModal 
                    title="Firma Odontólogo"
                    label="Firma y Sello del Ortodoncista"
                    initialSignature={formData.dentist_signature_url}
                    onSave={(url) => setFormData(prev => ({ ...prev, dentist_signature_url: url }))}
                    onClear={() => setFormData(prev => ({ ...prev, dentist_signature_url: '' }))}
                  />
                </div>
              </div>

              {/* Galería de Imágenes Clínicas Adjuntas */}
              <ClinicalImageGallery 
                images={recordImages}
                onUpload={handleUploadImage}
                onDelete={handleDeleteImage}
                bucketName="radiografias"
              />

              <div className="d-flex justify-content-between mt-4">
                <button type="button" className="btn btn-outline-secondary px-4 fw-bold" onClick={() => setCurrentStep(2)}>
                  <i className="bi bi-arrow-left me-2"></i> Anterior
                </button>
                <button type="button" className="btn btn-success px-5 fw-bold shadow" onClick={handleSubmit} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                  Finalizar y Guardar Expediente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrtodonciaForm;
