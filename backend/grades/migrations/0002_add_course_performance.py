from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CoursePerformance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quiz1', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('quiz2', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('quiz3', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('makeup_quiz', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('midterm', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('assignment', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('presentation', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('attendance_pct', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('final_exam', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('course', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='performance',
                    to='grades.course',
                )),
            ],
        ),
    ]
