import { supabase } from '../lib/supabase';

export const getPaymentsByPatient = async (pacienteId, clinicId) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getPaymentsByPatient error:', error); throw error; }
  return data || [];
};

export const getAllPayments = async (clinicId) => {
  if (!clinicId) return [];
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getAllPayments error:', error); throw error; }
  return data || [];
};

export const createPayment = async (pacienteId, paymentData, clinicId) => {
  const { data, error } = await supabase
    .from('pagos')
    .insert([{ ...paymentData, paciente_id: pacienteId, clinic_id: clinicId }])
    .select()
    .single();

  if (error) { console.error('createPayment error:', error); throw error; }
  return data;
};

export const deletePayment = async (id, clinicId) => {
  const { error } = await supabase
    .from('pagos')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
