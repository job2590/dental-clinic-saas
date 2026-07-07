import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../services/appointmentService';
import { getPatients } from '../services/patientService';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

// Configuración de idioma para el calendario
const locales = {
  'es': es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MOCK_DENTISTS = [
  { id: '1', nombre: 'Dr. Juan Pérez (Endodoncia)' },
  { id: '2', nombre: 'Dra. María Gómez (Ortodoncia)' },
  { id: '3', nombre: 'Dr. Carlos Rojas (General)' }
];

const AgendaPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    paciente_id: '',
    odontologo_id: '',
    start: '', // Se manejan como strings 'YYYY-MM-DDTHH:mm' en el input
    end: '',
    estado: 'Pendiente',
    observaciones: ''
  });

  const fetchData = async () => {
    try {
      const pts = await getPatients(user.clinic_id);
      setPatients(pts);
      const apps = await getAppointments(user.clinic_id);
      setAppointments(apps);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generar título si seleccionan paciente
      if (name === 'paciente_id') {
        const pt = patients.find(p => p.id === value);
        if (pt && !prev.title.includes('-')) {
           updated.title = `Cita: ${pt.nombre} ${pt.apellido}`;
        }
      }
      return updated;
    });
  };

  const handleSelectSlot = (slotInfo) => {
    // Al hacer clic en una fecha vacía
    const startStr = format(slotInfo.start, "yyyy-MM-dd'T'HH:mm");
    // Por defecto duran 1 hora
    const endDate = new Date(slotInfo.start.getTime() + 60 * 60 * 1000);
    const endStr = format(endDate, "yyyy-MM-dd'T'HH:mm");

    setFormData({
      title: '',
      paciente_id: '',
      odontologo_id: '',
      start: startStr,
      end: endStr,
      estado: 'Pendiente',
      observaciones: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    // Al hacer clic en un evento existente
    setFormData({
      ...event,
      start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      end: format(event.end, "yyyy-MM-dd'T'HH:mm")
    });
    setIsEditing(true);
    setEditingId(event.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      start: new Date(formData.start),
      end: new Date(formData.end)
    };

    if (isEditing) {
      await updateAppointment(editingId, payload, user.clinic_id);
    } else {
      await createAppointment(payload, user.clinic_id);
    }
    
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar y eliminar cita?',
      text: "Esta acción borrará el turno de la agenda.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteAppointment(editingId, user.clinic_id);
      setShowModal(false);
      Swal.fire({ title: '¡Cancelada!', text: 'La cita ha sido eliminada de la agenda.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };

  // Color de eventos basado en el estado
  const eventPropGetter = (event) => {
    let backgroundColor = '#6c757d'; // Default (Pendiente)
    switch(event.estado) {
      case 'Confirmada': backgroundColor = '#0d6efd'; break;
      case 'En Sala': backgroundColor = '#ffc107'; break; // Amarillo
      case 'Completada': backgroundColor = '#198754'; break; // Verde
      case 'Cancelada': backgroundColor = '#dc3545'; break; // Rojo
      default: break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        border: 'none',
        color: event.estado === 'En Sala' ? '#000' : '#fff',
        display: 'block',
        padding: '2px 5px'
      }
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Agenda de Citas</h2>
          <p className="text-muted mb-0">Gestión de turnos y calendario clínico.</p>
        </div>
        <button onClick={() => {
          setFormData({
            title: '', paciente_id: '', odontologo_id: '', start: '', end: '', estado: 'Pendiente', observaciones: ''
          });
          setIsEditing(false); setShowModal(true);
        }} className="btn btn-primary px-4 fw-medium shadow-sm">
          <i className="bi bi-plus-lg me-2"></i> Nueva Cita
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4" style={{ height: '75vh' }}>
          <Calendar
            localizer={localizer}
            events={appointments}
            startAccessor="start"
            endAccessor="end"
            culture="es"
            messages={{
              next: "Sig",
              previous: "Ant",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Cita",
              noEventsInRange: "No hay citas en este rango."
            }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
        </div>
      </div>

      {/* Modal Citas */}
      {showModal && (
        <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
          <div className="card border-0 shadow-lg rounded-4 w-100" style={{maxWidth: '500px', animation: 'fadeIn 0.2s ease-out'}}>
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-primary mb-0">
                <i className="bi bi-calendar-check me-2"></i> 
                {isEditing ? 'Detalles de la Cita' : 'Agendar Nueva Cita'}
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
            </div>
            
            <div className="card-body p-4">
              <form id="appForm" onSubmit={handleSubmit}>
                <div className="row g-3">
                  
                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Paciente</label>
                    <select className="form-select bg-light" name="paciente_id" value={formData.paciente_id} onChange={handleChange} required>
                      <option value="">Seleccione un paciente...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido} - CI: {p.ci}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Título / Motivo</label>
                    <input type="text" className="form-control bg-light" name="title" value={formData.title} onChange={handleChange} required placeholder="Ej. Control de Ortodoncia" />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Odontólogo Tratante</label>
                    <select className="form-select bg-light" name="odontologo_id" value={formData.odontologo_id} onChange={handleChange} required>
                      <option value="">Seleccione un doctor...</option>
                      {MOCK_DENTISTS.map(d => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Inicio</label>
                    <input type="datetime-local" className="form-control bg-light" name="start" value={formData.start} onChange={handleChange} required />
                  </div>
                  
                  <div className="col-6">
                    <label className="form-label text-muted small fw-semibold">Fin</label>
                    <input type="datetime-local" className="form-control bg-light" name="end" value={formData.end} onChange={handleChange} required />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Estado de la Cita</label>
                    <select className="form-select bg-light fw-bold" name="estado" value={formData.estado} onChange={handleChange}>
                      <option value="Pendiente">Pendiente (Gris)</option>
                      <option value="Confirmada">Confirmada (Azul)</option>
                      <option value="En Sala">En Sala de Espera (Amarillo)</option>
                      <option value="Completada">Completada (Verde)</option>
                      <option value="Cancelada">Cancelada (Rojo)</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Observaciones</label>
                    <textarea className="form-control bg-light" name="observaciones" rows="2" value={formData.observaciones} onChange={handleChange}></textarea>
                  </div>

                </div>
              </form>
            </div>
            
            <div className="card-footer bg-light p-3 d-flex justify-content-between border-top-0 rounded-bottom-4">
              {isEditing ? (
                <button type="button" className="btn btn-outline-danger" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i> Eliminar
                </button>
              ) : <div></div>}
              
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" form="appForm" className="btn btn-primary px-4 fw-medium shadow-sm">
                  {isEditing ? 'Actualizar Cita' : 'Agendar Cita'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        /* Ajustes menores para que react-big-calendar luzca más premium con bootstrap */
        .rbc-btn-group button { color: #495057; border-color: #dee2e6; font-weight: 500; }
        .rbc-btn-group button.rbc-active { background-color: #e9ecef; color: #0d6efd; border-color: #dee2e6; box-shadow: none; }
        .rbc-toolbar button:focus { outline: none; }
        .rbc-today { background-color: rgba(13, 110, 253, 0.05); }
        .rbc-header { padding: 10px 0; font-weight: 600; color: #6c757d; text-transform: uppercase; font-size: 0.85rem; }
      `}</style>
    </div>
  );
};

export default AgendaPage;
