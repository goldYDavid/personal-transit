function MapPanel({ results, direction }) {
  const first = results[0];
  const coords = first?.primaryCoordinates;

  return (
    <div className="card map-panel">
      <h3>מפה פשוטה</h3>
      <div className="map-box">
        {coords ? (
          <>
            <p>
              כיוון נוכחי: {direction === 'toWork' ? 'מהבית לעבודה' : 'מהעבודה לבית'}
            </p>
            <p>
              תחנת מוצא: {first.originStopName} ({coords.origin.lat}, {coords.origin.lon})
            </p>
            <p>
              תחנת יעד: {first.destinationStopName} ({coords.destination.lat}, {coords.destination.lon})
            </p>
            <p>כתובת תצוגת מפה: {import.meta.env.VITE_MAP_STYLE_URL || 'לא הוגדרה'}</p>
          </>
        ) : (
          <p>אין נתוני תחנות להצגה במפה.</p>
        )}
      </div>
    </div>
  );
}

export default MapPanel;
