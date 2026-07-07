import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getClinics, createClinic, updateClinic, changeClinicStatus, deleteClinic } from '../../services/superAdminService';
import { supabase } from '../../lib/supabase';

const ClinicsList = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    correo: '',
    plan: 'Básico',
    color_principal: '#0d6efd',
    logo: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const data = await getClinics();
      setClinics(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (clinic = null) => {
    if (clinic) {
      setFormData({
        nombre: clinic.nombre || '',
        direccion: clinic.direccion || '',
        telefono: clinic.telefono || '',
        correo: clinic.correo || '',
        plan: clinic.plan || 'Básico',
        color_principal: clinic.color_principal || '#0d6efd',
        logo: clinic.logo || ''
      });
      setIsEditing(true);
      setEditingId(clinic.id);
    } else {
      setFormData({
        nombre: '',
        direccion: '',
        telefono: '',
        correo: '',
        plan: 'Básico',
        color_principal: '#0d6efd',
        logo: ''
      });
      setIsEditing(false);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleLogoUpload = async (e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      setUploadingLogo(true);
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      setFormData({ ...formData, logo: data.publicUrl });
      
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateClinic(editingId, formData);
        Swal.fire({ title: '¡Actualizado!', text: 'Clínica actualizada.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await createClinic(formData);
        Swal.fire({ title: '¡Creada!', text: 'Clínica registrada exitosamente.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      fetchClinics();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleStatus = async (clinic) => {
    const nuevoEstado = clinic.estado === 'Activa' ? 'Suspendida' : 'Activa';
    const result = await Swal.fire({
      title: `¿${nuevoEstado === 'Activa' ? 'Activar' : 'Suspender'} Clínica?`,
      text: nuevoEstado === 'Activa' ? 'La clínica recuperará acceso al sistema.' : 'La clínica no podrá acceder al sistema.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'Activa' ? '#198754' : '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${nuevoEstado === 'Activa' ? 'activar' : 'suspender'}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await changeClinicStatus(clinic.id, nuevoEstado);
      fetchClinics();
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Clínica?',
      text: "Esta acción es irreversible y podría borrar todos sus datos.",
      icon: 'danger',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteClinic(id);
      Swal.fire({ title: '¡Eliminada!', text: 'Clínica borrada permanentemente.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchClinics();
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Gestión de Clínicas</h2>
          <p className="text-muted mb-0">Administra los clientes SaaS (Tenant)</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-sm d-flex align-items-center">
          <i className="bi bi-building-add me-2"></i> Nueva Clínica
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4 py-3 border-0">Clínica</th>
                  <th className="py-3 border-0">Contacto</th>
                  <th className="py-3 border-0">Plan</th>
                  <th className="py-3 border-0 text-center">Estado</th>
                  <th className="pe-4 py-3 border-0 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {clinics.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No hay clínicas registradas en el sistema.
                    </td>
                  </tr>
                ) : (
                  clinics.map(clinic => (
                    <tr key={clinic.id}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center">
                          {clinic.logo ? (
                            <img src={clinic.logo} alt="Logo" className="rounded-circle me-3 object-fit-cover shadow-sm" style={{width: '40px', height: '40px'}} />
                          ) : (
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                              style={{width: '40px', height: '40px', backgroundColor: clinic.color_principal || '#0d6efd'}}
                            >
                              {clinic.nombre.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold text-dark">{clinic.nombre}</div>
                            <div className="small text-muted text-truncate" style={{maxWidth: '200px'}}>ID: {clinic.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="text-secondary small"><i className="bi bi-envelope me-1"></i>{clinic.correo || 'N/A'}</div>
                        <div className="text-secondary small"><i className="bi bi-telephone me-1"></i>{clinic.telefono || 'N/A'}</div>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${clinic.plan === 'Premium' ? 'bg-primary' : 'bg-secondary'} bg-opacity-10 text-${clinic.plan === 'Premium' ? 'primary' : 'secondary'} border border-${clinic.plan === 'Premium' ? 'primary' : 'secondary'} border-opacity-25`}>
                          {clinic.plan}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`badge ${clinic.estado === 'Activa' ? 'bg-success' : 'bg-danger'}`}>
                          {clinic.estado}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="btn-group shadow-sm">
                          <Link to={`/superadmin/clinics/${clinic.id}/users`} className="btn btn-sm btn-light text-primary" title="Usuarios">
                            <i className="bi bi-people-fill"></i>
                          </Link>
                          <button onClick={() => handleOpenModal(clinic)} className="btn btn-sm btn-light text-secondary" title="Editar">
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button onClick={() => handleToggleStatus(clinic)} className={`btn btn-sm btn-light ${clinic.estado === 'Activa' ? 'text-warning' : 'text-success'}`} title={clinic.estado === 'Activa' ? 'Suspender' : 'Activar'}>
                            <i className={`bi ${clinic.estado === 'Activa' ? 'bi-pause-circle-fill' : 'bi-play-circle-fill'}`}></i>
                          </button>
                          <button onClick={() => handleDelete(clinic.id)} className="btn btn-sm btn-light text-danger" title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
          <div className="card border-0 shadow-lg rounded-4 w-100 m-3" style={{maxWidth: '600px', animation: 'fadeIn 0.2s ease-out'}}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-primary mb-0">
                <i className="bi bi-building me-2"></i> {isEditing ? 'Editar Clínica' : 'Nueva Clínica'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} id="clinicForm">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Nombre de la Clínica</label>
                    <input type="text" className="form-control bg-light" name="nombre" value={formData.nombre} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Dirección</label>
                    <input type="text" className="form-control bg-light" name="direccion" value={formData.direccion} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Teléfono</label>
                    <input type="text" className="form-control bg-light" name="telefono" value={formData.telefono} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Correo de Contacto</label>
                    <input type="email" className="form-control bg-light" name="correo" value={formData.correo} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Plan de Suscripción</label>
                    <select className="form-select bg-light" name="plan" value={formData.plan} onChange={handleChange}>
                      <option value="Básico">Básico</option>
                      <option value="Pro">Pro</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Color Principal (Marca)</label>
                    <div className="d-flex align-items-center gap-2">
                      <input type="color" className="form-control form-control-color bg-light" name="color_principal" value={formData.color_principal} onChange={handleChange} title="Elige un color" />
                      <span className="small text-muted">{formData.color_principal}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Logotipo (Opcional)</label>
                    <div className="d-flex align-items-center gap-3">
                      {formData.logo && (
                        <img src={formData.logo} alt="Preview" className="rounded shadow-sm object-fit-cover" style={{width: '50px', height: '50px'}} />
                      )}
                      <input type="file" className="form-control bg-light" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </div>
                    {uploadingLogo && <small className="text-primary mt-1 d-block">Subiendo logo...</small>}
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-top-0 rounded-bottom-4">
              <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" form="clinicForm" className="btn btn-primary px-4 fw-medium shadow-sm">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ClinicsList;
