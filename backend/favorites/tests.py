import unittest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Brand, Perfume
from .models import Favorite

User = get_user_model()


class FavoriteAPITests(unittest.TestCase):
    """Pruebas automatizadas del módulo de Favoritos."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._cleanup_all()
        cls.user_a = User.objects.create_user(
            username="ut_fav_a", email="ut_fava@aromatch.cl", password="Password123!"
        )
        cls.user_b = User.objects.create_user(
            username="ut_fav_b", email="ut_favb@aromatch.cl", password="Password123!"
        )
        cls.brand = Brand.objects.create(name="[UT-FAV] Dior", country="Francia")
        cls.perfume1 = Perfume.objects.create(
            name="[UT-FAV] Sauvage",
            brand=cls.brand,
            description="Aroma fresco.",
            concentration="EDP",
        )
        cls.perfume2 = Perfume.objects.create(
            name="[UT-FAV] Homme Intense",
            brand=cls.brand,
            description="Aroma iris.",
            concentration="EDP",
        )

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_all()
        super().tearDownClass()

    @classmethod
    def _cleanup_all(cls):
        Favorite.objects.filter(user__username__in=["ut_fav_a", "ut_fav_b"]).delete()
        Perfume.objects.filter(name__startswith="[UT-FAV]").delete()
        Brand.objects.filter(name__startswith="[UT-FAV]").delete()
        User.objects.filter(username__in=["ut_fav_a", "ut_fav_b"]).delete()

    def setUp(self):
        self.client = APIClient()
        Favorite.objects.filter(user__in=[self.user_a, self.user_b]).delete()

    def test_01_unauthenticated_access_denied(self):
        res = self.client.get("/api/favorites/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_create_list_and_delete_favorites(self):
        self.client.force_authenticate(user=self.user_a)
        c1 = self.client.post("/api/favorites/", {"perfume_id": self.perfume1.id}, format="json")
        c2 = self.client.post("/api/favorites/", {"perfume_id": self.perfume2.id}, format="json")
        self.assertEqual(c1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(c2.status_code, status.HTTP_201_CREATED)

        list_res = self.client.get("/api/favorites/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data["count"], 2)

        del_id = self.client.delete(f"/api/favorites/{c1.data['id']}/")
        self.assertEqual(del_id.status_code, status.HTTP_204_NO_CONTENT)

        del_perf = self.client.delete(f"/api/favorites/perfume/{self.perfume2.id}/")
        self.assertEqual(del_perf.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Favorite.objects.filter(user=self.user_a).count(), 0)

    def test_03_duplicate_favorite_rejected(self):
        self.client.force_authenticate(user=self.user_a)
        c1 = self.client.post("/api/favorites/", {"perfume_id": self.perfume1.id}, format="json")
        self.assertEqual(c1.status_code, status.HTTP_201_CREATED)

        dup = self.client.post("/api/favorites/", {"perfume_id": self.perfume1.id}, format="json")
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_04_user_isolation_in_favorites(self):
        self.client.force_authenticate(user=self.user_a)
        c1 = self.client.post("/api/favorites/", {"perfume_id": self.perfume1.id}, format="json")
        fav_id = c1.data["id"]

        self.client.force_authenticate(user=self.user_b)
        list_b = self.client.get("/api/favorites/")
        self.assertEqual(list_b.status_code, status.HTTP_200_OK)
        self.assertEqual(list_b.data["count"], 0)

        del_other = self.client.delete(f"/api/favorites/{fav_id}/")
        self.assertEqual(del_other.status_code, status.HTTP_404_NOT_FOUND)
