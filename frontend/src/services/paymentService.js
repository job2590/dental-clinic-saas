import { supabase } from '../lib/supabase';

export const getPaymentsByPatient = async (pacienteId, clinicId) => {
  // In our schema, pagos links to tratamiento_id.
  // So we first find all treatments for the patient via historia clinica.
  const { data: hc } = await supabase.from('historias_clinicas').select('id').eq('paciente_id', pacienteId).eq('clinic_id', clinicId).single();
  if (!hc) return [];

  const { data: treatments } = await supabase.from('tratamientos').select('id').eq('historia_clinica_id', hc.id);
  if (!treatments || treatments.length === 0) return [];

  const treatmentIds = treatments.map(t => t.id);

  const { data, error } = await supabase
    .from('pagos')
    .select('*, tratamientos(descripcion)')
    .in('tratamiento_id', treatmentIds)
    .eq('clinic_id', clinicId)
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAllPayments = async (clinicId) => {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, tratamientos(descripcion)')
    .eq('clinic_id', clinicId)
    .order('fecha_pago', { ascending: false });

  if (error) throw error;
  return data;
};

export const createPayment = async (pacienteId, paymentData, clinicId) => {
  const { data, error } = await supabase
    .from('pagos')
    .insert([{ ...paymentData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
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
