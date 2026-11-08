import unittest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Brand, Perfume
from .models import Review

User = get_user_model()


class ReviewAPITests(unittest.TestCase):
    """Pruebas automatizadas del módulo de Reseñas y Calificaciones."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._cleanup_all()
        cls.user_a = User.objects.create_user(
            username="ut_rev_a", email="ut_reva@aromatch.cl", password="Password123!"
        )
        cls.user_b = User.objects.create_user(
            username="ut_rev_b", email="ut_revb@aromatch.cl", password="Password123!"
        )
        cls.brand = Brand.objects.create(name="[UT-REV] Chanel", country="Francia")
        cls.perfume = Perfume.objects.create(
            name="[UT-REV] Bleu",
            brand=cls.brand,
            description="Aroma versátil.",
            concentration="EDP",
        )

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_all()
        super().tearDownClass()

    @classmethod
    def _cleanup_all(cls):
        Review.objects.filter(user__username__in=["ut_rev_a", "ut_rev_b"]).delete()
        Perfume.objects.filter(name__startswith="[UT-REV]").delete()
        Brand.objects.filter(name__startswith="[UT-REV]").delete()
        User.objects.filter(username__in=["ut_rev_a", "ut_rev_b"]).delete()

    def setUp(self):
        self.client = APIClient()
        Review.objects.filter(perfume=self.perfume).delete()

    def test_01_create_read_update_and_delete_own_review(self):
        self.client.force_authenticate(user=self.user_a)
        create_res = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 5, "comment": "Excelente aroma."},
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        rev_id = create_res.data["id"]

        self.client.force_authenticate(user=None)
        detail_res = self.client.get(f"/api/reviews/{rev_id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)

        by_perf = self.client.get(f"/api/reviews/perfume/{self.perfume.id}/")
        self.assertEqual(by_perf.status_code, status.HTTP_200_OK)
        self.assertEqual(by_perf.data["count"], 1)

        self.client.force_authenticate(user=self.user_a)
        mine_res = self.client.get("/api/reviews/my-reviews/")
        self.assertEqual(mine_res.status_code, status.HTTP_200_OK)
        self.assertEqual(mine_res.data["count"], 1)

        patch_res = self.client.patch(
            f"/api/reviews/{rev_id}/", {"rating": 4, "comment": "Actualizado."}, format="json"
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["rating"], 4)

        del_res = self.client.delete(f"/api/reviews/{rev_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_02_invalid_ratings_rejected(self):
        self.client.force_authenticate(user=self.user_a)
        r_low = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 0, "comment": "Inválida."},
            format="json",
        )
        r_high = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 6, "comment": "Inválida."},
            format="json",
        )
        self.assertEqual(r_low.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r_high.status_code, status.HTTP_400_BAD_REQUEST)

    def test_03_duplicate_review_per_user_and_perfume_rejected(self):
        self.client.force_authenticate(user=self.user_a)
        r1 = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 5, "comment": "Primera."},
            format="json",
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)

        dup = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 4, "comment": "Duplicada."},
            format="json",
        )
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_04_cannot_modify_or_delete_other_user_review(self):
        self.client.force_authenticate(user=self.user_a)
        r1 = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 5, "comment": "De user_a."},
            format="json",
        )
        rev_id = r1.data["id"]

        self.client.force_authenticate(user=self.user_b)
        patch_other = self.client.patch(
            f"/api/reviews/{rev_id}/", {"rating": 1}, format="json"
        )
        del_other = self.client.delete(f"/api/reviews/{rev_id}/")
        self.assertEqual(patch_other.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(del_other.status_code, status.HTTP_403_FORBIDDEN)

    def test_05_perfume_average_rating_and_count_dynamic_updates(self):
        self.client.force_authenticate(user=self.user_a)
        r1 = self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 5, "comment": "Cinco estrellas."},
            format="json",
        )
        rev_a_id = r1.data["id"]

        self.client.force_authenticate(user=self.user_b)
        self.client.post(
            "/api/reviews/",
            {"perfume": self.perfume.id, "rating": 3, "comment": "Tres estrellas."},
            format="json",
        )

        detail1 = self.client.get(f"/api/catalog/perfumes/{self.perfume.id}/")
        self.assertEqual(detail1.data["average_rating"], 4.0)
        self.assertEqual(detail1.data["reviews_count"], 2)

        self.client.force_authenticate(user=self.user_a)
        self.client.patch(f"/api/reviews/{rev_a_id}/", {"rating": 4}, format="json")
        detail2 = self.client.get(f"/api/catalog/perfumes/{self.perfume.id}/")
        self.assertEqual(detail2.data["average_rating"], 3.5)

        self.client.delete(f"/api/reviews/{rev_a_id}/")
        detail3 = self.client.get(f"/api/catalog/perfumes/{self.perfume.id}/")
        self.assertEqual(detail3.data["average_rating"], 3.0)
        self.assertEqual(detail3.data["reviews_count"], 1)
