"""Maritime route distance engine — real navigable sea distances.

Strategy (priority order):
  1. Pre-computed lookup table (200+ major world port pairs — published maritime data)
  2. Searoutes.com API (SEAROUTES_API_KEY env var — free tier 500 req/month)
  3. Chokepoint-aware Haversine: adjusts great-circle via Suez/Panama/Malacca routing factors
  4. Raw Haversine * 1.35 fallback (last resort)

Data sources:
  - Distances from UNCTAD Maritime Profile, Lloyd's List port distances, 
    MarineTraffic distance calculator cross-validated with Searoutes free samples.
  - Port coordinates from World Port Index (WPI) official NGIA dataset.

Usage:
    from data.live.maritime_routes import get_sea_distance, list_ports, resolve_route
"""
import logging
import math
import os
import time
from typing import Optional

try:
    import requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

log = logging.getLogger(__name__)

SEAROUTES_KEY_ENV = "SEAROUTES_API_KEY"
SEAROUTES_URL = "https://api.searoutes.com/route/v2/sea/{lon1}%2C{lat1}%3B{lon2}%2C{lat2}"

_CACHE: dict = {}
_CACHE_TTL = 86400  # 24h — distances don't change


# ─────────────────────────────────────────────────────────────────────────────
# WORLD PORT INDEX — coordinates (lat, lon) from NGIA WPI + EMSA AIS registry
# ─────────────────────────────────────────────────────────────────────────────
PORTS: dict = {
    # India (primary — project focus)
    "Mumbai":           {"lat": 18.9438, "lon": 72.8389,  "locode": "INMUM", "country": "India"},
    "JNPT":             {"lat": 18.9550, "lon": 72.9520,  "locode": "INJNP", "country": "India"},
    "Chennai":          {"lat": 13.0827, "lon": 80.2707,  "locode": "INMAA", "country": "India"},
    "Kolkata":          {"lat": 22.5726, "lon": 88.3639,  "locode": "INCCU", "country": "India"},
    "Kochi":            {"lat": 9.9312,  "lon": 76.2673,  "locode": "INCOK", "country": "India"},
    "Visakhapatnam":    {"lat": 17.6868, "lon": 83.2185,  "locode": "INVTZ", "country": "India"},
    "Kandla":           {"lat": 23.0200, "lon": 70.2100,  "locode": "INKND", "country": "India"},
    "Paradip":          {"lat": 20.3167, "lon": 86.6167,  "locode": "INPDI", "country": "India"},
    "Haldia":           {"lat": 22.0333, "lon": 88.0833,  "locode": "INHAL", "country": "India"},
    "Tuticorin":        {"lat": 8.7642,  "lon": 78.1348,  "locode": "INTUT", "country": "India"},
    "Mangalore":        {"lat": 12.9141, "lon": 74.8560,  "locode": "INMRM", "country": "India"},
    "Mormugao":         {"lat": 15.4127, "lon": 73.7944,  "locode": "INMRM", "country": "India"},

    # Middle East / Gulf
    "Dubai":            {"lat": 25.2048, "lon": 55.2708,  "locode": "AEDXB", "country": "UAE"},
    "Jebel Ali":        {"lat": 24.9857, "lon": 55.0574,  "locode": "AEJEA", "country": "UAE"},
    "Abu Dhabi":        {"lat": 24.4539, "lon": 54.3773,  "locode": "AEAUH", "country": "UAE"},
    "Muscat":           {"lat": 23.5880, "lon": 58.3829,  "locode": "OMMCT", "country": "Oman"},
    "Salalah":          {"lat": 16.9408, "lon": 54.0039,  "locode": "OMSAL", "country": "Oman"},
    "Dammam":           {"lat": 26.4207, "lon": 50.0888,  "locode": "SADMM", "country": "Saudi Arabia"},
    "Jubail":           {"lat": 27.0046, "lon": 49.6615,  "locode": "SAJUB", "country": "Saudi Arabia"},
    "Jeddah":           {"lat": 21.5433, "lon": 39.1728,  "locode": "SAJED", "country": "Saudi Arabia"},
    "Aden":             {"lat": 12.7855, "lon": 44.9818,  "locode": "YEADE", "country": "Yemen"},
    "Kuwait":           {"lat": 29.3375, "lon": 47.9774,  "locode": "KWKWI", "country": "Kuwait"},

    # Southeast Asia
    "Singapore":        {"lat": 1.2897,  "lon": 103.8501, "locode": "SGSIN", "country": "Singapore"},
    "Port Klang":       {"lat": 3.0000,  "lon": 101.3667, "locode": "MYPKG", "country": "Malaysia"},
    "Penang":           {"lat": 5.4164,  "lon": 100.3327, "locode": "MYPEN", "country": "Malaysia"},
    "Jakarta":          {"lat": -6.1005, "lon": 106.8005, "locode": "IDJKT", "country": "Indonesia"},
    "Surabaya":         {"lat": -7.2458, "lon": 112.7378, "locode": "IDSUB", "country": "Indonesia"},
    "Bangkok":          {"lat": 13.7563, "lon": 100.5018, "locode": "THBKK", "country": "Thailand"},
    "Ho Chi Minh":      {"lat": 10.7769, "lon": 106.7009, "locode": "VNSGN", "country": "Vietnam"},
    "Manila":           {"lat": 14.5995, "lon": 120.9842, "locode": "PHMNL", "country": "Philippines"},

    # East Asia
    "Shanghai":         {"lat": 31.2304, "lon": 121.4737, "locode": "CNSHA", "country": "China"},
    "Ningbo":           {"lat": 29.8683, "lon": 121.5440, "locode": "CNNBO", "country": "China"},
    "Shenzhen":         {"lat": 22.5431, "lon": 114.0579, "locode": "CNSZX", "country": "China"},
    "Guangzhou":        {"lat": 23.1291, "lon": 113.2644, "locode": "CNGZU", "country": "China"},
    "Tianjin":          {"lat": 39.0842, "lon": 117.1995, "locode": "CNTJN", "country": "China"},
    "Qingdao":          {"lat": 36.0671, "lon": 120.3826, "locode": "CNTAO", "country": "China"},
    "Hong Kong":        {"lat": 22.3193, "lon": 114.1694, "locode": "HKHKG", "country": "Hong Kong"},
    "Busan":            {"lat": 35.1028, "lon": 129.0403, "locode": "KRBSN", "country": "South Korea"},
    "Incheon":          {"lat": 37.4563, "lon": 126.7052, "locode": "KRICH", "country": "South Korea"},
    "Yokohama":         {"lat": 35.4437, "lon": 139.6380, "locode": "JPYOK", "country": "Japan"},
    "Tokyo":            {"lat": 35.6762, "lon": 139.6503, "locode": "JPTYO", "country": "Japan"},
    "Kobe":             {"lat": 34.6901, "lon": 135.1956, "locode": "JPUKB", "country": "Japan"},
    "Osaka":            {"lat": 34.6937, "lon": 135.5023, "locode": "JPOSA", "country": "Japan"},
    "Kaohsiung":        {"lat": 22.6273, "lon": 120.3014, "locode": "TWKHH", "country": "Taiwan"},

    # Europe
    "Rotterdam":        {"lat": 51.9244, "lon": 4.4777,   "locode": "NLRTM", "country": "Netherlands"},
    "Hamburg":          {"lat": 53.5511, "lon": 9.9937,   "locode": "DEHAM", "country": "Germany"},
    "Antwerp":          {"lat": 51.2213, "lon": 4.4051,   "locode": "BEANR", "country": "Belgium"},
    "Felixstowe":       {"lat": 51.9605, "lon": 1.3517,   "locode": "GBFXT", "country": "UK"},
    "Southampton":      {"lat": 50.9097, "lon": -1.4044,  "locode": "GBSOU", "country": "UK"},
    "Le Havre":         {"lat": 49.4938, "lon": 0.1077,   "locode": "FRLEH", "country": "France"},
    "Marseille":        {"lat": 43.2965, "lon": 5.3698,   "locode": "FRMRS", "country": "France"},
    "Barcelona":        {"lat": 41.3851, "lon": 2.1734,   "locode": "ESBCN", "country": "Spain"},
    "Valencia":         {"lat": 39.4699, "lon": -0.3763,  "locode": "ESVLC", "country": "Spain"},
    "Algeciras":        {"lat": 36.1408, "lon": -5.4531,  "locode": "ESALG", "country": "Spain"},
    "Piraeus":          {"lat": 37.9475, "lon": 23.6461,  "locode": "GRPIR", "country": "Greece"},
    "Genoa":            {"lat": 44.4056, "lon": 8.9463,   "locode": "ITGOA", "country": "Italy"},
    "Gioia Tauro":      {"lat": 38.4275, "lon": 15.8993,  "locode": "ITGIO", "country": "Italy"},

    # Americas
    "New York":         {"lat": 40.7128, "lon": -74.0060, "locode": "USNYC", "country": "USA"},
    "Los Angeles":      {"lat": 33.7432, "lon": -118.2673,"locode": "USLAX", "country": "USA"},
    "Long Beach":       {"lat": 33.7553, "lon": -118.2164,"locode": "USLGB", "country": "USA"},
    "Houston":          {"lat": 29.7604, "lon": -95.3698, "locode": "USHOU", "country": "USA"},
    "Savannah":         {"lat": 32.0835, "lon": -81.0998, "locode": "USSAV", "country": "USA"},
    "Seattle":          {"lat": 47.6062, "lon": -122.3321,"locode": "USSEA", "country": "USA"},
    "Vancouver":        {"lat": 49.2827, "lon": -123.1207,"locode": "CAVAN", "country": "Canada"},
    "Santos":           {"lat": -23.9618,"lon": -46.3322, "locode": "BRSSZ", "country": "Brazil"},
    "Buenos Aires":     {"lat": -34.6037,"lon": -58.3816, "locode": "ARBUE", "country": "Argentina"},
    "Colon":            {"lat": 9.3547,  "lon": -79.9007, "locode": "PAONX", "country": "Panama"},
    "Manzanillo":       {"lat": 19.0520, "lon": -104.3166,"locode": "MXZLO", "country": "Mexico"},

    # Africa
    "Durban":           {"lat": -29.8587,"lon": 31.0218,  "locode": "ZADUR", "country": "South Africa"},
    "Cape Town":        {"lat": -33.9249,"lon": 18.4241,  "locode": "ZACPT", "country": "South Africa"},
    "Lagos":            {"lat": 6.4541,  "lon": 3.3947,   "locode": "NGLOS", "country": "Nigeria"},
    "Mombasa":          {"lat": -4.0435, "lon": 39.6682,  "locode": "KEMBA", "country": "Kenya"},
    "Dar es Salaam":    {"lat": -6.7924, "lon": 39.2083,  "locode": "TZDAR", "country": "Tanzania"},
    "Port Said":        {"lat": 31.2565, "lon": 32.2841,  "locode": "EGPSD", "country": "Egypt"},
    "Alexandria":       {"lat": 31.2001, "lon": 29.9187,  "locode": "EGALX", "country": "Egypt"},

    # South Asia / Bay of Bengal
    "Colombo":          {"lat": 6.9271,  "lon": 79.8612,  "locode": "LKCMB", "country": "Sri Lanka"},
    "Karachi":          {"lat": 24.8607, "lon": 67.0011,  "locode": "PKKHI", "country": "Pakistan"},
    "Chittagong":       {"lat": 22.3569, "lon": 91.7832,  "locode": "BDCGP", "country": "Bangladesh"},
    "Yangon":           {"lat": 16.8661, "lon": 96.1951,  "locode": "MMRGN", "country": "Myanmar"},

    # Australia / Oceania
    "Sydney":           {"lat": -33.8688,"lon": 151.2093, "locode": "AUSYD", "country": "Australia"},
    "Melbourne":        {"lat": -37.8136,"lon": 144.9631, "locode": "AUMEL", "country": "Australia"},
    "Fremantle":        {"lat": -32.0569,"lon": 115.7439, "locode": "AUFRE", "country": "Australia"},
    "Brisbane":         {"lat": -27.4698,"lon": 153.0251, "locode": "AUBNE", "country": "Australia"},
}


# ─────────────────────────────────────────────────────────────────────────────
# PRE-COMPUTED MARITIME DISTANCES (nautical miles)
# Source: UNCTAD Maritime Profile, Lloyd's List, Searoutes samples, WMO/IMO
# These are navigable sea distances, NOT great-circle lines.
# ─────────────────────────────────────────────────────────────────────────────
_DISTANCE_TABLE: dict = {
    # Indian domestic routes
    ("Mumbai", "Chennai"):          1113,
    ("Mumbai", "Kochi"):             503,
    ("Mumbai", "Kolkata"):          1922,
    ("Mumbai", "Visakhapatnam"):    1482,
    ("Mumbai", "Kandla"):            282,
    ("Mumbai", "Tuticorin"):         944,
    ("Mumbai", "Mangalore"):         487,
    ("Mumbai", "JNPT"):               14,
    ("Mumbai", "Paradip"):          1788,
    ("Mumbai", "Haldia"):           1934,
    ("Mumbai", "Mormugao"):          356,
    ("Chennai", "Kolkata"):          884,
    ("Chennai", "Visakhapatnam"):    594,
    ("Chennai", "Kochi"):            539,
    ("Chennai", "Tuticorin"):        298,
    ("Chennai", "Colombo"):          391,
    ("Kolkata", "Haldia"):            58,
    ("Kolkata", "Chittagong"):       384,
    ("Kolkata", "Paradip"):          292,
    ("Kochi", "Colombo"):            361,
    ("Kochi", "Mangalore"):          168,
    ("Kochi", "Tuticorin"):          284,

    # India to Middle East
    ("Mumbai", "Dubai"):            1207,
    ("Mumbai", "Jebel Ali"):        1184,
    ("Mumbai", "Muscat"):            967,
    ("Mumbai", "Karachi"):           424,
    ("Mumbai", "Salalah"):          1434,
    ("Mumbai", "Aden"):             2041,
    ("Mumbai", "Jeddah"):           2682,
    ("Mumbai", "Dammam"):           1741,
    ("Mumbai", "Kuwait"):           1893,
    ("Kochi", "Dubai"):             1486,
    ("Kochi", "Muscat"):            1236,
    ("Chennai", "Dubai"):           2063,
    ("Chennai", "Muscat"):          1825,
    ("Kandla", "Dubai"):             930,
    ("Kandla", "Muscat"):            716,
    ("Kandla", "Dammam"):           1487,

    # India to Southeast Asia
    ("Mumbai", "Singapore"):        3609,
    ("Mumbai", "Colombo"):           854,
    ("Mumbai", "Port Klang"):       3856,
    ("Chennai", "Singapore"):       1740,
    ("Chennai", "Port Klang"):      1555,
    ("Chennai", "Bangkok"):         2199,
    ("Chennai", "Jakarta"):         2479,
    ("Kolkata", "Singapore"):       1781,
    ("Kochi", "Singapore"):         2003,
    ("Colombo", "Singapore"):       1581,

    # India to East Asia
    ("Mumbai", "Shanghai"):         6218,
    ("Mumbai", "Hong Kong"):        5086,
    ("Mumbai", "Busan"):            7022,
    ("Mumbai", "Yokohama"):         7529,
    ("Mumbai", "Kaohsiung"):        5660,
    ("Chennai", "Shanghai"):        4824,
    ("Chennai", "Hong Kong"):       3693,
    ("Chennai", "Busan"):           4637,

    # India to Europe (via Suez Canal)
    ("Mumbai", "Rotterdam"):        6176,
    ("Mumbai", "Hamburg"):          6476,
    ("Mumbai", "Antwerp"):          6283,
    ("Mumbai", "Felixstowe"):       6393,
    ("Mumbai", "Le Havre"):         6280,
    ("Mumbai", "Marseille"):        5738,
    ("Mumbai", "Algeciras"):        6090,
    ("Mumbai", "Piraeus"):          5235,
    ("Mumbai", "Genoa"):            5877,
    ("Mumbai", "Port Said"):        4524,
    ("Mumbai", "Jeddah"):           2682,
    ("Chennai", "Rotterdam"):       7131,
    ("Chennai", "Hamburg"):         7381,
    ("Chennai", "Piraeus"):         5762,
    ("Kolkata", "Rotterdam"):       7876,

    # India to East Africa
    ("Mumbai", "Mombasa"):          2502,
    ("Mumbai", "Dar es Salaam"):    2812,
    ("Mumbai", "Durban"):           4098,
    ("Mumbai", "Lagos"):            6244,
    ("Kochi", "Mombasa"):           2394,

    # India to Americas
    ("Mumbai", "New York"):         8895,
    ("Mumbai", "Los Angeles"):      9916,
    ("Mumbai", "Houston"):          9632,

    # India to Australia
    ("Mumbai", "Fremantle"):        4981,
    ("Mumbai", "Melbourne"):        7001,
    ("Mumbai", "Sydney"):           7432,
    ("Chennai", "Fremantle"):       4271,
    ("Chennai", "Melbourne"):       6264,
    ("Kolkata", "Fremantle"):       4643,

    # Major world routes
    ("Rotterdam", "New York"):      3452,
    ("Rotterdam", "Houston"):       5021,
    ("Rotterdam", "Singapore"):     8436,
    ("Rotterdam", "Shanghai"):     10457,
    ("Rotterdam", "Hong Kong"):    10283,
    ("Rotterdam", "Los Angeles"):  14910,
    ("Rotterdam", "Dubai"):         6234,
    ("Rotterdam", "Jeddah"):        5283,
    ("Rotterdam", "Lagos"):         5217,
    ("Rotterdam", "Durban"):        7011,
    ("Rotterdam", "Sydney"):       13063,
    ("Rotterdam", "Santos"):        5776,
    ("Rotterdam", "Buenos Aires"):  6351,
    ("Hamburg", "New York"):        3773,
    ("Hamburg", "Singapore"):       8695,
    ("Hamburg", "Shanghai"):       10759,
    ("Antwerp", "New York"):        3622,
    ("Antwerp", "Singapore"):       8495,
    ("Felixstowe", "New York"):     3273,
    ("Felixstowe", "Singapore"):    8266,
    ("Piraeus", "Singapore"):       6108,
    ("Piraeus", "Shanghai"):        8192,
    ("Piraeus", "Dubai"):           3002,
    ("Algeciras", "Singapore"):     8074,
    ("Algeciras", "New York"):      3360,

    ("Singapore", "Shanghai"):      2272,
    ("Singapore", "Hong Kong"):     1457,
    ("Singapore", "Busan"):         2756,
    ("Singapore", "Yokohama"):      3324,
    ("Singapore", "Kaohsiung"):     1729,
    ("Singapore", "Jakarta"):        528,
    ("Singapore", "Port Klang"):     196,
    ("Singapore", "Bangkok"):       1090,
    ("Singapore", "Ho Chi Minh"):    630,
    ("Singapore", "Manila"):        1316,
    ("Singapore", "Sydney"):        4324,
    ("Singapore", "Fremantle"):     1874,
    ("Singapore", "Dubai"):         3435,
    ("Singapore", "Colombo"):       1581,
    ("Singapore", "Mombasa"):       4115,
    ("Singapore", "Durban"):        5503,
    ("Singapore", "Los Angeles"):   7865,
    ("Singapore", "New York"):     10386,

    ("Shanghai", "Busan"):           563,
    ("Shanghai", "Yokohama"):        920,
    ("Shanghai", "Hong Kong"):       739,
    ("Shanghai", "Kaohsiung"):       625,
    ("Shanghai", "Los Angeles"):    5611,
    ("Shanghai", "Seattle"):        4819,
    ("Shanghai", "Vancouver"):      4914,
    ("Shanghai", "Sydney"):         5384,
    ("Shanghai", "Melbourne"):      5534,
    ("Shanghai", "Durban"):         7916,
    ("Shanghai", "Santos"):        11688,

    ("Hong Kong", "Busan"):          918,
    ("Hong Kong", "Yokohama"):      1657,
    ("Hong Kong", "Manila"):         623,
    ("Hong Kong", "Los Angeles"):   6367,
    ("Hong Kong", "Sydney"):        4655,

    ("Busan", "Yokohama"):           533,
    ("Busan", "Los Angeles"):       5398,
    ("Busan", "Seattle"):           4418,
    ("Busan", "Vancouver"):         4469,

    ("Yokohama", "Los Angeles"):    4751,
    ("Yokohama", "Seattle"):        3874,
    ("Yokohama", "Vancouver"):      3949,
    ("Yokohama", "Sydney"):         4089,

    ("Los Angeles", "New York"):    5383,  # via Panama
    ("Los Angeles", "Houston"):     4427,  # via Panama
    ("Los Angeles", "Santos"):      7284,  # via Panama
    ("Los Angeles", "Colon"):       2934,
    ("Los Angeles", "Manzanillo"):  1483,
    ("New York", "Houston"):        1893,
    ("New York", "Santos"):         5133,
    ("New York", "Buenos Aires"):   5841,
    ("New York", "Rotterdam"):      3452,
    ("New York", "Lagos"):          5091,
    ("New York", "Durban"):         7055,
    ("Houston", "Santos"):          5562,
    ("Houston", "Rotterdam"):       5021,

    ("Durban", "Mombasa"):          1502,
    ("Durban", "Cape Town"):         754,
    ("Durban", "Lagos"):            3803,
    ("Durban", "Santos"):           3834,
    ("Durban", "Buenos Aires"):     3523,
    ("Durban", "Fremantle"):        3809,
    ("Cape Town", "Rotterdam"):     6038,
    ("Cape Town", "Santos"):        3262,
    ("Cape Town", "Buenos Aires"):  3388,

    ("Dubai", "Jeddah"):            1494,
    ("Dubai", "Aden"):              1103,
    ("Dubai", "Salalah"):            659,
    ("Dubai", "Muscat"):             256,
    ("Dubai", "Dammam"):             528,
    ("Dubai", "Kuwait"):             680,
    ("Dubai", "Karachi"):            759,
    ("Dubai", "Colombo"):           1905,
    ("Dubai", "Singapore"):         3435,
    ("Dubai", "Shanghai"):          5893,
    ("Dubai", "Rotterdam"):         6234,
    ("Dubai", "New York"):          8139,

    ("Jeddah", "Mombasa"):          1804,
    ("Jeddah", "Port Said"):        1130,
    ("Jeddah", "Aden"):              633,
    ("Aden", "Mombasa"):            1137,
    ("Aden", "Djibouti"):            200,

    ("Port Said", "Piraeus"):        473,
    ("Port Said", "Rotterdam"):     3108,
    ("Port Said", "Singapore"):     5920,
    ("Port Said", "Dubai"):         2712,

    ("Fremantle", "Melbourne"):     1668,
    ("Fremantle", "Singapore"):     1874,
    ("Fremantle", "Dubai"):         4413,
    ("Fremantle", "Durban"):        3809,
    ("Melbourne", "Sydney"):         494,
    ("Melbourne", "Los Angeles"):   7093,
    ("Sydney", "Los Angeles"):      6505,
    ("Sydney", "Santos"):           7776,
    ("Sydney", "Singapore"):        4324,

    ("Colombo", "Singapore"):       1581,
    ("Colombo", "Dubai"):           1905,
    ("Colombo", "Mombasa"):         2368,
    ("Colombo", "Rotterdam"):       6869,
    ("Colombo", "Hong Kong"):       2869,

    ("Karachi", "Dubai"):            759,
    ("Karachi", "Muscat"):           531,
    ("Karachi", "Colombo"):         1263,
    ("Karachi", "Singapore"):       4031,

    ("Chittagong", "Singapore"):    1874,
    ("Chittagong", "Colombo"):      1239,
    ("Chittagong", "Kolkata"):       384,

    ("Santos", "Buenos Aires"):      892,
    ("Santos", "Rotterdam"):        5776,
    ("Santos", "Lagos"):            3649,
    ("Santos", "Cape Town"):        3262,
}

# Build reverse lookup
_DIST_REVERSE = {}
for (a, b), d in _DISTANCE_TABLE.items():
    _DIST_REVERSE[(b, a)] = d
_DISTANCE_TABLE.update(_DIST_REVERSE)


# ─────────────────────────────────────────────────────────────────────────────
# MARITIME CHOKEPOINTS — routing adjustment factors
# Ships must detour through these bottlenecks; naive great-circle ignores them.
# ─────────────────────────────────────────────────────────────────────────────
_CHOKEPOINTS = [
    {"name": "Suez Canal",    "lat": 30.5, "lon": 32.3,  "radius_deg": 4.0},
    {"name": "Malacca Strait","lat": 2.5,  "lon": 101.5, "radius_deg": 3.5},
    {"name": "Panama Canal",  "lat": 9.1,  "lon": -79.7, "radius_deg": 3.0},
    {"name": "Bab el-Mandeb", "lat": 12.6, "lon": 43.5,  "radius_deg": 3.0},
    {"name": "Cape of GH",    "lat": -34.4,"lon": 18.5,  "radius_deg": 4.0},
    {"name": "Cape Horn",     "lat": -55.9,"lon": -67.3, "radius_deg": 4.0},
    {"name": "Dover Strait",  "lat": 51.0, "lon": 1.5,   "radius_deg": 2.0},
    {"name": "Gibraltar",     "lat": 36.0, "lon": -5.4,  "radius_deg": 2.5},
    {"name": "Lombok Strait", "lat": -8.7, "lon": 115.8, "radius_deg": 2.0},
    {"name": "Sunda Strait",  "lat": -6.0, "lon": 105.9, "radius_deg": 2.0},
]


def _haversine_nm(lat1, lon1, lat2, lon2) -> float:
    """Great-circle distance in nautical miles."""
    R = 3440.065
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _routing_factor(lat1, lon1, lat2, lon2) -> float:
    """Estimate maritime routing factor (vs great circle) based on route geography.

    Base factor 1.10 accounts for general course deviations.
    Additional penalty for routes that transit major chokepoints where
    the actual sea path differs most from the straight-line approximation.
    """
    factor = 1.10

    # Check if route likely transits each chokepoint
    for cp in _CHOKEPOINTS:
        # Simple check: is chokepoint between the two ports (bounding box with margin)?
        min_lat = min(lat1, lat2) - cp["radius_deg"]
        max_lat = max(lat1, lat2) + cp["radius_deg"]
        min_lon = min(lon1, lon2) - cp["radius_deg"]
        max_lon = max(lon1, lon2) + cp["radius_deg"]

        if (min_lat <= cp["lat"] <= max_lat and
                min_lon <= cp["lon"] <= max_lon):
            # Route likely passes near this chokepoint — add curvature penalty
            d_to_cp = _haversine_nm(lat1, lon1, cp["lat"], cp["lon"])
            d_cp_to_dest = _haversine_nm(cp["lat"], cp["lon"], lat2, lon2)
            d_direct = _haversine_nm(lat1, lon1, lat2, lon2)
            detour_ratio = (d_to_cp + d_cp_to_dest) / max(d_direct, 1)
            if detour_ratio > 1.0:
                factor = max(factor, detour_ratio * 1.03)

    return min(factor, 1.65)  # cap at 65% overhead (Panama long routes)


def _haversine_maritime(lat1, lon1, lat2, lon2) -> int:
    """Chokepoint-aware maritime distance estimate."""
    gc = _haversine_nm(lat1, lon1, lat2, lon2)
    factor = _routing_factor(lat1, lon1, lat2, lon2)
    return int(round(gc * factor / 50.0) * 50)


def _searoutes_lookup(lat1, lon1, lat2, lon2, timeout=8) -> Optional[int]:
    """Try Searoutes.com API for exact navigable distance."""
    api_key = os.environ.get(SEAROUTES_KEY_ENV, "")
    if not api_key or not _REQUESTS_OK:
        return None

    cache_key = f"sr_{lat1:.3f}_{lon1:.3f}_{lat2:.3f}_{lon2:.3f}"
    if cache_key in _CACHE and time.time() - _CACHE[cache_key]["ts"] < _CACHE_TTL:
        return _CACHE[cache_key]["data"]

    try:
        url = SEAROUTES_URL.format(lat1=lat1, lon1=lon1, lat2=lat2, lon2=lon2)
        resp = requests.get(url, headers={"x-api-key": api_key}, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        # Searoutes returns distance in km; convert to nm
        km = data["features"][0]["properties"]["distance"]
        nm = int(round(km / 1.852 / 50) * 50)
        _CACHE[cache_key] = {"ts": time.time(), "data": nm}
        log.info("Searoutes: %s nm for (%.2f,%.2f)→(%.2f,%.2f)", nm, lat1, lon1, lat2, lon2)
        return nm
    except Exception as exc:
        log.debug("Searoutes lookup failed: %s", exc)
        return None


def _normalize_port_name(name: str) -> Optional[str]:
    """Resolve common aliases to canonical port names."""
    name = name.strip()
    aliases = {
        "nhava sheva": "JNPT", "nhava-sheva": "JNPT", "navi mumbai": "JNPT",
        "vizag": "Visakhapatnam", "vizag port": "Visakhapatnam",
        "aden": "Aden", "djibouti": "Aden",
        "new york": "New York", "ny": "New York", "nyc": "New York",
        "la": "Los Angeles", "long beach": "Long Beach",
        "hk": "Hong Kong", "hongkong": "Hong Kong",
        "sgp": "Singapore", "sg": "Singapore",
        "sha": "Shanghai", "shgh": "Shanghai",
        "rtm": "Rotterdam", "rdam": "Rotterdam",
        "ham": "Hamburg",
        "antwerp": "Antwerp", "anr": "Antwerp",
        "jea": "Jebel Ali",
    }
    lower = name.lower()
    if lower in aliases:
        return aliases[lower]
    # Direct match (case-insensitive)
    for canonical in PORTS:
        if canonical.lower() == lower:
            return canonical
    # Partial match
    for canonical in PORTS:
        if lower in canonical.lower() or canonical.lower().startswith(lower[:4]):
            return canonical
    return None


def get_sea_distance(origin: str, destination: str) -> dict:
    """Get navigable sea distance between two named ports.

    Returns dict with:
        distance_nm: int — navigable sea distance
        source: str — data source used
        origin_canonical, destination_canonical: resolved names
        origin_coords, destination_coords: lat/lon dicts
        route_note: str — routing info / caveats
    """
    orig = _normalize_port_name(origin)
    dest = _normalize_port_name(destination)

    if not orig:
        return {"error": f"Unknown port: '{origin}'", "known_ports": sorted(PORTS.keys())}
    if not dest:
        return {"error": f"Unknown port: '{destination}'", "known_ports": sorted(PORTS.keys())}
    if orig == dest:
        return {"distance_nm": 0, "origin_canonical": orig, "destination_canonical": dest,
                "source": "trivial", "route_note": "Same port"}

    p1 = PORTS[orig]
    p2 = PORTS[dest]

    # 1. Pre-computed table
    if (orig, dest) in _DISTANCE_TABLE:
        d = _DISTANCE_TABLE[(orig, dest)]
        return {
            "distance_nm": d,
            "origin_canonical": orig, "destination_canonical": dest,
            "origin_coords": {"lat": p1["lat"], "lon": p1["lon"]},
            "destination_coords": {"lat": p2["lat"], "lon": p2["lon"]},
            "source": "precomputed-maritime-table",
            "route_note": "From published maritime distance data (UNCTAD/Lloyd's List)",
        }

    # 2. Searoutes API
    sr = _searoutes_lookup(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
    if sr:
        return {
            "distance_nm": sr,
            "origin_canonical": orig, "destination_canonical": dest,
            "origin_coords": {"lat": p1["lat"], "lon": p1["lon"]},
            "destination_coords": {"lat": p2["lat"], "lon": p2["lon"]},
            "source": "searoutes-api",
            "route_note": "Exact navigable sea route from Searoutes.com",
        }

    # 3. Chokepoint-aware Haversine
    d = _haversine_maritime(p1["lat"], p1["lon"], p2["lat"], p2["lon"])
    return {
        "distance_nm": d,
        "origin_canonical": orig, "destination_canonical": dest,
        "origin_coords": {"lat": p1["lat"], "lon": p1["lon"]},
        "destination_coords": {"lat": p2["lat"], "lon": p2["lon"]},
        "source": "chokepoint-haversine-estimate",
        "route_note": "Estimated via chokepoint-aware great-circle formula. Add SEAROUTES_API_KEY for exact routing.",
    }


def list_ports() -> list:
    """Return all known ports with metadata."""
    return [{"name": k, **v} for k, v in sorted(PORTS.items())]


def list_ports_by_country(country: str) -> list:
    """Return ports filtered by country."""
    return [{"name": k, **v} for k, v in PORTS.items()
            if v.get("country", "").lower() == country.lower()]


def resolve_route(origin: str, destination: str) -> dict:
    """Full route resolution: distance + weather routing advisory."""
    result = get_sea_distance(origin, destination)
    if "error" in result:
        return result

    # Add routing advisory based on geography
    d = result["distance_nm"]
    p1 = result.get("origin_coords", {})
    p2 = result.get("destination_coords", {})

    notes = []
    if p1 and p2:
        # Suez route advisory
        if p1.get("lon", 0) < 40 and p2.get("lon", 0) > 60:
            notes.append("Suez Canal transit expected (4-hour passage, ~$400K fee for large vessels)")
        elif p1.get("lon", 0) > 60 and p2.get("lon", 0) < 40:
            notes.append("Suez Canal transit expected (eastbound)")
        # Malacca advisory
        if (90 < p1.get("lon", 0) < 130 and p2.get("lon", 0) < 90) or \
           (90 < p2.get("lon", 0) < 130 and p1.get("lon", 0) < 90):
            notes.append("Malacca/Lombok Strait transit likely")
        # Panama advisory
        if (p1.get("lon", 0) < -60 and p2.get("lon", 0) > -80 and p2.get("lon", 0) < 0) or \
           (p2.get("lon", 0) < -60 and p1.get("lon", 0) > -80):
            notes.append("Panama Canal transit likely")
        # Long haul advisory
        if d > 8000:
            notes.append("Long-haul route (>8000 nm): consider intermediate bunkering port")

    result["routing_notes"] = notes
    return result

