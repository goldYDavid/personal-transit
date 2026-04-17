import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

function isValidCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getValidMapPoints(result) {
  const points = Array.isArray(result?.mapPoints) ? result.mapPoints : [];

  return points.filter(
    (point) => isValidCoordinate(point?.lat) && isValidCoordinate(point?.lon)
  );
}

function getDirectionLabel(direction) {
  return direction === 'toWork' ? 'מהבית לעבודה' : 'מהעבודה לבית';
}

function createPointIcon(role) {
  const label = role === 'origin' ? 'א' : role === 'destination' ? 'י' : 'ה';

  return L.divIcon({
    className: 'map-marker-wrapper',
    html: `<div class="map-marker map-marker-${role}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
}

function FitMapToPoints({ points }) {
  const map = useMap();

  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lon], 15);
    return null;
  }

  const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
  map.fitBounds(bounds, {
    padding: [20, 20],
    maxZoom: 14
  });

  return null;
}

function MapPanel({ results, direction }) {
  const firstResult = results[0];
  const mapPoints = getValidMapPoints(firstResult);
  const center = mapPoints[0] ? [mapPoints[0].lat, mapPoints[0].lon] : [31.8947, 34.8113];

  return (
    <div className="card map-panel">
      <h3>מפה אמיתית</h3>
      <div className="map-box">
        {mapPoints.length >= 2 ? (
          <>
            <div className="map-meta">
              <div>כיוון נוכחי: {getDirectionLabel(direction)}</div>
              <div>מסלול מוצג: התוצאה הראשונה</div>
            </div>

            <div className="map-canvas">
              <MapContainer center={center} zoom={13} scrollWheelZoom={true}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitMapToPoints points={mapPoints} />
                {mapPoints.map((point) => (
                  <Marker
                    key={point.id || `${point.role}-${point.lat}-${point.lon}`}
                    position={[point.lat, point.lon]}
                    icon={createPointIcon(point.role)}
                  >
                    <Popup>
                      <strong>{point.label}</strong>
                      <div>{point.name}</div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <ol className="map-points-list">
              {mapPoints.map((point) => (
                <li key={point.id || `${point.role}-${point.lat}-${point.lon}-text`}>
                  <strong>{point.label}</strong>
                  <div>{point.name}</div>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p>אין עדיין מספיק נקודות תקינות להצגת מפה.</p>
        )}
      </div>
    </div>
  );
}

export default MapPanel;
