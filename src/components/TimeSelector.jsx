function TimeSelector({ mode, onModeChange, manualTime, onManualTimeChange }) {
  return (
    <div className="segment">
      <button className={`btn ${mode === 'now' ? '' : 'light'}`} onClick={() => onModeChange('now')}>
        עכשיו
      </button>
      <button
        className={`btn ${mode === 'tomorrowMorning' ? '' : 'light'}`}
        onClick={() => onModeChange('tomorrowMorning')}
      >
        מחר בבוקר
      </button>
      <label className="field" style={{ margin: 0 }}>
        <span>שעה ידנית</span>
        <input
          className="input"
          type="time"
          value={manualTime}
          onChange={(event) => {
            onModeChange('manual');
            onManualTimeChange(event.target.value);
          }}
        />
      </label>
    </div>
  );
}

export default TimeSelector;
