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

## 🚀 Instalación y Desarrollo Local

### Prerrequisitos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16+ recomendada).

### Pasos
1. Clona este repositorio:
   ```bash
   git clone https://github.com/tu-usuario/dental-clinic-amanecer.git
   cd dental-clinic-amanecer
   ```

2. Instala las dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre tu navegador en `http://localhost:5173`.

### Credenciales de Prueba (Entorno de Desarrollo)
En modo desarrollo, el sistema simula la base de datos mediante `localStorage`. Puedes ingresar con los siguientes usuarios de prueba:

* **SuperAdmin (Panel Global SaaS):**
  * Correo: `superadmin@saas.com`
  * Contraseña: `admin`
* **Administrador de Clínica (Panel Médico):**
  * Correo: `admin@clinica.com`
  * Contraseña: `admin`

## 📁 Estructura del Proyecto

```
dental-clinic-amanecer/
├── frontend/
│   ├── public/             # Archivos estáticos
│   ├── src/
│   │   ├── components/     # Componentes reutilizables (Sidebar, Layout, Odontograma...)
│   │   ├── context/        # Contextos globales (AuthContext)
│   │   ├── pages/          # Vistas principales separadas por módulos
│   │   └── services/       # Lógica de datos y llamadas a la API (Mock de BD)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/                # Lógica del servidor (En desarrollo)
└── database/               # Scripts y esquemas SQL (Supabase)
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.
