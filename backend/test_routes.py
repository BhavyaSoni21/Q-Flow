from data.live.maritime_routes import get_sea_distance, resolve_route

tests = [
    ("Mumbai", "Rotterdam"),
    ("Mumbai", "Singapore"),
    ("Mumbai", "Dubai"),
    ("Chennai", "Hong Kong"),
    ("Kolkata", "Fremantle"),
    ("Mumbai", "New York"),
    ("Shanghai", "Los Angeles"),
    ("Singapore", "Rotterdam"),
    ("vizag", "Rotterdam"),      # alias test
    ("nhava sheva", "Singapore"),  # alias test
]

print("Maritime Distance Tests:")
print("-" * 70)
for o, d in tests:
    r = get_sea_distance(o, d)
    if "error" in r:
        print(f"  {o} -> {d}: ERROR: {r['error']}")
    else:
        print(f"  {r['origin_canonical']} -> {r['destination_canonical']}: {r['distance_nm']} nm  [{r['source']}]")

print()
print("Routing Advisory Test (Mumbai -> Rotterdam):")
route = resolve_route("Mumbai", "Rotterdam")
print("  Distance:", route["distance_nm"], "nm")
print("  Notes:", route.get("routing_notes", []))

