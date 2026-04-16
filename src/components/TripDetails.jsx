function TripDetails({ steps }) {
  return (
    <div>
      <h4>שלבי נסיעה</h4>
      <ol className="route-steps">
        {steps.map((step, index) => (
          <li key={`${step.type}-${index}`}>
            {step.text}
            {step.line ? ` (קו ${step.line})` : ''}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default TripDetails;
