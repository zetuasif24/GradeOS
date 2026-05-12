import re
from rest_framework import serializers
# pyrefly: ignore [missing-import]
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User

# ── Email domain validator ──────────────────────────────────────────────────
# Requires a proper domain: at least one dot, TLD of 2+ chars, no spaces.
# Rejects obviously fake domains like @test, @x, @local, @foo
_DOMAIN_RE = re.compile(
    r'^[a-zA-Z0-9._%+\-]+@'          # local part
    r'[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*'  # domain labels
    r'\.[a-zA-Z]{2,}$'               # TLD ≥ 2 chars
)


def validate_email_domain(email: str) -> str:
    """Validate that the email has a real-looking domain with a proper TLD."""
    email = email.strip().lower()
    if not _DOMAIN_RE.match(email):
        raise serializers.ValidationError(
            'Enter a valid email address with a proper domain (e.g. you@gmail.com).'
        )
    # Extra guard: domain part must contain at least one dot
    domain = email.split('@', 1)[1]
    parts = domain.split('.')
    if len(parts) < 2 or any(len(p) == 0 for p in parts):
        raise serializers.ValidationError(
            'Email domain is not valid. Use a real email provider (e.g. gmail.com, yahoo.com).'
        )
    return email


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add user info to token response."""
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'name': self.user.name,
            'is_staff': self.user.is_staff,
        }
        return data


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[validate_email_domain],
    )
    name = serializers.CharField(
        required=True,
        max_length=150,
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'password2')

    def validate_email(self, value):
        """Ensure email is unique (case-insensitive)."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'is_staff', 'created_at')
        read_only_fields = ('id', 'email', 'is_staff', 'created_at')


class AdminUserSerializer(serializers.ModelSerializer):
    """Read-only serializer for admin user listing."""
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'is_staff', 'is_active', 'created_at')
        read_only_fields = fields


class AdminResetPasswordSerializer(serializers.Serializer):
    """Admin sets a new password for any user."""
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)


class UpdateProfileSerializer(serializers.ModelSerializer):
    """PATCH /api/auth/profile/ — update name and/or email."""
    email = serializers.EmailField(required=False)
    name  = serializers.CharField(required=False, max_length=150)

    class Meta:
        model  = User
        fields = ('name', 'email')

    def validate_email(self, value):
        value = validate_email_domain(value)
        user  = self.instance
        if User.objects.filter(email__iexact=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def update(self, instance, validated_data):
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """POST /api/auth/change-password/ — change password after verifying current one."""
    current_password = serializers.CharField(required=True, write_only=True)
    new_password     = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2    = serializers.CharField(required=True, write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        return attrs
