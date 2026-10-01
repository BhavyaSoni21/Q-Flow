"""Request schemas for the prediction API (master doc §10)."""
from typing import Optional

from pydantic import BaseModel, Field


class PredictFuelRequest(BaseModel):
    vessel_id: Optional[str] = None          # defaults to first vessel in the pool
    speed_knots: float = Field(..., gt=0)
    cargo_tonnes: float = Field(0.0, ge=0)
    distance_nm: float = Field(..., gt=0)
    weather_scenario: str = "normal"         # normal | adverse | severe
    fuel_id: str = "reference"
