from django.test import Client, TestCase
from django.conf import settings


class AssistantEndpointTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_status_endpoint_returns_json(self):
        response = self.client.post("/api/assistant/status/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("configured", data)
        self.assertIn("model_set", data)

    def test_chat_get_not_allowed(self):
        response = self.client.get("/api/assistant/chat/")
        self.assertEqual(response.status_code, 405)

    def test_chat_requires_consent(self):
        response = self.client.post(
            "/api/assistant/chat/",
            {"message": "Hello", "consent": "0", "lang": "kk"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["ok"])
        self.assertEqual(data.get("code"), "no_consent")

    def test_chat_empty_input_rejected(self):
        response = self.client.post(
            "/api/assistant/chat/",
            {"message": "   ", "consent": "1", "lang": "kk"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["ok"])
        self.assertEqual(data.get("code"), "bad_input")

    def test_chat_max_chars_exceeded_rejected(self):
        long_message = "A" * (settings.GEMINI_MAX_INPUT_CHARS + 10)
        response = self.client.post(
            "/api/assistant/chat/",
            {"message": long_message, "consent": "1", "lang": "kk"},
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data["ok"])
        self.assertEqual(data.get("code"), "bad_input")
