-- ==============================================================================
-- Dental Clinic Amanecer - PostgreSQL Database Schema
-- Preparado para integrarse con Supabase
-- ==============================================================================

-- Habilitar extensión para generar UUIDs (si se manejan fuera de Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USUARIOS Y ROLES
-- ==============================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Se asume el id como UUID para enlazarse con auth.users en Supabase
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. PACIENTES Y GESTIÓN CLÍNICA
-- ==============================================================================

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    documento_identidad VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    alergias TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historias_clinicas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
    antecedentes_medicos TEXT,
    antecedentes_familiares TEXT,
    medicacion_actual TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    odontologo_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INT DEFAULT 30,
    estado VARCHAR(20) DEFAULT 'Pendiente', -- Pendiente, Confirmada, Completada, Cancelada
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. TRATAMIENTOS Y FINANZAS
-- ==============================================================================

CREATE TABLE tratamientos (
    id SERIAL PRIMARY KEY,
    historia_clinica_id INT NOT NULL REFERENCES historias_clinicas(id) ON DELETE CASCADE,
    odontologo_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    descripcion TEXT NOT NULL,
    costo_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(30) DEFAULT 'Planificado', -- Planificado, En progreso, Finalizado, Cancelado
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    monto NUMERIC(10, 2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50) NOT NULL, -- Efectivo, Tarjeta, Transferencia
    referencia VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. MÓDULOS DE ESPECIALIDADES
-- ==============================================================================

CREATE TABLE odontogramas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    diente_numero INT NOT NULL,
    estado_diente VARCHAR(50) NOT NULL, -- Caries, Sano, Ausente, Obturado, etc.
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imagenes (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL,
    tipo VARCHAR(50), -- Foto clínica, Extraoral, Intraoral
    descripcion TEXT,
    fecha_captura DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE radiografias (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    tipo VARCHAR(50), -- Panorámica, Periapical, Cefalométrica
    observaciones TEXT,
    fecha_toma DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE implantes (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    diente_numero INT NOT NULL,
    marca_implante VARCHAR(100),
    dimensiones VARCHAR(50),
    fecha_cirugia DATE,
    estado_integracion VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ortodoncia (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    tipo_brackets VARCHAR(50), -- Metálicos, Zafiro, Invisibles
    fase_actual VARCHAR(100),
    proxima_revision DATE,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE periodoncia (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    profundidad_bolsas VARCHAR(255),
    sangrado BOOLEAN DEFAULT FALSE,
    movilidad_dental VARCHAR(50),
    diagnostico TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE endodoncia (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    diente_numero INT NOT NULL,
    conductos_tratados INT,
    longitud_trabajo VARCHAR(50),
    material_obturacion VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE protesis (
    id SERIAL PRIMARY KEY,
    tratamiento_id INT NOT NULL REFERENCES tratamientos(id) ON DELETE CASCADE,
    tipo_protesis VARCHAR(50), -- Fija, Removible, Total
    material VARCHAR(100),
    dientes_involucrados VARCHAR(100),
    fecha_impresion DATE,
    fecha_instalacion DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. ÍNDICES (Optimización de consultas)
-- ==============================================================================

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_pacientes_doc ON pacientes(documento_identidad);
CREATE INDEX idx_pacientes_nombre ON pacientes(apellidos, nombre);
CREATE INDEX idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX idx_citas_paciente ON citas(paciente_id);
CREATE INDEX idx_citas_odontologo ON citas(odontologo_id);
CREATE INDEX idx_tratamientos_hc ON tratamientos(historia_clinica_id);
CREATE INDEX idx_pagos_tratamiento ON pagos(tratamiento_id);
CREATE INDEX idx_odontogramas_paciente ON odontogramas(paciente_id);
