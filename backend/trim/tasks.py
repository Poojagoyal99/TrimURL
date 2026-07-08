from celery import shared_task
from django.core.cache import caches
from django.db.models import F
from .models import URL


@shared_task
def flush_click_counts():
    """
    Reads all click:* counters from Redis and flushes them to the DB in one batch.
    Runs every 60 seconds via Celery Beat.
    """
    redis_client = caches['default'].client.get_client()

    # Find all keys matching "click:*"
    keys = redis_client.keys("click:*")
    if not keys:
        return "No clicks to flush."

    for key in keys:
        count = redis_client.getdel(key)  # read and delete atomically
        if count:
            short_code = key.decode().split(":", 1)[1]
            URL.objects.filter(short_code=short_code).update(
                click_count=F('click_count') + int(count)
            )

    return f"Flushed {len(keys)} counters."
