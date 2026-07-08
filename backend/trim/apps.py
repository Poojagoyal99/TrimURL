from django.apps import AppConfig


class TrimConfig(AppConfig):
    name = 'trim'

    def ready(self):
        import trim.signals  # noqa: F401
