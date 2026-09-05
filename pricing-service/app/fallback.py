"""
Fallback pricing module implementing the deterministic rule-based cost-plus formula:
suggested_price = (raw_material_cost * category_markup) + labour_estimate
"""

CATEGORY_MARKUPS = {
    "handloom": 1.8,
    "pottery": 2.2,
    "woodcraft": 2.0,
    "metalcraft": 1.9,
    "jewelry": 2.4,
    "painting": 2.5,
    "leather": 1.8,
    "bamboo": 2.1,
}
DEFAULT_MARKUP = 2.0

CATEGORY_BASE_LABOUR = {
    "handloom": 700.0,
    "pottery": 400.0,
    "woodcraft": 600.0,
    "metalcraft": 800.0,
    "jewelry": 900.0,
    "painting": 750.0,
    "leather": 500.0,
    "bamboo": 350.0,
}
DEFAULT_BASE_LABOUR = 500.0


def calculate_rule_based_price(
    category: str,
    materials: list[str] = None,
    raw_material_cost: float = 0.0,
    image_tags: list[str] = None,
) -> dict:
    """
    Computes a deterministic cost-plus pricing recommendation and plain-language breakdown.
    """
    materials = materials or []
    image_tags = image_tags or []
    cat_key = (category or "").lower().strip()

    markup = CATEGORY_MARKUPS.get(cat_key, DEFAULT_MARKUP)
    base_labour = CATEGORY_BASE_LABOUR.get(cat_key, DEFAULT_BASE_LABOUR)

    # Complexity factor based on material variety and tags
    complexity_multiplier = 1.0 + min(len(materials), 4) * 0.05
    tag_keywords = {"intricate", "fine", "carved", "silk", "silver", "gold", "brass", "embroidery", "handcrafted"}
    matching_tags = sum(1 for tag in image_tags if any(kw in tag.lower() for kw in tag_keywords))
    complexity_multiplier += min(matching_tags * 0.05, 0.25)

    labour_estimate = round(base_labour * complexity_multiplier)
    suggested_margin = round(raw_material_cost * (markup - 1.0))
    suggested_price = round(raw_material_cost + suggested_margin + labour_estimate)

    # Calculate reasonable confidence interval bounds
    min_price = round(suggested_price * 0.9)
    max_price = round(suggested_price * 1.15)
    market_benchmark = round(suggested_price * 1.05)

    return {
        "suggestedPrice": suggested_price,
        "priceRange": {
            "minPrice": min_price,
            "maxPrice": max_price,
        },
        "breakdown": {
            "rawMaterialCost": round(raw_material_cost, 2),
            "suggestedMargin": suggested_margin,
            "labourEstimate": labour_estimate,
            "marketBenchmark": market_benchmark,
        },
        "modelVersion": "rule_based_fallback_v1",
    }
