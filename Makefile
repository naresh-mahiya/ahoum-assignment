.PHONY: up down build seed logs ps shell-backend shell-db migrate makemigrations test createsuperuser restart

up:
	docker compose up --build

up-d:
	docker compose up --build -d

down:
	docker compose down

clean:
	docker compose down -v

build:
	docker compose build

seed:
	docker compose exec backend python manage.py seed_data

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser_if_not_exists

test:
	docker compose exec backend python manage.py test

logs:
	docker compose logs -f

ps:
	docker compose ps

restart:
	docker compose restart

shell-backend:
	docker compose exec backend python manage.py shell

shell-db:
	docker compose exec db psql -U $${POSTGRES_USER} -d $${POSTGRES_DB}
