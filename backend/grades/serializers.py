from rest_framework import serializers
from .models import Semester, Course


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('id', 'name', 'grade', 'credit', 'created_at', 'updated_at')
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
