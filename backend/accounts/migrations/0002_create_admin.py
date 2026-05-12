"""
Data migration: 0002_create_admin

Creates the default admin (superuser) account if it doesn't already exist.
This runs automatically as part of `python manage.py migrate` on every deploy.

Credentials:
    email:    bigcat@gmail.com
    password: bigcat1234
"""

from django.db import migrations


def create_admin(apps, schema_editor):
    # Use the historical User model provided by the migration framework
    from django.contrib.auth import get_user_model
    User = get_user_model()

    email = "bigcat@gmail.com"
    password = "bigcat1234"
    name = "Admin"

    if not User.objects.filter(email=email).exists():
        User.objects.create_superuser(email=email, password=password, name=name)
        print(f"\n[create_admin] Superuser '{email}' created successfully.")
    else:
        print(f"\n[create_admin] Superuser '{email}' already exists — skipping.")


def reverse_create_admin(apps, schema_editor):
    # Reversing this migration does NOT delete the admin account (safety measure)
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_admin, reverse_create_admin),
    ]
