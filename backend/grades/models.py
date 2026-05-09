import uuid
from django.db import models
from django.conf import settings

GRADE_CHOICES = [
    ('A+', 'A+'), ('A', 'A'), ('A-', 'A-'),
    ('B+', 'B+'), ('B', 'B'), ('B-', 'B-'),
    ('C+', 'C+'), ('C', 'C'), ('D', 'D'), ('F', 'F'),
]


class Semester(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='semesters'
    )
    name = models.CharField(max_length=100)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return f'{self.user.email} — {self.name}'


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    name = models.CharField(max_length=200, blank=True)
    grade = models.CharField(max_length=2, choices=GRADE_CHOICES, default='A+')
    credit = models.DecimalField(max_digits=4, decimal_places=1, default=3.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.semester.name} — {self.name or "Unnamed"}: {self.grade}'
