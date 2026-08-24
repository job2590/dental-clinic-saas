import { supabase } from '../lib/supabase';

export const getOralSurgeryRecordByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_records')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getOralSurgeryRecordByPatient error:', error);
    throw error;
  }
  return data || null;
};

export const saveOralSurgeryRecord = async (recordData, clinicId) => {
  const payload = { ...recordData, clinic_id: clinicId };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('oral_surgery_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('oral_surgery_records')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Controles Postoperatorios
export const getOralSurgeryFollowups = async (oralSurgeryRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_followups')
    .select('*')
    .eq('oral_surgery_record_id', oralSurgeryRecordId)
    .eq('clinic_id', clinicId)
    .order('control_number', { ascending: true });

  if (error) {
    console.error('getOralSurgeryFollowups error:', error);
    throw error;
  }
  return data || [];
};

export const addOralSurgeryFollowup = async (followupData, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_followups')
    .insert([{ ...followupData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Imágenes de Cirugía Oral
export const getOralSurgeryImages = async (oralSurgeryRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_record_images')
    .select('*')
    .eq('oral_surgery_record_id', oralSurgeryRecordId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOralSurgeryImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadOralSurgeryImage = async (file, oralSurgeryRecordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `surgery_${oralSurgeryRecordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/oral_surgery/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('oral_surgery_record_images')
    .insert([{
      clinic_id: clinicId,
      oral_surgery_record_id: oralSurgeryRecordId,
      patient_id: patientId,
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteOralSurgeryImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('oral_surgery_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
