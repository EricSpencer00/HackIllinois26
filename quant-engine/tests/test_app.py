"""
Tests for app.py — FastAPI endpoints and helper functions.
"""

import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# _extract_symbol tests
# ---------------------------------------------------------------------------
class TestExtractSymbol:
    """Unit tests for the _extract_symbol helper."""

    def _fn(self, q):
        from app import _extract_symbol
        return _extract_symbol(q)

    # --- Ticker via $ prefix ---
    def test_dollar_sign_ticker(self):
        assert self._fn("What will $TSLA do next week?") == "TSLA"

    def test_dollar_sign_lowercase(self):
        assert self._fn("Is $aapl a buy?") == "AAPL"

    def test_dollar_sign_short(self):
        assert self._fn("Buy $V now") == "V"

    # --- Keyword mapping ---
    def test_keyword_tesla(self):
        assert self._fn("Will Tesla hit 300?") == "TSLA"

    def test_keyword_apple(self):
        assert self._fn("Is Apple stock a buy?") == "AAPL"

    def test_keyword_google(self):
        assert self._fn("Google earnings report") == "GOOGL"

    def test_keyword_alphabet(self):
        assert self._fn("Alphabet Q3 results") == "GOOGL"

    def test_keyword_amazon(self):
        assert self._fn("Amazon stock forecast") == "AMZN"

    def test_keyword_nvidia(self):
        assert self._fn("NVIDIA chip demand") == "NVDA"

    def test_keyword_elon(self):
        assert self._fn("Will Elon announce something?") == "TSLA"

    def test_keyword_spacex(self):
        assert self._fn("SpaceX launch impact") == "TSLA"

    # --- No match ---
    def test_no_match_general_question(self):
        assert self._fn("Will it rain tomorrow?") is None

    def test_no_match_empty(self):
        assert self._fn("") is None

    # --- Crypto exclusion (long names) ---
    def test_crypto_bitcoin_excluded(self):
        assert self._fn("Will bitcoin hit 100k?") is None

    def test_crypto_ethereum_excluded(self):
        assert self._fn("Ethereum merge impact") is None

    def test_crypto_solana_excluded(self):
        assert self._fn("Solana price prediction") is None

    def test_crypto_dogecoin_excluded(self):
        assert self._fn("Is dogecoin a good investment?") is None

    def test_crypto_generic_excluded(self):
        assert self._fn("Best cryptocurrency to buy") is None

    # --- Crypto exclusion (short tickers) ---
    def test_crypto_btc_short_excluded(self):
        assert self._fn("BTC is pumping") is None

    def test_crypto_eth_short_excluded(self):
        assert self._fn("ETH price today") is None

    def test_crypto_sol_short_excluded(self):
        assert self._fn("SOL to the moon") is None

    # --- Short ticker should NOT match mid-word ---
    def test_eth_in_whether_not_excluded(self):
        """'eth' inside 'whether' should NOT trigger exclusion because \\b won't match."""
        # 'whether' contains 'eth' but word-boundary check should skip it
        result = self._fn("Whether Apple launches a new product")
        assert result == "AAPL"


# ---------------------------------------------------------------------------
# Root / Health endpoint tests
# ---------------------------------------------------------------------------
class TestRootAndHealth:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json() == {"status": "Quant Engine is running!"}

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "healthy"}


# ---------------------------------------------------------------------------
# POST /api/analyze
# ---------------------------------------------------------------------------
class TestAnalyzeEndpoint:
    @patch("app.get_trade_confidence")
    @patch("app.get_polymarket_context")
    @patch("app.search_wikipedia")
    @patch("app.get_market_sentiment")
    def test_analyze_with_symbol(
        self, mock_sentiment, mock_wiki, mock_poly, mock_score, client
    ):
        mock_wiki.return_value = "Wiki context about Tesla"
        mock_poly.return_value = "Poly context about Tesla"
        mock_sentiment.return_value = "Finnhub context about TSLA"
        mock_score.return_value = {
            "confidence_score": 80,
            "sentiment": "bullish",
            "reasoning": "Looks good.",
        }

        resp = client.post(
            "/api/analyze",
            json={"question": "Will Tesla hit 300?"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence_score"] == 80
        assert data["sentiment"] == "bullish"
        assert data["symbol"] == "TSLA"
        assert "sources" in data
        assert data["sources"]["wikipedia"] is not None
        assert data["sources"]["polymarket"] is not None
        assert data["sources"]["finnhub"] is not None

    @patch("app.get_trade_confidence")
    @patch("app.get_polymarket_context")
    @patch("app.search_wikipedia")
    def test_analyze_without_symbol(
        self, mock_wiki, mock_poly, mock_score, client
    ):
        mock_wiki.return_value = "Wiki context"
        mock_poly.return_value = "Poly context"
        mock_score.return_value = {
            "confidence_score": 50,
            "sentiment": "neutral",
            "reasoning": "Uncertain.",
        }

        resp = client.post(
            "/api/analyze",
            json={"question": "Will it rain tomorrow?"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["confidence_score"] == 50
        assert data["symbol"] is None
        assert data["sources"]["finnhub"] is None

    @patch("app.get_trade_confidence")
    @patch("app.get_polymarket_context")
    @patch("app.search_wikipedia")
    def test_analyze_includes_user_context(
        self, mock_wiki, mock_poly, mock_score, client
    ):
        mock_wiki.return_value = "Wiki"
        mock_poly.return_value = "Poly"
        mock_score.return_value = {
            "confidence_score": 70,
            "sentiment": "bearish",
            "reasoning": "Bad signs.",
        }

        resp = client.post(
            "/api/analyze",
            json={"question": "What about MSFT?", "context": "User passed context", "symbol": "MSFT"},
        )
        assert resp.status_code == 200
        # Verify score function received the user context
        call_args = mock_score.call_args
        assert "User passed context" in call_args[0][1]

    @patch("app.get_polymarket_context", side_effect=Exception("boom"))
    @patch("app.search_wikipedia", return_value="wiki")
    def test_analyze_error_returns_500(self, mock_wiki, mock_poly, client):
        resp = client.post(
            "/api/analyze",
            json={"question": "Will Tesla hit 300?"},
        )
        assert resp.status_code == 500

    def test_analyze_missing_question(self, client):
        resp = client.post("/api/analyze", json={})
        assert resp.status_code == 422  # validation error


# ---------------------------------------------------------------------------
# GET /api/scrape
# ---------------------------------------------------------------------------
class TestScrapeEndpoint:
    @patch("app.get_company_news")
    @patch("app.get_stock_quote")
    @patch("app.search_markets")
    @patch("app.search_wikipedia")
    def test_scrape_with_symbol(
        self, mock_wiki, mock_markets, mock_quote, mock_news, client
    ):
        mock_wiki.return_value = "Wiki data"
        mock_markets.return_value = [{"question": "Market?"}]
        mock_quote.return_value = {"current_price": 250}
        mock_news.return_value = [{"headline": "News"}]

        resp = client.get("/api/scrape", params={"question": "Tesla stock"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["wikipedia"] == "Wiki data"
        assert data["finnhub"]["quote"]["current_price"] == 250
        assert data["symbol"] == "TSLA"

    @patch("app.search_markets")
    @patch("app.search_wikipedia")
    def test_scrape_without_symbol(self, mock_wiki, mock_markets, client):
        mock_wiki.return_value = "Wiki general"
        mock_markets.return_value = []

        resp = client.get("/api/scrape", params={"question": "Will it rain?"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["finnhub"] is None
        assert "symbol" not in data

    def test_scrape_missing_question(self, client):
        resp = client.get("/api/scrape")
        assert resp.status_code == 422
