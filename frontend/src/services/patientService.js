const STORAGE_KEY = 'clinic_patients';

const getStoredPatients = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredPatients = (patients) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
};

// Generar código estilo PAC-0001
const generateCode = (currentCount) => {
  const nextNum = currentCount + 1;
  return `PAC-${String(nextNum).padStart(4, '0')}`;
};

export const getPatients = async (clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredPatients();
      resolve(all.filter(p => p.clinic_id === String(clinicId)));
    }, 300);
  });
};

export const getPatientById = async (id, clinicId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const patients = getStoredPatients();
      const patient = patients.find(p => p.id === String(id) && p.clinic_id === String(clinicId));
      if (patient) {
        resolve(patient);
      } else {
        reject(new Error('Paciente no encontrado'));
      }
    }, 300);
  });
};

export const createPatient = async (patientData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const patients = getStoredPatients();
      const clinicPatients = patients.filter(p => p.clinic_id === String(clinicId));
      const newPatient = {
        ...patientData,
        id: Date.now().toString(),
        clinic_id: String(clinicId),
        codigo: generateCode(clinicPatients.length),
        fecha_registro: new Date().toISOString(),
      };
      patients.unshift(newPatient); // Agregar al inicio
      saveStoredPatients(patients);
      resolve(newPatient);
    }, 500);
  });
};

export const updatePatient = async (id, patientData, clinicId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const patients = getStoredPatients();
      const index = patients.findIndex(p => p.id === String(id) && p.clinic_id === String(clinicId));
      
      if (index !== -1) {
        // Mantener id, codigo y fecha_registro originales
        const originalPatient = patients[index];
        patients[index] = {
          ...originalPatient,
          ...patientData,
          id: originalPatient.id,
          clinic_id: originalPatient.clinic_id,
          codigo: originalPatient.codigo,
          fecha_registro: originalPatient.fecha_registro
        };
        saveStoredPatients(patients);
        resolve(patients[index]);
      } else {
        reject(new Error('Paciente no encontrado'));
      }
    }, 500);
  });
};

export const deletePatient = async (id, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const patients = getStoredPatients();
      const filtered = patients.filter(p => !(p.id === String(id) && p.clinic_id === String(clinicId)));
      saveStoredPatients(filtered);
      resolve(true);
    }, 400);
  });
};
