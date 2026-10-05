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

// All major world ports — powered by backend maritime_routes.py (NGIA World Port Index + UNCTAD data)
// Distance is now fetched live from /api/live/routes/distance (real navigable sea distances)
export const PORTS = [
    // India (primary)
    "Mumbai", "JNPT", "Chennai", "Kolkata", "Kochi", "Visakhapatnam",
    "Kandla", "Paradip", "Haldia", "Tuticorin", "Mangalore", "Mormugao",
    // South Asia
    "Colombo", "Karachi", "Chittagong", "Yangon",
    // Middle East / Gulf
    "Dubai", "Jebel Ali", "Abu Dhabi", "Muscat", "Salalah",
    "Dammam", "Jubail", "Jeddah", "Aden", "Kuwait",
    // Southeast Asia
    "Singapore", "Port Klang", "Penang", "Jakarta", "Surabaya",
    "Bangkok", "Ho Chi Minh", "Manila",
    // East Asia
    "Shanghai", "Ningbo", "Shenzhen", "Guangzhou", "Tianjin", "Qingdao",
    "Hong Kong", "Kaohsiung", "Busan", "Incheon", "Yokohama", "Tokyo", "Kobe", "Osaka",
    // Europe
    "Rotterdam", "Hamburg", "Antwerp", "Felixstowe", "Southampton",
    "Le Havre", "Marseille", "Barcelona", "Valencia", "Algeciras",
    "Piraeus", "Genoa", "Gioia Tauro",
    // Americas
    "New York", "Los Angeles", "Long Beach", "Houston", "Savannah",
    "Seattle", "Vancouver", "Santos", "Buenos Aires", "Colon", "Manzanillo",
    // Africa
    "Durban", "Cape Town", "Lagos", "Mombasa", "Dar es Salaam",
    "Port Said", "Alexandria",
    // Australia / Oceania
    "Sydney", "Melbourne", "Fremantle", "Brisbane",
];

export function calculateFeasibleDeadline(distance, portTime = 12, bufferTime = 6, designSpeed = 15) {
    // Normal cruising speed (14-16 knots), allowing optimal QPSO exploration
    const sailingHours = distance / designSpeed;
    return Math.max(24, Math.round(sailingHours + portTime + bufferTime + 12));
}
