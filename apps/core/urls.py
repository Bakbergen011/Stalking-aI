from django.urls import path

from apps.core import views

urlpatterns = [
    path("", views.home, name="home"),
    path("urgent/", views.urgent, name="urgent"),
    path("cover/", views.cover, name="cover"),
    path("risk/", views.risk, name="risk"),
    path("plan/", views.plan, name="plan"),
    path("evidence/", views.evidence, name="evidence"),
    path("legal/", views.legal, name="legal"),
    path("digital/", views.digital, name="digital"),
    path("resources/", views.resources, name="resources"),
    path("assistant/", views.assistant_page, name="assistant"),
    path("bodyguard/", views.bodyguard, name="bodyguard"),
    path("quest/", views.quest, name="quest"),
    path("cleaner/", views.cleaner, name="cleaner"),
    path("help-request/", views.help_request, name="help_request"),
    path("about/", views.about, name="about"),
]
