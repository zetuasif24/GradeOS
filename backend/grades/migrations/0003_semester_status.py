from django.db import migrations, models


def mark_existing_completed(apps, schema_editor):
    """
    All semesters that existed before this feature was introduced are assumed
    to be finished — mark them 'completed' so they still count towards CGPA.
    """
    Semester = apps.get_model('grades', 'Semester')
    Semester.objects.all().update(status='completed')


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0002_add_course_performance'),
    ]

    operations = [
        migrations.AddField(
            model_name='semester',
            name='status',
            field=models.CharField(
                choices=[('in_progress', 'In Progress'), ('completed', 'Completed')],
                default='in_progress',
                max_length=20,
            ),
        ),
        # Data migration: flip existing rows to 'completed'
        migrations.RunPython(mark_existing_completed, migrations.RunPython.noop),
    ]
