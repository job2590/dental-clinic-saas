import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getClinics } from '../../services/superAdminService';
import { createNotification } from '../../services/notificationService';

const SuperAdminNotificaciones = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    clinicId: '',
    titulo: '',
    mensaje: '',
    tipo: 'sistema'
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const data = await getClinics();
      setClinics(data.filter(c => c.estado === 'Activa'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clinicId || !formData.titulo || !formData.mensaje) {
      return Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
    }

    try {
      // Si el id es "all", en un sistema real iteraríamos o mandaríamos clinic_id nulo (global).
      // Por ahora iteraremos sobre todas las clínicas activas para crear notificaciones individuales
      if (formData.clinicId === 'all') {
        const promises = clinics.map(c => 
          createNotification(c.id, formData.titulo, formData.mensaje, formData.tipo)
        );
        await Promise.all(promises);
      } else {
        await createNotification(parseInt(formData.clinicId), formData.titulo, formData.mensaje, formData.tipo);
      }

      Swal.fire('¡Enviado!', 'La notificación ha sido enviada con éxito', 'success');
      setFormData({ clinicId: '', titulo: '', mensaje: '', tipo: 'sistema' });
    } catch (error) {
      Swal.fire('Error', 'No se pudo enviar la notificación', 'error');
    }
  };

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Enviar Notificación</h2>
        <p className="text-muted mb-0">Comunícate directamente con las clínicas del SaaS</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              
              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Destinatario (Clínica)</label>
                <select 
                  className="form-select bg-light" 
                  name="clinicId" 
                  value={formData.clinicId} 
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione una clínica...</option>
                  <option value="all">-- TODAS LAS CLÍNICAS ACTIVAS --</option>
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label text-muted small fw-semibold">Tipo de Mensaje</label>
                <select 
                  className="form-select bg-light" 
                  name="tipo" 
                  value={formData.tipo} 
                  onChange={handleChange}
                >
                  <option value="sistema">Actualización de Sistema</option>
                  <option value="anuncio">Anuncio Importante</option>
                  <option value="alerta">Alerta / Billing</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label text-muted small fw-semibold">Título</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="titulo"
                  placeholder="Ej: Nuevo módulo de historias clínicas"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label text-muted small fw-semibold">Mensaje (Cuerpo de la notificación)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  name="mensaje"
                  placeholder="Escribe el mensaje detallado aquí..."
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

            </div>
            
            <div className="text-end mt-4 pt-3 border-top">
              <button type="submit" className="btn btn-primary px-4 fw-medium shadow-sm">
                <i className="bi bi-send-fill me-2"></i> Enviar Notificación
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminNotificaciones;
