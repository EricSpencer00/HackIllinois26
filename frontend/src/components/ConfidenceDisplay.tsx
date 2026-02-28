interface Props {
  score: number;
  sentiment: string;
  reasoning: string;
  question: string;
}

export default function ConfidenceDisplay({ score, sentiment, reasoning, question }: Props) {
  const getColor = () => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getSentimentEmoji = () => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return '🟢';
      case 'bearish': return '🔴';
      default: return '🟡';
    }
  };

  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="confidence-card">
      <h2 className="confidence-question">"{question}"</h2>
      <div className="confidence-body">
        <div className="confidence-ring-container">
          <svg viewBox="0 0 200 200" className="confidence-ring">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="12"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getColor()}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="confidence-ring-progress"
            />
          </svg>
          <div className="confidence-score-text">
            <span className="confidence-number" style={{ color: getColor() }}>
              {score}
            </span>
            <span className="confidence-percent">%</span>
          </div>
        </div>
        <div className="confidence-details">
          <div className="sentiment-badge" style={{ borderColor: getColor() }}>
            {getSentimentEmoji()} {sentiment.toUpperCase()}
          </div>
          <p className="reasoning-text">{reasoning}</p>
        </div>
      </div>
    </div>
  );
}
