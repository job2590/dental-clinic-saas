import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import PatientSelectorHeader from '../../components/PatientSelectorHeader';
import SignaturePadModal from '../../components/SignaturePadModal';
import ClinicalImageGallery from '../../components/ClinicalImageGallery';
import {
  getOralSurgeryRecordByPatient,
  saveOralSurgeryRecord,
  getOralSurgeryFollowups,
  addOralSurgeryFollowup,
  getOralSurgeryImages,
  uploadOralSurgeryImage,
  deleteOralSurgeryImage
} from '../../services/oralSurgeryService';
import {
  generateOralSurgeryHistoryPdf,
  generateOralSurgeryConsentPdf
} from '../../services/specialtyPdfService';
import { getPatientById } from '../../services/patientService';

const CirugiaOralPage = () => {
  const { user, clinic } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('historia');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [images, setImages] = useState([]);
  const [newFollowup, setNewFollowup] = useState({
    control_date: new Date().toISOString().split('T')[0],
    findings: ''
  });

  const [record, setRecord] = useState({
    id: null, patient_id: '', patient_name: '',
    age: '', gender: 'Femenino', birth_date: '', ci: '', address: '', phone: '', occupation: '',
    consultation_date: new Date().toISOString().split('T')[0],
    consultation_reason: '',
    current_illness: '',
    has_diabetes: false, has_hypertension: false, has_heart_disease: false,
    has_kidney_disease: false, has_liver_disease: false, has_coagulation_disorder: false,
    has_asthma: false, has_epilepsy: false, is_pregnant: false,
    allergies_detail: '', medications_detail: '', previous_surgeries: '', medical_other: '',
    dental_history_notes: '',
    smokes: false, drinks_alcohol: false, habits_other: '',
    facial_symmetry: 'Simétrico', mouth_opening: 'Normal', lymph_nodes: 'No palpables',
    tmj_status: 'Sin alteraciones', extraoral_other_findings: '',
    oral_mucosa: 'Normal', gums: 'Sanos', teeth_involved: '', oral_hygiene: 'Regular',
    lesions: '', intraoral_other_findings: '',
    complementary_exams: [], complementary_exams_other: '',
    diagnosis: '', treatment_plan: '',
    surgery_type: '', anesthesia_used: 'Local (Lidocaína 2%)', surgical_technique: '',
    operative_findings: '', suture: 'Seda 3-0', medication_prescribed: '',
    postoperative_instructions: 'Reposo 24h, hielo local, dieta blanda y fría, no enjuagues fuertes.',
    history_patient_signature_url: '', history_dentist_signature_url: '',
    consent_given: true, consent_procedure: '', consent_holder_ci: '',
    consent_date: new Date().toISOString().split('T')[0],
    consent_patient_signature_url: '', consent_dentist_signature_url: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user?.clinic_id) return;
      try {
        setLoading(true);
        const patient = await getPatientById(id, user.clinic_id).catch(() => null);
        if (patient) {
          setSelectedPatient(patient);
          const existing = await getOralSurgeryRecordByPatient(patient.id, user.clinic_id);
          if (existing) {
            setRecord(existing);
            const fu = await getOralSurgeryFollowups(existing.id, user.clinic_id);
            setFollowups(fu);
            const imgs = await getOralSurgeryImages(existing.id, user.clinic_id);
            setImages(imgs);
          } else {
            setRecord(prev => ({
              ...prev, patient_id: patient.id,
              patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
              ci: patient.ci || '', address: patient.direccion || '',
              phone: patient.celular || '', age: patient.edad || ''
            }));
          }
        } else {
          // viene por id de expediente directamente
          // Buscar por id del record
          const { data: rec } = await supabase
            .from('oral_surgery_records').select('*').eq('id', id).eq('clinic_id', user.clinic_id).single();

          if (rec) {
            setRecord(rec);
            const p = await getPatientById(rec.patient_id, user.clinic_id).catch(() => null);
            setSelectedPatient(p);
            const fu = await getOralSurgeryFollowups(rec.id, user.clinic_id);
            setFollowups(fu);
            const imgs = await getOralSurgeryImages(rec.id, user.clinic_id);
            setImages(imgs);
          }
        }
      } catch (err) {
        console.error('Error cargando expediente de cirugía:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user?.clinic_id]);

  const handleSelectPatient = (patient, generalHistory) => {
    setSelectedPatient(patient);
    if (!patient) {
      setRecord(prev => ({ ...prev, patient_id: '', patient_name: '' }));
      return;
    }

    setRecord(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      ci: patient.ci || prev.ci,
      address: patient.direccion || prev.address,
      phone: patient.celular || prev.phone,
      age: patient.edad || prev.age,
      gender: patient.sexo || prev.gender,
      birth_date: patient.fecha_nacimiento || prev.birth_date,
      occupation: patient.ocupacion || prev.occupation,
      consent_holder_ci: patient.ci || '',
      // Auto-llenado desde Historia Clínica General
      has_diabetes: generalHistory?.diabetes || false,
      has_hypertension: generalHistory?.hipertension || false,
      has_asthma: generalHistory?.respiratorias || false,
      has_heart_disease: generalHistory?.cardiacas || false,
      allergies_detail: generalHistory?.alergias || prev.allergies_detail,
      medications_detail: generalHistory?.medicamentos || prev.medications_detail,
      previous_surgeries: generalHistory?.cirugias || prev.previous_surgeries,
    }));

    Swal.fire({ title: '¡Paciente Vinculado!', text: 'Datos y antecedentes precargados desde su ficha clínica.', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecord(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!record.patient_id) {
      Swal.fire('Atención', 'Vincula un paciente primero.', 'warning');
      return;
    }
    try {
      setSaving(true);
      const saved = await saveOralSurgeryRecord(record, user.clinic_id);
      setRecord(saved);
      Swal.fire({ title: '¡Expediente Guardado!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el expediente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!record.id) {
      Swal.fire('Guarda Primero', 'Debes guardar la historia clínica antes de añadir controles.', 'info');
      return;
    }
    try {
      const added = await addOralSurgeryFollowup({
        ...newFollowup,
        oral_surgery_record_id: record.id,
        patient_id: record.patient_id,
        control_number: followups.length + 1
      }, user.clinic_id);
      setFollowups(prev => [...prev, added]);
      setNewFollowup({ control_date: new Date().toISOString().split('T')[0], findings: '' });
      Swal.fire({ title: '¡Control Añadido!', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el control.', 'error');
    }
  };

  const handleUploadImage = async (file, caption) => {
    if (!record.id) {
      Swal.fire('Guarda Primero', 'Guarda el expediente antes de subir imágenes.', 'info');
      return;
    }
    const img = await uploadOralSurgeryImage(file, record.id, record.patient_id, user.clinic_id, caption);
    setImages(prev => [img, ...prev]);
  };

  const handleDeleteImage = async (imgId) => {
    await deleteOralSurgeryImage(imgId, user.clinic_id);
    setImages(prev => prev.filter(i => i.id !== imgId));
  };

  const handleExportHistoryPdf = async () => {
    const p = selectedPatient || (record.patient_id ? await getPatientById(record.patient_id, user.clinic_id) : null);
    await generateOralSurgeryHistoryPdf(record, followups, p, clinic);
  };

  const handleExportConsentPdf = async () => {
    const p = selectedPatient || (record.patient_id ? await getPatientById(record.patient_id, user.clinic_id) : null);
    await generateOralSurgeryConsentPdf(record, p, clinic);
  };

  const tabButtonClass = (tab) =>
    `nav-link py-3 fw-semibold rounded-0 ${activeTab === tab ? 'active bg-primary text-white' : 'text-muted'}`;

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;

  const medicalConditions = [
    { name: 'has_diabetes', label: 'Diabetes' },
    { name: 'has_hypertension', label: 'Hipertensión' },
    { name: 'has_heart_disease', label: 'Cardiopatía' },
    { name: 'has_kidney_disease', label: 'Nefropatía' },
    { name: 'has_liver_disease', label: 'Hepatopatía' },
    { name: 'has_coagulation_disorder', label: 'Trastorno coagulación' },
    { name: 'has_asthma', label: 'Asma' },
    { name: 'has_epilepsy', label: 'Epilepsia' },
    { name: 'is_pregnant', label: 'Embarazo' },
    { name: 'smokes', label: 'Fumador/a' },
    { name: 'drinks_alcohol', label: 'Consume Alcohol' },
  ];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Link to="/cirugia-oral" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Expediente de Cirugía Oral</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold text-primary">{record.patient_name || 'Sin seleccionar'}</span></p>
          </div>
        </div>
        <button type="button" onClick={handleSave} className="btn btn-primary fw-bold shadow-sm" disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
          Guardar Expediente
        </button>
      </div>

      <PatientSelectorHeader selectedPatient={selectedPatient} onSelectPatient={handleSelectPatient} moduleName="Cirugía Oral" />

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-light p-0 border-0">
          <ul className="nav nav-pills nav-fill">
            {[
              { key: 'historia', icon: 'bi-file-earmark-medical', label: 'Historia Clínica' },
              { key: 'consentimiento', icon: 'bi-file-earmark-check', label: 'Consentimiento' },
              { key: 'controles', icon: 'bi-clipboard2-pulse', label: 'Controles Post-Op.' },
              { key: 'imagenes', icon: 'bi-images', label: 'Imágenes' }
            ].map(t => (
              <li key={t.key} className="nav-item">
                <button type="button" className={tabButtonClass(t.key)} onClick={() => setActiveTab(t.key)}>
                  <i className={`bi ${t.icon} me-1 d-none d-md-inline`}></i> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body p-4 bg-white">
          {/* TAB: HISTORIA CLÍNICA — 13 secciones en acordeón */}
          {activeTab === 'historia' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">Historia Clínica de Cirugía Oral</h5>
                <button type="button" onClick={handleExportHistoryPdf} className="btn btn-sm btn-outline-danger fw-bold">
                  <i className="bi bi-file-pdf me-1"></i> Descargar PDF
                </button>
              </div>

              <div className="accordion accordion-flush" id="surgeryHistoryAccordion">

                {/* I. MOTIVO DE CONSULTA */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secI">
                      <i className="bi bi-chat-left-text me-2 text-primary"></i> I. Motivo de Consulta y Enfermedad Actual
                    </button>
                  </h2>
                  <div id="secI" className="accordion-collapse collapse show" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted fw-semibold small">Motivo Principal de Consulta</label>
                          <input type="text" className="form-control bg-light" name="consultation_reason" value={record.consultation_reason} onChange={handleChange} placeholder="Ej: Extracción de tercer molar" />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted fw-semibold small">Tipo de Cirugía a Realizar</label>
                          <select className="form-select bg-light" name="surgery_type" value={record.surgery_type} onChange={handleChange}>
                            <option value="">Seleccionar...</option>
                            <option value="Extracción simple">Extracción simple</option>
                            <option value="Extracción compleja">Extracción compleja</option>
                            <option value="Odontectomía (muela del juicio)">Odontectomía (muela del juicio)</option>
                            <option value="Apicectomía">Apicectomía</option>
                            <option value="Frenectomía">Frenectomía</option>
                            <option value="Biopsia oral">Biopsia oral</option>
                            <option value="Cirugía periodontal">Cirugía periodontal</option>
                            <option value="Exéresis de quiste / tumor">Exéresis de quiste / tumor</option>
                            <option value="Implante dental">Implante dental</option>
                            <option value="Otra">Otra</option>
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label text-muted fw-semibold small">Descripción de la Enfermedad Actual</label>
                          <textarea className="form-control bg-light" name="current_illness" rows="2" value={record.current_illness} onChange={handleChange} placeholder="Tiempo de evolución, síntomas, tratamientos previos..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* II. ANTECEDENTES MÉDICOS */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secII">
                      <i className="bi bi-heart-pulse me-2 text-danger"></i> II. Antecedentes Patológicos Personales (Precargados de Historia Clínica)
                    </button>
                  </h2>
                  <div id="secII" className="accordion-collapse collapse" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3 mb-3">
                        {medicalConditions.map(mc => (
                          <div className="col-6 col-md-4 col-lg-3" key={mc.name}>
                            <div className="form-check form-switch">
                              <input className="form-check-input" type="checkbox" name={mc.name} checked={!!record[mc.name]} onChange={handleChange} />
                              <label className="form-check-label small fw-medium">{mc.label}</label>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Alergias Conocidas</label>
                          <input type="text" className="form-control bg-light" name="allergies_detail" value={record.allergies_detail} onChange={handleChange} placeholder="Medicamentos, látex, anestésicos..." />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Medicación Habitual</label>
                          <input type="text" className="form-control bg-light" name="medications_detail" value={record.medications_detail} onChange={handleChange} placeholder="Anticoagulantes, antihipertensivos..." />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-muted small fw-semibold">Cirugías Anteriores</label>
                          <input type="text" className="form-control bg-light" name="previous_surgeries" value={record.previous_surgeries} onChange={handleChange} placeholder="Tipo, año, complicaciones..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* III. EXAMEN EXTRAORAL */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secIII">
                      <i className="bi bi-person-fill-check me-2 text-info"></i> III. Examen Clínico Extraoral
                    </button>
                  </h2>
                  <div id="secIII" className="accordion-collapse collapse" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3">
                        <div className="col-md-3">
                          <label className="form-label text-muted small fw-semibold">Simetría Facial</label>
                          <select className="form-select bg-light" name="facial_symmetry" value={record.facial_symmetry} onChange={handleChange}>
                            <option value="Simétrico">Simétrico</option>
                            <option value="Asimétrico">Asimétrico</option>
                            <option value="Asimétrico izquierdo">Asimétrico izquierdo</option>
                            <option value="Asimétrico derecho">Asimétrico derecho</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label text-muted small fw-semibold">Apertura Bucal</label>
                          <select className="form-select bg-light" name="mouth_opening" value={record.mouth_opening} onChange={handleChange}>
                            <option value="Normal (>35mm)">Normal (&gt;35mm)</option>
                            <option value="Limitada (20-35mm)">Limitada (20-35mm)</option>
                            <option value="Muy limitada (<20mm)">Muy limitada (&lt;20mm)</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label text-muted small fw-semibold">Ganglios Linfáticos</label>
                          <select className="form-select bg-light" name="lymph_nodes" value={record.lymph_nodes} onChange={handleChange}>
                            <option value="No palpables">No palpables</option>
                            <option value="Palpables dolorosos">Palpables dolorosos</option>
                            <option value="Palpables no dolorosos">Palpables no dolorosos</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="form-label text-muted small fw-semibold">ATM</label>
                          <select className="form-select bg-light" name="tmj_status" value={record.tmj_status} onChange={handleChange}>
                            <option value="Sin alteraciones">Sin alteraciones</option>
                            <option value="Ruidos articulares">Ruidos articulares</option>
                            <option value="Dolor a la palpación">Dolor a la palpación</option>
                            <option value="Disfunción severa">Disfunción severa</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IV. EXAMEN INTRAORAL */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secIV">
                      <i className="bi bi-clipboard2-pulse me-2 text-warning"></i> IV. Examen Intraoral y Piezas Involucradas
                    </button>
                  </h2>
                  <div id="secIV" className="accordion-collapse collapse" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Higiene Oral</label>
                          <select className="form-select bg-light" name="oral_hygiene" value={record.oral_hygiene} onChange={handleChange}>
                            <option value="Buena">Buena</option>
                            <option value="Regular">Regular</option>
                            <option value="Deficiente">Deficiente</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Encías</label>
                          <select className="form-select bg-light" name="gums" value={record.gums} onChange={handleChange}>
                            <option value="Sanos">Sanos</option>
                            <option value="Gingivitis">Gingivitis</option>
                            <option value="Periodontitis leve">Periodontitis leve</option>
                            <option value="Periodontitis severa">Periodontitis severa</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Pieza(s) Dental(es) Involucradas</label>
                          <input type="text" className="form-control bg-light" name="teeth_involved" value={record.teeth_involved} onChange={handleChange} placeholder="Ej: 3.8 (juicio inferior izquierdo)" />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-muted small fw-semibold">Hallazgos / Lesiones Relevantes</label>
                          <textarea className="form-control bg-light" name="lesions" rows="2" value={record.lesions} onChange={handleChange} placeholder="Abscesos, quistes, fracturas, tejido de granulación..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* V. DIAGNÓSTICO Y PLAN */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secV">
                      <i className="bi bi-lightbulb me-2 text-success"></i> V. Diagnóstico y Plan de Tratamiento
                    </button>
                  </h2>
                  <div id="secV" className="accordion-collapse collapse" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Diagnóstico Definitivo</label>
                          <textarea className="form-control bg-light" name="diagnosis" rows="3" value={record.diagnosis} onChange={handleChange} placeholder="Diagnóstico clínico y radiográfico..." />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Plan Quirúrgico</label>
                          <textarea className="form-control bg-light" name="treatment_plan" rows="3" value={record.treatment_plan} onChange={handleChange} placeholder="Protocolo, secuencia, consideraciones especiales..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VI. PROCEDIMIENTO QUIRÚRGICO */}
                <div className="accordion-item rounded-4 mb-2 border shadow-sm overflow-hidden">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#secVI">
                      <i className="bi bi-scissors me-2 text-danger"></i> VI. Procedimiento Quirúrgico y Sutura
                    </button>
                  </h2>
                  <div id="secVI" className="accordion-collapse collapse" data-bs-parent="#surgeryHistoryAccordion">
                    <div className="accordion-body">
                      <div className="row g-3">
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Anestesia Utilizada</label>
                          <select className="form-select bg-light" name="anesthesia_used" value={record.anesthesia_used} onChange={handleChange}>
                            <option value="Local (Lidocaína 2%)">Local (Lidocaína 2%)</option>
                            <option value="Local (Articaína 4%)">Local (Articaína 4%)</option>
                            <option value="Local + Sedación IV">Local + Sedación IV</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Tipo de Sutura</label>
                          <select className="form-select bg-light" name="suture" value={record.suture} onChange={handleChange}>
                            <option value="Seda 3-0">Seda 3-0</option>
                            <option value="Vicryl 3-0">Vicryl 3-0 (reabsorbible)</option>
                            <option value="Nylon 4-0">Nylon 4-0</option>
                            <option value="Sin sutura">Sin sutura</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label text-muted small fw-semibold">Técnica Quirúrgica</label>
                          <input type="text" className="form-control bg-light" name="surgical_technique" value={record.surgical_technique} onChange={handleChange} placeholder="Ej: Colgajo mucoperióstico, ostectomía, odontosección..." />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Hallazgos Intraoperatorios</label>
                          <textarea className="form-control bg-light" name="operative_findings" rows="2" value={record.operative_findings} onChange={handleChange} placeholder="Tejido de granulación, quiste, raíces anquilosadas..." />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label text-muted small fw-semibold">Medicación Prescrita</label>
                          <textarea className="form-control bg-light" name="medication_prescribed" rows="2" value={record.medication_prescribed} onChange={handleChange} placeholder="Antibiótico, AINE, analgésico + dosis..." />
                        </div>
                        <div className="col-12">
                          <label className="form-label text-muted small fw-semibold">Indicaciones Postoperatorias</label>
                          <textarea className="form-control bg-light" name="postoperative_instructions" rows="2" value={record.postoperative_instructions} onChange={handleChange} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Firmas de la Historia Clínica */}
              <h6 className="fw-bold text-secondary mb-3 mt-4">Firmas del Cirujano y del Paciente — Historia Clínica</h6>
              <div className="row g-4">
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma del Paciente / Declarante"
                    initialSignature={record.history_patient_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, history_patient_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, history_patient_signature_url: '' }))}
                  />
                </div>
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma y Sello del Cirujano Bucomaxilofacial"
                    initialSignature={record.history_dentist_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, history_dentist_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, history_dentist_signature_url: '' }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONSENTIMIENTO */}
          {activeTab === 'consentimiento' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">Consentimiento Informado para Intervención Quirúrgica</h5>
                <button type="button" onClick={handleExportConsentPdf} className="btn btn-sm btn-outline-danger fw-bold">
                  <i className="bi bi-file-pdf me-1"></i> Descargar PDF
                </button>
              </div>

              <div className="bg-light p-4 rounded-4 border mb-4 text-secondary small">
                <h6 className="fw-bold text-dark mb-2">Acuerdo Legal de Autorización Quirúrgica:</h6>
                <ol className="mb-0 ps-3">
                  <li><strong>Procedimiento:</strong> He sido informado del procedimiento de (especificar al guardar), sus etapas y complejidad.</li>
                  <li><strong>Riesgos Anestésicos:</strong> Reacciones alérgicas, toxicidad, hematomas, parestesia transitoria o permanente.</li>
                  <li><strong>Riesgos Quirúrgicos:</strong> Sangrado, infección, dehiscencia de sutura, dolor postoperatorio, limitación de apertura.</li>
                  <li><strong>Complicaciones Específicas:</strong> Comunicación oroantral, fractura de raíces, lesión de estructuras adyacentes.</li>
                  <li><strong>Alternativas:</strong> He sido informado de las alternativas no quirúrgicas disponibles.</li>
                  <li><strong>Indicaciones:</strong> Me comprometo a seguir estrictamente las instrucciones postoperatorias.</li>
                  <li><strong>Fotografías:</strong> Autorizo la toma de fotografías clínicas para seguimiento del caso y expediente médico.</li>
                </ol>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">Procedimiento Autorizado</label>
                  <input type="text" className="form-control bg-light" name="consent_procedure" value={record.consent_procedure || record.surgery_type} onChange={handleChange} placeholder="Ej: Odontectomía de tercer molar inferior izquierdo" />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">C.I. del Declarante</label>
                  <input type="text" className="form-control bg-light" name="consent_holder_ci" value={record.consent_holder_ci} onChange={handleChange} />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Fecha del Consentimiento</label>
                  <input type="date" className="form-control bg-light" name="consent_date" value={record.consent_date} onChange={handleChange} />
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma del Paciente / Declarante Legal"
                    initialSignature={record.consent_patient_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, consent_patient_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, consent_patient_signature_url: '' }))}
                  />
                </div>
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma y Sello del Cirujano Tratante"
                    initialSignature={record.consent_dentist_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, consent_dentist_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, consent_dentist_signature_url: '' }))}
                  />
                </div>
              </div>

              <div className="text-end mt-4">
                <button type="button" onClick={handleSave} className="btn btn-success fw-bold px-4" disabled={saving}>
                  <i className="bi bi-save me-2"></i> Guardar Consentimiento
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONTROLES POST-OP */}
          {activeTab === 'controles' && (
            <div>
              <h5 className="fw-bold text-primary mb-4">Controles Postoperatorios</h5>

              <form onSubmit={handleAddFollowup} className="bg-light p-4 rounded-4 border mb-4">
                <h6 className="fw-bold text-secondary mb-3">Registrar Nuevo Control</h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label text-muted small fw-semibold">Fecha del Control</label>
                    <input type="date" className="form-control" value={newFollowup.control_date}
                      onChange={e => setNewFollowup(prev => ({ ...prev, control_date: e.target.value }))} required />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label text-muted small fw-semibold">Hallazgos y Evolución</label>
                    <input type="text" className="form-control" placeholder="Ej: Cicatrización adecuada, sutura retirada, sin signos de infección" value={newFollowup.findings}
                      onChange={e => setNewFollowup(prev => ({ ...prev, findings: e.target.value }))} required />
                  </div>
                  <div className="col-md-1 d-flex align-items-end">
                    <button type="submit" className="btn btn-primary w-100 fw-bold">
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
              </form>

              {followups.length === 0 ? (
                <div className="text-center py-5 text-muted bg-light rounded-4">
                  <i className="bi bi-clipboard2-pulse fs-1 opacity-25 d-block mb-2"></i>
                  <p>No hay controles postoperatorios registrados.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {followups.map((f) => (
                    <div className="col-12" key={f.id}>
                      <div className="card border shadow-sm rounded-4 p-3">
                        <div className="d-flex align-items-start gap-3">
                          <div className="bg-primary text-white rounded-3 p-2 text-center fw-bold" style={{ minWidth: '56px' }}>
                            <div className="fs-3 lh-1">{f.control_number}</div>
                            <small className="opacity-75">Control</small>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">{f.control_date ? new Date(f.control_date).toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                            <p className="text-secondary mb-0 mt-1">{f.findings}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: IMÁGENES */}
          {activeTab === 'imagenes' && (
            <ClinicalImageGallery
              images={images}
              onUpload={handleUploadImage}
              onDelete={handleDeleteImage}
              bucketName="radiografias"
              title="Fotografías Clínicas Pre y Post-Quirúrgicas"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CirugiaOralPage;
