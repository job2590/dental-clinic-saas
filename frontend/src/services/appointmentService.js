import { supabase } from '../lib/supabase';

export const getAppointments = async (clinicId) => {
  if (!clinicId) return [];
  const { data, error } = await supabase
    .from('citas')
    .select('*, pacientes(nombre, apellido)')
    .eq('clinic_id', clinicId)
    .order('start', { ascending: true });

  if (error) { console.error('getAppointments error:', error); throw error; }
  return data || [];
};

export const getAppointmentsByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('citas')
    .select('*')
    .eq('paciente_id', patientId)
    .eq('clinic_id', clinicId)
    .order('start', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createAppointment = async (appointmentData, clinicId) => {
  const { data, error } = await supabase
    .from('citas')
    .insert([{ ...appointmentData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) { console.error('createAppointment error:', error); throw error; }
  return data;
};

export const updateAppointment = async (id, appointmentData, clinicId) => {
  const { id: _, clinic_id: __, created_at: ___, ...cleanData } = appointmentData;
  
  const { data, error } = await supabase
    .from('citas')
    .update(cleanData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) { console.error('updateAppointment error:', error); throw error; }
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
