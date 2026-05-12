"""
Management command: create_admin

Creates the default admin (superuser) account if it doesn't already exist.
Credentials are read from environment variables so they are never hard-coded.

Usage:
    python manage.py create_admin

Environment variables (set these in your deployment dashboard):
    ADMIN_EMAIL     – e-mail for the admin account  (default: bigcat@gmail.com)
    ADMIN_PASSWORD  – password for the admin account (required, no default)
    ADMIN_NAME      – display name                   (default: Admin)
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Create the default admin account if it does not already exist."

    def handle(self, *args, **options):
        email    = os.environ.get("ADMIN_EMAIL", "bigcat@gmail.com")
        password = os.environ.get("ADMIN_PASSWORD")
        name     = os.environ.get("ADMIN_NAME", "Admin")

        if not password:
            self.stderr.write(
                self.style.ERROR(
                    "ADMIN_PASSWORD environment variable is not set. "
                    "Admin account was NOT created."
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
