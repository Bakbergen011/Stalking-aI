from django.urls import path

from apps.assistant import views

urlpatterns = [
    path("chat/", views.gemini_chat, name="gemini_chat"),
    path("status/", views.gemini_status, name="gemini_status"),
]
