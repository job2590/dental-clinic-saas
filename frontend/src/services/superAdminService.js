// services/superAdminService.js

const CLINICS_KEY = 'saas_clinics';
const USERS_KEY = 'saas_users';

// Semilla inicial
const initDatabase = () => {
  let clinics = JSON.parse(localStorage.getItem(CLINICS_KEY));
  let users = JSON.parse(localStorage.getItem(USERS_KEY));

  if (!clinics) {
    clinics = [
      {
        id: '1',
        uuid: crypto.randomUUID(),
        nombre: 'Dental Clinic Amanecer',
        direccion: 'Av. Principal 123',
        telefono: '555-0192',
        correo: 'contacto@amanecer.com',
        plan: 'Premium',
        estado: 'Activa',
        fecha_registro: new Date().toISOString(),
        logo: '',
        color_principal: '#0d6efd'
      }
    ];
    localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
  }

  if (!users) {
    users = [
      {
        id: 'sa-1',
        email: 'superadmin@saas.com',
        password: 'admin', // En Supabase esto estará en auth.users y no será visible. Para esta demo lo dejamos en texto plano.
        name: 'Super Administrador',
        role: 'superadmin',
        clinic_id: null
      },
      {
        id: 'u-1',
        email: 'admin@clinica.com',
        password: 'admin',
        name: 'Dr. Admin',
        role: 'admin',
        clinic_id: '1'
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

// Asegurar que la BD esté inicializada al cargar el módulo
initDatabase();

// --- Auth ---

export const authenticateUser = async (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        resolve({ user });
      } else {
        resolve({ error: { message: 'Credenciales inválidas o usuario no existe.' } });
      }
    }, 500);
  });
};

export const getClinicById = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      resolve(clinics.find(c => c.id === id) || null);
    }, 200);
  });
};

// --- Clinics CRUD ---

export const getClinics = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      resolve(clinics);
    }, 300);
  });
};

export const createClinic = async (clinicData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      const newId = String(Date.now());
      const newClinic = {
        ...clinicData,
        id: newId,
        uuid: crypto.randomUUID(),
        fecha_registro: new Date().toISOString(),
        estado: 'Activa'
      };
      clinics.push(newClinic);
      localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
      resolve(newClinic);
    }, 400);
  });
};

export const updateClinic = async (id, clinicData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      const index = clinics.findIndex(c => c.id === id);
      if (index !== -1) {
        clinics[index] = { ...clinics[index], ...clinicData };
        localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
        resolve(clinics[index]);
      } else {
        resolve(null);
      }
    }, 400);
  });
};

export const changeClinicStatus = async (id, estado) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      const index = clinics.findIndex(c => c.id === id);
      if (index !== -1) {
        clinics[index].estado = estado; // 'Activa' o 'Suspendida'
        localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
        resolve(clinics[index]);
      } else {
        resolve(null);
      }
    }, 300);
  });
};

export const deleteClinic = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      clinics = clinics.filter(c => c.id !== id);
      localStorage.setItem(CLINICS_KEY, JSON.stringify(clinics));
      // También podríamos borrar usuarios de esta clínica, etc.
      resolve(true);
    }, 300);
  });
};

// --- Users CRUD ---

export const getUsersByClinic = async (clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      resolve(users.filter(u => u.clinic_id === clinicId));
    }, 300);
  });
};

export const createUser = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const newUser = {
        ...userData,
        id: 'u-' + Date.now(),
        role: userData.role || 'admin'
      };
      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      resolve(newUser);
    }, 400);
  });
};

export const updateUser = async (id, userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        resolve(users[index]);
      } else {
        resolve(null);
      }
    }, 300);
  });
};

export const deleteUser = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      users = users.filter(u => u.id !== id);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      resolve(true);
    }, 300);
  });
};

// --- Stats ---

export const getGlobalStats = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const clinics = JSON.parse(localStorage.getItem(CLINICS_KEY)) || [];
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
      resolve({
        totalClinics: clinics.length,
        activeClinics: clinics.filter(c => c.estado === 'Activa').length,
        suspendedClinics: clinics.filter(c => c.estado === 'Suspendida').length,
        totalUsers: users.filter(u => u.role !== 'superadmin').length
      });
    }, 300);
  });
};
