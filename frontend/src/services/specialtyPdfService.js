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
  headerTitle: { fontSize: 16, bold: true, color: '#0d6efd' },
  headerSub: { fontSize: 10, color: '#666666' },
  docTitle: { fontSize: 14, bold: true, alignment: 'right' },
  docDate: { fontSize: 10, alignment: 'right' },
  sectionHeader: { fontSize: 11, bold: true, color: '#0d6efd', margin: [0, 8, 0, 4] },
  tableHeader: { fontSize: 9, bold: true, fillColor: '#f8f9fa' },
  bodyText: { fontSize: 9, margin: [0, 2, 0, 2] },
  legalText: { fontSize: 9, alignment: 'justify', margin: [0, 10, 0, 20] },
  signatureTitle: { fontSize: 9, bold: true },
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
          { text: (clinic?.telefono || '') + ' | ' + (clinic?.correo || ''), style: 'headerSub' }
        ]
      },
      {
        width: 'auto',
        text: [
          { text: title.toUpperCase() + '\n', style: 'docTitle' },
          { text: `Fecha: ${new Date().toLocaleDateString()}`, style: 'docDate' }
        ]
      }
    ],
    margin: [0, 0, 0, 10]
  },
  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 15] }
];

const buildPatientInfoBlock = (patient) => ({
  table: {
    widths: ['*', '*', '*'],
    body: [
      [
        { text: `Paciente: ${patient?.nombre || ''} ${patient?.apellido || ''}`, style: 'bodyText', bold: true },
        { text: `C.I.: ${patient?.ci || '-'}`, style: 'bodyText' },
        { text: `Edad: ${patient?.edad || '-'} años`, style: 'bodyText' }
      ],
      [
        { text: `Sexo: ${patient?.sexo || '-'}`, style: 'bodyText' },
        { text: `Celular: ${patient?.celular || '-'}`, style: 'bodyText' },
        { text: `Dirección: ${patient?.direccion || '-'}`, style: 'bodyText' }
      ]
    ]
  },
  layout: 'noBorders',
  margin: [0, 0, 0, 15]
});

// Helper para convertir base64/URL en elemento de imagen para pdfmake
const getSignatureImage = (signatureUrl) => {
  if (signatureUrl && signatureUrl.startsWith('data:image')) {
    return { image: signatureUrl, width: 140, height: 50, alignment: 'center' };
  }
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }], alignment: 'center', margin: [0, 40, 0, 0] };
};

// ------------------------------------------------------------
// 1. PDF ORTODONCIA
// ------------------------------------------------------------
export const generateOrthodonticPdf = async (record, patient, clinic) => {
  const pdfMake = await getPdfMake();

  const docDefinition = {
    content: [
      ...buildHeader(clinic, 'Historia Clínica de Ortodoncia'),
      buildPatientInfoBlock(patient),

      { text: 'I. MOTIVO DE CONSULTA Y ANTECEDENTES', style: 'sectionHeader' },
      { text: [{ text: 'Motivos de consulta: ', bold: true }, Array.isArray(record.consultation_reasons) ? record.consultation_reasons.join(', ') : '-'], style: 'bodyText' },
      { text: [{ text: 'Antecedentes Médicos: ', bold: true }, Array.isArray(record.systemic_diseases) ? record.systemic_diseases.join(', ') : 'Ninguno'], style: 'bodyText' },
      { text: [{ text: 'Alergias: ', bold: true }, record.has_allergies ? record.allergies_detail || 'Sí' : 'No'], style: 'bodyText' },
      { text: [{ text: 'Hábitos: ', bold: true }, Array.isArray(record.habits) ? record.habits.join(', ') : 'Ninguno'], style: 'bodyText', margin: [0, 0, 0, 10] },

      { text: 'II. EVALUACIÓN CLÍNICA ORTODÓNCICA', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [{ text: `Perfil: ${record.profile || '-'}`, style: 'bodyText' }, { text: `Simetría: ${record.facial_symmetry || '-'}`, style: 'bodyText' }, { text: `Sonrisa: ${record.smile_type || '-'}`, style: 'bodyText' }],
            [{ text: `Higiene: ${record.oral_hygiene || '-'}`, style: 'bodyText' }, { text: `Clase Molar: ${record.molar_relation || '-'}`, style: 'bodyText' }, { text: `Clase Canina: ${record.canine_relation || '-'}`, style: 'bodyText' }],
            [{ text: `Overjet: ${record.overjet || '-'}`, style: 'bodyText' }, { text: `Overbite: ${record.overbite || '-'}`, style: 'bodyText' }, { text: `Apiñamiento: ${record.crowding || '-'}`, style: 'bodyText' }]
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 10]
      },

      { text: 'III. DIAGNÓSTICO Y PLAN DE TRATAMIENTO', style: 'sectionHeader' },
      { text: [{ text: 'Diagnóstico: ', bold: true }, record.diagnosis || 'Sin registro'], style: 'bodyText' },
      { text: [{ text: 'Plan de Tratamiento: ', bold: true }, record.treatment_plan || 'Sin registro'], style: 'bodyText', margin: [0, 0, 0, 15] },

      { text: 'IV. CONSENTIMIENTO INFORMADO Y AUTORIZACIÓN', style: 'sectionHeader' },
      {
        text: `Declaro haber recibido información explicativa y satisfactoria sobre el tratamiento ortodóncico propuesto, sus beneficios, riesgos, hábitos de cuidado y retenedores posteriores. Autorizo al profesional tratante a ejecutar el plan de tratamiento en ${clinic?.nombre || 'la clínica'}.`,
        style: 'legalText'
      },

      {
        columns: [
          {
            width: '*',
            stack: [
              getSignatureImage(record.patient_signature_url),
              { text: `\nFirma del Paciente / Declarante\nC.I.: ${record.consent_holder_ci || patient?.ci || '-'}`, style: 'signatureTitle', alignment: 'center' }
            ]
          },
          {
            width: '*',
            stack: [
              getSignatureImage(record.dentist_signature_url),
              { text: '\nFirma y Sello del Odontólogo\nOrtodoncista Tratante', style: 'signatureTitle', alignment: 'center' }
            ]
          }
        ]
      }
    ],
    styles: commonStyles
  };

  pdfMake.createPdf(docDefinition).download(`Ortodoncia_${patient?.nombre}_${patient?.apellido}.pdf`);
};

// ------------------------------------------------------------
// 2. PDF IMPLANTOLOGÍA (HISTORIA + CONSENTIMIENTO + PAGOS)
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
        style: 'legalText'
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
// 3. PDF CIRUGÍA ORAL (HISTORIA MULTIPÁGINA + CONSENTIMIENTO)
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
        style: 'legalText'
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
