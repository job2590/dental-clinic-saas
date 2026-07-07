import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../services/superAdminService';
import { supabase } from '../lib/supabase';

const UserProfile = () => {
  const { user, login } = useAuth(); // login to update context user state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAvatarUpload = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // Actualizar base de datos
      const updatedUser = await updateUser(user.id, { avatar: data.publicUrl });
      
      // Actualizar contexto local (re-login simulado)
      if (updatedUser) {
        await login(updatedUser.email, updatedUser.password); // Asumiendo password actual si no cambió, o re-auth.
        Swal.fire('¡Éxito!', 'Foto de perfil actualizada', 'success');
      }

    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updates = { name: formData.name, email: formData.email };
      if (formData.password) updates.password = formData.password;

      const updatedUser = await updateUser(user.id, updates);
      if (updatedUser) {
        await login(updatedUser.email, updatedUser.password);
        Swal.fire('¡Éxito!', 'Datos actualizados correctamente', 'success');
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al actualizar', 'error');
    }
  };

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Mi Perfil</h2>
        <p className="text-muted mb-0">Gestiona tu información personal y foto de perfil</p>
      </div>

      <div className="row g-4">
        {/* Tarjeta de Avatar */}
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 text-center p-4">
            <div className="position-relative mx-auto mb-3" style={{width: '120px', height: '120px'}}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="rounded-circle object-fit-cover w-100 h-100 shadow-sm" />
              ) : (
                <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center w-100 h-100 fs-1 fw-bold shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label htmlFor="avatarUpload" className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow p-2 cursor-pointer border" style={{transform: 'translate(10%, 10%)'}}>
                <i className="bi bi-camera-fill text-primary"></i>
                <input type="file" id="avatarUpload" className="d-none" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
            <p className="text-muted small mb-0 text-uppercase tracking-wide">{user?.role}</p>
            {uploading && <small className="text-primary mt-2 d-block">Subiendo imagen...</small>}
          </div>
        </div>

        {/* Tarjeta de Datos */}
        <div className="col-12 col-md-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="fw-bold text-primary mb-0"><i className="bi bi-person-lines-fill me-2"></i> Información Personal</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Nombre Completo</label>
                    <input type="text" className="form-control bg-light" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Correo Electrónico</label>
                    <input type="email" className="form-control bg-light" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Nueva Contraseña <span className="text-muted fw-normal">(Dejar en blanco para no cambiar)</span></label>
                    <input type="password" className="form-control bg-light" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                  </div>
                </div>
                <div className="text-end mt-4">
                  <button type="submit" className="btn btn-primary px-4 fw-medium shadow-sm">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
