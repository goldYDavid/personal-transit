import { useEffect, useMemo, useState } from 'react';
import { plannerService } from '../services/tripPlannerService';
import { realtimeService } from '../services/realtimeService';
import { appConfig } from '../config/appConfig';
import DirectionButtons from './DirectionButtons';
import TimeSelector from './TimeSelector';
import ResultsList from './ResultsList';
import MapPanel from './MapPanel';
import ErrorBanner from './ErrorBanner';
import LoadingState from './LoadingState';

function MainScreen({ user, onLogout }) {
  const [direction, setDirection] = useState('toWork');
  const [timeMode, setTimeMode] = useState('now');
  const [manualTime, setManualTime] = useState('08:00');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const planningTime = useMemo(
    () => plannerService.resolveRequestedTime(timeMode, manualTime),
    [timeMode, manualTime]
  );

  const loadTrips = async () => {
    setError('');
    setLoading(true);
    try {
      const planned = await plannerService.getPersonalTrips({
        userId: user.id,
        direction,
        requestedAt: planningTime
      });

      const withRealtime = await realtimeService.attachRealtimeStatus(planned);
      setResults(withRealtime);
    } catch (serviceError) {
      setResults([]);
      setError(serviceError.message || 'לא ניתן לתכנן נסיעות כרגע.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, planningTime]);

  return (
    <div>
      <div className="toolbar">
        <h1>תכנון נסיעה קבועה: קריית מלאכי ↔ רחובות</h1>
        <button className="btn secondary" onClick={onLogout}>
          יציאה
        </button>
      </div>

      <div className="segment" style={{ marginBottom: 10 }}>
        <DirectionButtons direction={direction} onChange={setDirection} labels={appConfig.directions} />
        <TimeSelector
          mode={timeMode}
          onModeChange={setTimeMode}
          manualTime={manualTime}
          onManualTimeChange={setManualTime}
        />
        <button className="btn" onClick={loadTrips}>
          רענון תוצאות
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loading ? (
        <LoadingState text="מחשב נסיעות רלוונטיות..." />
      ) : (
        <div className="main-grid">
          <ResultsList results={results} />
          <MapPanel results={results} direction={direction} />
        </div>
      )}
    </div>
  );
}

export default MainScreen;
