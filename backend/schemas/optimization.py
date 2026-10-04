"""Request schema for the optimization API (master doc §10)."""
from typing import List, Optional

from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    route_distance_nm: float = Field(600.0, gt=0)
    # Port-pair origin/destination — optional; used for provenance and corridor
    # route labeling. The distance field is always authoritative for the engine.
    origin_port: Optional[str] = None
    destination_port: Optional[str] = None
    cargo_demand_tonnes: float = Field(90000.0, gt=0)
    deadline_hours: float = Field(72.0, gt=0)
    vessel_ids: Optional[List[str]] = None
    allowed_fuels: Optional[List[str]] = None
    shore_power: bool = True
    weather: str = "normal"
    carbon_price_usd_per_t: float = 0.0
    ghg_cap_tonnes_co2e: Optional[float] = None
    algorithm: str = "auto"                 # auto | MO-QPSO | NSGA-II | MOPSO
    seed: int = 42
    iterations: int = Field(100, ge=1, le=500)
    population_size: int = Field(100, ge=4, le=400)
