import ResultCard from './ResultCard';

function ResultsList({ results }) {
  if (!results.length) {
    return <div className="card">לא נמצאו נסיעות רלוונטיות בזמן שנבחר.</div>;
  }

  return (
    <div className="result-list">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}

export default ResultsList;
