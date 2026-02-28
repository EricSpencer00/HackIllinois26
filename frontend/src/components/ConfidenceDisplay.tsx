interface Props {
  score: number;
  sentiment: string;
  reasoning: string;
  question: string;
}

export default function ConfidenceDisplay({ score, sentiment, reasoning, question }: Props) {
  return (
    <div className="confidence-display">
      <h2>"{question}"</h2>
      <div style={{ marginTop: '1rem', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.25rem' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Confidence Score: {score}%
        </p>
        <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>
          Sentiment: {sentiment.toUpperCase()}
        </p>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          {reasoning}
        </p>
      </div>
    </div>
  );
}
