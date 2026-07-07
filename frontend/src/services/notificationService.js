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
      .select('id, start, pacientes(nombre, apellido)')
      .eq('clinic_id', clinicId)
      .eq('estado', 'Programada')
      .gte('start', today)
      .lte('start', tomorrow)
      .order('start', { ascending: true });

    const virtualNotifs = (citasData || []).map(cita => {
      const citaDate = new Date(cita.start);
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

// Obtiene el historial completo (leídas y no leídas)
export const getAllNotifications = async (clinicId) => {
  if (!clinicId) return [];
  try {
    const { data: dbNotifs, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching all notifs:', error);

    const realNotifs = (dbNotifs || []).map(n => ({
      id: `db-${n.id}`,
      real_id: n.id,
      title: n.titulo,
      message: n.mensaje,
      type: n.tipo,
      time: format(new Date(n.created_at), "dd MMM HH:mm", { locale: es }),
      read: n.leida,
      isVirtual: false
    }));

    return realNotifs;
  } catch (err) {
    console.error('Error in getAllNotifications:', err);
    return [];
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
