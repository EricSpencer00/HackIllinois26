"""
Tests for scoring.py — Groq AI inference and response parsing.
"""

import json
import pytest
from unittest.mock import patch, MagicMock


class TestGetTradeConfidence:
    """Tests for get_trade_confidence()."""

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_successful_inference(self, mock_client, mock_groq_response):
        payload = {
            "confidence_score": 85,
            "sentiment": "bullish",
            "reasoning": "Strong momentum.",
        }
        mock_client.chat.completions.create.return_value = mock_groq_response(
            json.dumps(payload)
        )

        from scoring import get_trade_confidence

        result = get_trade_confidence("Will TSLA go up?", "Context here.")
        assert result["confidence_score"] == 85
        assert result["sentiment"] == "bullish"
        assert "reasoning" in result

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_bearish_sentiment(self, mock_client, mock_groq_response):
        payload = {
            "confidence_score": 30,
            "sentiment": "bearish",
            "reasoning": "Declining revenue.",
        }
        mock_client.chat.completions.create.return_value = mock_groq_response(
            json.dumps(payload)
        )

        from scoring import get_trade_confidence

        result = get_trade_confidence("Is AAPL going to drop?", "Bad news.")
        assert result["confidence_score"] == 30
        assert result["sentiment"] == "bearish"

    @patch("scoring.GROQ_API_KEY", "")
    def test_missing_api_key(self):
        from scoring import get_trade_confidence

        result = get_trade_confidence("question", "context")
        assert "error" in result
        assert "Missing" in result["error"] or "GROQ_API_KEY" in result["error"]

    @patch("scoring.GROQ_API_KEY", None)
    def test_none_api_key(self):
        from scoring import get_trade_confidence

        result = get_trade_confidence("question", "context")
        assert "error" in result

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_invalid_json_response(self, mock_client, mock_groq_response):
        mock_client.chat.completions.create.return_value = mock_groq_response(
            "This is not JSON at all"
        )

        from scoring import get_trade_confidence

        result = get_trade_confidence("question", "context")
        assert "error" in result

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_groq_api_exception(self, mock_client):
        mock_client.chat.completions.create.side_effect = Exception("API rate limit")

        from scoring import get_trade_confidence

        result = get_trade_confidence("question", "context")
        assert "error" in result
        assert "Groq inference failed" in result["error"]

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_prompt_contains_question_and_context(self, mock_client, mock_groq_response):
        payload = {"confidence_score": 60, "sentiment": "neutral", "reasoning": "OK."}
        mock_client.chat.completions.create.return_value = mock_groq_response(
            json.dumps(payload)
        )

        from scoring import get_trade_confidence

        get_trade_confidence("My question", "My context")

        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]["messages"] if "messages" in call_args[1] else call_args[0][0]
        user_msg = [m for m in messages if m["role"] == "user"][0]
        assert "My question" in user_msg["content"]
        assert "My context" in user_msg["content"]

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_model_parameter(self, mock_client, mock_groq_response):
        payload = {"confidence_score": 50, "sentiment": "neutral", "reasoning": "N/A"}
        mock_client.chat.completions.create.return_value = mock_groq_response(
            json.dumps(payload)
        )

        from scoring import get_trade_confidence

        get_trade_confidence("q", "c")

        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]["model"] == "llama-3.3-70b-versatile"
        assert call_args[1]["temperature"] == 0.2

    @patch("scoring.client")
    @patch("scoring.GROQ_API_KEY", "fake-key")
    def test_response_with_whitespace(self, mock_client, mock_groq_response):
        """LLM sometimes wraps JSON in whitespace/newlines."""
        payload = {"confidence_score": 92, "sentiment": "bullish", "reasoning": "Great."}
        mock_client.chat.completions.create.return_value = mock_groq_response(
            f"\n\n  {json.dumps(payload)}  \n"
        )

        from scoring import get_trade_confidence

        result = get_trade_confidence("q", "c")
        assert result["confidence_score"] == 92
