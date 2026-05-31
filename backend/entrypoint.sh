#!/bin/bash
set -e

echo "⏳ Waiting for DB..."
python manage.py wait_for_db

echo "🧬 Generating migrations..."
python manage.py makemigrations accounts sessions_app bookings payments --noinput

echo "📦 Running migrations..."
python manage.py migrate --noinput

echo "👤 Creating superuser if not exists..."
python manage.py createsuperuser_if_not_exists

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "🌱 Seeding demo data if empty..."
python manage.py seed_data --if-empty

echo "🚀 Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
