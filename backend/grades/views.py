from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Semester, Course, CoursePerformance
from .serializers import (
    SemesterSerializer, SemesterWriteSerializer,
    CourseSerializer, CoursePerformanceSerializer, BulkSyncSerializer
)

VALID_GRADES = {'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'}


class SemesterViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Semester.objects.filter(user=self.request.user).prefetch_related(
            'courses', 'courses__performance'
        )

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return SemesterSerializer
        return SemesterWriteSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ── Nested courses ──
    @action(detail=True, methods=['get', 'post'], url_path='courses')
    def courses(self, request, pk=None):
        semester = get_object_or_404(Semester, pk=pk, user=request.user)
        if request.method == 'GET':
            serializer = CourseSerializer(semester.courses.all(), many=True)
            return Response(serializer.data)
        # POST — create a new course
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(semester=semester)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'put', 'patch', 'delete'],
            url_path=r'courses/(?P<course_id>[^/.]+)')
    def course_detail(self, request, pk=None, course_id=None):
        semester = get_object_or_404(Semester, pk=pk, user=request.user)
        course = get_object_or_404(Course, pk=course_id, semester=semester)

        if request.method == 'GET':
            return Response(CourseSerializer(course).data)

        if request.method == 'DELETE':
            course.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # PUT / PATCH
        partial = (request.method == 'PATCH')
        serializer = CourseSerializer(course, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # ── Course performance (upsert) ──
    @action(detail=True, methods=['get', 'put', 'patch'],
            url_path=r'courses/(?P<course_id>[^/.]+)/performance')
    def course_performance(self, request, pk=None, course_id=None):
        semester = get_object_or_404(Semester, pk=pk, user=request.user)
        course = get_object_or_404(Course, pk=course_id, semester=semester)

        # Get or create performance record
        perf, _ = CoursePerformance.objects.get_or_create(course=course)

        if request.method == 'GET':
            return Response(CoursePerformanceSerializer(perf).data)

        # PUT / PATCH — upsert
        partial = (request.method == 'PATCH')
        serializer = CoursePerformanceSerializer(perf, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # ── Bulk sync (import all data at once) ──
    @action(detail=False, methods=['post'], url_path='bulk-sync')
    def bulk_sync(self, request):
        """
        Accept the full sems array from the frontend and create/replace
        all semesters and courses for this user. Used for one-shot migration.
        """
        serializer = BulkSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sems_data = serializer.validated_data['sems']

        # Delete existing data for this user
        Semester.objects.filter(user=request.user).delete()

        created_sems = []
        for i, sem_data in enumerate(sems_data):
            raw_status = sem_data.get('status', 'completed')
            sem_status = raw_status if raw_status in ('in_progress', 'completed') else 'completed'
            sem = Semester.objects.create(
                user=request.user,
                name=sem_data.get('name', f'Semester {i+1}'),
                order=i,
                status=sem_status,
            )
            for course_data in sem_data.get('courses', []):
                grade = course_data.get('grade', 'A+')
                if grade not in VALID_GRADES:
                    grade = 'A+'
                Course.objects.create(
                    semester=sem,
                    name=course_data.get('name', ''),
                    grade=grade,
                    credit=float(course_data.get('credit', 3)),
                )
            created_sems.append(sem)



        result = SemesterSerializer(created_sems, many=True)
        return Response(result.data, status=status.HTTP_201_CREATED)

    # ── Clear all data ──
    @action(detail=False, methods=['delete'], url_path='clear-all')
    def clear_all(self, request):
        Semester.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
