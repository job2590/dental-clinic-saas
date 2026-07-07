-- ==============================================================================
-- Dental Clinic Amanecer SaaS - PostgreSQL Database Schema (Supabase)
-- ==============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- LIMPIEZA DE TABLAS EXISTENTES (Si las hay)
-- ==============================================================================
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
-- 1. SaaS GLOBAL: Clínicas y Usuarios Administradores
-- ==============================================================================

CREATE TABLE clinics (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    correo VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'Básico',
    estado VARCHAR(50) DEFAULT 'Activo',
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
    clinic_id INT REFERENCES clinics(id) ON DELETE CASCADE, -- NULL si es SuperAdmin
    rol_id INT NOT NULL REFERENCES roles(id),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- En producción debe estar en auth.users, pero mantenemos simpleza
    telefono VARCHAR(20),
    avatar TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. PACIENTES Y GESTIÓN CLÍNICA (Multi-Tenant)
-- ==============================================================================

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    documento_identidad VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    alergias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, documento_identidad)
);

CREATE TABLE historias_clinicas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    antecedentes_medicos TEXT,
    antecedentes_familiares TEXT,
    medicacion_actual TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    odontologo_id UUID REFERENCES usuarios(id),
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INT DEFAULT 30,
    estado VARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Confirmada, Completada, Cancelada
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. TRATAMIENTOS Y FINANZAS
-- ==============================================================================

CREATE TABLE tratamientos (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    historia_clinica_id INT NOT NULL REFERENCES historias_clinicas(id) ON DELETE CASCADE,
    odontologo_id UUID REFERENCES usuarios(id),
    descripcion TEXT NOT NULL,
    costo_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'Planificado', 
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    monto NUMERIC(10, 2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) NOT NULL,
    referencia VARCHAR(100)
);

-- ==============================================================================
-- 4. ODONTOGRAMA
-- ==============================================================================

CREATE TABLE odontogramas (
    id SERIAL PRIMARY KEY,
    clinic_id INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    dientes JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. ÍNDICES (Para consultas rápidas multi-tenant)
-- ==============================================================================

CREATE INDEX idx_usuarios_clinic ON usuarios(clinic_id);
CREATE INDEX idx_pacientes_clinic ON pacientes(clinic_id);
CREATE INDEX idx_citas_clinic ON citas(clinic_id);
CREATE INDEX idx_tratamientos_clinic ON tratamientos(clinic_id);
CREATE INDEX idx_pagos_clinic ON pagos(clinic_id);
CREATE INDEX idx_odontogramas_clinic ON odontogramas(clinic_id);

-- ==============================================================================
-- INSERCIÓN DE DATOS INICIALES (SUPER ADMIN)
-- ==============================================================================
INSERT INTO usuarios (rol_id, nombre, email, password, activo) 
VALUES (1, 'Super Admin', 'superadmin@saas.com', 'admin', true);
