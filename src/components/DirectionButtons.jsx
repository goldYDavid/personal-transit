function DirectionButtons({ direction, onChange, labels }) {
  return (
    <div className="segment">
      <button
        className={`btn ${direction === 'toWork' ? '' : 'light'}`}
        onClick={() => onChange('toWork')}
      >
        {labels.toWork}
      </button>
      <button
        className={`btn ${direction === 'toHome' ? '' : 'light'}`}
        onClick={() => onChange('toHome')}
      >
        {labels.toHome}
      </button>
    </div>
  );
}

export default DirectionButtons;
