import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import PatientSelectorHeader from '../../components/PatientSelectorHeader';
import SignaturePadModal from '../../components/SignaturePadModal';
import ClinicalImageGallery from '../../components/ClinicalImageGallery';
import {
  getImplantRecordByPatient,
  saveImplantRecord,
  getImplantEvolutionNotes,
  addImplantEvolutionNote,
  getImplantPaymentPlan,
  saveImplantPaymentPlan,
  getImplantImages,
  uploadImplantImage,
  deleteImplantImage
} from '../../services/implantologyService';
import {
  generateImplantHistoryPdf,
  generateImplantConsentPdf,
  generateImplantPaymentPlanPdf
} from '../../services/specialtyPdfService';
import { getPatientById } from '../../services/patientService';

const defaultPaymentStages = [
  { label: 'Cirugía de colocación del implante', percentage: 50, amount: 0, paid: false, paid_date: null },
  { label: 'Inicio de rehabilitación protésica', percentage: 25, amount: 0, paid: false, paid_date: null },
  { label: 'Entrega de prótesis definitiva', percentage: 25, amount: 0, paid: false, paid_date: null }
];

const ImplantologiaPage = () => {
  const { user, clinic } = useAuth();
  const { id } = useParams(); // id del paciente o del expediente
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('historia');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Estado del expediente principal
  const [record, setRecord] = useState({
    id: null, patient_id: '', patient_name: '',
    age: '', gender: 'Femenino', phone: '',
    consultation_date: new Date().toISOString().split('T')[0],
    consultation_reason: 'Reemplazo dental con implantes osteointegrados',
    has_diabetes: false, has_hypertension: false, has_heart_disease: false,
    has_allergies: false, allergies_detail: '',
    medications_detail: '', smokes: false, medical_other: '',
    tooth_loss_cause: 'Caries avanzada', tooth_loss_cause_other: '',
    previous_treatments: '',
    oral_hygiene: 'Regular', gum_status: 'Sano', prosthetic_space: 'Adecuado', occlusion: '',
    bone_height_mm: '', bone_width_mm: '', bone_quality: 'D2',
    anatomical_risk_structures: false, anatomical_risk_detail: '',
    diagnosis: '', treatment_plan: [], treatment_plan_notes: '',
    history_patient_signature_url: '', history_dentist_signature_url: '',
    consent_given: true, consent_holder_name: '', consent_holder_ci: '',
    consent_date: new Date().toISOString().split('T')[0],
    consent_patient_signature_url: '', consent_dentist_signature_url: ''
  });

  // Estado de evoluciones
  const [evolutionNotes, setEvolutionNotes] = useState([]);
  const [newNote, setNewNote] = useState({ visit_date: new Date().toISOString().split('T')[0], procedure_performed: '', clinical_findings: '' });

  // Estado del plan de pagos
  const [paymentPlan, setPaymentPlan] = useState({
    id: null, patient_id: '', implant_record_id: null,
    treatment_description: 'Implante dental con corona unitaria',
    total_cost: 0, currency: 'BOB',
    payment_stages: defaultPaymentStages,
    observations: '', patient_signature_url: ''
  });

  // Imágenes
  const [images, setImages] = useState([]);

  // Cargar datos si viene un id
  useEffect(() => {
    const loadData = async () => {
      if (!id || !user?.clinic_id) return;
      try {
        setLoading(true);
        // Intentar cargar por paciente_id primero
        const patient = await getPatientById(id, user.clinic_id);
        if (patient) {
          setSelectedPatient(patient);
          const existingRecord = await getImplantRecordByPatient(patient.id, user.clinic_id);
          if (existingRecord) {
            setRecord(existingRecord);
            const notes = await getImplantEvolutionNotes(existingRecord.id, user.clinic_id);
            setEvolutionNotes(notes);
            const plan = await getImplantPaymentPlan(existingRecord.id, patient.id, user.clinic_id);
            if (plan) setPaymentPlan(plan);
            const imgs = await getImplantImages(existingRecord.id, user.clinic_id);
            setImages(imgs);
          } else {
            setRecord(prev => ({
              ...prev, patient_id: patient.id,
              patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
              consent_holder_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
              consent_holder_ci: patient.ci || '',
              phone: patient.celular || ''
            }));
            setPaymentPlan(prev => ({ ...prev, patient_id: patient.id }));
          }
        }
      } catch (err) {
        console.error('Error al cargar expediente de implantología:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, user?.clinic_id]);

  // Manejar selección de paciente + auto-llenado
  const handleSelectPatient = (patient, generalHistory) => {
    setSelectedPatient(patient);
    if (!patient) {
      setRecord(prev => ({ ...prev, patient_id: '', patient_name: '' }));
      setPaymentPlan(prev => ({ ...prev, patient_id: '' }));
      return;
    }

    setRecord(prev => ({
      ...prev,
      patient_id: patient.id,
      patient_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      age: patient.edad || prev.age,
      gender: patient.sexo || prev.gender,
      phone: patient.celular || prev.phone,
      consent_holder_name: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),
      consent_holder_ci: patient.ci || '',
      // Auto-llenado desde historia clínica general
      has_diabetes: generalHistory?.diabetes || false,
      has_hypertension: generalHistory?.hipertension || false,
      has_allergies: !!generalHistory?.alergias,
      allergies_detail: generalHistory?.alergias || prev.allergies_detail,
      medications_detail: generalHistory?.medicamentos || prev.medications_detail,
    }));
    setPaymentPlan(prev => ({ ...prev, patient_id: patient.id }));

    Swal.fire({ title: '¡Paciente Vinculado!', text: 'Datos personales y antecedentes precargados.', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleRecordChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecord(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveRecord = async () => {
    if (!record.patient_id) {
      Swal.fire('Atención', 'Vincula un paciente primero.', 'warning');
      return;
    }
    try {
      setSaving(true);
      const saved = await saveImplantRecord(record, user.clinic_id);
      setRecord(saved);
      if (paymentPlan.patient_id && !paymentPlan.id) {
        setPaymentPlan(prev => ({ ...prev, implant_record_id: saved.id }));
      }
      Swal.fire({ title: '¡Guardado!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el expediente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvolutionNote = async (e) => {
    e.preventDefault();
    if (!record.id) {
      Swal.fire('Guarda el expediente primero', 'Debes guardar la historia clínica antes de agregar evoluciones.', 'info');
      return;
    }
    try {
      const added = await addImplantEvolutionNote({
        ...newNote,
        implant_record_id: record.id,
        patient_id: record.patient_id
      }, user.clinic_id);
      setEvolutionNotes(prev => [added, ...prev]);
      setNewNote({ visit_date: new Date().toISOString().split('T')[0], procedure_performed: '', clinical_findings: '' });
      Swal.fire({ title: '¡Anotación de Control Añadida!', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar la nota de evolución.', 'error');
    }
  };

  const handleSavePaymentPlan = async () => {
    if (!record.patient_id) {
      Swal.fire('Vincula un Paciente', 'Debes vincular un paciente antes de guardar el plan de pagos.', 'warning');
      return;
    }
    try {
      setSaving(true);
      const saved = await saveImplantPaymentPlan({
        ...paymentPlan,
        patient_id: record.patient_id,
        implant_record_id: record.id || null
      }, user.clinic_id);
      setPaymentPlan(saved);
      Swal.fire({ title: '¡Plan de Pagos Guardado!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el plan de pagos.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTotalCostChange = (e) => {
    const total = parseFloat(e.target.value) || 0;
    const updatedStages = paymentPlan.payment_stages.map(stage => ({
      ...stage,
      amount: parseFloat(((stage.percentage / 100) * total).toFixed(2))
    }));
    setPaymentPlan(prev => ({ ...prev, total_cost: total, payment_stages: updatedStages }));
  };

  const handleTogglePaidStage = (index) => {
    setPaymentPlan(prev => {
      const stages = [...prev.payment_stages];
      stages[index] = {
        ...stages[index],
        paid: !stages[index].paid,
        paid_date: !stages[index].paid ? new Date().toLocaleDateString() : null
      };
      return { ...prev, payment_stages: stages };
    });
  };

  const handleUploadImage = async (file, caption) => {
    if (!record.id) {
      Swal.fire('Guardar Primero', 'Debes guardar el expediente antes de subir imágenes.', 'info');
      return;
    }
    const newImg = await uploadImplantImage(file, record.id, record.patient_id, user.clinic_id, caption);
    setImages(prev => [newImg, ...prev]);
  };

  const handleDeleteImage = async (imageId) => {
    await deleteImplantImage(imageId, user.clinic_id);
    setImages(prev => prev.filter(i => i.id !== imageId));
  };

  const handleExportHistoryPdf = async () => {
    const patient = selectedPatient || (record.patient_id ? await getPatientById(record.patient_id, user.clinic_id) : null);
    await generateImplantHistoryPdf(record, patient, clinic);
  };
  const handleExportConsentPdf = async () => {
    const patient = selectedPatient || (record.patient_id ? await getPatientById(record.patient_id, user.clinic_id) : null);
    await generateImplantConsentPdf(record, patient, clinic);
  };
  const handleExportPaymentPdf = async () => {
    const patient = selectedPatient || (record.patient_id ? await getPatientById(record.patient_id, user.clinic_id) : null);
    await generateImplantPaymentPlanPdf(paymentPlan, patient, clinic);
  };

  if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;

  const tabButtonClass = (tab) => `nav-link py-3 fw-semibold ${activeTab === tab ? 'active bg-primary text-white' : 'text-muted'}`;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Link to="/implantologia" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Expediente de Implantología</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold text-primary">{record.patient_name || 'Sin seleccionar'}</span></p>
          </div>
        </div>
        <button type="button" onClick={handleSaveRecord} className="btn btn-primary fw-bold shadow-sm" disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
          Guardar Historia
        </button>
      </div>

      <PatientSelectorHeader selectedPatient={selectedPatient} onSelectPatient={handleSelectPatient} moduleName="Implantología" />

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-light p-0 border-0">
          <ul className="nav nav-pills nav-fill">
            {[
              { key: 'historia', icon: 'bi-journal-medical', label: 'Historia Clínica' },
              { key: 'evolucion', icon: 'bi-clipboard2-pulse', label: 'Hoja de Evolución' },
              { key: 'consentimiento', icon: 'bi-file-earmark-check', label: 'Consentimiento' },
              { key: 'pagos', icon: 'bi-cash-stack', label: 'Plan de Pagos' },
              { key: 'imagenes', icon: 'bi-images', label: 'Imágenes' }
            ].map(t => (
              <li key={t.key} className="nav-item">
                <button type="button" className={`${tabButtonClass(t.key)} nav-link rounded-0`} onClick={() => setActiveTab(t.key)}>
                  <i className={`bi ${t.icon} me-1 d-none d-md-inline`}></i> {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body p-4 bg-white">
          {/* TAB: HISTORIA CLÍNICA */}
          {activeTab === 'historia' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">Historia Clínica de Implantología</h5>
                <button type="button" onClick={handleExportHistoryPdf} className="btn btn-sm btn-outline-danger fw-bold">
                  <i className="bi bi-file-pdf me-1"></i> Descargar PDF
                </button>
              </div>

              <h6 className="fw-bold text-secondary mb-3">Antecedentes Médicos (precargados si hay Historia Clínica)</h6>
              <div className="row g-3 mb-4">
                {[
                  { name: 'has_diabetes', label: 'Diabetes' },
                  { name: 'has_hypertension', label: 'Hipertensión' },
                  { name: 'has_heart_disease', label: 'Cardiopatía' },
                  { name: 'smokes', label: 'Fumador/a' },
                  { name: 'has_allergies', label: 'Tiene Alergias' }
                ].map(item => (
                  <div className="col-6 col-md-3" key={item.name}>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" name={item.name} checked={!!record[item.name]} onChange={handleRecordChange} />
                      <label className="form-check-label fw-medium small">{item.label}</label>
                    </div>
                  </div>
                ))}
              </div>

              {record.has_allergies && (
                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold small">Detalle de Alergias</label>
                  <input type="text" className="form-control bg-light" name="allergies_detail" value={record.allergies_detail} onChange={handleRecordChange} placeholder="Especificar alergias conocidas..." />
                </div>
              )}

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">Causa de Pérdida Dental</label>
                  <select className="form-select bg-light" name="tooth_loss_cause" value={record.tooth_loss_cause} onChange={handleRecordChange}>
                    <option value="Caries avanzada">Caries avanzada</option>
                    <option value="Enfermedad periodontal">Enfermedad periodontal</option>
                    <option value="Trauma dental">Trauma dental</option>
                    <option value="Fractura radicular">Fractura radicular</option>
                    <option value="Reabsorción radicular">Reabsorción radicular</option>
                    <option value="Congénita">Congénita (agenesia)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">Calidad Ósea (CBCT / Panorámica)</label>
                  <select className="form-select bg-light" name="bone_quality" value={record.bone_quality} onChange={handleRecordChange}>
                    <option value="D1">D1 - Hueso cortical denso</option>
                    <option value="D2">D2 - Hueso cortical grueso + medular densa</option>
                    <option value="D3">D3 - Cortical delgada + medular densa</option>
                    <option value="D4">D4 - Hueso medular escaso</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Altura Ósea Disponible (mm)</label>
                  <input type="number" className="form-control bg-light" name="bone_height_mm" value={record.bone_height_mm} onChange={handleRecordChange} placeholder="Ej. 12.5" step="0.1" />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Ancho Óseo Disponible (mm)</label>
                  <input type="number" className="form-control bg-light" name="bone_width_mm" value={record.bone_width_mm} onChange={handleRecordChange} placeholder="Ej. 5.5" step="0.1" />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold small">Riesgo Anatómico</label>
                  <div className="form-check form-switch mt-2">
                    <input className="form-check-input" type="checkbox" name="anatomical_risk_structures" checked={!!record.anatomical_risk_structures} onChange={handleRecordChange} />
                    <label className="form-check-label fw-medium small">Seno maxilar / Nervio dentario inferior proximal</label>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Diagnóstico Implantológico</label>
                <textarea className="form-control bg-light" name="diagnosis" rows="3" value={record.diagnosis} onChange={handleRecordChange} placeholder="Edentulismo parcial/total, planeación protésica..." />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Notas del Plan de Tratamiento</label>
                <textarea className="form-control bg-light" name="treatment_plan_notes" rows="2" value={record.treatment_plan_notes} onChange={handleRecordChange} placeholder="Protocolo de carga, tipo de implante, diámetro/longitud..." />
              </div>

              <h6 className="fw-bold text-secondary mb-3 mt-4">Firma del Odontólogo y Paciente — Historia Clínica</h6>
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
                    label="Firma y Sello del Implantólogo"
                    initialSignature={record.history_dentist_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, history_dentist_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, history_dentist_signature_url: '' }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: EVOLUCIÓN */}
          {activeTab === 'evolucion' && (
            <div>
              <h5 className="fw-bold text-primary mb-4">Hoja de Evolución — Controles de Implante</h5>

              <form onSubmit={handleAddEvolutionNote} className="bg-light p-4 rounded-4 border mb-4">
                <h6 className="fw-bold text-secondary mb-3">Agregar Nueva Anotación de Control</h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label text-muted small fw-semibold">Fecha del Control</label>
                    <input type="date" className="form-control" value={newNote.visit_date}
                      onChange={e => setNewNote(prev => ({ ...prev, visit_date: e.target.value }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Procedimiento Realizado</label>
                    <input type="text" className="form-control" placeholder="Ej: Control post-quirúrgico 1 semana" value={newNote.procedure_performed}
                      onChange={e => setNewNote(prev => ({ ...prev, procedure_performed: e.target.value }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small fw-semibold">Hallazgos Clínicos</label>
                    <input type="text" className="form-control" placeholder="Ej: Cicatrización normal, sin complicaciones" value={newNote.clinical_findings}
                      onChange={e => setNewNote(prev => ({ ...prev, clinical_findings: e.target.value }))} />
                  </div>
                  <div className="col-md-1 d-flex align-items-end">
                    <button type="submit" className="btn btn-primary w-100 fw-bold">
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
              </form>

              {evolutionNotes.length === 0 ? (
                <div className="text-center py-5 text-muted bg-light rounded-4">
                  <i className="bi bi-clipboard2-pulse fs-1 opacity-25 d-block mb-2"></i>
                  <p className="mb-0">No hay controles registrados todavía.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small text-uppercase">
                      <tr>
                        <th className="ps-3">Control #</th>
                        <th>Fecha</th>
                        <th>Procedimiento</th>
                        <th>Hallazgos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evolutionNotes.map((note, i) => (
                        <tr key={note.id}>
                          <td className="ps-3 fw-bold text-primary">#{evolutionNotes.length - i}</td>
                          <td>{note.visit_date ? new Date(note.visit_date).toLocaleDateString() : '-'}</td>
                          <td className="fw-medium">{note.procedure_performed}</td>
                          <td className="text-muted">{note.clinical_findings || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: CONSENTIMIENTO */}
          {activeTab === 'consentimiento' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">Consentimiento Informado de Implantología</h5>
                <button type="button" onClick={handleExportConsentPdf} className="btn btn-sm btn-outline-danger fw-bold">
                  <i className="bi bi-file-pdf me-1"></i> Descargar PDF
                </button>
              </div>

              <div className="bg-light p-4 rounded-4 border mb-4 text-secondary small">
                <h6 className="fw-bold text-dark mb-2">Términos del Consentimiento Informado:</h6>
                <ol className="mb-0 ps-3">
                  <li><strong>Procedimiento:</strong> Colocación quirúrgica de implante(s) de titanio intraóseo(s) para restauración dental.</li>
                  <li><strong>Riesgos:</strong> Infección, hematoma, parestesia, fallo de osteointegración, perforación de estructuras anatómicas.</li>
                  <li><strong>Beneficios:</strong> Recuperación funcional y estética, preservación del hueso alveolar.</li>
                  <li><strong>Alternativas:</strong> Prótesis removibles, puentes fijos.</li>
                  <li><strong>Tiempo:</strong> La osteointegración puede tardar de 3 a 6 meses según condiciones individuales.</li>
                  <li><strong>Cuidados:</strong> Reposo, dieta blanda, uso de medicación prescrita y asistencia a controles.</li>
                  <li><strong>Responsabilidad:</strong> El incumplimiento de indicaciones puede comprometer el resultado del tratamiento.</li>
                </ol>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">Nombre del Paciente / Declarante</label>
                  <input type="text" className="form-control bg-light" name="consent_holder_name" value={record.consent_holder_name} onChange={handleRecordChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold small">C.I. del Declarante</label>
                  <input type="text" className="form-control bg-light" name="consent_holder_ci" value={record.consent_holder_ci} onChange={handleRecordChange} />
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma del Paciente / Declarante"
                    initialSignature={record.consent_patient_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, consent_patient_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, consent_patient_signature_url: '' }))}
                  />
                </div>
                <div className="col-md-6">
                  <SignaturePadModal
                    label="Firma y Sello del Cirujano Implantólogo"
                    initialSignature={record.consent_dentist_signature_url}
                    onSave={(url) => setRecord(prev => ({ ...prev, consent_dentist_signature_url: url }))}
                    onClear={() => setRecord(prev => ({ ...prev, consent_dentist_signature_url: '' }))}
                  />
                </div>
              </div>

              <div className="text-end mt-4">
                <button type="button" onClick={handleSaveRecord} className="btn btn-success fw-bold px-4" disabled={saving}>
                  <i className="bi bi-save me-2"></i> Guardar Consentimiento
                </button>
              </div>
            </div>
          )}

          {/* TAB: PLAN DE PAGOS */}
          {activeTab === 'pagos' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">Plan de Pagos 50% / 25% / 25%</h5>
                <button type="button" onClick={handleExportPaymentPdf} className="btn btn-sm btn-outline-danger fw-bold">
                  <i className="bi bi-file-pdf me-1"></i> Descargar PDF
                </button>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="form-label text-muted fw-semibold small">Descripción del Tratamiento</label>
                  <input type="text" className="form-control bg-light" value={paymentPlan.treatment_description}
                    onChange={e => setPaymentPlan(prev => ({ ...prev, treatment_description: e.target.value }))}
                    placeholder="Ej: Implante dental con corona de zirconio" />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold small">Costo Total (Bs.)</label>
                  <input type="number" className="form-control bg-light fw-bold fs-5" value={paymentPlan.total_cost} onChange={handleTotalCostChange} min="0" step="0.50" />
                </div>
                <div className="col-md-2">
                  <label className="form-label text-muted fw-semibold small">Moneda</label>
                  <select className="form-select bg-light" value={paymentPlan.currency} onChange={e => setPaymentPlan(prev => ({ ...prev, currency: e.target.value }))}>
                    <option value="BOB">BOB (Bs.)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-4">
                {paymentPlan.payment_stages.map((stage, i) => (
                  <div className="col-12" key={i}>
                    <div className={`card border rounded-4 p-3 ${stage.paid ? 'border-success bg-success bg-opacity-10' : 'border-light'}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0 fw-bold text-dark">{stage.label}</h6>
                          <span className="badge bg-primary bg-opacity-25 text-primary me-2">{stage.percentage}%</span>
                          <span className="fw-bold text-dark fs-5">{paymentPlan.currency} {stage.amount?.toFixed(2) || '0.00'}</span>
                          {stage.paid && <small className="text-success ms-3"><i className="bi bi-check-circle-fill me-1"></i>Pagado: {stage.paid_date}</small>}
                        </div>
                        <button
                          type="button"
                          className={`btn fw-bold ${stage.paid ? 'btn-outline-secondary' : 'btn-success'}`}
                          onClick={() => handleTogglePaidStage(i)}
                        >
                          {stage.paid ? <><i className="bi bi-arrow-counterclockwise me-1"></i> Desmarcar</> : <><i className="bi bi-check-lg me-1"></i> Marcar como Pagado</>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="form-label text-muted fw-semibold small">Observaciones y Condiciones del Plan</label>
                <textarea className="form-control bg-light" rows="2" value={paymentPlan.observations}
                  onChange={e => setPaymentPlan(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Términos de pago, vigencia, penalizaciones por incumplimiento..." />
              </div>

              <div className="mb-4">
                <SignaturePadModal
                  label="Conformidad del Paciente con el Plan de Pagos"
                  initialSignature={paymentPlan.patient_signature_url}
                  onSave={(url) => setPaymentPlan(prev => ({ ...prev, patient_signature_url: url }))}
                  onClear={() => setPaymentPlan(prev => ({ ...prev, patient_signature_url: '' }))}
                />
              </div>

              <div className="text-end">
                <button type="button" onClick={handleSavePaymentPlan} className="btn btn-success fw-bold px-5" disabled={saving}>
                  <i className="bi bi-save me-2"></i> Guardar Plan de Pagos
                </button>
              </div>
            </div>
          )}

          {/* TAB: IMÁGENES */}
          {activeTab === 'imagenes' && (
            <ClinicalImageGallery
              images={images}
              onUpload={handleUploadImage}
              onDelete={handleDeleteImage}
              bucketName="radiografias"
              title="Imágenes Clínicas e Imagenología CBCT / Panorámica"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImplantologiaPage;
