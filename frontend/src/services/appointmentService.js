const STORAGE_KEY = 'clinic_appointments';

const getStoredAppointments = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredAppointments = (appointments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

export const getAppointments = async (clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredAppointments();
      const clinicAll = all.filter(a => a.clinic_id === String(clinicId));
      // Asegurarse de que las fechas sean objetos Date reales para react-big-calendar
      const parsed = clinicAll.map(app => ({
        ...app,
        start: new Date(app.start),
        end: new Date(app.end)
      }));
      resolve(parsed);
    }, 300);
  });
};

export const createAppointment = async (appData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredAppointments();
      const newApp = {
        ...appData,
        id: Date.now().toString(),
        clinic_id: String(clinicId),
        created_at: new Date().toISOString()
      };
      all.push(newApp);
      saveStoredAppointments(all);
      // Retornar parseado para que no falle el calendario in-memory
      resolve({
        ...newApp,
        start: new Date(newApp.start),
        end: new Date(newApp.end)
      });
    }, 400);
  });
};

export const updateAppointment = async (id, appData, clinicId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const all = getStoredAppointments();
      const index = all.findIndex(a => a.id === String(id) && a.clinic_id === String(clinicId));
      
      if (index !== -1) {
        all[index] = { ...all[index], ...appData, clinic_id: String(clinicId) };
        saveStoredAppointments(all);
        resolve({
          ...all[index],
          start: new Date(all[index].start),
          end: new Date(all[index].end)
        });
      } else {
        reject(new Error('Cita no encontrada'));
      }
    }, 400);
  });
};

export const deleteAppointment = async (id, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredAppointments();
      const filtered = all.filter(a => !(a.id === String(id) && a.clinic_id === String(clinicId)));
      saveStoredAppointments(filtered);
      resolve(true);
    }, 300);
  });
};
