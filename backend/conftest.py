"""Pytest bootstrap: make the ported engine importable as `fleet_engine`.

Phase 0 keeps the handoff engine and its tests UNCHANGED (the test does
`import fleet_engine as fe`). Phase 1 will split the engine into the
`emissions/` + `optimization/` modules per master doc §11 and switch to
package imports; until then we put the engine dir on sys.path here.
"""
import os
import sys

_HERE = os.path.dirname(__file__)
sys.path.insert(0, _HERE)                              # backend/  -> `emissions`, package imports
sys.path.insert(0, os.path.join(_HERE, "optimization"))  # -> `import fleet_engine`

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_engine_predictor():
    """Keep tests isolated: importing the API installs a calibrated predictor into the
    engine's module global; reset to the default physics predictor before each test."""
    try:
        import fleet_engine as fe
        fe.set_predictor(fe.physics_predictor)
    except Exception:
        pass
    yield
