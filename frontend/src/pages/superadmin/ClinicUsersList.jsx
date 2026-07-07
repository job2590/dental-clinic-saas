import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getUsersByClinic, createUser, updateUser, deleteUser, getClinicById } from '../../services/superAdminService';

const ClinicUsersList = () => {
  const { clinicId } = useParams();
  const [clinic, setClinic] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cData, uData] = await Promise.all([
        getClinicById(clinicId),
        getUsersByClinic(clinicId)
      ]);
      setClinic(cData);
      setUsers(uData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: user.password || ''
      });
      setIsEditing(true);
      setEditingId(user.id);
    } else {
      setFormData({
        name: '',
        email: '',
        password: ''
      });
      setIsEditing(false);
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateUser(editingId, formData);
        Swal.fire({ title: '¡Actualizado!', text: 'Usuario actualizado.', icon: 'success', timer: 1500, showConfirmButton: false });
      } else {
        await createUser({ ...formData, clinic_id: clinicId, role: 'admin' });
        Swal.fire({ title: '¡Creado!', text: 'Usuario administrador creado.', icon: 'success', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar Usuario?',
      text: "El usuario perderá el acceso a la clínica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteUser(id);
      Swal.fire({ title: '¡Eliminado!', text: 'Usuario borrado.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
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
        <div className="d-flex align-items-center">
          <Link to="/superadmin/clinics" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Administradores de Clínica</h3>
            <p className="text-muted mb-0">Clínica: <span className="fw-bold text-primary">{clinic?.nombre}</span></p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary shadow-sm d-flex align-items-center">
          <i className="bi bi-person-plus-fill me-2"></i> Nuevo Administrador
        </button>
      </div>

      <div className="alert alert-info bg-info bg-opacity-10 border-0 text-info-emphasis d-flex align-items-center rounded-4 p-3 shadow-sm mb-4">
        <i className="bi bi-info-circle-fill fs-4 me-3"></i>
        <div>
          <strong>Nota de Desarrollo:</strong> Las contraseñas se muestran en texto plano únicamente en esta versión de demostración (local) para facilitar las pruebas del multi-tenant.
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-nowrap">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4 py-3 border-0">Nombre</th>
                  <th className="py-3 border-0">Correo (Usuario)</th>
                  <th className="py-3 border-0">Contraseña (Test)</th>
                  <th className="pe-4 py-3 border-0 text-end">Acciones</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5 text-muted">
                      No hay usuarios asignados a esta clínica.
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td className="ps-4 py-3 fw-bold text-dark">{u.name}</td>
                      <td className="py-3 text-secondary">{u.email}</td>
                      <td className="py-3">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 user-select-all" style={{fontFamily: 'monospace', letterSpacing: '1px'}}>
                          {u.password}
                        </span>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <button onClick={() => handleOpenModal(u)} className="btn btn-sm btn-light text-secondary me-2">
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="btn btn-sm btn-light text-danger">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Usuario */}
      {showModal && (
        <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
          <div className="card border-0 shadow-lg rounded-4 w-100" style={{maxWidth: '500px', animation: 'fadeIn 0.2s ease-out'}}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-primary mb-0">
                <i className="bi bi-person-badge me-2"></i> {isEditing ? 'Editar Usuario' : 'Nuevo Administrador'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} id="userForm">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Nombre Completo</label>
                    <input type="text" className="form-control bg-light" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Correo Electrónico (Login)</label>
                    <input type="email" className="form-control bg-light" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Contraseña</label>
                    <input type="text" className="form-control bg-light" name="password" value={formData.password} onChange={handleChange} required />
                    {!isEditing && <small className="text-muted mt-1 d-block">Establece una contraseña temporal para este usuario.</small>}
                  </div>
                </div>
              </form>
            </div>
            <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-top-0 rounded-bottom-4">
              <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" form="userForm" className="btn btn-primary px-4 fw-medium shadow-sm">
                Guardar Usuario
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

export default ClinicUsersList;
