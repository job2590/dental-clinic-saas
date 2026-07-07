export const getDashboardStats = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalPatients: 1245,
        appointmentsToday: 18,
        monthlyRevenue: 24500.50,
      });
    }, 400);
  });
};

export const getRevenueData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        data: [15000, 18200, 16500, 21000, 22500, 24500],
      });
    }, 400);
  });
};

export const getLatestPatients = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'María González', date: '06-Jul-2026', treatment: 'Limpieza' },
        { id: 2, name: 'Carlos Rodríguez', date: '05-Jul-2026', treatment: 'Ortodoncia' },
        { id: 3, name: 'Ana Pérez', date: '05-Jul-2026', treatment: 'Extracción' },
        { id: 4, name: 'Luis Martínez', date: '04-Jul-2026', treatment: 'Revisión' },
      ]);
    }, 400);
  });
};

export const getUpcomingAppointments = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, patient: 'Roberto Sánchez', time: '09:00 AM', status: 'Confirmada' },
        { id: 2, patient: 'Lucía Fernández', time: '10:30 AM', status: 'Pendiente' },
        { id: 3, patient: 'Javier López', time: '11:45 AM', status: 'Confirmada' },
        { id: 4, patient: 'Elena Gómez', time: '02:00 PM', status: 'En sala' },
      ]);
    }, 400);
  });
};
