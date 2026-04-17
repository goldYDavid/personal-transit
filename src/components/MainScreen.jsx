import { useEffect, useMemo, useState } from 'react';
import { plannerService } from '../services/tripPlannerService';
import { realtimeService } from '../services/realtimeService';
import { openBusService } from '../services/openBusService';
import { appConfig } from '../config/appConfig';
import DirectionButtons from './DirectionButtons';
import TimeSelector from './TimeSelector';
import ResultsList from './ResultsList';
import MapPanel from './MapPanel';
import ErrorBanner from './ErrorBanner';
import LoadingState from './LoadingState';

function nowTimeLabel() {
  return new Date().toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function buildLogLine(message, details) {
  if (!details) {
    return `[${nowTimeLabel()}] ${message}`;
  }

  return `[${nowTimeLabel()}] ${message} | ${details}`;
}

function BrowserLogsScreen({ browserLogs, debugInfo, onClear }) {
  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <strong>לוג דפדפן</strong>
        <div style={{ marginTop: 8 }}>אירועים מתועדים: {browserLogs.length}</div>
        <div style={{ marginTop: 10 }}>
          <button className="btn light" onClick={onClear}>
            נקה לוג דפדפן
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <strong>לוג פעולות בדפדפן</strong>
        <div style={{ marginTop: 8 }}>
          {browserLogs.length ? browserLogs.join('\n') : 'אין אירועים עדיין'}
        </div>
      </div>

      <div className="card" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <strong>לוג OpenBus</strong>
        <div style={{ marginTop: 8 }}>קריאות שרת: {debugInfo.requestCount || 0}</div>
        <div>שלב אחרון: {debugInfo.lastStep || 'אין'}</div>
        <div>URL אחרון: {debugInfo.lastUrl || 'אין'}</div>
        <div style={{ marginTop: 8 }}>
          {(debugInfo.recentLogs || []).join('\n') || 'אין לוג OpenBus'}
        </div>
      </div>
    </div>
  );
}

function MainScreen({ user, onLogout }) {
  const [direction, setDirection] = useState('toWork');
  const [timeMode, setTimeMode] = useState('now');
  const [manualTime, setManualTime] = useState('08:00');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeScreen, setActiveScreen] = useState('results');
  const [debugInfo, setDebugInfo] = useState(openBusService.getDebugSnapshot());
  const [browserLogs, setBrowserLogs] = useState([buildLogLine('מסך ראשי נטען')]);

  const addBrowserLog = (message, details = '') => {
    setBrowserLogs((currentLogs) => [...currentLogs, buildLogLine(message, details)].slice(-200));
  };

  const planningTime = useMemo(
    () => plannerService.resolveRequestedTime(timeMode, manualTime),
    [timeMode, manualTime]
  );

  useEffect(() => {
    if (!loading) {
      setDebugInfo(openBusService.getDebugSnapshot());
      return undefined;
    }

    const intervalId = setInterval(() => {
      setDebugInfo(openBusService.getDebugSnapshot());
    }, 500);

    return () => clearInterval(intervalId);
  }, [loading]);

  const loadTrips = async (reason = 'manual') => {
    addBrowserLog('התחלת טעינת נסיעות', `reason=${reason}, direction=${direction}, timeMode=${timeMode}, manualTime=${manualTime}`);
    setError('');
    setLoading(true);
    setDebugInfo(openBusService.getDebugSnapshot());

    try {
      const planned = await plannerService.getPersonalTrips({
        userId: user.id,
        direction,
        requestedAt: planningTime
      });

      addBrowserLog('התקבלו תוצאות תכנון', `count=${planned.length}`);
      const withRealtime = await realtimeService.attachRealtimeStatus(planned);
      addBrowserLog('הוצמד זמן אמת', `count=${withRealtime.length}`);
      setResults(withRealtime);
      setDebugInfo(openBusService.getDebugSnapshot());
    } catch (serviceError) {
      setResults([]);
      setError(serviceError.message || 'לא ניתן לתכנן נסיעות כרגע.');
      addBrowserLog('טעינת נסיעות נכשלה', serviceError.message || 'שגיאה לא ידועה');
      setDebugInfo(openBusService.getDebugSnapshot());
    } finally {
      setLoading(false);
      addBrowserLog('טעינת נסיעות הסתיימה');
    }
  };

  useEffect(() => {
    loadTrips('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, planningTime]);

  const handleDirectionChange = (nextDirection) => {
    addBrowserLog('שינוי כיוון נסיעה', `${direction} -> ${nextDirection}`);
    setDirection(nextDirection);
  };

  const handleTimeModeChange = (nextMode) => {
    addBrowserLog('שינוי מצב זמן', `${timeMode} -> ${nextMode}`);
    setTimeMode(nextMode);
  };

  const handleManualTimeChange = (nextTime) => {
    addBrowserLog('שינוי שעה ידנית', `${manualTime} -> ${nextTime}`);
    setManualTime(nextTime);
  };

  const handleScreenChange = (nextScreen) => {
    addBrowserLog('מעבר מסך', `${activeScreen} -> ${nextScreen}`);
    setActiveScreen(nextScreen);
  };

  const clearBrowserLogs = () => {
    setBrowserLogs([buildLogLine('לוג דפדפן נוקה ידנית')]);
  };

  return (
    <div>
      <div className="toolbar">
        <h1>תכנון נסיעה קבועה: קריית מלאכי ↔ רחובות</h1>
        <button className="btn secondary" onClick={onLogout}>
          יציאה
        </button>
      </div>

      <div className="segment" style={{ marginBottom: 10 }}>
        <DirectionButtons
          direction={direction}
          onChange={handleDirectionChange}
          labels={appConfig.directions}
        />
        <TimeSelector
          mode={timeMode}
          onModeChange={handleTimeModeChange}
          manualTime={manualTime}
          onManualTimeChange={handleManualTimeChange}
        />
        <button className="btn" onClick={() => loadTrips('manual-refresh')}>
          רענון תוצאות
        </button>
      </div>

      <div className="segment" style={{ marginBottom: 12 }}>
        <button
          className={`btn ${activeScreen === 'results' ? '' : 'light'}`}
          onClick={() => handleScreenChange('results')}
        >
          תוצאות
        </button>
        <button
          className={`btn ${activeScreen === 'logs' ? '' : 'light'}`}
          onClick={() => handleScreenChange('logs')}
        >
          לוגים
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {activeScreen === 'logs' ? (
        <BrowserLogsScreen
          browserLogs={browserLogs}
          debugInfo={debugInfo}
          onClear={clearBrowserLogs}
        />
      ) : loading ? (
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
