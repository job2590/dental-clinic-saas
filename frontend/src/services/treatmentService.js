const STORAGE_KEY = 'clinic_treatments';

const getStoredTreatments = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredTreatments = (treatments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(treatments));
};

export const getTreatmentsByPatient = async (pacienteId, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredTreatments();
      resolve(all.filter(t => t.paciente_id === String(pacienteId) && t.clinic_id === String(clinicId)).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
    }, 300);
  });
};

export const createTreatment = async (pacienteId, treatmentData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredTreatments();
      const newTreatment = {
        ...treatmentData,
        id: Date.now().toString(),
        paciente_id: String(pacienteId),
        clinic_id: String(clinicId),
        fecha_registro: new Date().toISOString()
      };
      all.unshift(newTreatment);
      saveStoredTreatments(all);
      resolve(newTreatment);
    }, 400);
  });
};

export const updateTreatment = async (id, treatmentData, clinicId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const all = getStoredTreatments();
      const index = all.findIndex(t => t.id === String(id) && t.clinic_id === String(clinicId));
      
      if (index !== -1) {
        all[index] = { ...all[index], ...treatmentData, clinic_id: String(clinicId) };
        saveStoredTreatments(all);
        resolve(all[index]);
      } else {
        reject(new Error('Tratamiento no encontrado'));
      }
    }, 400);
  });
};

export const deleteTreatment = async (id, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredTreatments();
      const filtered = all.filter(t => !(t.id === String(id) && t.clinic_id === String(clinicId)));
      saveStoredTreatments(filtered);
      resolve(true);
    }, 300);
  });
};
