-- ============================================================
-- SCRIPT DE BASE DE DATOS: MÓDULOS DE ESPECIALIDADES CLÍNICAS
-- Ortodoncia, Implantología, Cirugía Oral y Plantillas
-- ============================================================

-- Habilitar extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. TABLA: PLANTILLAS DE CONSENTIMIENTO EDITABLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_templates (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    module_type VARCHAR(50) NOT NULL, -- 'orthodontics', 'implantology', 'oral_surgery'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, module_type)
);

-- ------------------------------------------------------------
-- 2. TABLAS: ORTODONCIA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orthodontic_records (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Datos personales (para respaldo o copia al momento del registro)
    patient_name TEXT NOT NULL,
    age INT,
    gender VARCHAR(20),
    birth_date DATE,
    occupation TEXT,
    phone TEXT,
    consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Motivo de consulta
    consultation_reasons JSONB DEFAULT '[]'::jsonb,
    consultation_other TEXT,

    -- Antecedentes médicos
    systemic_diseases JSONB DEFAULT '[]'::jsonb,
    systemic_other TEXT,
    has_allergies BOOLEAN DEFAULT false,
    allergies_detail TEXT,
    takes_medications BOOLEAN DEFAULT false,
    medications_detail TEXT,
    has_surgeries BOOLEAN DEFAULT false,
    surgeries_detail TEXT,
    has_hospitalizations BOOLEAN DEFAULT false,
    hospitalizations_detail TEXT,

    -- Antecedentes odontológicos
    previous_orthodontics BOOLEAN DEFAULT false,
    extractions BOOLEAN DEFAULT false,
    dental_trauma BOOLEAN DEFAULT false,
    bruxism BOOLEAN DEFAULT false,

    -- Hábitos
    habits JSONB DEFAULT '[]'::jsonb,
    habits_other TEXT,

    -- Examen extraoral
    profile VARCHAR(50),
    facial_symmetry VARCHAR(50),
    lip_competence VARCHAR(50),
    smile_type VARCHAR(50),

    -- Examen intraoral
    oral_hygiene VARCHAR(50),
    periodontal_status VARCHAR(50),
    molar_relation VARCHAR(50),
    canine_relation VARCHAR(50),
    overjet VARCHAR(50),
    overbite VARCHAR(50),
    midline VARCHAR(50),
    crowding VARCHAR(50),
    has_diastemas BOOLEAN DEFAULT false,
    crossbite VARCHAR(50),

    -- Exámenes complementarios
    complementary_exams JSONB DEFAULT '[]'::jsonb,

    -- Diagnóstico y tratamiento
    diagnosis TEXT,
    treatment_plan TEXT,
    observations TEXT,

    -- Consentimiento informado y firmas
    consent_given BOOLEAN DEFAULT false,
    consent_holder_name TEXT,
    consent_holder_ci TEXT,
    tutor_name TEXT,
    patient_signature_url TEXT,
    dentist_signature_url TEXT,
    consent_location TEXT,
    consent_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orthodontic_record_images (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    orthodontic_record_id INT NOT NULL REFERENCES orthodontic_records(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. TABLAS: IMPLANTOLOGÍA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS implant_records (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Datos personales
    patient_name TEXT NOT NULL,
    age INT,
    gender VARCHAR(20),
    phone TEXT,
    consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Motivo de consulta
    consultation_reason TEXT,

    -- Antecedentes médicos
    has_diabetes BOOLEAN DEFAULT false,
    has_hypertension BOOLEAN DEFAULT false,
    has_heart_disease BOOLEAN DEFAULT false,
    has_allergies BOOLEAN DEFAULT false,
    allergies_detail TEXT,
    medications_detail TEXT,
    smokes BOOLEAN DEFAULT false,
    medical_other TEXT,

    -- Antecedentes odontológicos
    tooth_loss_cause VARCHAR(50),
    tooth_loss_cause_other TEXT,
    previous_treatments TEXT,

    -- Examen clínico
    oral_hygiene VARCHAR(50),
    gum_status VARCHAR(50),
    prosthetic_space VARCHAR(50),
    occlusion TEXT,

    -- Evaluación radiográfica (CBCT/Panorámica)
    bone_height_mm NUMERIC(6,2),
    bone_width_mm NUMERIC(6,2),
    bone_quality VARCHAR(10),
    anatomical_risk_structures BOOLEAN DEFAULT false,
    anatomical_risk_detail TEXT,

    -- Diagnóstico y plan
    diagnosis TEXT,
    treatment_plan JSONB DEFAULT '[]'::jsonb,
    treatment_plan_notes TEXT,

    -- Firmas de la Historia Clínica
    history_patient_signature_url TEXT,
    history_dentist_signature_url TEXT,

    -- Consentimiento informado
    consent_given BOOLEAN DEFAULT false,
    consent_holder_name TEXT,
    consent_holder_ci TEXT,
    consent_date DATE DEFAULT CURRENT_DATE,
    consent_patient_signature_url TEXT,
    consent_dentist_signature_url TEXT,
    consent_dentist_seal_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implant_evolution_notes (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    implant_record_id INT NOT NULL REFERENCES implant_records(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    procedure_performed TEXT NOT NULL,
    clinical_findings TEXT,
    dentist_signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implant_payment_plans (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    implant_record_id INT REFERENCES implant_records(id) ON DELETE SET NULL,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    treatment_description TEXT,
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'BOB',
    payment_stages JSONB DEFAULT '[
      {"label": "Cirugía de colocación del implante", "percentage": 50, "amount": 0, "paid": false, "paid_date": null},
      {"label": "Inicio de rehabilitación protésica", "percentage": 25, "amount": 0, "paid": false, "paid_date": null},
      {"label": "Entrega de prótesis definitiva", "percentage": 25, "amount": 0, "paid": false, "paid_date": null}
    ]'::jsonb,
    observations TEXT,
    patient_signature_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implant_record_images (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    implant_record_id INT NOT NULL REFERENCES implant_records(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. TABLAS: CIRUGÍA ORAL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oral_surgery_records (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    record_number TEXT,

    -- I. Datos del paciente
    patient_name TEXT NOT NULL,
    age INT,
    gender VARCHAR(20),
    birth_date DATE,
    ci TEXT,
    address TEXT,
    phone TEXT,
    occupation TEXT,
    consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- II y III
    consultation_reason TEXT,
    current_illness TEXT,

    -- IV. Antecedentes médicos
    has_diabetes BOOLEAN DEFAULT false,
    has_hypertension BOOLEAN DEFAULT false,
    has_heart_disease BOOLEAN DEFAULT false,
    has_kidney_disease BOOLEAN DEFAULT false,
    has_liver_disease BOOLEAN DEFAULT false,
    has_coagulation_disorder BOOLEAN DEFAULT false,
    has_asthma BOOLEAN DEFAULT false,
    has_epilepsy BOOLEAN DEFAULT false,
    is_pregnant BOOLEAN DEFAULT false,
    allergies_detail TEXT,
    medications_detail TEXT,
    previous_surgeries TEXT,
    medical_other TEXT,

    -- V. Antecedentes odontológicos
    dental_history_notes TEXT,

    -- VI. Hábitos
    smokes BOOLEAN DEFAULT false,
    drinks_alcohol BOOLEAN DEFAULT false,
    habits_other TEXT,

    -- VII. Examen clínico — Extraoral
    facial_symmetry TEXT,
    mouth_opening TEXT,
    lymph_nodes TEXT,
    tmj_status TEXT,
    extraoral_other_findings TEXT,

    -- VII. Examen clínico — Intraoral
    oral_mucosa TEXT,
    gums TEXT,
    teeth_involved TEXT,
    oral_hygiene VARCHAR(50),
    lesions TEXT,
    intraoral_other_findings TEXT,

    -- VIII. Exámenes complementarios
    complementary_exams JSONB DEFAULT '[]'::jsonb,
    complementary_exams_other TEXT,

    -- IX y X
    diagnosis TEXT,
    treatment_plan TEXT,

    -- XI. Procedimiento quirúrgico
    surgery_type TEXT,
    anesthesia_used TEXT,
    surgical_technique TEXT,
    operative_findings TEXT,
    suture TEXT,
    medication_prescribed TEXT,

    -- XII. Indicaciones postoperatorias
    postoperative_instructions TEXT,

    -- Firmas de la Historia Clínica
    history_patient_signature_url TEXT,
    history_dentist_signature_url TEXT,

    -- Consentimiento informado
    consent_given BOOLEAN DEFAULT false,
    consent_procedure TEXT,
    consent_holder_ci TEXT,
    consent_date DATE DEFAULT CURRENT_DATE,
    consent_patient_signature_url TEXT,
    consent_dentist_signature_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oral_surgery_followups (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    oral_surgery_record_id INT NOT NULL REFERENCES oral_surgery_records(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    control_number INT,
    control_date DATE NOT NULL DEFAULT CURRENT_DATE,
    findings TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oral_surgery_record_images (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    oral_surgery_record_id INT NOT NULL REFERENCES oral_surgery_records(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ÍNDICES PARA RENDIMIENTO MULTI-CLÍNICA Y BÚSQUEDAS
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ortho_clinic_patient ON orthodontic_records(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_implant_clinic_patient ON implant_records(clinic_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_surgery_clinic_patient ON oral_surgery_records(clinic_id, patient_id);
