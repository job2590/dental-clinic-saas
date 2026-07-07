import React from 'react';

const COLORS = {
  'Sano': '#ffffff',
  'Caries': '#dc3545', // Rojo
  'Corona': '#0d6efd', // Azul
  'Implante': '#6f42c1', // Morado
  'Ausente': '#212529', // Negro
  'Endodoncia': '#fd7e14', // Naranja
  'Fractura': '#ffc107', // Amarillo
  'Extracción': '#842029', // Rojo Oscuro
  'Prótesis': '#198754' // Verde
};

const Tooth = ({ tooth, onFaceClick, onToothClick, isGeneralToolActive }) => {
  const { numero, estadoGeneral, caras } = tooth;

  const handleFaceClick = (e, faceId) => {
    e.stopPropagation(); // Evitar que dispare el onToothClick si no queremos
    if (isGeneralToolActive) {
      onToothClick(numero);
    } else {
      onFaceClick(numero, faceId);
    }
  };

  const handleContainerClick = () => {
    if (isGeneralToolActive) {
      onToothClick(numero);
    }
  };

  // Determinar si hay un estado general que sobreescribe todo
  const hasGeneralState = estadoGeneral && estadoGeneral !== 'Sano';

  // Si hay un estado general de cruz (Ausente o Extracción)
  const isCrossedOut = estadoGeneral === 'Ausente' || estadoGeneral === 'Extracción';
  const crossColor = estadoGeneral === 'Ausente' ? COLORS['Ausente'] : COLORS['Extracción'];

  // Si hay un estado general de relleno (Corona, Implante, Prótesis, Endodoncia)
  const isSolid = estadoGeneral === 'Corona' || estadoGeneral === 'Implante' || estadoGeneral === 'Prótesis' || estadoGeneral === 'Endodoncia';
  const solidColor = hasGeneralState ? COLORS[estadoGeneral] : 'transparent';

  // Obtener colores por cara (si no hay estado general sólido)
  const getColor = (faceId) => {
    if (isSolid) return solidColor;
    return COLORS[caras[faceId]] || COLORS['Sano'];
  };

  // Coordenadas de los polígonos para una caja de 100x100
  const polygons = {
    top: "0,0 100,0 75,25 25,25",
    right: "100,0 100,100 75,75 75,25",
    bottom: "0,100 100,100 75,75 25,75",
    left: "0,0 0,100 25,75 25,25",
    center: "25,25 75,25 75,75 25,75"
  };

  return (
    <div 
      className="d-flex flex-column align-items-center m-1" 
      style={{ width: '45px', cursor: 'pointer' }}
      onClick={handleContainerClick}
    >
      <span className="fw-bold mb-1 small text-secondary">{numero}</span>
      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%' }}>
        <svg 
          viewBox="0 0 100 100" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          {/* Si tiene un estado de relleno total, mostramos un círculo de fondo o pintamos las caras del mismo color. 
              Por simplicidad, pintaremos las 5 caras del color sólido si isSolid es true */}
          
          {['top', 'right', 'bottom', 'left', 'center'].map(faceId => (
            <polygon
              key={faceId}
              points={polygons[faceId]}
              fill={getColor(faceId)}
              stroke="#6c757d"
              strokeWidth="2"
              onClick={(e) => handleFaceClick(e, faceId)}
              style={{ transition: 'fill 0.2s', opacity: (isCrossedOut && faceId !== 'center') ? 0.3 : 1 }}
            />
          ))}

          {/* Superposiciones gráficas para estados especiales */}
          {isCrossedOut && (
            <g style={{ pointerEvents: 'none' }}>
              <line x1="0" y1="0" x2="100" y2="100" stroke={crossColor} strokeWidth="8" />
              <line x1="100" y1="0" x2="0" y2="100" stroke={crossColor} strokeWidth="8" />
            </g>
          )}

        </svg>
      </div>
    </div>
  );
};

export default Tooth;
