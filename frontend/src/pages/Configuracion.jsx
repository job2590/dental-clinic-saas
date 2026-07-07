import React, { useState } from 'react';
import Swal from 'sweetalert2';

const Configuracion = () => {
  const [settings, setSettings] = useState({
    notificacionesEmail: true,
    notificacionesPush: false,
    idioma: 'es',
    zonaHoraria: 'America/Santiago'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    Swal.fire({
      title: '¡Guardado!',
      text: 'Tus preferencias han sido actualizadas.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Configuración</h2>
        <p className="text-muted mb-0">Ajusta las preferencias generales de tu cuenta</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-bottom p-4">
          <h5 className="fw-bold text-primary mb-0"><i className="bi bi-gear-fill me-2"></i> Preferencias del Sistema</h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSave}>
            <div className="row g-4">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">Notificaciones</h6>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="notificacionesEmail" name="notificacionesEmail" checked={settings.notificacionesEmail} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="notificacionesEmail">Recibir resúmenes por correo electrónico</label>
                </div>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="notificacionesPush" name="notificacionesPush" checked={settings.notificacionesPush} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="notificacionesPush">Activar alertas en el navegador</label>
                </div>
              </div>
              
              <div className="col-md-6">
                <h6 className="fw-bold mb-3">Localización</h6>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Idioma del Sistema</label>
                  <select className="form-select bg-light" name="idioma" value={settings.idioma} onChange={handleChange}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold">Zona Horaria</label>
                  <select className="form-select bg-light" name="zonaHoraria" value={settings.zonaHoraria} onChange={handleChange}>
                    <option value="America/Santiago">America/Santiago (GMT-4)</option>
                    <option value="America/Bogota">America/Bogota (GMT-5)</option>
                    <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                    <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="text-end mt-4 pt-3 border-top">
              <button type="submit" className="btn btn-primary px-4 fw-medium shadow-sm">
                Guardar Preferencias
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
