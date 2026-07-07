const STORAGE_KEY = 'clinic_radiographies';

const getStoredRadiographies = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredRadiographies = (radiographies) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(radiographies));
};

export const getRadiographiesByPatient = async (pacienteId, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredRadiographies();
      resolve(all.filter(r => r.paciente_id === String(pacienteId) && r.clinic_id === String(clinicId)).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
    }, 300);
  });
};

export const createRadiography = async (pacienteId, radiographyData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredRadiographies();
      const newRad = {
        ...radiographyData,
        id: Date.now().toString(),
        paciente_id: String(pacienteId),
        clinic_id: String(clinicId),
        fecha_registro: new Date().toISOString()
      };
      all.unshift(newRad);
      saveStoredRadiographies(all);
      resolve(newRad);
    }, 400);
  });
};

export const deleteRadiography = async (id, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredRadiographies();
      const filtered = all.filter(r => !(r.id === String(id) && r.clinic_id === String(clinicId)));
      saveStoredRadiographies(filtered);
      resolve(true);
    }, 300);
  });
};
