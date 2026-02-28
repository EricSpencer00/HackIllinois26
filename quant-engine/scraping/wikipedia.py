"""
WIKIPEDIA SCRAPER
- Interacts with: Wikipedia API.
- Purpose: Fetches background context, historical facts, or biographical info
  relevant to the user's question.
"""

import re
import requests


def _extract_wiki_query(question: str) -> str:
    """Extract entity names and key terms for Wikipedia search."""
    words = question.split()
    question_words = {'will', 'what', 'when', 'where', 'how', 'is', 'are', 'can',
                      'do', 'does', 'should', 'would', 'could', 'the', 'a', 'an', 'by'}
    proper_nouns = []
    for i, w in enumerate(words):
        clean = re.sub(r'[^a-zA-Z0-9\'-]', '', w)
        if not clean:
            continue
        if clean[0].isupper() and len(clean) > 1:
            if i == 0 and clean.lower() in question_words:
                continue
            proper_nouns.append(clean)

    domain_terms = ['trillionaire', 'billionaire', 'net worth', 'wealth',
                    'president', 'ceo', 'founder', 'market cap', 'ipo']
    important = []
    lower_q = question.lower()
    for term in domain_terms:
        if term in lower_q:
            important.append(term)

    if proper_nouns:
        result = ' '.join(proper_nouns)
        if important:
            result += ' ' + important[0]
        return result
    return question


def search_wikipedia(query: str, max_results: int = 3) -> str:
    """Search Wikipedia and return summary text for the top results."""
    wiki_query = _extract_wiki_query(query)
    search_url = "https://en.wikipedia.org/w/api.php"
    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": wiki_query,
        "srlimit": max_results,
        "format": "json",
    }

    try:
        resp = requests.get(search_url, params=search_params, timeout=10)
        resp.raise_for_status()
        results = resp.json().get("query", {}).get("search", [])

        if not results:
            return f"No Wikipedia results for: {query}"

        summaries = []
        for r in results:
            title = r["title"]
            summary = _get_page_summary(title)
            if summary:
                summaries.append(f"## {title}\n{summary}")

        return "\n\n".join(summaries) if summaries else "No summaries found."

    except Exception as e:
        return f"Wikipedia scrape failed: {str(e)}"


def _get_page_summary(title: str) -> str:
    """Get the summary extract for a Wikipedia page."""
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            extract = page.get("extract", "")
            if len(extract) > 1500:
                extract = extract[:1500] + "..."
            return extract
        return ""
    except Exception:
        return ""