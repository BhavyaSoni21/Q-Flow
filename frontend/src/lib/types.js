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
    "Port 1", "Port 2",
    "Rotterdam", "New York", "Singapore",
    "Shanghai", "Los Angeles", "Dubai",
    "Mumbai", "Hong Kong", "Hamburg"
];

// Route presets. refDistance is a stored reference in nm (null = generic, no check).
// Label and distance are derived from the same preset so they can never disagree.
export const ROUTES = [
    { origin: "Port 1", destination: "Port 2", refDistance: null },
    { origin: "Rotterdam", destination: "New York", refDistance: 3300 },
    { origin: "Singapore", destination: "Rotterdam", refDistance: 8400 },
    { origin: "Shanghai", destination: "Los Angeles", refDistance: 5800 },
    { origin: "Dubai", destination: "Mumbai", refDistance: 1100 },
    { origin: "Hong Kong", destination: "Hamburg", refDistance: 9500 },
];

export function getRouteDistance(origin, destination) {
    const route = ROUTES.find(r => r.origin === origin && r.destination === destination) || 
                  ROUTES.find(r => r.origin === destination && r.destination === origin);
    return route ? route.refDistance : null;
}