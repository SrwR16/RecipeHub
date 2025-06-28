#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z $DATABASE_HOST 3306; do
  sleep 1
done
echo "Database is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis..."
while ! nc -z $REDIS_HOST 6379; do
  sleep 1
done
echo "Redis is ready!"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Start the Django server
echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000