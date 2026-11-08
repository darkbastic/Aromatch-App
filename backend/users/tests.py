from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Brand, Note, Perfume

User = get_user_model()


class UserAuthFlowTests(APITestCase):
    """Pruebas integrales de registro, login, perfil, refresh y logout (Etapa 6)."""

    def setUp(self):
        self.register_url = reverse("users:register")
        self.login_url = reverse("users:login")
        self.logout_url = reverse("users:logout")
        self.refresh_url = reverse("users:token_refresh")
        self.profile_url = reverse("users:profile")
        self.user_data = {
            "username": "aromatch_tester",
            "email": "tester@aromatch.cl",
            "first_name": "Ana",
            "last_name": "Pérez",
            "password": "PasswordSeguro123!",
            "password_confirm": "PasswordSeguro123!",
        }

    def test_complete_authentication_and_profile_flow(self):
        # 1. Comprobar que un usuario no autenticado no pueda acceder al perfil
        unauth_res = self.client.get(self.profile_url)
        self.assertEqual(unauth_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Registrar un usuario
        reg_res = self.client.post(self.register_url, self.user_data, format="json")
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", reg_res.data)

        # 3. Intentar registrar nuevamente el mismo email
        dup_data = {**self.user_data, "username": "otro_usuario"}
        dup_res = self.client.post(self.register_url, dup_data, format="json")
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", dup_res.data)

        # 4. Iniciar sesión y obtener los tokens
        login_res = self.client.post(
            self.login_url,
            {"username": "aromatch_tester", "password": "PasswordSeguro123!"},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_token = login_res.data["access"]
        refresh_token = login_res.data["refresh"]

        # 5. Consultar el perfil autenticado (incluyendo is_staff e is_superuser)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        profile_res = self.client.get(self.profile_url)
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data["username"], "aromatch_tester")
        self.assertEqual(profile_res.data["email"], "tester@aromatch.cl")
        self.assertFalse(profile_res.data["is_staff"])
        self.assertFalse(profile_res.data["is_superuser"])

        # 6. Actualizar el perfil (e intentar elevar privilegios sin éxito)
        update_res = self.client.patch(
            self.profile_url,
            {
                "first_name": "Ana María",
                "last_name": "Pérez Soto",
                "is_staff": True,
                "is_superuser": True,
            },
            format="json",
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data["first_name"], "Ana María")
        self.assertFalse(update_res.data["is_staff"])
        self.assertFalse(update_res.data["is_superuser"])

        # 7. Renovar el Access Token
        refresh_res = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(refresh_res.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_res.data)

        # 8. Cerrar sesión e intentar reutilizar el Refresh Token invalidado
        logout_res = self.client.post(
            self.logout_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(logout_res.status_code, status.HTTP_205_RESET_CONTENT)

        reuse_refresh_res = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(reuse_refresh_res.status_code, status.HTTP_401_UNAUTHORIZED)

        reuse_logout_res = self.client.post(
            self.logout_url,
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(reuse_logout_res.status_code, status.HTTP_400_BAD_REQUEST)


class AdminPanelPermissionsAndCRUDTests(APITestCase):
    """
    Pruebas del Panel Administrativo:
    - Estadísticas reales (/api/users/admin/stats/)
    - Gestión de cuentas administrativas (/api/users/admins/)
    -Separación estricta entre Usuario Normal, Administrador (is_staff) y Superadministrador (is_superuser)
    - CRUD administrativo de Marcas, Notas y Perfumes.
    """

    def setUp(self):
        self.stats_url = reverse("users:admin_stats")
        self.admins_url = reverse("users:admin_users")
        self.brands_url = reverse("catalog:brand-list")
        self.notes_url = reverse("catalog:note-list")
        self.perfumes_url = reverse("catalog:perfume-list")

        self.normal_user = User.objects.create_user(
            username="normal_user",
            email="normal@aromatch.cl",
            password="PasswordSeguro123!",
            is_staff=False,
            is_superuser=False,
        )
        self.staff_admin = User.objects.create_user(
            username="staff_admin",
            email="staff@aromatch.cl",
            password="PasswordSeguro123!",
            is_staff=True,
            is_superuser=False,
        )
        self.super_admin = User.objects.create_superuser(
            username="super_admin",
            email="super@aromatch.cl",
            password="PasswordSeguro123!",
        )

    def test_normal_user_cannot_access_admin_panel_or_write_catalog(self):
        self.client.force_authenticate(user=self.normal_user)

        stats_res = self.client.get(self.stats_url)
        self.assertEqual(stats_res.status_code, status.HTTP_403_FORBIDDEN)

        admins_list_res = self.client.get(self.admins_url)
        self.assertEqual(admins_list_res.status_code, status.HTTP_403_FORBIDDEN)

        admins_create_res = self.client.post(self.admins_url, {}, format="json")
        self.assertEqual(admins_create_res.status_code, status.HTTP_403_FORBIDDEN)

        brand_create_res = self.client.post(
            self.brands_url,
            {"name": "Marca Prohibida", "country": "Francia"},
            format="json",
        )
        self.assertEqual(brand_create_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_admin_can_access_stats_and_manage_catalog_but_cannot_manage_admins(self):
        self.client.force_authenticate(user=self.staff_admin)

        # 1. Puede consultar estadísticas del dashboard
        stats_res = self.client.get(self.stats_url)
        self.assertEqual(stats_res.status_code, status.HTTP_200_OK)
        self.assertIn("total_perfumes", stats_res.data)
        self.assertIn("total_brands", stats_res.data)
        self.assertIn("total_notes", stats_res.data)
        self.assertIn("total_admins", stats_res.data)

        # 2. NO puede consultar ni crear otros administradores (exclusivo de superusuario)
        admins_get_res = self.client.get(self.admins_url)
        self.assertEqual(admins_get_res.status_code, status.HTTP_403_FORBIDDEN)

        admins_post_res = self.client.post(
            self.admins_url,
            {
                "username": "intento_admin",
                "email": "intento@aromatch.cl",
                "password": "PasswordSeguro123!",
                "password_confirm": "PasswordSeguro123!",
            },
            format="json",
        )
        self.assertEqual(admins_post_res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Puede realizar CRUD completo de Marca, Nota y Perfume
        brand_res = self.client.post(
            self.brands_url,
            {
                "name": "Guerlain",
                "country": "Francia",
                "description": "Casa histórica francesa.",
            },
            format="json",
        )
        self.assertEqual(brand_res.status_code, status.HTTP_201_CREATED)
        brand_id = brand_res.data["id"]

        note_res = self.client.post(
            self.notes_url,
            {
                "name": "Iris Pallida",
                "family": "Floral",
                "description": "Nota empolvada y elegante.",
            },
            format="json",
        )
        self.assertEqual(note_res.status_code, status.HTTP_201_CREATED)
        note_id = note_res.data["id"]

        perfume_res = self.client.post(
            self.perfumes_url,
            {
                "name": "L'Homme Idéal",
                "brand_id": brand_id,
                "description": "Fragancia amaretto y cuero.",
                "concentration": "EDP",
                "gender": "MASCULINE",
                "release_year": 2016,
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": "LONG_LASTING",
                "projection": "MODERATE",
                "notes_input": [{"note": note_id, "note_type": "HEART"}],
            },
            format="json",
        )
        self.assertEqual(perfume_res.status_code, status.HTTP_201_CREATED)
        perfume_id = perfume_res.data["id"]

        # Editar perfume
        perfume_detail_url = reverse("catalog:perfume-detail", args=[perfume_id])
        patch_res = self.client.patch(
            perfume_detail_url,
            {"projection": "STRONG"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["projection"], "STRONG")

        # Eliminar perfume, nota y marca
        del_perfume = self.client.delete(perfume_detail_url)
        self.assertEqual(del_perfume.status_code, status.HTTP_204_NO_CONTENT)

        del_note = self.client.delete(reverse("catalog:note-detail", args=[note_id]))
        self.assertEqual(del_note.status_code, status.HTTP_204_NO_CONTENT)

        del_brand = self.client.delete(reverse("catalog:brand-detail", args=[brand_id]))
        self.assertEqual(del_brand.status_code, status.HTTP_204_NO_CONTENT)

    def test_super_admin_can_list_and_create_staff_administrators(self):
        self.client.force_authenticate(user=self.super_admin)

        # 1. Consultar lista de administradores
        list_res = self.client.get(self.admins_url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        results = list_res.data.get("results", list_res.data)
        self.assertEqual(len(results), 2)

        # 2. Crear un nuevo administrador (incluso si envía is_superuser=True, debe quedar False)
        create_res = self.client.post(
            self.admins_url,
            {
                "username": "nuevo_curador",
                "email": "curador@aromatch.cl",
                "first_name": "Mateo",
                "last_name": "Rojas",
                "password": "AdminPassword2026!",
                "password_confirm": "AdminPassword2026!",
                "is_superuser": True,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(create_res.data["is_staff"])
        self.assertFalse(create_res.data["is_superuser"])
        self.assertNotIn("password", create_res.data)

        created_user = User.objects.get(username="nuevo_curador")
        self.assertTrue(created_user.is_staff)
        self.assertFalse(created_user.is_superuser)
        self.assertTrue(created_user.check_password("AdminPassword2026!"))
