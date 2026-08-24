/**
 * Servicio de Generación de PDFs Vectoriales para Especialidades Clínicas
 * Ortodoncia, Implantología y Cirugía Oral usando pdfmake.
 */

const getPdfMake = async () => {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : window.pdfMake?.vfs;
  return pdfMake;
};

const commonStyles = {
  headerTitle: { fontSize: 15, bold: true, color: '#0d6efd' },
  headerSub: { fontSize: 9, color: '#666666' },
  docTitle: { fontSize: 13, bold: true, alignment: 'right', color: '#1a1a1a' },
  docDate: { fontSize: 9, alignment: 'right', color: '#666666' },
  sectionHeader: { fontSize: 10, bold: true, color: '#0d6efd', margin: [0, 8, 0, 4] },
  tableHeader: { fontSize: 8.5, bold: true, fillColor: '#f8f9fa' },
  bodyText: { fontSize: 8.5, margin: [0, 1.5, 0, 1.5], color: '#222222' },
  legalTitle: { fontSize: 13, bold: true, alignment: 'center', color: '#0d6efd', margin: [0, 0, 0, 12] },
  legalBody: { fontSize: 9, alignment: 'justify', lineHeight: 1.3, color: '#333333' },
  legalItem: { fontSize: 8.5, alignment: 'justify', margin: [0, 2, 0, 2], lineHeight: 1.25 },
  signatureTitle: { fontSize: 8.5, bold: true, color: '#222222' },
  signatureSub: { fontSize: 8, color: '#666666' }
};

const buildHeader = (clinic, title) => [
  {
    columns: [
      {
        width: '*',
        text: [
          { text: (clinic?.nombre || 'CLÍNICA DENTAL').toUpperCase() + '\n', style: 'headerTitle' },
          { text: (clinic?.direccion || '') + '\n', style: 'headerSub' },
          { text: (clinic?.telefono || '') + (clinic?.correo ? ' | ' + clinic?.correo : ''), style: 'headerSub' }
        ]
      },
      {
        width: 'auto',
        text: [
          { text: title.toUpperCase() + '\n', style: 'docTitle' },
          { text: `Fecha de emisión: ${new Date().toLocaleDateString()}`, style: 'docDate' }
        ]
      }
    ],
    margin: [0, 0, 0, 8]
  },
  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0d6efd' }], margin: [0, 0, 0, 12] }
];

const buildPatientInfoBlock = (patient) => ({
  table: {
    widths: ['35%', '30%', '35%'],
    body: [
      [
        { text: [{ text: 'Paciente: ', bold: true }, `${patient?.nombre || ''} ${patient?.apellido || ''}`], style: 'bodyText' },
        { text: [{ text: 'C.I.: ', bold: true }, `${patient?.ci || '-'}`], style: 'bodyText' },
        { text: [{ text: 'Edad: ', bold: true }, `${patient?.edad ? patient.edad + ' años' : '-'}`], style: 'bodyText' }
      ],
      [
        { text: [{ text: 'Sexo: ', bold: true }, `${patient?.sexo || '-'}`], style: 'bodyText' },
        { text: [{ text: 'Celular: ', bold: true }, `${patient?.celular || '-'}`], style: 'bodyText' },
        { text: [{ text: 'Dirección: ', bold: true }, `${patient?.direccion || '-'}`], style: 'bodyText' }
      ]
    ]
  },
  layout: {
    fillColor: () => '#f8f9fa',
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => '#e9ecef',
    vLineColor: () => '#e9ecef',
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4
  },
  margin: [0, 0, 0, 10]
});

// Helper para convertir base64/URL en elemento de imagen para pdfmake
const getSignatureImage = (signatureUrl) => {
  if (signatureUrl && signatureUrl.startsWith('data:image')) {
    return { image: signatureUrl, width: 130, height: 45, alignment: 'center' };
  }
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 130, y2: 0, lineWidth: 1, lineColor: '#999999' }], alignment: 'center', margin: [0, 35, 0, 0] };
};

// ------------------------------------------------------------
// 1. PDF HISTORIAL DE ORTODONCIA
// ------------------------------------------------------------
export const generateOrthodonticPdf = async (record, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const consultationReasons = Array.isArray(record.consultation_reasons) ? [...record.consultation_reasons] : [];
  if (record.consultation_other) {
    consultationReasons.push(`Otros: ${record.consultation_other}`);
  }

  const systemicList = Array.isArray(record.systemic_diseases) ? [...record.systemic_diseases] : [];
  if (record.systemic_other) {
    systemicList.push(`Otra: ${record.systemic_other}`);
  }

  const habitsList = Array.isArray(record.habits) ? [...record.habits] : [];
  if (record.habits_other) {
    habitsList.push(`Otros: ${record.habits_other}`);
  }

  const orthoAntecedents = [];
  if (record.previous_orthodontics) orthoAntecedents.push('Ortodoncia previa');
  if (record.extractions) orthoAntecedents.push('Extracciones previas');
  if (record.dental_trauma) orthoAntecedents.push('Traumatismo dental');
  if (record.bruxism) orthoAntecedents.push('Bruxismo');
  if (orthoAntecedents.length === 0) orthoAntecedents.push('Ninguno reportado');

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Historial Clínico de Ortodoncia'),
      buildPatientInfoBlock(patient),

      // I. MOTIVO DE CONSULTA Y ANTECEDENTES ORTODÓNCICOS
      { text: 'I. MOTIVO DE CONSULTA Y ANTECEDENTES ORTODÓNCICOS', style: 'sectionHeader' },
      { text: [{ text: 'Motivos de consulta: ', bold: true }, consultationReasons.length > 0 ? consultationReasons.join(', ') : 'No especificado'], style: 'bodyText' },
      { text: [{ text: 'Antecedentes ortodóncicos: ', bold: true }, orthoAntecedents.join(', ')], style: 'bodyText' },
      { text: [{ text: 'Fecha de consulta: ', bold: true }, record.consultation_date || '-'], style: 'bodyText', margin: [0, 0, 0, 6] },

      // ANTECEDENTES MÉDICOS Y HÁBITOS
      { text: 'ANTECEDENTES MÉDICOS Y HÁBITOS', style: 'sectionHeader' },
      { text: [{ text: 'Enfermedades Sistémicas: ', bold: true }, systemicList.length > 0 ? systemicList.join(', ') : 'Ninguna'], style: 'bodyText' },
      { text: [{ text: 'Alergias: ', bold: true }, record.has_allergies ? (record.allergies_detail || 'Sí (sin detalle)') : 'No presenta'], style: 'bodyText' },
      { text: [{ text: 'Medicamentos habituales: ', bold: true }, record.takes_medications ? (record.medications_detail || 'Sí (sin detalle)') : 'No consume'], style: 'bodyText' },
      { text: [{ text: 'Cirugías: ', bold: true }, record.has_surgeries ? (record.surgeries_detail || 'Sí') : 'No'], style: 'bodyText' },
      { text: [{ text: 'Hospitalizaciones: ', bold: true }, record.has_hospitalizations ? (record.hospitalizations_detail || 'Sí') : 'No'], style: 'bodyText' },
      { text: [{ text: 'Hábitos nocivos identificados: ', bold: true }, habitsList.length > 0 ? habitsList.join(', ') : 'Ninguno'], style: 'bodyText', margin: [0, 0, 0, 6] },

      // II. EXAMEN EXTRAORAL
      { text: 'II. EXAMEN EXTRAORAL', style: 'sectionHeader' },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: [{ text: 'Perfil: ', bold: true }, `${record.profile || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Simetría: ', bold: true }, `${record.facial_symmetry || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Comp. Labial: ', bold: true }, `${record.lip_competence || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Tipo Sonrisa: ', bold: true }, `${record.smile_type || '-'}`], style: 'bodyText' }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 6]
      },

      // III. EXAMEN INTRAORAL
      { text: 'III. EXAMEN INTRAORAL', style: 'sectionHeader' },
      {
        table: {
          widths: ['33%', '33%', '34%'],
          body: [
            [
              { text: [{ text: 'Higiene oral: ', bold: true }, `${record.oral_hygiene || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Estado periodontal: ', bold: true }, `${record.periodontal_status || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Relación molar: ', bold: true }, `${record.molar_relation || '-'}`], style: 'bodyText' }
            ],
            [
              { text: [{ text: 'Relación canina: ', bold: true }, `${record.canine_relation || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Overjet: ', bold: true }, `${record.overjet || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Overbite: ', bold: true }, `${record.overbite || '-'}`], style: 'bodyText' }
            ],
            [
              { text: [{ text: 'Línea media: ', bold: true }, `${record.midline || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Apiñamiento: ', bold: true }, `${record.crowding || '-'}`], style: 'bodyText' },
              { text: [{ text: 'Diastemas: ', bold: true }, record.has_diastemas ? 'Sí' : 'No'], style: 'bodyText' }
            ],
            [
              { text: [{ text: 'Mordida cruzada: ', bold: true }, `${record.crossbite || 'No'}`], style: 'bodyText' },
              { text: '', style: 'bodyText' },
              { text: '', style: 'bodyText' }
            ]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 6]
      },

      // IV. DIAGNÓSTICO Y PLAN DE TRATAMIENTO
      { text: 'IV. DIAGNÓSTICO Y PLAN DE TRATAMIENTO', style: 'sectionHeader' },
      { text: [{ text: 'Diagnóstico: ', bold: true }, record.diagnosis || 'Sin registro'], style: 'bodyText' },
      { text: [{ text: 'Plan de Tratamiento: ', bold: true }, record.treatment_plan || 'Sin registro'], style: 'bodyText' },
      { text: [{ text: 'Observaciones: ', bold: true }, record.observations || 'Sin observaciones'], style: 'bodyText', margin: [0, 0, 0, 20] },

      // FIRMAS AL PIE DEL HISTORIAL
      {
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#666666' }], alignment: 'center', margin: [0, 30, 0, 0] },
              { text: `\nFirma del Paciente / Tutor\nC.I.: ${patient?.ci || '_______________'}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#666666' }], alignment: 'center', margin: [0, 30, 0, 0] },
              { text: '\nFirma y Sello del Odontólogo\nOrtodoncista Tratante', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles,
    pageMargins: [40, 30, 40, 30]
  };

  pdfMake.createPdf(docDefinition).download(`Historial_Ortodoncia_${patient?.nombre || 'Paciente'}_${patient?.apellido || ''}.pdf`);
};

// ------------------------------------------------------------
// 2. PDF CONSENTIMIENTO INFORMADO DE ORTODONCIA (STANDALONE)
// ------------------------------------------------------------
export const generateOrthodonticConsentPdf = async (patient, clinic, tutorName = '') => {
  const pdfMake = await getPdfMake();

  const patientFullName = `${patient?.nombre || ''} ${patient?.apellido || ''}`.trim() || 'Paciente sin registrar';
  const patientCi = patient?.ci || 'Sin registro';
  const declarantName = tutorName && tutorName.trim() ? tutorName.trim() : patientFullName;
  const displayTutor = tutorName && tutorName.trim() ? tutorName.trim() : 'No aplica (Mayor de edad)';
  const formattedDate = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const clinicCity = clinic?.ciudad || clinic?.direccion || 'Bolivia';

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Documento Legal Clínico'),
      
      { text: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE ORTODONCIA', style: 'legalTitle' },

      {
        text: [
          'Yo, ',
          { text: `${declarantName}`, bold: true, color: '#0d6efd' },
          ', con C.I. ',
          { text: `${patientCi}`, bold: true, color: '#0d6efd' },
          ', declaro que he recibido información clara y suficiente sobre el tratamiento de ortodoncia que se realizará al paciente ',
          { text: `${patientFullName}`, bold: true, color: '#0d6efd' },
          '.'
        ],
        style: 'legalBody',
        margin: [0, 0, 0, 10]
      },

      { text: 'He sido informado(a) de que:', style: { fontSize: 9.5, bold: true, color: '#0d6efd', margin: [0, 0, 0, 6] } },

      {
        ul: [
          'El tratamiento tiene como objetivo mejorar la alineación dental, la mordida, la función y la estética; sin embargo, no se pueden garantizar resultados exactos.',
          'La duración estimada del tratamiento dependerá de la complejidad del caso y de mi colaboración, pudiendo prolongarse por factores biológicos o por el incumplimiento de las indicaciones.',
          'Es indispensable asistir puntualmente a los controles programados y mantener una adecuada higiene bucal durante todo el tratamiento.',
          'Debo evitar alimentos duros, pegajosos o muy crujientes que puedan dañar los aparatos de ortodoncia.',
          'Es posible experimentar molestias, sensibilidad o dolor leve después de la colocación o activación de los aparatos, las cuales generalmente son temporales.',
          'Existen riesgos potenciales, como descalcificaciones, caries, inflamación de encías, reabsorción radicular, recidiva, fractura o desprendimiento de los aparatos y necesidad de modificar el plan de tratamiento si las condiciones clínicas lo requieren.',
          'Al finalizar el tratamiento será necesario el uso de retenedores para mantener los resultados obtenidos. El incumplimiento de esta indicación puede ocasionar movimientos dentarios y recaídas.',
          'He tenido la oportunidad de realizar preguntas, las cuales fueron respondidas de manera satisfactoria, y comprendo los beneficios, riesgos, alternativas y limitaciones del tratamiento.'
        ],
        style: 'legalItem',
        margin: [0, 0, 0, 10]
      },

      {
        text: 'Con esta información, manifiesto que otorgo mi consentimiento libre y voluntario para iniciar el tratamiento de ortodoncia.',
        style: { fontSize: 9, bold: true, margin: [0, 4, 0, 12] }
      },

      // DATOS DEL PACIENTE Y TUTOR (TABLA)
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              { text: [{ text: 'Nombre del paciente: ', bold: true }, `${patientFullName}`], style: 'bodyText' },
              { text: [{ text: 'C.I. del paciente: ', bold: true }, `${patientCi}`], style: 'bodyText' }
            ],
            [
              { text: [{ text: 'Padre, madre o tutor: ', bold: true }, `${displayTutor}`], style: 'bodyText' },
              { text: [{ text: 'Teléfono / Celular: ', bold: true }, `${patient?.celular || 'No registrado'}`], style: 'bodyText' }
            ]
          ]
        },
        layout: {
          fillColor: () => '#f8f9fa',
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#dee2e6',
          vLineColor: () => '#dee2e6',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 5,
          paddingBottom: () => 5
        },
        margin: [0, 0, 0, 20]
      },

      // ESPACIOS DE FIRMAS CON DATOS DEL PACIENTE Y ODONTÓLOGO LLENADOS
      {
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 190, y2: 0, lineWidth: 1, lineColor: '#666666' }], alignment: 'center', margin: [0, 25, 0, 0] },
              { text: '\nFirma del Paciente o Tutor', style: 'signatureTitle', alignment: 'center' },
              { text: `Nombre: ${declarantName}`, style: 'signatureSub', alignment: 'center' },
              { text: `C.I.: ${patientCi}`, style: 'signatureSub', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 190, y2: 0, lineWidth: 1, lineColor: '#666666' }], alignment: 'center', margin: [0, 25, 0, 0] },
              { text: '\nFirma del Odontólogo', style: 'signatureTitle', alignment: 'center' },
              { text: 'Ortodoncista Tratante', style: 'signatureSub', alignment: 'center' },
              { text: 'Sello y Matrícula Profesional', style: 'signatureSub', alignment: 'center' }
            ]
          }
        ],
        margin: [0, 0, 0, 18]
      },

      // LUGAR Y FECHA CON DATOS PRECARGADOS
      {
        columns: [
          { width: '*', text: [{ text: 'Lugar: ', bold: true }, `${clinicCity}`], style: 'bodyText' },
          { width: '*', text: [{ text: 'Fecha: ', bold: true }, `${formattedDate}`], style: 'bodyText', alignment: 'right' }
        ]
      }
    ],
    styles: commonStyles,
    pageMargins: [40, 30, 40, 30]
  };

  pdfMake.createPdf(docDefinition).download(`Consentimiento_Ortodoncia_${patient?.nombre || 'Paciente'}_${patient?.apellido || ''}.pdf`);
};

// ------------------------------------------------------------
// 3. PDF IMPLANTOLOGÍA (HISTORIA + CONSENTIMIENTO + PAGOS)
// ------------------------------------------------------------
export const generateImplantHistoryPdf = async (record, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Historia Clínica de Implantología'),
      buildPatientInfoBlock(patient),

      { text: 'I. MOTIVO DE CONSULTA Y ANTECEDENTES', style: 'sectionHeader' },
      { text: [{ text: 'Motivo: ', bold: true }, record.consultation_reason || 'Reemplazo dental'], style: 'bodyText' },
      { text: [{ text: 'Diabetes: ', bold: true }, record.has_diabetes ? 'Sí' : 'No', { text: '  |  Hipertensión: ', bold: true }, record.has_hypertension ? 'Sí' : 'No', { text: '  |  Fumador: ', bold: true }, record.smokes ? 'Sí' : 'No'], style: 'bodyText' },
      { text: [{ text: 'Causa de pérdida dental: ', bold: true }, record.tooth_loss_cause || '-'], style: 'bodyText', margin: [0, 0, 0, 10] },

      { text: 'II. EVALUACIÓN RADIOGRÁFICA Y ÓSEA (CBCT)', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [{ text: `Altura Ósea: ${record.bone_height_mm ? record.bone_height_mm + ' mm' : '-'}`, style: 'bodyText' }, { text: `Ancho Óseo: ${record.bone_width_mm ? record.bone_width_mm + ' mm' : '-'}`, style: 'bodyText' }, { text: `Calidad Ósea: ${record.bone_quality || '-'}`, style: 'bodyText' }]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10]
      },

      { text: 'III. DIAGNÓSTICO Y PLAN IMPLANTOLÓGICO', style: 'sectionHeader' },
      { text: [{ text: 'Diagnóstico: ', bold: true }, record.diagnosis || 'Edentulismo parcial/total'], style: 'bodyText' },
      { text: [{ text: 'Plan de Tratamiento: ', bold: true }, Array.isArray(record.treatment_plan) ? record.treatment_plan.join(', ') : '-'], style: 'bodyText' },
      { text: [{ text: 'Notas adicionales: ', bold: true }, record.treatment_plan_notes || 'Ninguna'], style: 'bodyText', margin: [0, 0, 0, 20] },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(record.history_patient_signature_url),
              { text: `\nFirma Paciente\nC.I.: ${patient?.ci || '-'}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              getSignatureImage(record.history_dentist_signature_url),
              { text: '\nFirma Odontólogo\nCirujano Implantólogo', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Implantologia_Historia_${patient?.nombre}_${patient?.apellido}.pdf`);
};

export const generateImplantConsentPdf = async (record, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Consentimiento Informado - Implantes Dentales'),
      buildPatientInfoBlock(patient),

      {
        text: `Yo, ${record.consent_holder_name || (patient?.nombre + ' ' + patient?.apellido)}, con C.I. ${record.consent_holder_ci || patient?.ci || ''}, declaro haber sido informado sobre el tratamiento con implantes dentales, sus riesgos (infección, hematomas, parestesia, falla de osteointegración), beneficios y alternativas. Autorizo voluntariamente al equipo médico de ${clinic?.nombre || 'la clínica'} a realizar la cirugía de colocación e intervención complementaria.`,
        style: 'legalBody',
        margin: [0, 10, 0, 20]
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(record.consent_patient_signature_url),
              { text: `\nFirma del Paciente / Declarante\nC.I.: ${record.consent_holder_ci || patient?.ci || ''}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              getSignatureImage(record.consent_dentist_signature_url),
              { text: '\nFirma y Sello del Odontólogo\nEspecialista Tratante', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Implantologia_Consentimiento_${patient?.nombre}_${patient?.apellido}.pdf`);
};

export const generateImplantPaymentPlanPdf = async (plan, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const stages = Array.isArray(plan.payment_stages) ? plan.payment_stages : [];

  const tableBody = [
    [
      { text: 'Etapa / Concepto', style: 'tableHeader' },
      { text: 'Porcentaje', style: 'tableHeader' },
      { text: 'Monto (Bs.)', style: 'tableHeader' },
      { text: 'Estado', style: 'tableHeader' }
    ],
    ...stages.map(stg => [
      { text: stg.label || '', style: 'bodyText' },
      { text: `${stg.percentage || 0}%`, style: 'bodyText' },
      { text: `${stg.amount ? stg.amount.toFixed(2) : '0.00'}`, style: 'bodyText' },
      { text: stg.paid ? `PAGADO (${stg.paid_date || ''})` : 'PENDIENTE', style: 'bodyText', bold: true, color: stg.paid ? '#198754' : '#dc3545' }
    ])
  ];

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Plan de Pagos de Implantología'),
      buildPatientInfoBlock(patient),

      { text: [{ text: 'Costo Total del Tratamiento: ', bold: true, fontSize: 11 }, { text: `${plan.currency || 'BOB'} ${plan.total_cost ? Number(plan.total_cost).toFixed(2) : '0.00'}`, bold: true, fontSize: 12, color: '#0d6efd' }], margin: [0, 0, 0, 10] },

      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        margin: [0, 0, 0, 15]
      },

      { text: 'Observaciones y Términos:', style: 'sectionHeader' },
      { text: plan.observations || 'Los pagos se realizarán en las etapas establecidas.', style: 'bodyText', margin: [0, 0, 0, 20] },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(plan.patient_signature_url),
              { text: `\nConformidad del Paciente\nC.I.: ${patient?.ci || ''}`, style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Plan_Pagos_Implantes_${patient?.nombre}_${patient?.apellido}.pdf`);
};

// ------------------------------------------------------------
// 4. PDF CIRUGÍA ORAL (HISTORIA MULTIPÁGINA + CONSENTIMIENTO)
// ------------------------------------------------------------
export const generateOralSurgeryHistoryPdf = async (record, followups = [], patient, clinic) => {
  const pdfMake = await getPdfMake();

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Historia Clínica de Cirugía Oral'),
      buildPatientInfoBlock(patient),

      { text: 'I. ENFERMEDAD ACTUAL Y MOTIVO', style: 'sectionHeader' },
      { text: [{ text: 'Motivo: ', bold: true }, record.consultation_reason || '-'], style: 'bodyText' },
      { text: [{ text: 'Enfermedad Actual: ', bold: true }, record.current_illness || '-'], style: 'bodyText', margin: [0, 0, 0, 8] },

      { text: 'II. ANTECEDENTES Y EXAMEN CLÍNICO', style: 'sectionHeader' },
      { text: [{ text: 'Alergias: ', bold: true }, record.allergies_detail || 'Ninguna', { text: '  |  Medicamentos: ', bold: true }, record.medications_detail || 'Ninguno'], style: 'bodyText' },
      { text: [{ text: 'Examen Extraoral: ', bold: true }, record.facial_symmetry || 'Simétrico', { text: '  |  Apertura Bucal: ', bold: true }, record.mouth_opening || 'Normal'], style: 'bodyText' },
      { text: [{ text: 'Piezas Involucradas: ', bold: true }, record.teeth_involved || '-'], style: 'bodyText', margin: [0, 0, 0, 8] },

      { text: 'III. PROCEDIMIENTO QUIRÚRGICO Y SUTURA', style: 'sectionHeader' },
      { text: [{ text: 'Tipo de Cirugía: ', bold: true }, record.surgery_type || '-'], style: 'bodyText' },
      { text: [{ text: 'Anestesia Usada: ', bold: true }, record.anesthesia_used || '-'], style: 'bodyText' },
      { text: [{ text: 'Técnica Quirúrgica: ', bold: true }, record.surgical_technique || '-'], style: 'bodyText' },
      { text: [{ text: 'Sutura: ', bold: true }, record.suture || '-'], style: 'bodyText' },
      { text: [{ text: 'Medicación Prescrita: ', bold: true }, record.medication_prescribed || '-'], style: 'bodyText', margin: [0, 0, 0, 8] },

      { text: 'IV. INDICACIONES POSTOPERATORIAS', style: 'sectionHeader' },
      { text: record.postoperative_instructions || 'Reposo absoluto, hielo local 24h, dieta blanda y fría.', style: 'bodyText', margin: [0, 0, 0, 10] },

      { text: 'V. CONTROLES Y EVOLUCIÓN POST-QUIRÚRGICA', style: 'sectionHeader' },
      followups.length > 0 ? {
        table: {
          widths: ['auto', 'auto', '*'],
          body: [
            [{ text: 'N.º Control', style: 'tableHeader' }, { text: 'Fecha', style: 'tableHeader' }, { text: 'Hallazgos Clínicos', style: 'tableHeader' }],
            ...followups.map(f => [
              { text: `Control #${f.control_number || 1}`, style: 'bodyText' },
              { text: f.control_date || '', style: 'bodyText' },
              { text: f.findings || '', style: 'bodyText' }
            ])
          ]
        },
        margin: [0, 0, 0, 15]
      } : { text: 'Sin controles registrados.', style: 'bodyText', margin: [0, 0, 0, 15] },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(record.history_patient_signature_url),
              { text: `\nFirma Paciente\nC.I.: ${patient?.ci || ''}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              getSignatureImage(record.history_dentist_signature_url),
              { text: '\nFirma Cirujano Bucomaxilofacial', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Cirugia_Oral_Historia_${patient?.nombre}_${patient?.apellido}.pdf`);
};

export const generateOralSurgeryConsentPdf = async (record, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Consentimiento Informado para Cirugía Oral'),
      buildPatientInfoBlock(patient),

      {
        text: `Yo, ${patient?.nombre} ${patient?.apellido}, con C.I. ${record.consent_holder_ci || patient?.ci || ''}, declaro que el cirujano me ha explicado de forma clara el procedimiento quirúrgico de (${record.consent_procedure || 'Cirugía Oral'}), sus riesgos (sangrado, hematomas, infección, parestesia), beneficios e indicaciones. Autorizo libre y voluntariamente la intervención quirúrgica en ${clinic?.nombre || 'la clínica'}.`,
        style: 'legalBody',
        margin: [0, 10, 0, 20]
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(record.consent_patient_signature_url),
              { text: `\nFirma Paciente / Declarante\nC.I.: ${record.consent_holder_ci || patient?.ci || ''}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              getSignatureImage(record.consent_dentist_signature_url),
              { text: '\nFirma y Sello del Cirujano', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Cirugia_Oral_Consentimiento_${patient?.nombre}_${patient?.apellido}.pdf`);
};
