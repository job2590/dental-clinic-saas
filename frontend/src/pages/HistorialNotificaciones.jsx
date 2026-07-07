import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllNotifications, markAsRead } from '../services/notificationService';

const HistorialNotificaciones = () => {
  const { clinic } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (clinic?.id) {
        const notifs = await getAllNotifications(clinic.id);
        setNotifications(notifs);
        
        // Al entrar al historial, marcamos todas como leídas
        const hasUnread = notifs.some(n => !n.read);
        if (hasUnread) {
          await markAsRead(clinic.id);
        }
      }
      setLoading(false);
    };
    fetchHistory();
  }, [clinic]);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Historial de Notificaciones</h2>
        <p className="text-muted mb-0">Mensajes y anuncios enviados por la plataforma</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="list-group list-group-flush">
          {notifications.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <i className="bi bi-bell-slash fs-1 d-block mb-3 text-light"></i>
              No hay notificaciones en tu historial.
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="list-group-item p-4 border-bottom">
                <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                  <h5 className="mb-0 fw-bold text-dark">
                    {n.type === 'anuncio' && <i className="bi bi-megaphone-fill text-warning me-2"></i>}
                    {n.type === 'alerta' && <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>}
                    {n.type === 'sistema' && <i className="bi bi-info-circle-fill text-primary me-2"></i>}
                    {n.title}
                  </h5>
                  <span className="badge bg-light text-secondary border">{n.time}</span>
                </div>
                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line' }}>{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialNotificaciones;
