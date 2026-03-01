"""
Tests for scraping/polymarket.py — Polymarket CLOB / Gamma API.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestSearchMarkets:
    @patch("scraping.polymarket.requests.get")
    def test_successful_search(self, mock_get, sample_polymarket_gamma_response):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_polymarket_gamma_response
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("Tesla stock price")
        assert len(results) >= 1
        first = results[0]
        assert "question" in first
        assert "outcome_yes" in first
        assert "outcome_no" in first

    @patch("scraping.polymarket.requests.get")
    def test_no_relevant_markets(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = [
            {
                "question": "Completely unrelated topic",
                "description": "Nothing to do with query",
                "outcomePrices": ["0.5", "0.5"],
                "volume": "1000",
                "liquidity": "500",
                "endDate": "2026-12-31",
                "slug": "unrelated",
            }
        ]
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("xyzzy foobar baz")
        # No keyword overlap → empty (or the keyword filter drops them)
        assert isinstance(results, list)

    @patch("scraping.polymarket.requests.get")
    def test_api_error(self, mock_get):
        mock_get.side_effect = Exception("Connection refused")

        from scraping.polymarket import search_markets

        results = search_markets("Tesla")
        assert len(results) == 1
        assert "error" in results[0]
        assert "Polymarket search failed" in results[0]["error"]

    @patch("scraping.polymarket.requests.get")
    def test_stop_words_removed(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = []
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        search_markets("Will the Tesla stock go up?")
        call_params = mock_get.call_args[1]["params"]
        query = call_params["query"]
        # 'will' and 'the' should be stripped
        assert "will" not in query.split()
        assert "the" not in query.split()

    @patch("scraping.polymarket.requests.get")
    def test_limit_parameter(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = []
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        search_markets("Tesla", limit=10)
        call_params = mock_get.call_args[1]["params"]
        assert call_params["limit"] == 10

    @patch("scraping.polymarket.requests.get")
    def test_outcome_prices_from_list(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = [
            {
                "question": "Tesla test market",
                "description": "Tesla market description",
                "outcomePrices": ["0.72", "0.28"],
                "volume": "5000",
                "liquidity": "1000",
                "endDate": "2026-06-01",
                "slug": "tesla-test",
            }
        ]
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("Tesla market")
        assert len(results) == 1
        assert results[0]["outcome_yes"] == "0.72"
        assert results[0]["outcome_no"] == "0.28"

    @patch("scraping.polymarket.requests.get")
    def test_fallback_to_best_bid_ask(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = [
            {
                "question": "Tesla fallback test",
                "description": "Tesla fallback description",
                "outcomePrices": [],  # empty list
                "volume": "5000",
                "liquidity": "1000",
                "endDate": "2026-06-01",
                "slug": "tesla-fallback",
                "bestBid": "0.60",
                "bestAsk": "0.40",
            }
        ]
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("Tesla fallback")
        assert len(results) == 1
        assert results[0]["outcome_yes"] == "0.60"
        assert results[0]["outcome_no"] == "0.40"

    @patch("scraping.polymarket.requests.get")
    def test_results_capped_at_5(self, mock_get):
        markets = [
            {
                "question": f"Tesla market {i}",
                "description": f"Tesla description {i}",
                "outcomePrices": ["0.5", "0.5"],
                "volume": "1000",
                "liquidity": "500",
                "endDate": "2026-01-01",
                "slug": f"market-{i}",
            }
            for i in range(10)
        ]
        mock_resp = MagicMock()
        mock_resp.json.return_value = markets
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("Tesla market")
        assert len(results) <= 5

    @patch("scraping.polymarket.requests.get")
    def test_description_truncated(self, mock_get):
        long_desc = "Tesla " + ("x" * 500)
        mock_resp = MagicMock()
        mock_resp.json.return_value = [
            {
                "question": "Tesla long desc",
                "description": long_desc,
                "outcomePrices": ["0.5", "0.5"],
                "volume": "1000",
                "liquidity": "500",
                "endDate": "2026-01-01",
                "slug": "long-desc",
            }
        ]
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.polymarket import search_markets

        results = search_markets("Tesla long")
        assert len(results[0]["description"]) <= 200


class TestGetPolymarketContext:
    @patch("scraping.polymarket.search_markets")
    def test_with_markets(self, mock_search):
        mock_search.return_value = [
            {
                "question": "Will Tesla hit 300?",
                "outcome_yes": "0.65",
                "outcome_no": "0.35",
                "volume": "150000",
            }
        ]

        from scraping.polymarket import get_polymarket_context

        result = get_polymarket_context("Tesla stock")
        assert "Polymarket Prediction Markets:" in result
        assert "Will Tesla hit 300?" in result
        assert "0.65" in result
        assert "150000" in result

    @patch("scraping.polymarket.search_markets")
    def test_no_markets(self, mock_search):
        mock_search.return_value = []

        from scraping.polymarket import get_polymarket_context

        result = get_polymarket_context("xyzzy")
        assert result == "No relevant Polymarket data found."

    @patch("scraping.polymarket.search_markets")
    def test_market_with_error(self, mock_search):
        mock_search.return_value = [
            {"error": "Polymarket search failed: timeout"}
        ]

        from scraping.polymarket import get_polymarket_context

        result = get_polymarket_context("Tesla")
        assert "Error:" in result

    @patch("scraping.polymarket.search_markets")
    def test_market_without_optional_fields(self, mock_search):
        mock_search.return_value = [
            {
                "question": "Some market?",
                "outcome_yes": None,
                "outcome_no": None,
                "volume": None,
            }
        ]

        from scraping.polymarket import get_polymarket_context

        result = get_polymarket_context("some query")
        assert "Some market?" in result
        # Should not crash on None values
