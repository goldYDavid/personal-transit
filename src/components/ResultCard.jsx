import { useState } from 'react';
import TripDetails from './TripDetails';

function ResultCard({ result }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="card">
      <h3>
        יציאה {result.departureTime} | הגעה {result.arrivalTime}
      </h3>
      <p>
        משך כולל: {result.totalMinutes} דקות | החלפות: {result.transfers}
      </p>
      <p>קווים: {result.lines.join(', ') || 'לא זמין'}</p>
      <span className="tag">זמן אמת: {result.realtimeStatus || 'לא זמין'}</span>
      <div style={{ marginTop: 10 }}>
        <button className="btn light" onClick={() => setShowDetails((v) => !v)}>
          {showDetails ? 'סגור פירוט' : 'פירוט'}
        </button>
      </div>
      {showDetails ? <TripDetails steps={result.steps} /> : null}
    </div>
  );
}

export default ResultCard;
