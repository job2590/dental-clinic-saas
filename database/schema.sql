-- ==============================================================================
-- Dental Clinic Amanecer SaaS - PostgreSQL Database Schema (Supabase)
-- ALINEADO con el Frontend React existente
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- LIMPIEZA
-- ==============================================================================
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS radiografias CASCADE;
DROP TABLE IF EXISTS odontogramas CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS tratamientos CASCADE;
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS historias_clinicas CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;

-- ==============================================================================
-- 1. CLINICAS Y ROLES
-- ==============================================================================

CREATE TABLE clinics (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    correo VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'Básico',
    estado VARCHAR(50) DEFAULT 'Activa',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logo TEXT,
    color_principal VARCHAR(20) DEFAULT '#0d6efd'
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

INSERT INTO roles (nombre, descripcion) VALUES 
('SuperAdmin', 'Administrador Global del SaaS'),
('Admin', 'Administrador de una clínica'),
('Odontologo', 'Médico odontólogo de una clínica');

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id INT REFERENCES clinics(id) ON DELETE CASCADE,
    rol_id INT NOT NULL REFERENCES roles(id),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    avatar TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. PACIENTES (Columnas alineadas con PacienteForm.jsx)
-- ==============================================================================

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    codigo VARCHAR(20),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100),
    ci VARCHAR(50),
    fecha_nacimiento DATE,
    edad INT,
    sexo VARCHAR(20),
    estado_civil VARCHAR(30),
    profesion VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    celular VARCHAR(20),
    whatsapp VARCHAR(20),
    correo VARCHAR(255),
    contacto_emergencia VARCHAR(200),
    seguro VARCHAR(100),
    tipo_sangre VARCHAR(10),
    observaciones TEXT,
    foto_url TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, ci)
);

-- ==============================================================================
-- 3. HISTORIA CLINICA (Columnas alineadas con HistoriaClinicaForm.jsx)
-- ==============================================================================

CREATE TABLE historias_clinicas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    -- Tab 1: Motivo de Consulta
    motivo_consulta TEXT,
    enfermedad_actual TEXT,
    -- Tab 2: Antecedentes Médicos
    diabetes BOOLEAN DEFAULT FALSE,
    hipertension BOOLEAN DEFAULT FALSE,
    cardiacas BOOLEAN DEFAULT FALSE,
    respiratorias BOOLEAN DEFAULT FALSE,
    hemorragicos BOOLEAN DEFAULT FALSE,
    hepatitis BOOLEAN DEFAULT FALSE,
    vih BOOLEAN DEFAULT FALSE,
    embarazo BOOLEAN DEFAULT FALSE,
    alergias TEXT,
    medicamentos TEXT,
    cirugias TEXT,
    otros_antecedentes TEXT,
    -- Tab 3: Antecedentes Odontológicos
    ultima_visita VARCHAR(100),
    cepillado VARCHAR(50),
    hilo_dental BOOLEAN DEFAULT FALSE,
    habitos TEXT,
    tratamientos_previos TEXT,
    -- Tab 4: Examen Clínico Extraoral
    simetria_facial VARCHAR(100),
    atm VARCHAR(100),
    ganglios VARCHAR(100),
    labios VARCHAR(100),
    -- Tab 4: Examen Clínico Intraoral
    mucosa VARCHAR(100),
    lengua VARCHAR(100),
    piso_boca VARCHAR(100),
    paladar VARCHAR(100),
    encias VARCHAR(100),
    higiene_oral VARCHAR(50),
    caries VARCHAR(200),
    restauraciones VARCHAR(200),
    movilidad VARCHAR(200),
    oclusion VARCHAR(200),
    -- Tab 5: Diagnóstico y Plan
    examenes TEXT,
    diagnostico TEXT,
    plan_tratamiento TEXT,
    -- Tab 6: Firmas (base64)
    firma_paciente TEXT,
    firma_odontologo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. CITAS (Columnas alineadas con AgendaPage.jsx)
-- ==============================================================================

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    odontologo_id UUID REFERENCES usuarios(id),
    title VARCHAR(255),
    start TIMESTAMP WITH TIME ZONE NOT NULL,
    "end" TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(20) DEFAULT 'Pendiente',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. TRATAMIENTOS (Columnas alineadas con TratamientosPage.jsx)
-- ==============================================================================

CREATE TABLE tratamientos (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    odontologo_id UUID REFERENCES usuarios(id),
    fecha DATE DEFAULT CURRENT_DATE,
    pieza VARCHAR(20),
    diagnostico TEXT,
    tratamiento TEXT,
    costo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    descuento NUMERIC(10, 2) DEFAULT 0.00,
    saldo NUMERIC(10, 2) DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'Pendiente',
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. PAGOS (Columnas alineadas con PagosPage.jsx y CajaPage.jsx)
-- ==============================================================================

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tratamiento_id INT REFERENCES tratamientos(id) ON DELETE SET NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    monto NUMERIC(10, 2) NOT NULL,
    metodo VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    observacion TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. ODONTOGRAMA
-- ==============================================================================

CREATE TABLE odontogramas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    dientes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. RADIOGRAFIAS (Columnas alineadas con RadiografiasPage.jsx)
-- ==============================================================================

CREATE TABLE radiografias (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    notas TEXT,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. NOTIFICACIONES
-- ==============================================================================

CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    clinic_id INT REFERENCES clinics(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'sistema',
    leida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. ÍNDICES
-- ==============================================================================

CREATE INDEX idx_usuarios_clinic ON usuarios(clinic_id);
CREATE INDEX idx_pacientes_clinic ON pacientes(clinic_id);
CREATE INDEX idx_citas_clinic ON citas(clinic_id);
CREATE INDEX idx_tratamientos_clinic ON tratamientos(clinic_id);
CREATE INDEX idx_pagos_clinic ON pagos(clinic_id);
CREATE INDEX idx_odontogramas_clinic ON odontogramas(clinic_id);
CREATE INDEX idx_radiografias_clinic ON radiografias(clinic_id);
CREATE INDEX idx_notificaciones_clinic ON notificaciones(clinic_id);

-- ==============================================================================
-- SUPER ADMIN INICIAL
-- ==============================================================================
INSERT INTO usuarios (rol_id, nombre, email, password, activo) 
VALUES (1, 'Super Admin', 'superadmin@saas.com', 'admin', true);

-- ==============================================================================
-- DESACTIVAR RLS (para desarrollo)
-- ==============================================================================
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE historias_clinicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE tratamientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE odontogramas DISABLE ROW LEVEL SECURITY;
ALTER TABLE radiografias DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- INSTRUCCIONES PARA SUPABASE STORAGE
-- ==============================================================================
-- 1. Ve a Supabase Dashboard > Storage
-- 2. Crea los siguientes buckets como PUBLICOS:
--    - avatars
--    - logos
--    - patient-photos
--    - radiografias
-- 3. En cada bucket, ve a Policies y crea:
--    - Policy para SELECT: Allow all (anon, authenticated)
--    - Policy para INSERT: Allow all (anon, authenticated)
--    - Policy para UPDATE: Allow all (anon, authenticated)
--    - Policy para DELETE: Allow all (anon, authenticated)
-- 
-- O ejecuta en SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('patient-photos', 'patient-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('radiografias', 'radiografias', true);
--
-- CREATE POLICY "Acceso publico lectura" ON storage.objects FOR SELECT USING (true);
-- CREATE POLICY "Acceso publico subida" ON storage.objects FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Acceso publico update" ON storage.objects FOR UPDATE USING (true);
-- CREATE POLICY "Acceso publico delete" ON storage.objects FOR DELETE USING (true);
