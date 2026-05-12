from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (RegisterView, LoginView, LogoutView, MeView,
                    UpdateProfileView, ChangePasswordView,
                    AdminUserListView, AdminUserDetailView, AdminResetPasswordView)

urlpatterns = [
    path('register/',        RegisterView.as_view(),       name='auth-register'),
    path('login/',           LoginView.as_view(),          name='auth-login'),
    path('logout/',          LogoutView.as_view(),         name='auth-logout'),
    path('refresh/',         TokenRefreshView.as_view(),   name='auth-refresh'),
    path('me/',              MeView.as_view(),             name='auth-me'),
    path('profile/',         UpdateProfileView.as_view(),  name='auth-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    # Admin
    path('admin/users/',                  AdminUserListView.as_view(),      name='admin-user-list'),
    path('admin/users/<int:pk>/',         AdminUserDetailView.as_view(),    name='admin-user-detail'),
    path('admin/users/<int:pk>/reset-password/', AdminResetPasswordView.as_view(), name='admin-user-reset-pw'),
]

