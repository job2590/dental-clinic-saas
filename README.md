# Dental Clinic Amanecer (SaaS Platform)

Dental Clinic Amanecer es una avanzada plataforma SaaS (Software as a Service) Multi-Clínica diseñada específicamente para el sector odontológico. Provee un robusto sistema de gestión (CRM) para administrar pacientes, citas, tratamientos, historias clínicas, radiografías y pagos, con un panel global de administración (SuperAdmin).

## 🌟 Características Principales

* **Arquitectura SaaS Multi-Tenant:** Aislamiento total de datos por clínica (`clinic_id`). Cada cliente tiene acceso exclusivo a sus datos.
* **Módulo SuperAdmin:** Panel global para registrar, suspender y administrar clínicas y sus administradores.
* **Odontograma Interactivo:** Registro visual de piezas dentales (caries, endodoncias, implantes, etc.) con nomenclatura FDI.
* **Gestión de Imágenes:** Galería clínica para subir y visualizar radiografías panorámicas, periapicales y tomografías.
* **Caja y Pagos:** Seguimiento financiero de cada paciente, control de saldos y emisión de recibos.
* **UI/UX Moderna:** Interfaz responsiva, rápida y animada construida con React y Bootstrap, con soporte para identidad de marca (White-labeling).

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React.js, Vite, React Router v6, Bootstrap 5, Chart.js, SweetAlert2.
* **Backend:** Node.js (Próximamente), Supabase (Autenticación y Base de Datos PostgreSQL).
* **Despliegue:** Preparado para Vercel (Frontend) y Render (Backend).

## 📁 Estructura del Proyecto

```
dental-clinic-amanecer/
├── frontend/               # Código del Cliente SaaS
├── backend/                # Lógica del servidor
└── database/               # Esquemas SQL
```

## 📄 Licencia

Este es un software de código cerrado y propietario. Todos los derechos reservados © 2026 Dental Clinic Amanecer SaaS. Queda estrictamente prohibida la copia, distribución, modificación o uso no autorizado de este código fuente.
