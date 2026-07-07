import { supabase } from '../lib/supabase';

export const getAppointments = async (clinicId) => {
  if (!clinicId) return [];
  const { data, error } = await supabase
    .from('citas')
    .select('*, pacientes(nombre, apellidos), usuarios(nombre)')
    .eq('clinic_id', clinicId)
    .order('fecha_hora', { ascending: true });

  if (error) throw error;
  return data;
};

export const getAppointmentsByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('citas')
    .select('*, usuarios(nombre)')
    .eq('paciente_id', patientId)
    .eq('clinic_id', clinicId)
    .order('fecha_hora', { ascending: true });

  if (error) throw error;
  return data;
};

export const createAppointment = async (appointmentData, clinicId) => {
  const { data, error } = await supabase
    .from('citas')
    .insert([{ ...appointmentData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointment = async (id, appointmentData, clinicId) => {
  const { data, error } = await supabase
    .from('citas')
    .update(appointmentData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAppointment = async (id, clinicId) => {
  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
