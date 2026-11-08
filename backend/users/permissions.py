from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permite lectura pública (GET, HEAD, OPTIONS) a cualquier solicitud,
    pero restringe la creación, edición y eliminación a usuarios administradores (is_staff).
    """

    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite lectura pública y restringe la modificación o eliminación
    únicamente al usuario propietario del recurso (obj.user == request.user).
    """

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user and request.user.is_authenticated and obj.user == request.user
        )


class IsStaffAdmin(permissions.BasePermission):
    """
    Permite el acceso exclusivamente a usuarios autenticados con rol administrativo
    (is_staff=True), ya sean administradores de catálogo o superadministradores.
    """

    message = "No tienes permisos administrativos para acceder a este recurso."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class IsSuperUser(permissions.BasePermission):
    """
    Permite el acceso exclusivamente a superadministradores (is_superuser=True).
    Restringe tanto a usuarios normales como a administradores estándar (is_staff=True, is_superuser=False).
    """

    message = "Se requieren privilegios de superadministrador para realizar esta acción."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )
