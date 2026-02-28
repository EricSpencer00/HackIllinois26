import { useState } from 'react';

interface Props {
  onSearch: (question: string) => void;
  loading: boolean;
  visible: boolean;
}

export default function SearchBar({ onSearch, loading, visible }: Props) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <div className={`search-container ${visible ? '' : 'hidden'}`}>
      <div className="search-bar">
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="search-input"
            placeholder="Ask anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </form>
        <span className="search-hint">press enter to analyze</span>
      </div>
    </div>
  );
}
