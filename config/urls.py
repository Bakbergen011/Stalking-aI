from django.contrib import admin
from django.urls import include, path, re_path

from apps.core.views import root_redirect, set_language

urlpatterns = [
    path("", root_redirect, name="root"),
    path("admin/", admin.site.urls),
    path("i18n/set-language/", set_language, name="set_language"),
    path("api/assistant/", include("apps.assistant.urls")),
    re_path(r"^(?P<lang>kk|ru)/", include("apps.core.urls")),
]

admin.site.site_header = "Stalking editor"
admin.site.site_title = "Stalking"
admin.site.index_title = "Catalog & content"
