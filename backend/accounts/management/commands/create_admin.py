"""
Management command: create_admin

Creates the default admin (superuser) account if it doesn't already exist.
Credentials are read from environment variables — nothing is hardcoded.

Usage:
    python manage.py create_admin

Environment variables (set in your deployment dashboard):
    ADMIN_EMAIL     – e-mail for the admin account  (required)
    ADMIN_PASSWORD  – password for the admin account (required)
    ADMIN_NAME      – display name                   (default: Admin)
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create the default admin account if it does not already exist."

    def handle(self, *args, **options):
        email    = os.environ.get("ADMIN_EMAIL", "")
        password = os.environ.get("ADMIN_PASSWORD", "")
        name     = os.environ.get("ADMIN_NAME", "Admin")

        if not email or not password:
            self.stderr.write(
                self.style.WARNING(
                    "ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin creation."
                )
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f"Admin account '{email}' already exists — skipping.")
            )
            return

        User.objects.create_superuser(email=email, password=password, name=name)
        self.stdout.write(
            self.style.SUCCESS(f"Admin account '{email}' created successfully.")
        )
