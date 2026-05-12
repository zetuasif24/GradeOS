"""
Data migration: 0002_create_admin

Creates the default admin (superuser) account if it doesn't already exist.
Credentials are read from environment variables ADMIN_EMAIL and ADMIN_PASSWORD.
This migration is a no-op if the account already exists.
"""

import os
from django.db import migrations


def create_admin(apps, schema_editor):
    from django.contrib.auth import get_user_model
    User = get_user_model()

    email    = os.environ.get("ADMIN_EMAIL", "")
    password = os.environ.get("ADMIN_PASSWORD", "")
    name     = os.environ.get("ADMIN_NAME", "Admin")

    if not email or not password:
        print("\n[create_admin] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping.")
        return

    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(email=email, password=password, name=name)
        print(f"\n[create_admin] Superuser '{email}' created successfully.")
    else:
        print(f"\n[create_admin] Superuser '{email}' already exists — skipping.")


def reverse_create_admin(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_admin, reverse_create_admin),
    ]
