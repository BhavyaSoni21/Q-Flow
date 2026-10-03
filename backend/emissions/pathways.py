"""Versioned fuel-pathway metadata exposed to the dashboard."""

PATHWAYS = {
    "methanol_grey": [
        dict(pathway="Fossil", wtw=95.0, availability="representative", source="CONCAWE / IEA", version="2024"),
        dict(pathway="Bio", wtw=28.0, availability="representative", source="CONCAWE / IEA", version="2024"),
        dict(pathway="e-Methanol", wtw=12.0, availability="representative", source="CONCAWE / IEA", version="2024"),
    ],
    "methanol_green": [
        dict(pathway="Bio", wtw=28.0, availability="representative", source="CONCAWE / IEA", version="2024"),
        dict(pathway="e-Methanol", wtw=12.0, availability="representative", source="CONCAWE / IEA", version="2024"),
    ],
    "hydrogen_green": [
        dict(pathway="Grey", wtw=90.0, availability="representative", source="JRC Well-to-Tank", version="2023"),
        dict(pathway="Blue", wtw=32.0, availability="representative", source="JRC Well-to-Tank", version="2023"),
        dict(pathway="Renewable electrolysis", wtw=5.0, availability="representative", source="JRC Well-to-Tank", version="2023"),
    ],
    "ammonia_green": [
        dict(pathway="Grey", wtw=78.0, availability="representative", source="IEA / IRENA", version="2024"),
        dict(pathway="Blue", wtw=30.0, availability="representative", source="IEA / IRENA", version="2024"),
        dict(pathway="Renewable", wtw=8.0, availability="representative", source="IEA / IRENA", version="2024"),
    ],
}


def records():
    return [dict(fuel_id=fuel, **pathway) for fuel, pathways in PATHWAYS.items() for pathway in pathways]
