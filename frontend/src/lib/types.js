// Shared domain types (JSDoc-style; runtime is plain JS on this platform).

/**
 * @typedef {Object} Vessel
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} capacity  // tonnes
 * @property {number} minSpeed  // kn
 * @property {number} maxSpeed  // kn
 * @property {string[]} allowedFuels
 * @property {boolean} shorePower
 * @property {boolean} available
 */

/**
 * @typedef {Object} FuelPathway
 * @property {string} id
 * @property {string} name
 * @property {string} pathway
 * @property {number} price      // USD / t
 * @property {number} lhv        // MJ / kg
 * @property {number} wtt        // gCO2e / MJ
 * @property {number} ttw        // gCO2e / MJ
 * @property {number} wtw        // gCO2e / MJ
 * @property {string} source
 * @property {string} version
 */

/**
 * @typedef {Object} DeploymentRow
 * @property {string} vesselId
 * @property {number} speed
 * @property {string} fuelId
 * @property {boolean} shorePower
 * @property {number} cargo
 * @property {number} sailingTime
 * @property {number} fuel
 * @property {number} fuelError
 * @property {number} cost
 * @property {number} wtw
 * @property {boolean} feasible
 */

/**
 * @typedef {Object} ParetoPoint
 * @property {number} fuel
 * @property {number} cost
 * @property {number} wtw
 * @property {string} fuelId
 * @property {DeploymentRow[]} deployment
 * @property {boolean} feasible
 * @property {string} tag
 */

export const WEATHER_SCENARIOS = ["Normal", "Adverse", "Severe"];
export const ALGORITHMS = ["QPSO", "NSGA-II", "Classical PSO"];

export const PORTS = [
    "Rotterdam", "New York", "Singapore",
    "Shanghai", "Los Angeles", "Dubai",
    "Mumbai", "Hong Kong", "Hamburg",
    "Port 1", "Port 2"
];

// Port Coordinates (approx lat/lon for nautical distance calculation)
export const PORT_COORDINATES = {
    "Rotterdam": { lat: 51.9244, lon: 4.4777 },
    "New York": { lat: 40.7128, lon: -74.0060 },
    "Singapore": { lat: 1.3521, lon: 103.8198 },
    "Shanghai": { lat: 31.2304, lon: 121.4737 },
    "Los Angeles": { lat: 33.7432, lon: -118.2673 },
    "Dubai": { lat: 25.2048, lon: 55.2708 },
    "Mumbai": { lat: 18.9438, lon: 72.8389 },
    "Hong Kong": { lat: 22.3193, lon: 114.1694 },
    "Hamburg": { lat: 53.5511, lon: 9.9937 },
    "Port 1": { lat: 51.9244, lon: 4.4777 },
    "Port 2": { lat: 40.7128, lon: -74.0060 },
};

// Route presets with realistic maritime shipping distances in nautical miles (nm).
export const ROUTES = [
    { origin: "Rotterdam", destination: "New York", refDistance: 3300 },
    { origin: "Singapore", destination: "Rotterdam", refDistance: 8400 },
    { origin: "Shanghai", destination: "Los Angeles", refDistance: 5800 },
    { origin: "Dubai", destination: "Mumbai", refDistance: 1100 },
    { origin: "Hong Kong", destination: "Hamburg", refDistance: 9500 },
    { origin: "Mumbai", destination: "Rotterdam", refDistance: 6200 },
    { origin: "Singapore", destination: "Shanghai", refDistance: 2250 },
    { origin: "Hong Kong", destination: "Singapore", refDistance: 1450 },
    { origin: "Hamburg", destination: "New York", refDistance: 3600 },
    { origin: "Dubai", destination: "Singapore", refDistance: 3400 },
    { origin: "Mumbai", destination: "Dubai", refDistance: 1100 },
    { origin: "Shanghai", destination: "Rotterdam", refDistance: 10500 },
    { origin: "Port 1", destination: "Port 2", refDistance: 3300 },
];

export function getRouteDistance(origin, destination) {
    if (!origin || !destination || origin === destination) return 500;
    const route = ROUTES.find(r => (r.origin === origin && r.destination === destination) ||
                                  (r.origin === destination && r.destination === origin));
    if (route) return route.refDistance;
    
    // Haversine approximation with maritime routing factor (1.3x great circle)
    const p1 = PORT_COORDINATES[origin];
    const p2 = PORT_COORDINATES[destination];
    if (p1 && p2) {
        const R = 3440.065; // Earth radius in nautical miles
        const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
        const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 1.35 / 50) * 50; // rounded to nearest 50 nm
    }
    return 2500;
}

export function calculateFeasibleDeadline(distance, portTime = 12, bufferTime = 6, designSpeed = 15) {
    // Normal cruising speed (14-16 knots), allowing optimal QPSO exploration
    const sailingHours = distance / designSpeed;
    return Math.max(24, Math.round(sailingHours + portTime + bufferTime + 12));
}