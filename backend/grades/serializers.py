from rest_framework import serializers
from .models import Semester, Course, CoursePerformance


class CoursePerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CoursePerformance
        fields = (
            'quiz1', 'quiz2', 'quiz3', 'makeup_quiz',
            'midterm', 'assignment', 'presentation',
            'attendance_pct', 'final_exam', 'updated_at',
        )
        read_only_fields = ('updated_at',)


class CourseSerializer(serializers.ModelSerializer):
    performance = CoursePerformanceSerializer(read_only=True)

    class Meta:
        model = Course
        fields = ('id', 'name', 'grade', 'credit', 'performance', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class SemesterSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Semester
        fields = ('id', 'name', 'order', 'courses', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class SemesterWriteSerializer(serializers.ModelSerializer):
    """Used for create/update — excludes nested courses."""
    class Meta:
        model = Semester
        fields = ('id', 'name', 'order')
        read_only_fields = ('id',)


class BulkSyncSerializer(serializers.Serializer):
    """Accepts the full sems array from the frontend for one-shot sync."""
    sems = serializers.ListField(child=serializers.DictField())
