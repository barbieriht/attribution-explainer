"""Reference values for the JS math, computed by the thesis code itself.

    python scripts/make_fixture.py /path/to/FWI > tests/fixtures/attribution.json

Needs the thesis environment (`fwi_common` importable from the FWI repository). The JS
tests (tests/attribution.test.js) compare against this file, so
the browser computes exactly what the paper's exact grid computes.
"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(sys.argv[1]) / "implementations"))
from fwi_common.diagnostics.dependence import FUNCTIONALS, attribute_cells, posterior_cells  # noqa: E402
from fwi_common.testbeds.linear_gaussian import CoupledLinearOperator, SharedLatentFields, spectral_modes  # noqa: E402

SETTINGS = [  # shared fraction, kappa, noise variance, stride -- spread across the paper's grid
    (0.5, 0.5, 0.1, 4), (1.0, 0.75, 0.01, 2), (0.25, 0.0, 1.0, 8), (0.0, 0.9, 0.001, 2), (0.75, 0.95, 0.1, 8),
]
NAMES = {"mean_signed_pointwise_correlation": "signed", "mean_abs_pointwise_correlation": "unsigned",
         "mutual_information": "mi"}
CELL = {frozenset(): "none", frozenset({"O"}): "O", frozenset({"P"}): "P", frozenset({"O", "P"}): "OP"}


def main() -> None:
    out = {"settings": [], "modes": {}}
    phi = spectral_modes((16, 16), 3.0, 8)
    out["modes"] = {"ell": 3.0, "first_column": phi[:, 0].tolist(), "eighth_column": phi[:, 7].tolist()}
    for s, kappa, noise, stride in SETTINGS:
        fields = SharedLatentFields(shape=(16, 16), latent_dim=8, shared_fraction=s, correlation_lengths=(3.0, 4.0),
                                    scatter=0.1)
        op = CoupledLinearOperator.build((16, 16), n_fields=2, kappa=kappa, stride=stride, blur_sigma=1.0,
                                         rng=np.random.default_rng(0))
        prior = fields.joint_covariance()
        cells = posterior_cells(prior, op, noise * np.eye(op.matrix().shape[0]))
        entry = {"shared": s, "kappa": kappa, "noise": noise, "stride": stride,
                 "prior_spot": [prior[0, 0], prior[0, 256], prior[17, 300], prior[255, 511]],
                 "cells": {}, "shares": {}}
        for name, short in NAMES.items():
            result = attribute_cells(cells, FUNCTIONALS[name], 0, 1, 2)
            entry["shares"][short] = {"O": result.shares["O"], "P": result.shares["P"]}
            for key, value in result.cells.items():
                entry["cells"].setdefault(CELL[key], {})[short] = value
        out["settings"].append(entry)
    json.dump(out, sys.stdout, indent=1)


if __name__ == "__main__":
    main()
