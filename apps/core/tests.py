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
