from django.contrib import admin
from .models import Semester, Course


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'order', 'created_at')
    list_filter = ('user',)
    inlines = [CourseInline]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'semester', 'grade', 'credit')
    list_filter = ('grade', 'semester__user')
