"""
Tests for scraping/wikipedia.py — Wikipedia API interactions.
"""

import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# _extract_wiki_query tests
# ---------------------------------------------------------------------------
class TestExtractWikiQuery:
    def _fn(self, q):
        from scraping.wikipedia import _extract_wiki_query
        return _extract_wiki_query(q)

    def test_proper_nouns_extracted(self):
        result = self._fn("Will Tesla stock go up?")
        assert "Tesla" in result

    def test_multiple_proper_nouns(self):
        result = self._fn("Will Elon Musk buy Twitter?")
        assert "Elon" in result
        assert "Musk" in result
        assert "Twitter" in result

    def test_leading_question_word_ignored(self):
        """A capitalized question word at the start (like 'Will') should be dropped."""
        result = self._fn("Will Apple announce new MacBook?")
        assert "Will" not in result
        assert "Apple" in result
        assert "MacBook" in result

    def test_no_proper_nouns_returns_full_question(self):
        q = "how does inflation work?"
        result = self._fn(q)
        assert result == q

    def test_domain_terms_detected(self):
        """Domain terms like 'trillionaire' should be found but proper nouns take priority."""
        result = self._fn("Will Elon Musk become a trillionaire?")
        # Proper nouns present → those are used instead of domain terms
        assert "Elon" in result
        assert "Musk" in result


# ---------------------------------------------------------------------------
# search_wikipedia tests
# ---------------------------------------------------------------------------
class TestSearchWikipedia:
    @patch("scraping.wikipedia._get_page_summary")
    @patch("scraping.wikipedia.requests.get")
    def test_successful_search(self, mock_get, mock_summary, sample_wiki_search_response):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_wiki_search_response
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        mock_summary.side_effect = [
            "Tesla, Inc. is an American EV company.",
            "Elon Musk is the CEO of Tesla.",
        ]

        from scraping.wikipedia import search_wikipedia

        result = search_wikipedia("Tesla Elon Musk")
        assert "## Tesla, Inc." in result
        assert "## Elon Musk" in result
        assert "American EV company" in result

    @patch("scraping.wikipedia.requests.get")
    def test_no_results(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"query": {"search": []}}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.wikipedia import search_wikipedia

        result = search_wikipedia("zzxxyy404notfound")
        assert "No Wikipedia results" in result

    @patch("scraping.wikipedia.requests.get")
    def test_api_exception(self, mock_get):
        mock_get.side_effect = Exception("Network error")

        from scraping.wikipedia import search_wikipedia

        result = search_wikipedia("Tesla")
        assert "Wikipedia scrape failed" in result

    @patch("scraping.wikipedia._get_page_summary")
    @patch("scraping.wikipedia.requests.get")
    def test_empty_summaries_fallback(self, mock_get, mock_summary):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "query": {"search": [{"title": "Page1"}, {"title": "Page2"}]}
        }
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        mock_summary.return_value = ""  # both pages return empty

        from scraping.wikipedia import search_wikipedia

        result = search_wikipedia("something")
        assert result == "No summaries found."

    @patch("scraping.wikipedia._get_page_summary")
    @patch("scraping.wikipedia.requests.get")
    def test_max_results_parameter(self, mock_get, mock_summary):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"query": {"search": [{"title": "A"}]}}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp
        mock_summary.return_value = "Summary A"

        from scraping.wikipedia import search_wikipedia

        search_wikipedia("query", max_results=5)
        call_params = mock_get.call_args[1]["params"]
        assert call_params["srlimit"] == 5


# ---------------------------------------------------------------------------
# _get_page_summary tests
# ---------------------------------------------------------------------------
class TestGetPageSummary:
    @patch("scraping.wikipedia.requests.get")
    def test_successful_summary(self, mock_get, sample_wiki_page_response):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_wiki_page_response
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.wikipedia import _get_page_summary

        result = _get_page_summary("Tesla, Inc.")
        assert "electric vehicle" in result

    @patch("scraping.wikipedia.requests.get")
    def test_long_extract_truncated(self, mock_get):
        long_text = "A" * 2000
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "query": {"pages": {"1": {"title": "Long", "extract": long_text}}}
        }
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.wikipedia import _get_page_summary

        result = _get_page_summary("Long")
        assert len(result) <= 1504  # 1500 + "..."

    @patch("scraping.wikipedia.requests.get")
    def test_api_error_returns_empty(self, mock_get):
        mock_get.side_effect = Exception("Timeout")

        from scraping.wikipedia import _get_page_summary

        result = _get_page_summary("Anything")
        assert result == ""

    @patch("scraping.wikipedia.requests.get")
    def test_missing_extract_field(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "query": {"pages": {"1": {"title": "NoExtract"}}}
        }
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.wikipedia import _get_page_summary

        result = _get_page_summary("NoExtract")
        assert result == ""

    @patch("scraping.wikipedia.requests.get")
    def test_empty_pages(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = {"query": {"pages": {}}}
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.wikipedia import _get_page_summary

        result = _get_page_summary("Nothing")
        assert result == ""
