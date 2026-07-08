FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent .pyc files and enable stdout/stderr logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source
COPY . .

# Expose Django port
EXPOSE 8000

# Collect static files, run migrations, then start gunicorn
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:8000"]
