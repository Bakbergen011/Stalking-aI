from django.test import Client, TestCase
from django.urls import reverse


class CorePagesTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_root_redirect(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/kk/", response.url)

    def test_root_redirect_with_cookie(self):
        self.client.cookies["stalking_lang"] = "ru"
        response = self.client.get("/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/ru/", response.url)

    def test_all_public_pages_render_kk(self):
        pages = [
            "home",
            "urgent",
            "cover",
            "risk",
            "plan",
            "evidence",
            "legal",
            "digital",
            "resources",
            "assistant",
            "bodyguard",
            "quest",
            "cleaner",
            "help-request",
            "about",
        ]
        for name in pages:
            url = f"/kk/{name}/" if name != "home" else "/kk/"
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                200,
                f"Page {name} failed with status {response.status_code}",
            )
            # Security headers check
            self.assertIn("Permissions-Policy", response.headers)
            self.assertIn("Content-Security-Policy", response.headers)
            self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")
            self.assertEqual(response.headers.get("Referrer-Policy"), "same-origin")

    def test_all_public_pages_render_ru(self):
        pages = [
            "home",
            "urgent",
            "cover",
            "risk",
            "plan",
            "evidence",
            "legal",
            "digital",
            "resources",
            "assistant",
            "bodyguard",
            "quest",
            "cleaner",
            "help-request",
            "about",
        ]
        for name in pages:
            url = f"/ru/{name}/" if name != "home" else "/ru/"
            response = self.client.get(url)
            self.assertEqual(
                response.status_code,
                200,
                f"Page {name} (ru) failed with status {response.status_code}",
            )

    def test_emergency_numbers_in_urgent(self):
        response = self.client.get("/kk/urgent/")
        content = response.content.decode("utf-8")
        self.assertIn("102", content)
        self.assertIn("112", content)
        self.assertIn("103", content)
        self.assertIn("111", content)
        self.assertIn("150", content)

    def test_set_language_post(self):
        response = self.client.post("/i18n/set-language/", {"lang": "ru", "next": "/kk/risk/"})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.cookies["stalking_lang"].value, "ru")
        self.assertIn("/ru/risk/", response.url)


class HelpRequestTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_help_request_disabled_when_no_email(self):
        with self.settings(HELP_REQUEST_EMAIL=""):
            response = self.client.get("/kk/help-request/")
            self.assertEqual(response.status_code, 200)
            self.assertContains(response, "қолжетімсіз")

            # POST should be rejected safely
            post_resp = self.client.post("/kk/help-request/", {"message": "Маған көмек керек"})
            self.assertEqual(post_resp.status_code, 403)

    def test_help_request_get_when_enabled(self):
        with self.settings(HELP_REQUEST_EMAIL="specialist@example.com"):
            response = self.client.get("/kk/help-request/")
            self.assertEqual(response.status_code, 200)
            self.assertContains(response, "Қауіпсіз жіберу")
            # Recipient email must NEVER leak to response HTML
            self.assertNotContains(response, "specialist@example.com")

    def test_help_request_post_validation(self):
        with self.settings(HELP_REQUEST_EMAIL="specialist@example.com"):
            # Empty message
            resp = self.client.post("/kk/help-request/", {"message": ""})
            self.assertEqual(resp.status_code, 400)
            self.assertContains(resp, "міндетті", status_code=400)

            # Too short message
            resp_short = self.client.post("/kk/help-request/", {"message": "қысқа"})
            self.assertEqual(resp_short.status_code, 400)
            self.assertContains(resp_short, "қысқа", status_code=400)

    def test_help_request_honeypot(self):
        from django.core import mail
        mail.outbox = []
        with self.settings(HELP_REQUEST_EMAIL="specialist@example.com"):
            resp = self.client.post(
                "/kk/help-request/",
                {
                    "message": "Бұл спам бот жазған хабарлама",
                    "website_url_check": "https://spam.com",
                },
            )
            self.assertEqual(resp.status_code, 200)
            # No email should be sent
            self.assertEqual(len(mail.outbox), 0)

    def test_help_request_success_email_dispatch(self):
        import io
        from django.core import mail
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        mail.outbox = []

        # Create a small valid test JPEG image in memory
        img_io = io.BytesIO()
        test_img = Image.new("RGB", (50, 50), color="blue")
        test_img.save(img_io, format="JPEG")
        img_bytes = img_io.getvalue()
        uploaded = SimpleUploadedFile("my_photo.jpg", img_bytes, content_type="image/jpeg")

        with self.settings(HELP_REQUEST_EMAIL="specialist@example.com"):
            resp = self.client.post(
                "/kk/help-request/",
                {
                    "message": "Маған қудалау бойынша жедел кеңес қажет, көмектесіңізші.",
                    "contact": "safe-contact@example.kz",
                    "attachment": uploaded,
                },
            )
            self.assertEqual(resp.status_code, 200)
            self.assertContains(resp, "Өтініш сәтті жіберілді")

            # Verify email was dispatched
            self.assertEqual(len(mail.outbox), 1)
            msg = mail.outbox[0]
            self.assertEqual(msg.to, ["specialist@example.com"])
            self.assertEqual(msg.reply_to, ["safe-contact@example.kz"])
            self.assertIn("Маған қудалау бойынша", msg.body)
            self.assertIn("safe-contact@example.kz", msg.body)
            self.assertEqual(len(msg.attachments), 1)
            att_filename, att_content, att_mime = msg.attachments[0]
            self.assertTrue(att_filename.startswith("evidence_"))
            self.assertEqual(att_mime, "image/jpg")

            # Check that response HTML NEVER exposes the recipient email
            self.assertNotContains(resp, "specialist@example.com")

    def test_help_request_web3forms_dispatch(self):
        from unittest.mock import patch

        with self.settings(WEB3FORMS_ACCESS_KEY="fake-access-key-123", HELP_REQUEST_EMAIL=""):
            with patch("apps.core.views._send_help_request_via_web3forms") as mock_web3:
                mock_web3.return_value = {"success": True}
                resp = self.client.post(
                    "/kk/help-request/",
                    {
                        "message": "Тест хабарлама Web3Forms арқылы жеткізілуі тиіс.",
                        "contact": "+7 777 123 45 67",
                    },
                )
                self.assertEqual(resp.status_code, 200)
                self.assertContains(resp, "Өтініш сәтті жіберілді")
                self.assertTrue(mock_web3.called)
                args, kwargs = mock_web3.call_args
                self.assertEqual(kwargs["access_key"], "fake-access-key-123")
                self.assertEqual(kwargs["contact"], "+7 777 123 45 67")
                self.assertIn("Тест хабарлама", kwargs["message"])

    def test_help_request_resend_dispatch(self):
        from unittest.mock import patch

        with self.settings(RESEND_API_KEY="re_test_key_123", HELP_REQUEST_EMAIL="specialist@example.com"):
            with patch("apps.core.views._send_help_request_via_resend") as mock_resend:
                mock_resend.return_value = {"id": "res_123"}
                resp = self.client.post(
                    "/kk/help-request/",
                    {
                        "message": "Тест хабарлама Resend арқылы жеткізілуі тиіс.",
                        "contact": "victim@example.com",
                    },
                )
                self.assertEqual(resp.status_code, 200)
                self.assertContains(resp, "Өтініш сәтті жіберілді")
                self.assertTrue(mock_resend.called)
                args, kwargs = mock_resend.call_args
                self.assertEqual(kwargs["api_key"], "re_test_key_123")
                self.assertEqual(kwargs["recipient_email"], "specialist@example.com")
                self.assertEqual(kwargs["reply_to"], ["victim@example.com"])
                self.assertIn("Тест хабарлама", kwargs["email_body"])
