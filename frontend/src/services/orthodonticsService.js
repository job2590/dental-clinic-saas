import { supabase } from '../lib/supabase';

export const getOrthodonticRecordsByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_records')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrthodonticRecordsByPatient error:', error);
    throw error;
  }
  return data || [];
};

export const getOrthodonticRecordById = async (id, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_records')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getOrthodonticRecordById error:', error);
    throw error;
  }
  return data || null;
};

export const saveOrthodonticRecord = async (recordData, clinicId) => {
  const payload = { ...recordData, clinic_id: clinicId };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('orthodontic_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('orthodontic_records')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export const getOrthodonticImages = async (recordId, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_record_images')
    .select('*')
    .eq('orthodontic_record_id', recordId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrthodonticImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadOrthodonticImage = async (file, recordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `ortho_${recordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/orthodontics/${fileName}`;

  // Usamos el bucket 'radiografias' o 'patient-photos' que ya existen en el proyecto
  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error subiendo imagen a storage:', uploadError);
    throw uploadError;
  }

  const { data, error: dbError } = await supabase
    .from('orthodontic_record_images')
    .insert([{
      clinic_id: clinicId,
      orthodontic_record_id: recordId,
      patient_id: patientId,
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteOrthodonticImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('orthodontic_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
