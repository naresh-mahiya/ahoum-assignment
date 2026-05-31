import time

from django.core.management.base import BaseCommand
from django.db import connections
from django.db.utils import OperationalError


class Command(BaseCommand):
    help = 'Block until the default database accepts connections.'

    def handle(self, *args, **options):
        self.stdout.write('Waiting for database...')
        max_attempts = 60
        attempt = 0
        db_conn = None
        while not db_conn and attempt < max_attempts:
            try:
                conn = connections['default']
                conn.ensure_connection()
                db_conn = conn
            except OperationalError:
                attempt += 1
                self.stdout.write('DB unavailable, waiting 1s...')
                time.sleep(1)
        if not db_conn:
            self.stderr.write(self.style.ERROR('Database never became available.'))
            raise SystemExit(1)
        self.stdout.write(self.style.SUCCESS('Database available!'))
