const STORAGE_KEY = 'clinic_histories';

const getStoredHistories = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveStoredHistories = (histories) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
};

export const getClinicalHistory = async (pacienteId, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const histories = getStoredHistories();
      const key = `${clinicId}_${pacienteId}`;
      resolve(histories[key] || null);
    }, 400);
  });
};

export const saveClinicalHistory = async (pacienteId, historyData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const histories = getStoredHistories();
      const key = `${clinicId}_${pacienteId}`;
      histories[key] = {
        ...historyData,
        clinic_id: String(clinicId),
        updated_at: new Date().toISOString()
      };
      saveStoredHistories(histories);
      resolve(histories[key]);
    }, 600);
  });
};
