function isValidCoordinate(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getValidMapPoints(result) {
  const points = Array.isArray(result?.mapPoints) ? result.mapPoints : [];

  return points.filter(
    (point) =>
      isValidCoordinate(point?.lat) &&
      isValidCoordinate(point?.lon)
  );
}

function buildBounds(points) {
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lon);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const latPadding = Math.max((maxLat - minLat) * 0.2, 0.01);
  const lonPadding = Math.max((maxLon - minLon) * 0.2, 0.01);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLon: minLon - lonPadding,
    maxLon: maxLon + lonPadding
  };
}

function buildEmbedUrl(points) {
  const bounds = buildBounds(points);
  const bbox = [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat]
    .map((value) => value.toFixed(6))
    .join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

function buildOpenStreetMapLink(points) {
  const firstPoint = points[0];

  return `https://www.openstreetmap.org/?mlat=${firstPoint.lat.toFixed(6)}&mlon=${firstPoint.lon.toFixed(6)}#map=13/${firstPoint.lat.toFixed(6)}/${firstPoint.lon.toFixed(6)}`;
}

function getDirectionLabel(direction) {
  return direction === 'toWork' ? 'מהבית לעבודה' : 'מהעבודה לבית';
}

function MapPanel({ results, direction }) {
  const firstResult = results[0];
  const mapPoints = getValidMapPoints(firstResult);
  const mapUrl = mapPoints.length >= 2 ? buildEmbedUrl(mapPoints) : '';
  const externalMapUrl = mapPoints.length ? buildOpenStreetMapLink(mapPoints) : '';

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

            <iframe
              title="מפת מסלול"
              src={mapUrl}
              className="map-iframe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <ol className="map-points-list">
              {mapPoints.map((point) => (
                <li key={point.id || `${point.role}-${point.lat}-${point.lon}`}>
                  <strong>{point.label}</strong>
                  <div>{point.name}</div>
                </li>
              ))}
            </ol>

            <a
              href={externalMapUrl}
              target="_blank"
              rel="noreferrer"
              className="map-link"
            >
              פתח ב-OpenStreetMap
            </a>
          </>
        ) : (
          <p>אין עדיין מספיק נקודות תקינות להצגת מפה.</p>
        )}
      </div>
    </div>
  );
}

export default MapPanel;
