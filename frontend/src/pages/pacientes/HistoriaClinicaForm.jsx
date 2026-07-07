import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPatientById } from '../../services/patientService';
import { getClinicalHistory, saveClinicalHistory } from '../../services/clinicalHistoryService';
import { getClinicById } from '../../services/superAdminService';
import { useAuth } from '../../context/AuthContext';

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
    const docDefinition = {
      content: [
        // Encabezado
        {
          columns: [
            {
              width: '*',
              text: [
                { text: (clinic?.nombre || 'Clínica Dental').toUpperCase() + '\n', style: 'header' },
                { text: clinic?.direccion || '', style: 'subheader' },
                { text: (clinic?.telefono || '') + ' | ' + (clinic?.correo || ''), style: 'subheader' }
              ]
            },
            {
              width: 'auto',
              text: [
                { text: 'HISTORIA CLÍNICA\n', style: 'headerRight' },
                { text: `Fecha: ${new Date().toLocaleDateString()}`, style: 'subheaderRight' }
              ]
            }
          ],
          columnGap: 10,
          margin: [0, 0, 0, 10]
        },
        // Separador
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 15] },

        // Datos Personales
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: 'I. DATOS DEL PACIENTE', style: 'sectionTitle', fillColor: '#eeeeee', border: [false, false, false, false] }
              ]
            ]
          },
          margin: [0, 0, 0, 5]
        },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: `Nombre: ${patient?.nombre} ${patient?.apellido}`, style: 'tableText' },
                { text: `CI: ${patient?.ci}`, style: 'tableText' },
                { text: `Fecha Nac.: ${patient?.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString() : '-'}`, style: 'tableText' }
              ],
              [
                { text: `Sexo: ${patient?.sexo || '-'}`, style: 'tableText' },
                { text: `Celular: ${patient?.celular || '-'}`, style: 'tableText' },
                { text: `Dirección: ${patient?.direccion || '-'}`, style: 'tableText' }
              ]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 15]
        },

        // Motivo de Consulta
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: 'II. MOTIVO DE CONSULTA Y ENFERMEDAD ACTUAL', style: 'sectionTitle', fillColor: '#eeeeee', border: [false, false, false, false] }
              ]
            ]
          },
          margin: [0, 0, 0, 5]
        },
        { text: [{ text: 'Motivo: ', bold: true }, formData.motivo_consulta || 'No especificado'], style: 'bodyText' },
        { text: [{ text: 'Enfermedad Actual: ', bold: true }, formData.enfermedad_actual || 'No especificada'], style: 'bodyText', margin: [0, 0, 0, 15] },

        // Antecedentes Médicos
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: 'III. ANTECEDENTES MÉDICOS', style: 'sectionTitle', fillColor: '#eeeeee', border: [false, false, false, false] }
              ]
            ]
          },
          margin: [0, 0, 0, 5]
        },
        {
          columns: [
            { width: '25%', text: `Diabetes: ${formData.diabetes ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `Hipertensión: ${formData.hipertension ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `E. Cardíacas: ${formData.cardiacas ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `E. Respiratorias: ${formData.respiratorias ? 'Sí' : 'No'}`, style: 'bodyText' }
          ],
          margin: [0, 0, 0, 2]
        },
        {
          columns: [
            { width: '25%', text: `T. Hemorrágicos: ${formData.hemorragicos ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `Hepatitis: ${formData.hepatitis ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `VIH: ${formData.vih ? 'Sí' : 'No'}`, style: 'bodyText' },
            { width: '25%', text: `Embarazo: ${formData.embarazo ? 'Sí' : 'No'}`, style: 'bodyText' }
          ],
          margin: [0, 0, 0, 5]
        },
        { text: [{ text: 'Alergias: ', bold: true }, formData.alergias || 'Ninguna'], style: 'bodyText' },
        { text: [{ text: 'Medicamentos: ', bold: true }, formData.medicamentos || 'Ninguno'], style: 'bodyText' },
        { text: [{ text: 'Cirugías Previas: ', bold: true }, formData.cirugias || 'Ninguna'], style: 'bodyText' },
        { text: [{ text: 'Otros Antecedentes: ', bold: true }, formData.otros_antecedentes || 'Ninguno'], style: 'bodyText', margin: [0, 0, 0, 15] },

        // Exámenes y Diagnóstico
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: 'IV. DIAGNÓSTICO Y PLAN DE TRATAMIENTO', style: 'sectionTitle', fillColor: '#eeeeee', border: [false, false, false, false] }
              ]
            ]
          },
          margin: [0, 0, 0, 5]
        },
        { text: [{ text: 'Exámenes Complementarios:\n', bold: true }, formData.examenes || 'Ninguno'], style: 'bodyText', margin: [0, 0, 0, 5] },
        { text: [{ text: 'Diagnóstico Clínico:\n', bold: true }, formData.diagnostico || 'No especificado'], style: 'bodyText', margin: [0, 0, 0, 5] },
        { text: [{ text: 'Plan de Tratamiento:\n', bold: true }, formData.plan_tratamiento || 'No especificado'], style: 'bodyText', margin: [0, 0, 0, 20] },

        // Consentimiento
        { text: 'V. CONSENTIMIENTO INFORMADO', style: 'consentHeader', alignment: 'center', margin: [0, 0, 0, 5] },
        {
          text: `Declaro haber recibido información clara, veraz y suficiente acerca de mi estado de salud bucal, mi diagnóstico, el plan de tratamiento propuesto, sus alternativas, riesgos y beneficios esperados. Asimismo, declaro que todos los datos proporcionados en mis antecedentes médicos son ciertos. Autorizo libre y voluntariamente a los profesionales de ${clinic?.nombre || 'la Clínica'} a realizar los procedimientos y tratamientos descritos.`,
          style: 'consentText',
          alignment: 'justify',
          margin: [0, 0, 0, 40]
        },

        // Firmas
        {
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }], alignment: 'center' },
                { text: 'Firma del Paciente', style: 'signatureTitle', margin: [0, 5, 0, 0] },
                { text: `CI: ${patient?.ci}`, style: 'signatureSub' }
              ],
              alignment: 'center'
            },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }], alignment: 'center' },
                { text: 'Firma y Sello del Odontólogo', style: 'signatureTitle', margin: [0, 5, 0, 0] },
                { text: 'Profesional Tratante', style: 'signatureSub' }
              ],
              alignment: 'center'
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 10, color: '#666666' },
        headerRight: { fontSize: 14, bold: true, alignment: 'right' },
        subheaderRight: { fontSize: 10, alignment: 'right' },
        sectionTitle: { fontSize: 11, bold: true, margin: [2, 4, 2, 4] },
        tableText: { fontSize: 9, margin: [0, 1, 0, 1] },
        bodyText: { fontSize: 9, margin: [0, 1, 0, 1] },
        consentHeader: { fontSize: 10, bold: true },
        consentText: { fontSize: 9, italics: true },
        signatureTitle: { fontSize: 10, bold: true },
        signatureSub: { fontSize: 8, color: '#666666' }
      },
      defaultStyle: {
        columnGap: 20
      }
    };

    pdfMake.createPdf(docDefinition).download(`Historia_Clinica_${patient?.nombre}_${patient?.apellido}.pdf`);
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
          <i className="bi bi-file-pdf me-2 text-danger"></i> Descargar PDF
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
  );
};

export default HistoriaClinicaForm;
