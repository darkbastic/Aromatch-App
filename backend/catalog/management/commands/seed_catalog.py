from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Brand, Note, Perfume, PerfumeNote


class Command(BaseCommand):
    help = (
        "Puebla y amplía de forma idempotente el catálogo de Aromatch con marcas, "
        "notas olfativas, perfumes reales y sus pirámides olfativas."
    )

    @transaction.atomic
    def handle(self, *args, **options):
        # 1. Inspección inicial del estado actual en la base de datos
        initial_brands_count = Brand.objects.count()
        initial_notes_count = Note.objects.count()
        initial_perfumes_count = Perfume.objects.count()
        initial_relations_count = PerfumeNote.objects.count()

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"[Inspección inicial] Marcas: {initial_brands_count} | "
                f"Notas: {initial_notes_count} | "
                f"Perfumes: {initial_perfumes_count} | "
                f"Relaciones PerfumeNote: {initial_relations_count}"
            )
        )

        # 2. Definición de marcas del catálogo (originales + ampliación)
        brands_data = [
            {
                "name": "Dior",
                "country": "Francia",
                "description": "Casa de alta perfumería francesa fundada en 1947.",
            },
            {
                "name": "Chanel",
                "country": "Francia",
                "description": "Icónica casa francesa de moda y alta perfumería.",
            },
            {
                "name": "Tom Ford",
                "country": "Estados Unidos",
                "description": "Perfumería contemporánea de lujo, opulencia e intensidad.",
            },
            {
                "name": "Giorgio Armani",
                "country": "Italia",
                "description": (
                    "Casa italiana de moda y alta perfumería creadora de las líneas "
                    "Giorgio Armani y Emporio Armani."
                ),
            },
            {
                "name": "Jean Paul Gaultier",
                "country": "Francia",
                "description": (
                    "Icónica casa francesa de moda y perfumería reconocida por sus "
                    "composiciones audaces y sus emblemáticos frascos."
                ),
            },
            {
                "name": "Versace",
                "country": "Italia",
                "description": (
                    "Casa de lujo italiana célebre por sus fragancias vibrantes de "
                    "carácter mediterráneo, seductor y energético."
                ),
            },
        ]

        brands = {}
        brands_created = 0
        brands_reused = 0

        for b in brands_data:
            existing_brand = Brand.objects.filter(name__iexact=b["name"].strip()).first()
            if existing_brand:
                brands_reused += 1
                # Solo completamos descripción o país si estaban vacíos, sin sobrescribir logos
                updated_fields = []
                if not existing_brand.country and b.get("country"):
                    existing_brand.country = b["country"]
                    updated_fields.append("country")
                if not existing_brand.description and b.get("description"):
                    existing_brand.description = b["description"]
                    updated_fields.append("description")
                if updated_fields:
                    existing_brand.save(update_fields=updated_fields + ["updated_at"])
                brands[b["name"]] = existing_brand
            else:
                obj = Brand.objects.create(
                    name=b["name"].strip(),
                    country=b.get("country", ""),
                    description=b.get("description", ""),
                )
                brands_created += 1
                brands[b["name"]] = obj

        # Si ya existía una marca llamada "Emporio Armani", la mapeamos; de lo contrario reutilizamos "Giorgio Armani"
        emporio_brand = (
            Brand.objects.filter(name__iexact="Emporio Armani").first()
            or brands["Giorgio Armani"]
        )

        # 3. Definición normalizada de notas olfativas (reutilizando equivalentes sin duplicar)
        notes_data = [
            # Notas base iniciales
            {
                "name": "Bergamota",
                "family": "Cítrica",
                "description": "Nota cítrica fresca, luminosa y ligeramente floral.",
            },
            {
                "name": "Pimienta de Sichuan",
                "family": "Especiada",
                "description": "Nota especiada vibrante con matices cítricos y herbales.",
            },
            {
                "name": "Lavanda",
                "family": "Aromática",
                "description": "Aroma herbal limpio, clásico y relajante.",
            },
            {
                "name": "Ambroxan",
                "family": "Ambarada",
                "description": "Nota ambarada, mineral y amaderada de gran fijación.",
            },
            {
                "name": "Pomelo",
                "family": "Cítrica",
                "description": "Cítrico chispeante, ligeramente amargo y refrescante.",
            },
            {
                "name": "Incienso",
                "family": "Balsámica",
                "description": "Nota ahumada, mística y resinosa.",
            },
            {
                "name": "Cedro",
                "family": "Amaderada",
                "description": "Madera seca, limpia y elegante.",
            },
            {
                "name": "Hoja de Tabaco",
                "family": "Especiada",
                "description": "Aroma cálido, rico, aromático y ligeramente dulce.",
            },
            {
                "name": "Vainilla",
                "family": "Oriental",
                "description": "Nota dulce, cremosa, cálida y reconfortante.",
            },
            {
                "name": "Cacao",
                "family": "Gourmand",
                "description": "Matiz achocolatado seco y profundo.",
            },
            {
                "name": "Notas Marinas",
                "family": "Acuática",
                "description": "Acorde fresco y cristalino que evoca la brisa oceánica.",
            },
            {
                "name": "Romero",
                "family": "Aromática",
                "description": "Hierba mediterránea fresca y alcanforada.",
            },
            {
                "name": "Pachulí",
                "family": "Amaderada",
                "description": "Nota terrosa, húmeda, exótica y profunda.",
            },
            # Nuevas notas verificadas para JPG, Versace y Emporio Armani
            {
                "name": "Pera",
                "family": "Frutal",
                "description": "Nota frutal jugosa, dulce y luminosa de salida.",
            },
            {
                "name": "Menta",
                "family": "Aromática",
                "description": "Hoja aromática verde, fría y vigorizante.",
            },
            {
                "name": "Limón",
                "family": "Cítrica",
                "description": "Cítrico brillante, ácido y sumamente energético.",
            },
            {
                "name": "Canela",
                "family": "Especiada",
                "description": "Especia cálida, dulce y envolvente.",
            },
            {
                "name": "Esclarea",
                "family": "Aromática",
                "description": "Salvia aromática con matices herbales, limpios y ambarados.",
            },
            {
                "name": "Ámbar",
                "family": "Ambarada",
                "description": "Acorde resinoso, cálido, dorado y sensual.",
            },
            {
                "name": "Cardamomo",
                "family": "Especiada",
                "description": "Especia aromática, fresca, resinosa y ligeramente dulce.",
            },
            {
                "name": "Iris",
                "family": "Floral",
                "description": "Nota floral empolvada, mantecosa y sofisticada.",
            },
            {
                "name": "Notas Amaderadas",
                "family": "Amaderada",
                "description": "Acorde cálido y estructurado de maderas nobles.",
            },
            {
                "name": "Benjuí",
                "family": "Balsámica",
                "description": "Resina balsámica cálida con facetas avainilladas.",
            },
            {
                "name": "Miel",
                "family": "Gourmand",
                "description": "Néctar dorado, denso, dulce y envolvente.",
            },
            {
                "name": "Haba Tonka",
                "family": "Oriental",
                "description": "Semilla aromática cálida con matices de almendra, vainilla y heno.",
            },
            {
                "name": "Hojas de Higuera",
                "family": "Verde",
                "description": "Nota verde, fresca y ligeramente láctea de carácter mediterráneo.",
            },
            {
                "name": "Pimienta Negra",
                "family": "Especiada",
                "description": "Especia seca, picante y vibrante.",
            },
            {
                "name": "Hojas de Violeta",
                "family": "Verde",
                "description": "Nota verde, acuosa y ligeramente metálica y floral.",
            },
            {
                "name": "Almizcle",
                "family": "Almizclada",
                "description": "Nota limpia, suave y de efecto segunda piel.",
            },
            {
                "name": "Azafrán",
                "family": "Especiada",
                "description": "Especia lujosa, cálida y con matices coriáceos.",
            },
            {
                "name": "Neroli",
                "family": "Floral",
                "description": "Aceite esencial de flor de naranjo amargo, cítrico y floral.",
            },
            {
                "name": "Jacinto",
                "family": "Floral",
                "description": "Flor primaveral fresca con matices verdes y acuáticos.",
            },
            {
                "name": "Geranio",
                "family": "Floral",
                "description": "Nota floral herbal con matices rosados y mentolados.",
            },
            {
                "name": "Manzana",
                "family": "Frutal",
                "description": "Fruta crujiente, fresca y ligeramente ácida.",
            },
            {
                "name": "Mandarina",
                "family": "Cítrica",
                "description": "Cítrico jugoso, dulce y chispeante.",
            },
            {
                "name": "Sándalo",
                "family": "Amaderada",
                "description": "Madera cremosa, suave, cálida y envolvente.",
            },
            {
                "name": "Cuero",
                "family": "Cuero",
                "description": "Acorde profundo, ahumado y elegante con carácter distinguido.",
            },
            {
                "name": "Pimienta Rosa",
                "family": "Especiada",
                "description": "Baya especiada luminosa, rosada y ligeramente frutal.",
            },
            {
                "name": "Salvia",
                "family": "Aromática",
                "description": "Hierba aromática mediterránea de carácter limpio y alcanforado.",
            },
            {
                "name": "Castaña",
                "family": "Gourmand",
                "description": "Acorde cálido de castaña asada y glaseada, firma de Stronger With You.",
            },
            {
                "name": "Enebro",
                "family": "Aromática",
                "description": "Baya aromática fresca, resinosa y ligeramente balsámica.",
            },
            {
                "name": "Toffee",
                "family": "Gourmand",
                "description": "Acorde dulce de caramelo tostado y mantecoso.",
            },
            {
                "name": "Gamuza",
                "family": "Cuero",
                "description": "Faceta de cuero suave, aterciopelada y sensual.",
            },
            {
                "name": "Ron",
                "family": "Gourmand",
                "description": "Acorde licoroso cálido, especiado y ambarado.",
            },
            {
                "name": "Elemi",
                "family": "Balsámica",
                "description": "Resina fresca con matices alimonados y especiados.",
            },
            {
                "name": "Davana",
                "family": "Aromática",
                "description": "Hierba aromática con matices frutales, balsámicos y licorosos.",
            },
        ]

        notes = {}
        notes_created = 0
        notes_reused = 0

        for n in notes_data:
            canonical_name = n["name"].strip()
            existing_note = Note.objects.filter(name__iexact=canonical_name).first()
            if existing_note:
                notes_reused += 1
                updated_fields = []
                if not existing_note.family and n.get("family"):
                    existing_note.family = n["family"]
                    updated_fields.append("family")
                if not existing_note.description and n.get("description"):
                    existing_note.description = n["description"]
                    updated_fields.append("description")
                if updated_fields:
                    existing_note.save(update_fields=updated_fields + ["updated_at"])
                notes[canonical_name] = existing_note
            else:
                obj = Note.objects.create(
                    name=canonical_name,
                    family=n.get("family", ""),
                    description=n.get("description", ""),
                )
                notes_created += 1
                notes[canonical_name] = obj

        # 4. Definición completa de perfumes (4 iniciales + 10 reales de JPG, Versace y Emporio Armani)
        perfumes_data = [
            # --- Colección base inicial ---
            {
                "name": "Sauvage",
                "brand": brands["Dior"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2018,
                "description": (
                    "Fragancia fresca, especiada y ambarada inspirada en el desierto al atardecer."
                ),
                "recommended_seasons": ["SPRING", "AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Bergamota", "TOP"),
                    ("Pimienta de Sichuan", "HEART"),
                    ("Lavanda", "HEART"),
                    ("Ambroxan", "BASE"),
                    ("Vainilla", "BASE"),
                ],
            },
            {
                "name": "Bleu de Chanel",
                "brand": brands["Chanel"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2014,
                "description": "Aromático amaderado de estela elegante y atemporal.",
                "recommended_seasons": ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.MODERATE,
                "pyramid": [
                    ("Pomelo", "TOP"),
                    ("Bergamota", "TOP"),
                    ("Incienso", "HEART"),
                    ("Cedro", "BASE"),
                ],
            },
            {
                "name": "Tobacco Vanille",
                "brand": brands["Tom Ford"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.UNISEX,
                "release_year": 2007,
                "description": (
                    "Opulenta combinación de tabaco especiado, vainilla cremosa y cacao."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.ETERNAL,
                "projection": Perfume.ProjectionChoices.ENORMOUS,
                "pyramid": [
                    ("Hoja de Tabaco", "TOP"),
                    ("Vainilla", "HEART"),
                    ("Cacao", "HEART"),
                    ("Cedro", "BASE"),
                ],
            },
            {
                "name": "Acqua di Giò Profondo",
                "brand": brands["Giorgio Armani"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2020,
                "description": (
                    "Interpretación marina e intensa con notas cítricas y aromáticas."
                ),
                "recommended_seasons": ["SPRING", "SUMMER"],
                "estimated_duration": Perfume.DurationChoices.MODERATE,
                "projection": Perfume.ProjectionChoices.MODERATE,
                "pyramid": [
                    ("Notas Marinas", "TOP"),
                    ("Bergamota", "TOP"),
                    ("Romero", "HEART"),
                    ("Lavanda", "HEART"),
                    ("Pachulí", "BASE"),
                ],
            },
            # --- Jean Paul Gaultier ---
            {
                "name": "Ultra Male",
                "brand": brands["Jean Paul Gaultier"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_TOILETTE,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2015,
                "description": (
                    "Fragancia oriental fougère intensa y seductora donde la pera jugosa, "
                    "el limón y la menta contrastan con canela especiada, lavanda y un "
                    "fondo cálido de vainilla, ámbar, cedro y pachulí."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Pera", "TOP"),
                    ("Lavanda", "TOP"),
                    ("Menta", "TOP"),
                    ("Bergamota", "TOP"),
                    ("Limón", "TOP"),
                    ("Canela", "HEART"),
                    ("Esclarea", "HEART"),
                    ("Vainilla", "BASE"),
                    ("Ámbar", "BASE"),
                    ("Cedro", "BASE"),
                    ("Pachulí", "BASE"),
                ],
            },
            {
                "name": "Le Male Le Parfum",
                "brand": brands["Jean Paul Gaultier"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2020,
                "description": (
                    "Sofisticada versión Eau de Parfum Intense que abre con cardamomo "
                    "especiado, evoluciona hacia un corazón elegante de lavanda e iris "
                    "y reposa sobre una base envolvente de vainilla y maderas orientales."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER", "SPRING"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Cardamomo", "TOP"),
                    ("Lavanda", "HEART"),
                    ("Iris", "HEART"),
                    ("Vainilla", "BASE"),
                    ("Notas Amaderadas", "BASE"),
                ],
            },
            {
                "name": "Le Male Elixir",
                "brand": brands["Jean Paul Gaultier"],
                "concentration": Perfume.ConcentrationChoices.PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2023,
                "description": (
                    "Elixir aromático y ambarado de gran riqueza olfativa que fusiona "
                    "lavanda y menta refrescante con vainilla cremosa, benjuí resinoso, "
                    "miel dorada, haba tonka y hoja de tabaco."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.ETERNAL,
                "projection": Perfume.ProjectionChoices.ENORMOUS,
                "pyramid": [
                    ("Lavanda", "TOP"),
                    ("Menta", "TOP"),
                    ("Vainilla", "HEART"),
                    ("Benjuí", "HEART"),
                    ("Miel", "BASE"),
                    ("Haba Tonka", "BASE"),
                    ("Hoja de Tabaco", "BASE"),
                ],
            },
            # --- Versace ---
            {
                "name": "Dylan Blue Pour Homme",
                "brand": brands["Versace"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_TOILETTE,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2016,
                "description": (
                    "Fougère aromático mediterráneo de gran versatilidad con notas "
                    "marinas, bergamota, pomelo y hojas de higuera sobre un corazón de "
                    "ambroxan, pimienta negra y pachulí con fondo de incienso, haba tonka "
                    "y azafrán."
                ),
                "recommended_seasons": ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.MODERATE,
                "pyramid": [
                    ("Bergamota", "TOP"),
                    ("Pomelo", "TOP"),
                    ("Notas Marinas", "TOP"),
                    ("Hojas de Higuera", "TOP"),
                    ("Ambroxan", "HEART"),
                    ("Pimienta Negra", "HEART"),
                    ("Hojas de Violeta", "HEART"),
                    ("Pachulí", "HEART"),
                    ("Incienso", "BASE"),
                    ("Almizcle", "BASE"),
                    ("Haba Tonka", "BASE"),
                    ("Azafrán", "BASE"),
                ],
            },
            {
                "name": "Versace Pour Homme",
                "brand": brands["Versace"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_TOILETTE,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2008,
                "description": (
                    "Clásico aromático fougère fresco y luminoso protagonizado por "
                    "limón, bergamota y neroli sobre un corazón aromático de jacinto, "
                    "esclarea, geranio y cedro con un fondo limpio de haba tonka, "
                    "almizcle y ámbar."
                ),
                "recommended_seasons": ["SPRING", "SUMMER"],
                "estimated_duration": Perfume.DurationChoices.MODERATE,
                "projection": Perfume.ProjectionChoices.MODERATE,
                "pyramid": [
                    ("Limón", "TOP"),
                    ("Bergamota", "TOP"),
                    ("Neroli", "TOP"),
                    ("Jacinto", "HEART"),
                    ("Esclarea", "HEART"),
                    ("Geranio", "HEART"),
                    ("Cedro", "HEART"),
                    ("Haba Tonka", "BASE"),
                    ("Almizcle", "BASE"),
                    ("Ámbar", "BASE"),
                ],
            },
            {
                "name": "Eros Eau de Parfum",
                "brand": brands["Versace"],
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2020,
                "description": (
                    "Fragancia oriental amaderada y fresca que combina una apertura "
                    "vibrante de menta, manzana, limón y mandarina con ambroxan, "
                    "geranio y esclarea sobre un fondo intenso de vainilla, cedro, "
                    "sándalo, pachulí y cuero."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER", "SPRING"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Menta", "TOP"),
                    ("Manzana", "TOP"),
                    ("Limón", "TOP"),
                    ("Mandarina", "TOP"),
                    ("Ambroxan", "HEART"),
                    ("Geranio", "HEART"),
                    ("Esclarea", "HEART"),
                    ("Vainilla", "BASE"),
                    ("Cedro", "BASE"),
                    ("Sándalo", "BASE"),
                    ("Pachulí", "BASE"),
                    ("Cuero", "BASE"),
                ],
            },
            # --- Emporio Armani / Giorgio Armani ---
            {
                "name": "Stronger With You",
                "brand": emporio_brand,
                "concentration": Perfume.ConcentrationChoices.EAU_DE_TOILETTE,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2017,
                "description": (
                    "Fragancia aromática fougère de la línea Emporio Armani con "
                    "apertura especiada de cardamomo, pimienta rosa, hojas de violeta "
                    "y menta, corazón aromático de salvia, canela y lavanda, y un fondo "
                    "distintivo de castaña glaseada, vainilla, cedro y ámbar."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER", "SPRING"],
                "estimated_duration": Perfume.DurationChoices.LONG_LASTING,
                "projection": Perfume.ProjectionChoices.MODERATE,
                "pyramid": [
                    ("Cardamomo", "TOP"),
                    ("Pimienta Rosa", "TOP"),
                    ("Hojas de Violeta", "TOP"),
                    ("Menta", "TOP"),
                    ("Salvia", "HEART"),
                    ("Canela", "HEART"),
                    ("Lavanda", "HEART"),
                    ("Vainilla", "BASE"),
                    ("Castaña", "BASE"),
                    ("Cedro", "BASE"),
                    ("Ámbar", "BASE"),
                ],
            },
            {
                "name": "Stronger With You Intensely",
                "brand": emporio_brand,
                "concentration": Perfume.ConcentrationChoices.EAU_DE_PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2019,
                "description": (
                    "Composición oriental fougère cálida y adictiva de Emporio Armani "
                    "que abre con pimienta rosa y enebro, despliega un corazón de "
                    "toffee caramelizado, canela, lavanda y salvia, y culmina en una "
                    "base profunda de vainilla, haba tonka, ámbar y gamuza."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.ETERNAL,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Pimienta Rosa", "TOP"),
                    ("Enebro", "TOP"),
                    ("Toffee", "HEART"),
                    ("Canela", "HEART"),
                    ("Lavanda", "HEART"),
                    ("Salvia", "HEART"),
                    ("Vainilla", "BASE"),
                    ("Haba Tonka", "BASE"),
                    ("Ámbar", "BASE"),
                    ("Gamuza", "BASE"),
                ],
            },
            {
                "name": "Stronger With You Absolutely",
                "brand": emporio_brand,
                "concentration": Perfume.ConcentrationChoices.PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2021,
                "description": (
                    "Versión Parfum sensual y licorosa de Emporio Armani que combina "
                    "un acorde de ron cálido, elemi y bergamota en la salida con un "
                    "corazón aromático de lavanda y davana sobre castaña glaseada, "
                    "vainilla, cedro y pachulí."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.ETERNAL,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Ron", "TOP"),
                    ("Elemi", "TOP"),
                    ("Bergamota", "TOP"),
                    ("Lavanda", "HEART"),
                    ("Davana", "HEART"),
                    ("Castaña", "BASE"),
                    ("Vainilla", "BASE"),
                    ("Cedro", "BASE"),
                    ("Pachulí", "BASE"),
                ],
            },
            {
                "name": "Stronger With You Parfum",
                "brand": emporio_brand,
                "concentration": Perfume.ConcentrationChoices.PARFUM,
                "gender": Perfume.GenderChoices.MASCULINE,
                "release_year": 2025,
                "description": (
                    "Interpretación profunda, especiada y coriácea de Emporio Armani "
                    "con salida vibrante de pimienta rosa y mandarina, corazón "
                    "aromático de lavanda, esclarea y canela, y un fondo envolvente "
                    "de castaña, vainilla, cuero y ámbar."
                ),
                "recommended_seasons": ["AUTUMN", "WINTER"],
                "estimated_duration": Perfume.DurationChoices.ETERNAL,
                "projection": Perfume.ProjectionChoices.STRONG,
                "pyramid": [
                    ("Pimienta Rosa", "TOP"),
                    ("Mandarina", "TOP"),
                    ("Lavanda", "HEART"),
                    ("Esclarea", "HEART"),
                    ("Canela", "HEART"),
                    ("Castaña", "BASE"),
                    ("Vainilla", "BASE"),
                    ("Cuero", "BASE"),
                    ("Ámbar", "BASE"),
                ],
            },
        ]

        perfumes_created = 0
        perfumes_reused = 0
        relations_created = 0
        relations_reused = 0

        for p_data in perfumes_data:
            pyramid = p_data.pop("pyramid")
            existing_perfume = Perfume.objects.filter(
                brand=p_data["brand"],
                name__iexact=p_data["name"].strip(),
                concentration=p_data["concentration"],
            ).first()

            if existing_perfume:
                perfumes_reused += 1
                # Preservamos image_url existente si ya fue configurada en Supabase / Panel Admin
                for field, value in p_data.items():
                    if field == "image_url" and existing_perfume.image_url and not value:
                        continue
                    setattr(existing_perfume, field, value)
                existing_perfume.save()
                perfume = existing_perfume
            else:
                perfume = Perfume.objects.create(**p_data)
                perfumes_created += 1

            for note_name, note_type in pyramid:
                note_obj = notes[note_name]
                _, rel_created = PerfumeNote.objects.update_or_create(
                    perfume=perfume,
                    note=note_obj,
                    defaults={"note_type": note_type},
                )
                if rel_created:
                    relations_created += 1
                else:
                    relations_reused += 1

        # 5. Validación posterior a la carga (incluyendo serialización de la API)
        from catalog.serializers import PerfumeDetailSerializer

        final_brands_count = Brand.objects.count()
        final_notes_count = Note.objects.count()
        final_perfumes_count = Perfume.objects.count()
        final_relations_count = PerfumeNote.objects.count()

        invalid_pyramids = []
        serialized_details = []
        for perf in Perfume.objects.select_related("brand").prefetch_related("perfume_notes__note").all():
            data = PerfumeDetailSerializer(perf).data
            pyramid_data = data.get("olfactory_pyramid", {})
            top_count = len(pyramid_data.get("top", []))
            heart_count = len(pyramid_data.get("heart", []))
            base_count = len(pyramid_data.get("base", []))
            if top_count == 0 or heart_count == 0 or base_count == 0:
                invalid_pyramids.append(perf.name)
            serialized_details.append(
                f"  • {perf.brand.name} — {perf.name} ({perf.get_concentration_display()}, {perf.release_year}): "
                f"Salida={top_count}, Corazón={heart_count}, Fondo={base_count}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n[Resumen de Ejecución seed_catalog]\n"
                f"- Marcas: {final_brands_count} totales ({brands_created} creadas, {brands_reused} reutilizadas)\n"
                f"- Notas olfativas: {final_notes_count} totales ({notes_created} creadas, {notes_reused} reutilizadas)\n"
                f"- Perfumes: {final_perfumes_count} totales ({perfumes_created} agregados, {perfumes_reused} reutilizados/actualizados)\n"
                f"- Relaciones PerfumeNote: {final_relations_count} totales ({relations_created} creadas, {relations_reused} reutilizadas)\n"
                f"- Pirámides olfativas válidas en API (TOP/HEART/BASE): "
                f"{final_perfumes_count - len(invalid_pyramids)}/{final_perfumes_count}\n\n"
                f"[Detalle de Pirámides Verificadas en API]:\n" + "\n".join(serialized_details)
            )
        )
