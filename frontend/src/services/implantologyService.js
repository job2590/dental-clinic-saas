import { supabase } from '../lib/supabase';

export const getImplantRecordByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_records')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getImplantRecordByPatient error:', error);
    throw error;
  }
  return data || null;
};

export const saveImplantRecord = async (recordData, clinicId) => {
  const payload = { ...recordData, clinic_id: clinicId };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('implant_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('implant_records')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Evoluciones (Notas de Control)
export const getImplantEvolutionNotes = async (implantRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_evolution_notes')
    .select('*')
    .eq('implant_record_id', implantRecordId)
    .eq('clinic_id', clinicId)
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('getImplantEvolutionNotes error:', error);
    throw error;
  }
  return data || [];
};

export const addImplantEvolutionNote = async (noteData, clinicId) => {
  const { data, error } = await supabase
    .from('implant_evolution_notes')
    .insert([{ ...noteData, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Plan de Pagos de Implantes
export const getImplantPaymentPlan = async (implantRecordId, patientId, clinicId) => {
  let query = supabase.from('implant_payment_plans').select('*').eq('clinic_id', clinicId);
  if (implantRecordId) {
    query = query.eq('implant_record_id', implantRecordId);
  } else {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error('getImplantPaymentPlan error:', error);
    throw error;
  }
  return data || null;
};

export const saveImplantPaymentPlan = async (planData, clinicId) => {
  const payload = { ...planData, clinic_id: clinicId };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('implant_payment_plans')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('implant_payment_plans')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Imágenes de Implantología
export const getImplantImages = async (implantRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_record_images')
    .select('*')
    .eq('implant_record_id', implantRecordId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getImplantImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadImplantImage = async (file, implantRecordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `implant_${implantRecordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/implantology/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('implant_record_images')
    .insert([{
      clinic_id: clinicId,
      implant_record_id: implantRecordId,
      patient_id: patientId,
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteImplantImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('implant_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
