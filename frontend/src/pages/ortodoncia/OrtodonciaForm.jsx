import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import PatientSelectorHeader from '../../components/PatientSelectorHeader';
import ClinicalImageGallery from '../../components/ClinicalImageGallery';
import { 
  getOrthodonticRecordById, 
  saveOrthodonticRecord, 
  getOrthodonticImages, 
  uploadOrthodonticImage, 
  deleteOrthodonticImage 
} from '../../services/orthodonticsService';
import { 
  generateOrthodonticPdf, 
  generateOrthodonticConsentPdf 
} from '../../services/specialtyPdfService';
import { getPatientById } from '../../services/patientService';

const OrtodonciaForm = () => {
  const { user, clinic } = useAuth();
  const { id } = useParams(); // ID de expediente o paciente
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recordImages, setRecordImages] = useState([]);

  // Estado completo de la ficha de Ortodoncia
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

    // I. Motivo de consulta y antecedentes ortodóncicos
    consultation_reasons: [],
    consultation_other: '',
    previous_orthodontics: false,
    extractions: false,
    dental_trauma: false,
    bruxism: false,

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

    // Hábitos
    habits: [],
    habits_other: '',

    // II. Examen Extraoral
    profile: 'Recto',
    facial_symmetry: 'Simétrica',
    lip_competence: 'Competente',
    smile_type: 'Media',

    // III. Examen Intraoral
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

    // Diagnóstico, tratamiento y tutor
    diagnosis: '',
    treatment_plan: '',
    observations: '',
    tutor_name: ''
  });

  // Cargar registro existente si viene :id
  useEffect(() => {
    const loadExistingRecord = async () => {
      if (!id || !user?.clinic_id) return;
      try {
        setLoading(true);
        // Intentar buscar por ID de expediente
        let record = await getOrthodonticRecordById(id, user.clinic_id).catch(() => null);
        if (record) {
          setFormData(record);
          const patient = await getPatientById(record.patient_id, user.clinic_id).catch(() => null);
          setSelectedPatient(patient);
          const imgs = await getOrthodonticImages(record.id, user.clinic_id);
          setRecordImages(imgs);
        } else {
          // Si no es expediente, verificar si es ID de paciente
          const patient = await getPatientById(id, user.clinic_id).catch(() => null);
          if (patient) {
            handleSelectPatient(patient, null);
          }
        }
      } catch (err) {
        console.error("Error al cargar expediente de ortodoncia:", err);
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

      // Auto-llenado desde Historia Clínica General si existe
      has_allergies: !!generalHistory?.alergias,
      allergies_detail: generalHistory?.alergias || prev.allergies_detail,
      takes_medications: !!generalHistory?.medicamentos,
      medications_detail: generalHistory?.medicamentos || prev.medications_detail,
      has_surgeries: !!generalHistory?.cirugias,
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
      text: 'Los datos del paciente y sus antecedentes fueron precargados en la ficha.',
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
      let currentList = Array.isArray(prev[category]) ? [...prev[category]] : [];

      if (category === 'systemic_diseases') {
        if (option === 'Ninguna') {
          currentList = currentList.includes('Ninguna') ? [] : ['Ninguna'];
          return { ...prev, systemic_diseases: currentList, systemic_other: '' };
        } else {
          currentList = currentList.filter(item => item !== 'Ninguna');
          if (currentList.includes(option)) {
            currentList = currentList.filter(item => item !== option);
          } else {
            currentList.push(option);
          }
          return { ...prev, systemic_diseases: currentList };
        }
      }

      if (category === 'habits') {
        if (option === 'Ninguno') {
          currentList = currentList.includes('Ninguno') ? [] : ['Ninguno'];
          return { ...prev, habits: currentList, habits_other: '' };
        } else {
          currentList = currentList.filter(item => item !== 'Ninguno');
          if (currentList.includes(option)) {
            currentList = currentList.filter(item => item !== option);
          } else {
            currentList.push(option);
          }
          return { ...prev, habits: currentList };
        }
      }

      // Motivos de consulta
      if (currentList.includes(option)) {
        currentList = currentList.filter(item => item !== option);
      } else {
        currentList.push(option);
      }
      return { ...prev, [category]: currentList };
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
      const savedRecord = await saveOrthodonticRecord({
        ...formData,
        dentist_id: formData.dentist_id || user?.id || null
      }, user.clinic_id);
      setFormData(savedRecord);

      Swal.fire({
        title: '¡Ficha Guardada!',
        text: 'La Ficha de Ortodoncia ha sido almacenada correctamente.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      if (!formData.id) {
        navigate(`/ortodoncia/editar/${savedRecord.id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error guardando ortodoncia:', err);
      Swal.fire('Error', err?.message || 'No se pudo guardar la ficha.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (file, caption) => {
    if (!formData.id) {
      Swal.fire('Guardar Primero', 'Guarda la ficha antes de adjuntar imágenes.', 'info');
      return;
    }
    const newImg = await uploadOrthodonticImage(file, formData.id, formData.patient_id, user.clinic_id, caption);
    setRecordImages(prev => [newImg, ...prev]);
  };

  const handleDeleteImage = async (imageId) => {
    await deleteOrthodonticImage(imageId, user.clinic_id);
    setRecordImages(prev => prev.filter(img => img.id !== imageId));
  };

  // BOTÓN 1: Descargar Historial de Ortodoncia PDF
  const handleExportHistoryPdf = async () => {
    const patient = selectedPatient || (formData.patient_id ? await getPatientById(formData.patient_id, user.clinic_id) : null);
    if (!patient) {
      Swal.fire('Atención', 'Vincula un paciente antes de generar el documento.', 'warning');
      return;
    }
    await generateOrthodonticPdf(formData, patient, clinic);
  };

  // BOTÓN 2: Descargar Consentimiento Informado PDF
  const handleExportConsentPdf = async () => {
    const patient = selectedPatient || (formData.patient_id ? await getPatientById(formData.patient_id, user.clinic_id) : null);
    if (!patient) {
      Swal.fire('Atención', 'Vincula un paciente antes de generar el documento.', 'warning');
      return;
    }
    await generateOrthodonticConsentPdf(patient, clinic, formData.tutor_name);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const consultationOptions = [
    "Estética", 
    "Apiñamiento", 
    "Separación entre dientes", 
    "Mordida cruzada", 
    "Mordida abierta", 
    "Mordida profunda", 
    "Dificultad para masticar", 
    "Otros"
  ];

  const systemicOptions = [
    "Ninguna", 
    "Diabetes", 
    "Hipertensión", 
    "Asma", 
    "Cardiopatía", 
    "Tiroides", 
    "Epilepsia", 
    "Otra"
  ];

  const habitsOptions = [
    "Respiración bucal", 
    "Succión digital", 
    "Deglución atípica", 
    "Onicofagia", 
    "Interposición lingual", 
    "Morder objetos", 
    "Ninguno", 
    "Otros"
  ];

  return (
    <div className="container-fluid p-0 max-w-1200 pb-5">
      {/* Header Principal y Acciones */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div className="d-flex align-items-center">
          <Link to="/ortodoncia" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Ficha de Ortodoncia</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold text-primary">{formData.patient_name || 'Sin seleccionar'}</span></p>
          </div>
        </div>

        {/* Botones de Acción Superiores */}
        <div className="d-flex flex-wrap gap-2">
          <button 
            type="button" 
            onClick={handleExportHistoryPdf} 
            className="btn btn-outline-primary fw-bold shadow-sm"
            title="Descargar Historial de Ortodoncia PDF"
          >
            <i className="bi bi-file-earmark-medical me-1 text-primary"></i> Descargar Historial PDF
          </button>
          <button 
            type="button" 
            onClick={handleExportConsentPdf} 
            className="btn btn-outline-danger fw-bold shadow-sm"
            title="Descargar Consentimiento Informado PDF"
          >
            <i className="bi bi-file-earmark-check me-1 text-danger"></i> Descargar Consentimiento PDF
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="btn btn-success fw-bold shadow-sm px-4" 
            disabled={saving}
          >
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
            Guardar Ficha
          </button>
        </div>
      </div>

      {/* 1. Vinculación del Paciente con Búsqueda en Tiempo Real */}
      <PatientSelectorHeader 
        selectedPatient={selectedPatient} 
        onSelectPatient={handleSelectPatient}
        moduleName="Ortodoncia"
      />

      {/* FORMULARIO DE ORTODONCIA */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-body p-4 p-md-5 bg-white">
          
          {/* I. MOTIVO DE CONSULTA Y ANTECEDENTES ORTODÓNCICOS */}
          <div className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-primary rounded-circle p-2 me-2">
                <i className="bi bi-chat-square-text-fill"></i>
              </span>
              <h5 className="fw-bold text-primary mb-0">I. Motivo de Consulta y Antecedentes Ortodóncicos</h5>
            </div>

            {/* Motivos principales de consulta */}
            <div className="bg-light p-4 rounded-4 border mb-4">
              <label className="form-label text-dark fw-bold small mb-2">Motivos principales de consulta:</label>
              <div className="row g-3">
                {consultationOptions.map(opt => (
                  <div className="col-6 col-md-4 col-lg-3" key={opt}>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`reason_${opt}`}
                        checked={(formData.consultation_reasons || []).includes(opt)}
                        onChange={() => handleArrayCheckboxChange('consultation_reasons', opt)}
                      />
                      <label className="form-check-label small fw-medium" htmlFor={`reason_${opt}`}>{opt}</label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campo de texto cuando se selecciona "Otros" */}
              {(formData.consultation_reasons || []).includes('Otros') && (
                <div className="mt-3 pt-3 border-top">
                  <label className="form-label text-muted fw-semibold small">Especificar otro motivo de consulta:</label>
                  <input 
                    type="text" 
                    className="form-control bg-white" 
                    name="consultation_other" 
                    placeholder="Describa el motivo de consulta..." 
                    value={formData.consultation_other || ''} 
                    onChange={handleTextChange} 
                  />
                </div>
              )}
            </div>

            {/* Antecedentes ortodóncicos específicos */}
            <div className="bg-light p-4 rounded-4 border">
              <label className="form-label text-dark fw-bold small mb-2">Antecedentes ortodóncicos previos:</label>
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="prev_ortho"
                      name="previous_orthodontics" 
                      checked={!!formData.previous_orthodontics} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label small fw-medium" htmlFor="prev_ortho">Tratamiento ortodóncico previo</label>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="prev_ext"
                      name="extractions" 
                      checked={!!formData.extractions} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label small fw-medium" htmlFor="prev_ext">Extracciones previas</label>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="prev_trauma"
                      name="dental_trauma" 
                      checked={!!formData.dental_trauma} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label small fw-medium" htmlFor="prev_trauma">Traumatismo dental</label>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="prev_bruxism"
                      name="bruxism" 
                      checked={!!formData.bruxism} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label small fw-medium" htmlFor="prev_bruxism">Bruxismo</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-5 text-muted opacity-25" />

          {/* ANTECEDENTES MÉDICOS Y HÁBITOS */}
          <div className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-danger rounded-circle p-2 me-2">
                <i className="bi bi-heart-pulse-fill"></i>
              </span>
              <h5 className="fw-bold text-danger mb-0">Antecedentes Médicos y Hábitos</h5>
            </div>

            {/* Enfermedades Sistémicas */}
            <div className="bg-light p-4 rounded-4 border mb-4">
              <label className="form-label text-dark fw-bold small mb-2">Enfermedades Sistémicas:</label>
              <div className="row g-3">
                {systemicOptions.map(opt => (
                  <div className="col-6 col-md-4 col-lg-3" key={opt}>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`sys_${opt}`}
                        checked={(formData.systemic_diseases || []).includes(opt)}
                        onChange={() => handleArrayCheckboxChange('systemic_diseases', opt)}
                      />
                      <label className="form-check-label small fw-medium" htmlFor={`sys_${opt}`}>{opt}</label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campo cuando selecciona "Otra" */}
              {(formData.systemic_diseases || []).includes('Otra') && (
                <div className="mt-3 pt-3 border-top">
                  <label className="form-label text-muted fw-semibold small">Especificar otra enfermedad sistémica:</label>
                  <input 
                    type="text" 
                    className="form-control bg-white" 
                    name="systemic_other" 
                    placeholder="Describa la condición o enfermedad..." 
                    value={formData.systemic_other || ''} 
                    onChange={handleTextChange} 
                  />
                </div>
              )}
            </div>

            {/* Alergias, Medicamentos, Cirugías, Hospitalizaciones */}
            <div className="row g-4 mb-4">
              {/* Alergias */}
              <div className="col-md-6">
                <div className="card h-100 border rounded-4 p-3 bg-light">
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switch_allergies"
                      name="has_allergies" 
                      checked={!!formData.has_allergies} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="switch_allergies">
                      ¿Presenta Alergias?
                    </label>
                  </div>
                  {formData.has_allergies && (
                    <input 
                      type="text" 
                      className="form-control bg-white mt-2" 
                      name="allergies_detail" 
                      placeholder="Especificar alergias a medicamentos, látex, etc..." 
                      value={formData.allergies_detail || ''} 
                      onChange={handleTextChange} 
                    />
                  )}
                </div>
              </div>

              {/* Medicamentos */}
              <div className="col-md-6">
                <div className="card h-100 border rounded-4 p-3 bg-light">
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switch_meds"
                      name="takes_medications" 
                      checked={!!formData.takes_medications} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="switch_meds">
                      ¿Consume Medicamentos habituales?
                    </label>
                  </div>
                  {formData.takes_medications && (
                    <input 
                      type="text" 
                      className="form-control bg-white mt-2" 
                      name="medications_detail" 
                      placeholder="Especificar medicamentos y dosis..." 
                      value={formData.medications_detail || ''} 
                      onChange={handleTextChange} 
                    />
                  )}
                </div>
              </div>

              {/* Cirugías */}
              <div className="col-md-6">
                <div className="card h-100 border rounded-4 p-3 bg-light">
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switch_surgeries"
                      name="has_surgeries" 
                      checked={!!formData.has_surgeries} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="switch_surgeries">
                      Cirugías
                    </label>
                  </div>
                  {formData.has_surgeries && (
                    <input 
                      type="text" 
                      className="form-control bg-white mt-2" 
                      name="surgeries_detail" 
                      placeholder="Indicar qué cirugía o cirugías tuvo el paciente..." 
                      value={formData.surgeries_detail || ''} 
                      onChange={handleTextChange} 
                    />
                  )}
                </div>
              </div>

              {/* Hospitalizaciones */}
              <div className="col-md-6">
                <div className="card h-100 border rounded-4 p-3 bg-light">
                  <div className="form-check form-switch mb-2">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="switch_hosp"
                      name="has_hospitalizations" 
                      checked={!!formData.has_hospitalizations} 
                      onChange={handleTextChange} 
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="switch_hosp">
                      Hospitalizaciones
                    </label>
                  </div>
                  {formData.has_hospitalizations && (
                    <input 
                      type="text" 
                      className="form-control bg-white mt-2" 
                      name="hospitalizations_detail" 
                      placeholder="Indicar el motivo o detalles de la hospitalización..." 
                      value={formData.hospitalizations_detail || ''} 
                      onChange={handleTextChange} 
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Hábitos Nocivos Identificados */}
            <div className="bg-light p-4 rounded-4 border">
              <label className="form-label text-dark fw-bold small mb-2">Hábitos Nocivos Identificados:</label>
              <div className="row g-3">
                {habitsOptions.map(h => (
                  <div className="col-6 col-md-4 col-lg-3" key={h}>
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`habit_${h}`}
                        checked={(formData.habits || []).includes(h)}
                        onChange={() => handleArrayCheckboxChange('habits', h)}
                      />
                      <label className="form-check-label small fw-medium" htmlFor={`habit_${h}`}>{h}</label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Campo cuando selecciona "Otros" */}
              {(formData.habits || []).includes('Otros') && (
                <div className="mt-3 pt-3 border-top">
                  <label className="form-label text-muted fw-semibold small">Especificar otro hábito:</label>
                  <input 
                    type="text" 
                    className="form-control bg-white" 
                    name="habits_other" 
                    placeholder="Describa el hábito nocivo..." 
                    value={formData.habits_other || ''} 
                    onChange={handleTextChange} 
                  />
                </div>
              )}
            </div>
          </div>

          <hr className="my-5 text-muted opacity-25" />

          {/* II. EXAMEN EXTRAORAL */}
          <div className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-info rounded-circle p-2 me-2 text-dark">
                <i className="bi bi-person-bounding-box"></i>
              </span>
              <h5 className="fw-bold text-info text-dark mb-0">II. Examen Extraoral</h5>
            </div>

            <div className="row g-3 bg-light p-4 rounded-4 border">
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Perfil Facial</label>
                <select className="form-select bg-white" name="profile" value={formData.profile || 'Recto'} onChange={handleTextChange}>
                  <option value="Recto">Recto</option>
                  <option value="Convexo">Convexo</option>
                  <option value="Cóncavo">Cóncavo</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Simetría Facial</label>
                <select className="form-select bg-white" name="facial_symmetry" value={formData.facial_symmetry || 'Simétrica'} onChange={handleTextChange}>
                  <option value="Simétrica">Simétrica</option>
                  <option value="Asimétrica">Asimétrica</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Competencia Labial</label>
                <select className="form-select bg-white" name="lip_competence" value={formData.lip_competence || 'Competente'} onChange={handleTextChange}>
                  <option value="Competente">Competente</option>
                  <option value="Incompetente">Incompetente</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Tipo de Sonrisa</label>
                <select className="form-select bg-white" name="smile_type" value={formData.smile_type || 'Media'} onChange={handleTextChange}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="my-5 text-muted opacity-25" />

          {/* III. EXAMEN INTRAORAL */}
          <div className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-warning rounded-circle p-2 me-2 text-dark">
                <i className="bi bi-grid-3x3-gap-fill"></i>
              </span>
              <h5 className="fw-bold text-dark mb-0">III. Examen Intraoral</h5>
            </div>

            <div className="row g-4 bg-light p-4 rounded-4 border">
              {/* Higiene Oral */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Higiene Oral</label>
                <select className="form-select bg-white" name="oral_hygiene" value={formData.oral_hygiene || 'Buena'} onChange={handleTextChange}>
                  <option value="Buena">Buena</option>
                  <option value="Regular">Regular</option>
                  <option value="Mala">Mala</option>
                </select>
              </div>

              {/* Estado Periodontal */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Estado Periodontal</label>
                <select className="form-select bg-white" name="periodontal_status" value={formData.periodontal_status || 'Sano'} onChange={handleTextChange}>
                  <option value="Sano">Sano</option>
                  <option value="Gingivitis">Gingivitis</option>
                  <option value="Periodontitis">Periodontitis</option>
                </select>
              </div>

              {/* Relación Molar */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Relación Molar</label>
                <select className="form-select bg-white" name="molar_relation" value={formData.molar_relation || 'Clase I'} onChange={handleTextChange}>
                  <option value="Clase I">Clase I</option>
                  <option value="Clase II">Clase II</option>
                  <option value="Clase III">Clase III</option>
                </select>
              </div>

              {/* Relación Canina */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Relación Canina</label>
                <select className="form-select bg-white" name="canine_relation" value={formData.canine_relation || 'Clase I'} onChange={handleTextChange}>
                  <option value="Clase I">Clase I</option>
                  <option value="Clase II">Clase II</option>
                  <option value="Clase III">Clase III</option>
                </select>
              </div>

              {/* Overjet */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Overjet</label>
                <select className="form-select bg-white" name="overjet" value={formData.overjet || 'Normal'} onChange={handleTextChange}>
                  <option value="Normal">Normal</option>
                  <option value="Aumentado">Aumentado</option>
                  <option value="Disminuido">Disminuido</option>
                </select>
              </div>

              {/* Overbite */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Overbite</label>
                <select className="form-select bg-white" name="overbite" value={formData.overbite || 'Normal'} onChange={handleTextChange}>
                  <option value="Normal">Normal</option>
                  <option value="Profunda">Profunda</option>
                  <option value="Abierta">Abierta</option>
                </select>
              </div>

              {/* Línea Media */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Línea Media</label>
                <select className="form-select bg-white" name="midline" value={formData.midline || 'Coincidente'} onChange={handleTextChange}>
                  <option value="Coincidente">Coincidente</option>
                  <option value="Desviada">Desviada</option>
                </select>
              </div>

              {/* Apiñamiento */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Apiñamiento</label>
                <select className="form-select bg-white" name="crowding" value={formData.crowding || 'Leve'} onChange={handleTextChange}>
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Severo">Severo</option>
                  <option value="No presenta">No presenta</option>
                </select>
              </div>

              {/* Diastemas */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Diastemas</label>
                <select 
                  className="form-select bg-white" 
                  name="has_diastemas" 
                  value={formData.has_diastemas ? 'true' : 'false'} 
                  onChange={(e) => setFormData(prev => ({ ...prev, has_diastemas: e.target.value === 'true' }))}
                >
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </div>

              {/* Mordida Cruzada */}
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Mordida Cruzada</label>
                <select className="form-select bg-white" name="crossbite" value={formData.crossbite || 'No'} onChange={handleTextChange}>
                  <option value="No">No</option>
                  <option value="Anterior">Anterior</option>
                  <option value="Posterior">Posterior</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="my-5 text-muted opacity-25" />

          {/* DIAGNÓSTICO Y PLAN DE TRATAMIENTO */}
          <div className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-secondary rounded-circle p-2 me-2">
                <i className="bi bi-clipboard2-check-fill"></i>
              </span>
              <h5 className="fw-bold text-dark mb-0">Diagnóstico, Plan de Tratamiento y Observaciones</h5>
            </div>

            <div className="row g-4">
              <div className="col-12">
                <label className="form-label text-muted fw-semibold small">Diagnóstico Ortodóncico</label>
                <textarea 
                  className="form-control bg-light" 
                  name="diagnosis" 
                  rows="3" 
                  placeholder="Diagnóstico clínico, esquelético y dental..." 
                  value={formData.diagnosis || ''} 
                  onChange={handleTextChange}
                ></textarea>
              </div>

              <div className="col-12">
                <label className="form-label text-muted fw-semibold small">Plan de Tratamiento</label>
                <textarea 
                  className="form-control bg-light" 
                  name="treatment_plan" 
                  rows="3" 
                  placeholder="Secuencia mecánica, aparatología, fases del tratamiento y retención..." 
                  value={formData.treatment_plan || ''} 
                  onChange={handleTextChange}
                ></textarea>
              </div>

              <div className="col-md-8">
                <label className="form-label text-muted fw-semibold small">Observaciones adicionales</label>
                <input 
                  type="text" 
                  className="form-control bg-light" 
                  name="observations" 
                  placeholder="Notas adicionales sobre el caso clínico..." 
                  value={formData.observations || ''} 
                  onChange={handleTextChange} 
                />
              </div>

              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Nombre del Tutor (si aplica para Consentimiento)</label>
                <input 
                  type="text" 
                  className="form-control bg-light" 
                  name="tutor_name" 
                  placeholder="Nombre del padre, madre o tutor..." 
                  value={formData.tutor_name || ''} 
                  onChange={handleTextChange} 
                />
              </div>
            </div>
          </div>

          <hr className="my-5 text-muted opacity-25" />

          {/* GALERÍA DE IMÁGENES CLÍNICAS */}
          <div className="mb-5">
            <ClinicalImageGallery 
              images={recordImages}
              onUpload={handleUploadImage}
              onDelete={handleDeleteImage}
              bucketName="radiografias"
              title="Fotografías Clínicas, Panorámicas y Modelos de Estudio"
            />
          </div>

          {/* SECCIÓN DE DOCUMENTOS Y DESCARGA PDF */}
          <div className="card border-0 bg-light rounded-4 p-4 p-md-5 border-start border-primary border-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-file-earmark-pdf-fill text-danger me-2"></i>
                  Documentos y Exportación PDF
                </h5>
                <p className="text-muted small mb-0">
                  Genera e imprime los dos documentos oficiales e independientes de Ortodoncia en formato vectorial:
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button 
                  type="button" 
                  onClick={handleExportHistoryPdf} 
                  className="btn btn-primary fw-bold shadow-sm"
                >
                  <i className="bi bi-file-earmark-medical me-1"></i> Descargar Historial de Ortodoncia PDF
                </button>
                <button 
                  type="button" 
                  onClick={handleExportConsentPdf} 
                  className="btn btn-danger fw-bold shadow-sm"
                >
                  <i className="bi bi-file-earmark-check me-1"></i> Descargar Consentimiento Informado PDF
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrtodonciaForm;
