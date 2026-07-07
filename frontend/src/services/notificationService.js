import { supabase } from '../lib/supabase';
import { startOfToday, endOfTomorrow, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// Obtiene todas las notificaciones (reales + virtuales de citas)
export const getNotifications = async (clinicId) => {
  if (!clinicId) return [];

  try {
    // 1. Notificaciones reales de la base de datos (mensajes del superadmin)
    const { data: dbNotifs, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('leida', false)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching notifs:', error);

    const realNotifs = (dbNotifs || []).map(n => ({
      id: `db-${n.id}`, // Prefijo para distinguirlas
      real_id: n.id,
      title: n.titulo,
      message: n.mensaje,
      type: n.tipo,
      time: format(new Date(n.created_at), "dd MMM HH:mm", { locale: es }),
      read: n.leida,
      isVirtual: false
    }));

    // 2. Notificaciones virtuales (Recordatorios de citas de hoy y mañana)
    const today = startOfToday().toISOString();
    const tomorrow = endOfTomorrow().toISOString();

    const { data: citasData } = await supabase
      .from('citas')
      .select('id, fecha_hora, pacientes(nombre, apellido)')
      .eq('clinic_id', clinicId)
      .eq('estado', 'Programada')
      .gte('fecha_hora', today)
      .lte('fecha_hora', tomorrow)
      .order('fecha_hora', { ascending: true });

    const virtualNotifs = (citasData || []).map(cita => {
      const citaDate = new Date(cita.fecha_hora);
      const isCitaToday = isToday(citaDate);
      const dayText = isCitaToday ? 'Hoy' : 'Mañana';
      const timeText = format(citaDate, 'HH:mm');
      const pacienteName = cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellido}` : 'Paciente';

      return {
        id: `virt-${cita.id}`,
        title: `Recordatorio de Cita: ${dayText}`,
        message: `${pacienteName} tiene cita a las ${timeText}`,
        type: 'recordatorio',
        time: 'Automático',
        read: false,
        isVirtual: true // No se guarda en BD, se calcula al vuelo
      };
    });

    // Combinar ambas y devolver
    return [...virtualNotifs, ...realNotifs];
  } catch (err) {
    console.error('Error in getNotifications:', err);
    return [];
  }
};

// Marcar notificaciones reales como leídas
export const markAsRead = async (clinicId) => {
  if (!clinicId) return;
  try {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('clinic_id', clinicId)
      .eq('leida', false);
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking read:', err);
    return false;
  }
};

// --- Funciones para SuperAdmin ---

export const createNotification = async (clinicId, titulo, mensaje, tipo = 'sistema') => {
  try {
    const { data, error } = await supabase
      .from('notificaciones')
      .insert([{
        clinic_id: clinicId, // Si es 'all', deberíamos manejarlo iterando o con null si es global, pero el requerimiento es clinicas especificas
        titulo,
        mensaje,
        tipo
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};
