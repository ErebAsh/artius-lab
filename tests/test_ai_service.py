import json
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.ai_service import (
    _call_ai,
    check_ats_score,
    enhance_resume,
    modify_resume_with_ai,
    parse_resume_text,
)
from backend.schemas import PersonalInfo, ResumeData


class TestGroqAIService(unittest.IsolatedAsyncioTestCase):
    async def test_call_ai_missing_key(self):
        """Verify _call_ai raises ValueError if no key is provided and GROQ_API_KEY is empty."""
        with patch("backend.ai_service.GROQ_API_KEY", ""):
            with self.assertRaises(ValueError) as ctx:
                await _call_ai("system prompt", "user prompt", api_key=None)
            self.assertIn("Groq API key is missing", str(ctx.exception))

    @patch("backend.ai_service.AsyncOpenAI")
    async def test_call_ai_success_qwen(self, mock_openai_cls):
        """Verify _call_ai invokes Groq with Qwen 27B and parses response JSON."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client

        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = json.dumps({"enhanced_data": {"title": "Engineer"}})
        mock_completion.choices = [mock_choice]

        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

        result = await _call_ai("sys", "user", api_key="gsk_test_key_123")

        self.assertEqual(result, {"enhanced_data": {"title": "Engineer"}})
        mock_openai_cls.assert_called_once_with(
            base_url="https://api.groq.com/openai/v1",
            api_key="gsk_test_key_123",
        )
        call_kwargs = mock_client.chat.completions.create.call_args.kwargs
        self.assertEqual(call_kwargs["model"], "qwen/qwen3.8-27b")
        self.assertEqual(call_kwargs["response_format"], {"type": "json_object"})
        self.assertEqual(call_kwargs["extra_body"], {"reasoning_format": "hidden"})

    @patch("backend.ai_service.AsyncOpenAI")
    async def test_call_ai_markdown_fences_stripping(self, mock_openai_cls):
        """Verify _call_ai correctly strips ```json code fences if returned by the LLM."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client

        mock_completion = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = '```json\n{"score": 95}\n```'
        mock_completion.choices = [mock_choice]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)

        result = await _call_ai("sys", "user", api_key="gsk_test")
        self.assertEqual(result, {"score": 95})

    @patch("backend.ai_service.AsyncOpenAI")
    async def test_call_ai_error_propagation(self, mock_openai_cls):
        """Verify _call_ai propagates exceptions when Groq API fails."""
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create = AsyncMock(
            side_effect=RuntimeError("Groq API rate limit or outage")
        )

        with self.assertRaises(RuntimeError) as ctx:
            await _call_ai("sys", "user", api_key="gsk_test")
        self.assertIn("Groq API rate limit or outage", str(ctx.exception))

    @patch("backend.ai_service._call_ai")
    async def test_enhance_resume(self, mock_call_ai):
        mock_call_ai.return_value = {
            "enhanced_data": {"personal_info": {"full_name": "Alice"}},
            "layout_settings": {"margin": "18mm"},
        }
        sample_resume = ResumeData(
            template_id="AL-001",
            personal_info=PersonalInfo(
                full_name="Alice",
                title="Dev",
                email="alice@example.com",
                phone="123-456-7890",
                location="San Francisco, CA",
            ),
        )
        res = await enhance_resume(sample_resume, api_key="gsk_test")
        self.assertIn("enhanced_data", res)

    @patch("backend.ai_service._call_ai")
    async def test_check_ats_score(self, mock_call_ai):
        mock_call_ai.return_value = {
            "score": 88,
            "keyword_matches": ["Python"],
            "missing_keywords": ["Docker"],
            "improvements": ["Add metrics"],
            "summary": "Solid resume",
        }
        res = await check_ats_score("Alice resume text...", api_key="gsk_test")
        self.assertEqual(res["score"], 88)

    @patch("backend.ai_service._call_ai")
    async def test_parse_resume_text(self, mock_call_ai):
        mock_call_ai.return_value = {
            "personal_info": {"full_name": "Bob"},
            "experience": [],
        }
        res = await parse_resume_text("Bob raw resume", api_key="gsk_test")
        self.assertEqual(res["personal_info"]["full_name"], "Bob")

    @patch("backend.ai_service._call_ai")
    async def test_modify_resume_with_ai(self, mock_call_ai):
        mock_call_ai.return_value = {
            "modified_data": {"personal_info": {"full_name": "Charlie"}},
            "changes_summary": "Updated name",
        }
        res = await modify_resume_with_ai({}, "Change name to Charlie", api_key="gsk_test")
        self.assertEqual(res["changes_summary"], "Updated name")


if __name__ == "__main__":
    unittest.main()
