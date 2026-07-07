import { supabase } from '../lib/supabase';

export const getOdontogramByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('odontogramas')
    .select('*')
    .eq('paciente_id', patientId)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data || null;
};

export const saveOdontogram = async (patientId, dientesData, clinicId) => {
  const existing = await getOdontogramByPatient(patientId, clinicId);

  if (existing) {
    const { data, error } = await supabase
      .from('odontogramas')
      .update({ dientes: dientesData, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('odontogramas')
      .insert([{ paciente_id: patientId, dientes: dientesData, clinic_id: clinicId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
