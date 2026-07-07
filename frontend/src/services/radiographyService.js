import { supabase } from '../lib/supabase';

export const getRadiographiesByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('radiografias')
    .select('*')
    .eq('paciente_id', patientId)
    .eq('clinic_id', clinicId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data;
};

export const createRadiography = async (radiographyData, clinicId) => {
  const { data, error } = await supabase
    .from('radiografias')
    .insert([{ ...radiographyData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteRadiography = async (id, clinicId) => {
  const { error } = await supabase
    .from('radiografias')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
