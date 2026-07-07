const STORAGE_KEY = 'clinic_payments';

const getStoredPayments = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredPayments = (payments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
};

export const getPaymentsByPatient = async (pacienteId, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredPayments();
      resolve(all.filter(p => p.paciente_id === String(pacienteId) && p.clinic_id === String(clinicId)).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
    }, 300);
  });
};

export const getAllPayments = async (clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredPayments();
      resolve(all.filter(p => p.clinic_id === String(clinicId)).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
    }, 300);
  });
};

export const createPayment = async (pacienteId, paymentData, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredPayments();
      const newPayment = {
        ...paymentData,
        id: Date.now().toString(),
        paciente_id: String(pacienteId),
        clinic_id: String(clinicId),
        fecha_registro: new Date().toISOString()
      };
      all.unshift(newPayment);
      saveStoredPayments(all);
      resolve(newPayment);
    }, 400);
  });
};

export const deletePayment = async (id, clinicId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const all = getStoredPayments();
      const filtered = all.filter(p => !(p.id === String(id) && p.clinic_id === String(clinicId)));
      saveStoredPayments(filtered);
      resolve(true);
    }, 300);
  });
};
