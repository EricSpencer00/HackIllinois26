interface Props {
  score: number;
  sentiment: string;
  reasoning: string;
  question: string;
  tradeUrl?: string;
}

export default function ConfidenceDisplay({ score, sentiment, reasoning, question, tradeUrl }: Props) {
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
        
        {tradeUrl && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <a 
              href={tradeUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: 'var(--accent-orange)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                border: '4px outset var(--accent-orange)',
                boxShadow: '0 0 15px var(--accent-orange)'
              }}
            >
              TRADE DIRECTLY NOW!
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
