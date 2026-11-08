from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Brand, Note, Perfume, PerfumeNote

User = get_user_model()


class CatalogAPITests(APITestCase):
    """Pruebas integrales para la API del catálogo (Etapa 7)."""

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_catalog",
            email="admin@aromatch.cl",
            password="AdminPassword123!",
            is_staff=True,
        )
        self.normal_user = User.objects.create_user(
            username="user_catalog",
            email="user@aromatch.cl",
            password="UserPassword123!",
            is_staff=False,
        )

        self.brand_dior = Brand.objects.create(name="Dior", country="Francia")
        self.brand_chanel = Brand.objects.create(name="Chanel", country="Francia")

        self.note_bergamota = Note.objects.create(name="Bergamota", family="Cítrica")
        self.note_lavanda = Note.objects.create(name="Lavanda", family="Aromática")
        self.note_vainilla = Note.objects.create(name="Vainilla", family="Oriental")

        self.perfume = Perfume.objects.create(
            name="Sauvage",
            brand=self.brand_dior,
            description="Aroma fresco y especiado.",
            concentration=Perfume.ConcentrationChoices.EAU_DE_PARFUM,
            gender=Perfume.GenderChoices.MASCULINE,
            release_year=2018,
            recommended_seasons=["AUTUMN", "WINTER"],
            estimated_duration=Perfume.DurationChoices.LONG_LASTING,
            projection=Perfume.ProjectionChoices.STRONG,
        )
        PerfumeNote.objects.create(
            perfume=self.perfume,
            note=self.note_bergamota,
            note_type=PerfumeNote.NoteTypeChoices.TOP,
        )
        PerfumeNote.objects.create(
            perfume=self.perfume,
            note=self.note_lavanda,
            note_type=PerfumeNote.NoteTypeChoices.HEART,
        )
        PerfumeNote.objects.create(
            perfume=self.perfume,
            note=self.note_vainilla,
            note_type=PerfumeNote.NoteTypeChoices.BASE,
        )

    def test_public_read_and_filters(self):
        # Listado público
        res = self.client.get("/api/catalog/perfumes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)

        # Detalle con pirámide olfativa
        detail_res = self.client.get(f"/api/catalog/perfumes/{self.perfume.id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        pyramid = detail_res.data["olfactory_pyramid"]
        self.assertEqual(len(pyramid["top"]), 1)
        self.assertEqual(len(pyramid["heart"]), 1)
        self.assertEqual(len(pyramid["base"]), 1)

        # Identificador inexistente -> 404
        not_found = self.client.get("/api/catalog/perfumes/999999/")
        self.assertEqual(not_found.status_code, status.HTTP_404_NOT_FOUND)
