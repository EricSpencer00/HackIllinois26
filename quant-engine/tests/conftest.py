"""
Shared fixtures for the test suite.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """FastAPI test client."""
    from app import app
    return TestClient(app)


@pytest.fixture
def mock_groq_response():
    """Factory fixture to build a fake Groq chat completion response."""
    def _make(content: str):
        msg = MagicMock()
        msg.content = content
        choice = MagicMock()
        choice.message = msg
        resp = MagicMock()
        resp.choices = [choice]
        return resp
    return _make


@pytest.fixture
def sample_stock_quote():
    """Sample Finnhub quote API response."""
    return {
        "c": 250.0,
        "h": 255.0,
        "l": 245.0,
        "o": 248.0,
        "pc": 247.0,
        "d": 3.0,
        "dp": 1.21,
    }


@pytest.fixture
def sample_company_news():
    """Sample Finnhub company news API response."""
    return [
        {
            "headline": "Tesla reports record deliveries",
            "summary": "Tesla delivered a record number of vehicles this quarter." * 5,
            "source": "Reuters",
            "url": "https://example.com/1",
            "datetime": 1700000000,
        },
        {
            "headline": "Tesla opens new factory",
            "summary": "A new Gigafactory has been announced.",
            "source": "Bloomberg",
            "url": "https://example.com/2",
            "datetime": 1700000001,
        },
    ]


@pytest.fixture
def sample_polymarket_gamma_response():
    """Sample Gamma API response for Polymarket."""
    return [
        {
            "question": "Will Tesla stock hit $300?",
            "description": "Market for Tesla stock price prediction.",
            "outcomePrices": ["0.65", "0.35"],
            "volume": "150000",
            "liquidity": "50000",
            "endDate": "2026-06-01",
            "slug": "will-tesla-stock-hit-300",
            "bestBid": None,
            "bestAsk": None,
        },
        {
            "question": "Will Elon Musk step down as CEO?",
            "description": "Market about Elon Musk leadership at Tesla.",
            "outcomePrices": ["0.10", "0.90"],
            "volume": "80000",
            "liquidity": "20000",
            "endDate": "2026-12-31",
            "slug": "elon-musk-step-down",
            "bestBid": None,
            "bestAsk": None,
        },
    ]


@pytest.fixture
def sample_wiki_search_response():
    """Sample Wikipedia search API response."""
    return {
        "query": {
            "search": [
                {"title": "Tesla, Inc."},
                {"title": "Elon Musk"},
            ]
        }
    }


@pytest.fixture
def sample_wiki_page_response():
    """Sample Wikipedia page extract API response."""
    return {
        "query": {
            "pages": {
                "12345": {
                    "title": "Tesla, Inc.",
                    "extract": "Tesla, Inc. is an American electric vehicle and clean energy company.",
                }
            }
        }
    }
