"""
Tests for scraping/finnHub.py — Finnhub API interactions.
"""

import pytest
from unittest.mock import patch, MagicMock


class TestGetStockQuote:
    @patch("scraping.finnHub.requests.get")
    def test_successful_quote(self, mock_get, sample_stock_quote):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_stock_quote
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_stock_quote

        result = get_stock_quote("TSLA")
        assert result["symbol"] == "TSLA"
        assert result["current_price"] == 250.0
        assert result["high"] == 255.0
        assert result["low"] == 245.0
        assert result["open"] == 248.0
        assert result["previous_close"] == 247.0
        assert result["change"] == 3.0
        assert result["change_percent"] == 1.21

    @patch("scraping.finnHub.requests.get")
    def test_lowercase_symbol_uppercased(self, mock_get, sample_stock_quote):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_stock_quote
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_stock_quote

        result = get_stock_quote("tsla")
        assert result["symbol"] == "TSLA"
        # Verify the API was called with the uppercased symbol
        call_params = mock_get.call_args[1]["params"]
        assert call_params["symbol"] == "TSLA"

    @patch("scraping.finnHub.requests.get")
    def test_api_error(self, mock_get):
        mock_get.side_effect = Exception("Connection timeout")

        from scraping.finnHub import get_stock_quote

        result = get_stock_quote("TSLA")
        assert "error" in result
        assert "Finnhub quote failed" in result["error"]

    @patch("scraping.finnHub.requests.get")
    def test_http_error(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.raise_for_status.side_effect = Exception("404 Not Found")
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_stock_quote

        result = get_stock_quote("INVALID")
        assert "error" in result


class TestGetCompanyNews:
    @patch("scraping.finnHub.requests.get")
    def test_successful_news(self, mock_get, sample_company_news):
        mock_resp = MagicMock()
        mock_resp.json.return_value = sample_company_news
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_company_news

        result = get_company_news("TSLA")
        assert len(result) == 2
        assert result[0]["headline"] == "Tesla reports record deliveries"
        assert result[0]["source"] == "Reuters"
        assert len(result[0]["summary"]) <= 300

    @patch("scraping.finnHub.requests.get")
    def test_news_limited_to_5(self, mock_get):
        articles = [
            {"headline": f"Article {i}", "summary": f"Summary {i}",
             "source": "Test", "url": f"https://example.com/{i}", "datetime": i}
            for i in range(10)
        ]
        mock_resp = MagicMock()
        mock_resp.json.return_value = articles
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_company_news

        result = get_company_news("TSLA")
        assert len(result) == 5

    @patch("scraping.finnHub.requests.get")
    def test_empty_news(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = []
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_company_news

        result = get_company_news("TSLA")
        assert result == []

    @patch("scraping.finnHub.requests.get")
    def test_news_api_error(self, mock_get):
        mock_get.side_effect = Exception("Network error")

        from scraping.finnHub import get_company_news

        result = get_company_news("TSLA")
        assert len(result) == 1
        assert "error" in result[0]
        assert "Finnhub news failed" in result[0]["error"]

    @patch("scraping.finnHub.requests.get")
    def test_custom_days_back(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.json.return_value = []
        mock_resp.raise_for_status = MagicMock()
        mock_get.return_value = mock_resp

        from scraping.finnHub import get_company_news

        get_company_news("AAPL", days_back=30)
        call_params = mock_get.call_args[1]["params"]
        # The 'from' date should be ~30 days before 'to'
        assert "from" in call_params
        assert "to" in call_params


class TestGetMarketSentiment:
    @patch("scraping.finnHub.get_company_news")
    @patch("scraping.finnHub.get_stock_quote")
    def test_successful_sentiment(self, mock_quote, mock_news):
        mock_quote.return_value = {
            "symbol": "TSLA",
            "current_price": 250.0,
            "change_percent": 1.21,
        }
        mock_news.return_value = [
            {"headline": "Tesla delivers record vehicles", "summary": "Great quarter."},
        ]

        from scraping.finnHub import get_market_sentiment

        result = get_market_sentiment("TSLA")
        assert "Stock Quote for TSLA" in result
        assert "$250.0" in result
        assert "1.21%" in result
        assert "Tesla delivers record vehicles" in result

    @patch("scraping.finnHub.get_company_news")
    @patch("scraping.finnHub.get_stock_quote")
    def test_sentiment_with_quote_error(self, mock_quote, mock_news):
        mock_quote.return_value = {"error": "Finnhub quote failed: timeout"}
        mock_news.return_value = [
            {"headline": "Some news", "summary": "Details."},
        ]

        from scraping.finnHub import get_market_sentiment

        result = get_market_sentiment("TSLA")
        assert "Finnhub quote failed" in result

    @patch("scraping.finnHub.get_company_news")
    @patch("scraping.finnHub.get_stock_quote")
    def test_sentiment_with_news_error(self, mock_quote, mock_news):
        mock_quote.return_value = {"symbol": "TSLA", "current_price": 250.0, "change_percent": 1.0}
        mock_news.return_value = [{"error": "Finnhub news failed: timeout"}]

        from scraping.finnHub import get_market_sentiment

        result = get_market_sentiment("TSLA")
        assert "Finnhub news failed" in result

    @patch("scraping.finnHub.get_company_news")
    @patch("scraping.finnHub.get_stock_quote")
    def test_sentiment_lowercase_symbol(self, mock_quote, mock_news):
        mock_quote.return_value = {"symbol": "AAPL", "current_price": 180.0, "change_percent": -0.5}
        mock_news.return_value = []

        from scraping.finnHub import get_market_sentiment

        result = get_market_sentiment("aapl")
        assert "Stock Quote for AAPL" in result
