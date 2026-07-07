const STORAGE_KEY = 'clinic_odontograms';

const getStoredOdontograms = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveStoredOdontograms = (odontograms) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(odontograms));
};

export const getOdontogramByPatient = async (pacienteId, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredOdontograms();
      const key = `${clinicId}_${pacienteId}`;
      resolve(all[key] || null);
    }, 300);
  });
};

export const saveOdontogram = async (pacienteId, odontogramData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredOdontograms();
      const key = `${clinicId}_${pacienteId}`;
      all[key] = {
        dientes: odontogramData,
        clinic_id: String(clinicId),
        updated_at: new Date().toISOString()
      };
      saveStoredOdontograms(all);
      resolve(all[key]);
    }, 400); // Simulamos retraso de red
  });
};
