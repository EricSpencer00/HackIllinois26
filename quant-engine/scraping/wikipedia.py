"""
WIKIPEDIA SCRAPER
- Interacts with: Wikipedia API.
- Purpose: Fetches background context, historical facts, or biographical info
  relevant to the user's question.
"""

import requests


def search_wikipedia(query: str, max_results: int = 3) -> str:
    """Search Wikipedia and return summary text for the top results."""
    search_url = "https://en.wikipedia.org/w/api.php"
    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
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