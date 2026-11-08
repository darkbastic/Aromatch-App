import unittest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Brand, Note, Perfume, PerfumeNote
from favorites.models import Favorite
from reviews.models import Review
from .models import UserNotePreference

User = get_user_model()


class RecommendationsAPITests(unittest.TestCase):
    """Pruebas automatizadas de Preferencias Olfativas y Recomendaciones."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._cleanup_all()

        cls.user_a = User.objects.create_user(
            username="ut_rec_a", email="ut_reca@aromatch.cl", password="Password123!"
        )
        cls.user_b = User.objects.create_user(
            username="ut_rec_b", email="ut_recb@aromatch.cl", password="Password123!"
        )
        cls.brand = Brand.objects.create(name="[UT-REC] Tom Ford", country="EE.UU.")
        cls.note_vainilla = Note.objects.create(name="[UT-REC] Vainilla", family="Oriental")
        cls.note_tabaco = Note.objects.create(name="[UT-REC] Tabaco", family="Especiada")
        cls.note_oud_aislado = Note.objects.create(name="[UT-REC] OudAislado", family="Amaderada")

        cls.p_match2 = Perfume.objects.create(
            name="[UT-REC] Tobacco Vanille",
            brand=cls.brand,
            description="Tabaco y vainilla.",
            concentration="EDP",
        )
        PerfumeNote.objects.create(perfume=cls.p_match2, note=cls.note_tabaco, note_type="TOP")
        PerfumeNote.objects.create(perfume=cls.p_match2, note=cls.note_vainilla, note_type="BASE")

        cls.p_match1 = Perfume.objects.create(
            name="[UT-REC] Noir Extreme",
            brand=cls.brand,
            description="Vainilla.",
            concentration="EDP",
        )
        PerfumeNote.objects.create(perfume=cls.p_match1, note=cls.note_vainilla, note_type="BASE")

        cls.p_fav = Perfume.objects.create(
            name="[UT-REC] Favorito Excluido",
            brand=cls.brand,
            description="En favoritos.",
            concentration="EDP",
        )
        PerfumeNote.objects.create(perfume=cls.p_fav, note=cls.note_tabaco, note_type="TOP")
        PerfumeNote.objects.create(perfume=cls.p_fav, note=cls.note_vainilla, note_type="BASE")

        cls.p_rev = Perfume.objects.create(
            name="[UT-REC] Reseñado Excluido",
            brand=cls.brand,
            description="Ya reseñado.",
            concentration="EDT",
        )
        PerfumeNote.objects.create(perfume=cls.p_rev, note=cls.note_tabaco, note_type="HEART")

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_all()
        super().tearDownClass()

    @classmethod
    def _cleanup_all(cls):
        Favorite.objects.filter(user__username__in=["ut_rec_a", "ut_rec_b"]).delete()
        Review.objects.filter(user__username__in=["ut_rec_a", "ut_rec_b"]).delete()
        UserNotePreference.objects.filter(user__username__in=["ut_rec_a", "ut_rec_b"]).delete()
        Perfume.objects.filter(name__startswith="[UT-REC]").delete()
        Brand.objects.filter(name__startswith="[UT-REC]").delete()
        Note.objects.filter(name__startswith="[UT-REC]").delete()
        User.objects.filter(username__in=["ut_rec_a", "ut_rec_b"]).delete()

    def setUp(self):
        self.client = APIClient()
        Favorite.objects.filter(user__in=[self.user_a, self.user_b]).delete()
        Review.objects.filter(user__in=[self.user_a, self.user_b]).delete()
        UserNotePreference.objects.filter(user__in=[self.user_a, self.user_b]).delete()

    def test_01_preferences_unauthenticated_denied(self):
        res_pref = self.client.get("/api/recommendations/preferences/")
        res_rec = self.client.get("/api/recommendations/")
        self.assertEqual(res_pref.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_rec.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_preferences_create_list_duplicate_and_delete(self):
        self.client.force_authenticate(user=self.user_a)
        c1 = self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_vainilla.id},
            format="json",
        )
        self.assertEqual(c1.status_code, status.HTTP_201_CREATED)
        pref_id = c1.data["id"]

        dup = self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_vainilla.id},
            format="json",
        )
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

        list_res = self.client.get("/api/recommendations/preferences/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data["count"], 1)

        del_res = self.client.delete(f"/api/recommendations/preferences/{pref_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_03_preferences_user_isolation(self):
        self.client.force_authenticate(user=self.user_a)
        c1 = self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_vainilla.id},
            format="json",
        )
        pref_id = c1.data["id"]

        self.client.force_authenticate(user=self.user_b)
        list_b = self.client.get("/api/recommendations/preferences/")
        self.assertEqual(list_b.data["count"], 0)

        del_other = self.client.delete(f"/api/recommendations/preferences/{pref_id}/")
        self.assertEqual(del_other.status_code, status.HTTP_404_NOT_FOUND)

    def test_04_recommendations_for_user_without_preferences(self):
        self.client.force_authenticate(user=self.user_a)
        res = self.client.get("/api/recommendations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["has_preferences"])
        self.assertEqual(res.data["results"], [])

    def test_05_recommendations_scoring_ordering_and_exclusions(self):
        self.client.force_authenticate(user=self.user_a)
        self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_vainilla.id},
            format="json",
        )
        self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_tabaco.id},
            format="json",
        )

        Favorite.objects.create(user=self.user_a, perfume=self.p_fav)
        Review.objects.create(user=self.user_a, perfume=self.p_rev, rating=5, comment="Genial.")

        res = self.client.get("/api/recommendations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["has_preferences"])

        results = [r for r in res.data["results"] if r["name"].startswith("[UT-REC]")]
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["id"], self.p_match2.id)
        self.assertEqual(results[0]["matched_notes_count"], 2)
        self.assertEqual(results[0]["match_percentage"], 100.0)
        self.assertEqual(results[1]["id"], self.p_match1.id)
        self.assertEqual(results[1]["matched_notes_count"], 1)
        self.assertEqual(results[1]["match_percentage"], 50.0)

    def test_06_recommendations_when_no_perfumes_match(self):
        self.client.force_authenticate(user=self.user_b)
        self.client.post(
            "/api/recommendations/preferences/",
            {"note_id": self.note_oud_aislado.id},
            format="json",
        )
        res = self.client.get("/api/recommendations/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["has_preferences"])
        self.assertEqual(res.data["count"], 0)
        self.assertEqual(res.data["results"], [])
