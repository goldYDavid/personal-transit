function StepRow({ step, index }) {
  return (
    <li key={`${step.type}-${index}`} style={{ marginBottom: 12 }}>
      <div>
        <strong>
          {index + 1}. {step.text}
        </strong>
      </div>

      {step.line ? <div>קו: {step.line}</div> : null}
      {step.time ? <div>שעה: {step.time}</div> : null}
      {step.stopName ? <div>תחנה: {step.stopName}</div> : null}
      {step.waitMinutes !== undefined ? <div>זמן המתנה: {step.waitMinutes} דקות</div> : null}
    </li>
  );
}

function TripDetails({ steps }) {
  const transferStep = steps.find((step) => step.type === 'transfer');
  const transferArrivalStep = steps.find((step) => step.type === 'transfer_arrival');

  return (
    <div>
      <h4>שלבי נסיעה</h4>

      {transferStep ? (
        <div className="card" style={{ marginBottom: 12, background: '#f8fafc' }}>
          <strong>פרטי החלפה</strong>
          <div style={{ marginTop: 8 }}>תחנת החלפה: {transferStep.stopName || 'לא זמין'}</div>
          <div>שעת הגעה להחלפה: {transferArrivalStep?.time || 'לא זמין'}</div>
          <div>שעת יציאה מקו ההמשך: {transferStep.time || 'לא זמין'}</div>
          <div>זמן המתנה: {transferStep.waitMinutes ?? 0} דקות</div>
        </div>
      ) : null}

      <ol className="route-steps">
        {steps.map((step, index) => (
          <StepRow key={`${step.type}-${index}`} step={step} index={index} />
        ))}
      </ol>
    </div>
  );
}

export default TripDetails;
