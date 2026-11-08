from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extiende TokenObtainPairSerializer para permitir iniciar sesión tanto con
    `username` como con `email` (insensible a mayúsculas/minúsculas).
    """

    def validate(self, attrs: dict) -> dict:
        identifier = (attrs.get(self.username_field) or "").strip()
        if identifier:
            matched_user = (
                User.objects.filter(username__iexact=identifier).first()
                or User.objects.filter(email__iexact=identifier).first()
            )
            if matched_user:
                attrs[self.username_field] = matched_user.get_username()
        return super().validate(attrs)



class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro público de nuevos usuarios estándar.
    Garantiza correo único, coincidencia de contraseñas y almacenamiento cifrado (hash).
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        )
        read_only_fields = ("id",)

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario registrado con este correo electrónico."
            )
        return normalized_email

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data: dict):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para consultar y actualizar la información del usuario autenticado.
    Los campos de privilegios (is_staff, is_superuser) son estrictamente de solo lectura.
    """

    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "username",
            "is_staff",
            "is_superuser",
            "date_joined",
        )

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        user = self.instance
        if (
            User.objects.filter(email__iexact=normalized_email)
            .exclude(pk=user.pk if user else None)
            .exists()
        ):
            raise serializers.ValidationError(
                "Este correo electrónico ya está en uso por otra cuenta."
            )
        return normalized_email


class UserLogoutSerializer(serializers.Serializer):
    """
    Serializer para recibir e invalidar el Refresh Token del usuario mediante la blacklist de SimpleJWT.
    """

    refresh = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs: dict) -> dict:
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs) -> None:
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            raise serializers.ValidationError(
                {"refresh": "El token es inválido, ha expirado o ya fue invalidado."}
            )


class AdminUserSerializer(serializers.ModelSerializer):
    """
    Serializer de lectura y creación controlada de cuentas administrativas.
    - Solo accesible por superadministradores (is_superuser=True).
    - Las cuentas creadas reciben siempre is_staff=True e is_superuser=False.
    - Nunca expone hashes de contraseña.
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    role_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "role_display",
            "date_joined",
            "password",
            "password_confirm",
        )
        read_only_fields = (
            "id",
            "is_staff",
            "is_superuser",
            "role_display",
            "date_joined",
        )

    def get_role_display(self, obj) -> str:
        if obj.is_superuser:
            return "Superadministrador"
        if obj.is_staff:
            return "Administrador"
        return "Usuario"

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario registrado con este correo electrónico."
            )
        return normalized_email

    def validate(self, attrs: dict) -> dict:
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs

    def create(self, validated_data: dict):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        # Forzar reglas de seguridad: is_staff=True e is_superuser=False
        validated_data["is_staff"] = True
        validated_data["is_superuser"] = False
        user = User.objects.create_user(password=password, **validated_data)
        return user
