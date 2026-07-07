import { supabase } from '../lib/supabase';

export const getDashboardStats = async (clinicId) => {
  if (!clinicId) return { totalPatients: 0, appointmentsToday: 0, monthlyRevenue: 0 };

  try {
    // 1. Total Patients
    const { count: totalPatients } = await supabase
      .from('pacientes')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    // 2. Appointments Today
    const today = new Date().toISOString().split('T')[0];
    const { count: appointmentsToday } = await supabase
      .from('citas')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('start', `${today}T00:00:00Z`)
      .lte('start', `${today}T23:59:59Z`);

    // 3. Monthly Revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: payments } = await supabase
      .from('pagos')
      .select('monto')
      .eq('clinic_id', clinicId)
      .gte('fecha_pago', startOfMonth);

    const monthlyRevenue = payments ? payments.reduce((acc, curr) => acc + Number(curr.monto), 0) : 0;

    return {
      totalPatients: totalPatients || 0,
      appointmentsToday: appointmentsToday || 0,
      monthlyRevenue
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { totalPatients: 0, appointmentsToday: 0, monthlyRevenue: 0 };
  }
};

export const getRevenueData = async (clinicId) => {
  // Simularemos datos de los últimos 6 meses basados en el mes actual
  // En producción, agrupar por mes en SQL es más eficiente.
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const currentMonth = new Date().getMonth();
  
  const labels = [];
  const data = [];

  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    labels.push(months[m]);
    data.push(0); // Por defecto en ceros
  }

  // Si quisiéramos llenarlo con los pagos reales, consultaríamos Supabase aquí.
  // Por ahora lo dejamos en ceros para mostrar el "dashboard limpio con 0 datos"
  return { labels, data };
};

export const getLatestPatients = async (clinicId) => {
  if (!clinicId) return [];
  const { data } = await supabase
    .from('pacientes')
    .select('id, nombre, apellido, created_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(4);

  if (!data) return [];

  return data.map(p => ({
    id: p.id,
    name: `${p.nombre} ${p.apellido}`,
    date: new Date(p.created_at).toLocaleDateString(),
    treatment: 'Evaluación inicial' // Podría cruzarse con tratamientos
  }));
};

export const getUpcomingAppointments = async (clinicId) => {
  if (!clinicId) return [];
  const today = new Date().toISOString();
  
  const { data } = await supabase
    .from('citas')
    .select('id, start, estado, pacientes(nombre, apellido)')
    .eq('clinic_id', clinicId)
    .gte('start', today)
    .order('start', { ascending: true })
    .limit(4);

  if (!data) return [];

  return data.map(c => {
    const time = new Date(c.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      id: c.id,
      patient: c.pacientes ? `${c.pacientes.nombre} ${c.pacientes.apellido}` : 'Paciente',
      time,
      status: c.estado
    };
  });
};
