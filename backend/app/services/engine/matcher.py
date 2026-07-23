from __future__ import annotations

from collections.abc import Mapping
from typing import Any


def normalize_features(features: Mapping[str, Any]) -> dict[str, Any]:
    normalized = dict(features)
    if "agreement" not in normalized:
        person = normalized.get("person")
        number = normalized.get("number")
        number_code = {"singular": "sg", "plural": "pl"}.get(number)
        if person in {1, 2, 3} and number_code:
            normalized["agreement"] = f"{person}{number_code}"
    return normalized


def _as_values(value: Any) -> set[Any]:
    if isinstance(value, (list, tuple, set, frozenset)):
        return set(value)
    return {value}


def values_match(required: Any, actual: Any) -> bool:
    """Compare scalar/list combinations by equality or non-empty intersection."""
    try:
        return bool(_as_values(required) & _as_values(actual))
    except TypeError:
        # Nested JSON values are not matcher primitives.
        return required == actual


def features_match(
    requirements: Mapping[str, Any],
    features: Mapping[str, Any],
) -> bool:
    """
    Match only properties represented on both sides.

    Candidate data is intentionally sparse. A missing property is therefore
    unknown, not a contradiction. Explicitly conflicting shared properties
    reject the candidate.
    """
    shared_keys = requirements.keys() & features.keys()
    return all(
        values_match(requirements[key], features[key])
        for key in shared_keys
    )


def candidates_are_compatible(
    previous_match: Mapping[str, Any],
    current_self: Mapping[str, Any],
) -> bool:
    return features_match(
        normalize_features(previous_match),
        normalize_features(current_self),
    )
