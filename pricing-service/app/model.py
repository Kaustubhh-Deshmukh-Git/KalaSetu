import os
import logging
from pathlib import Path
from .fallback import calculate_rule_based_price

logger = logging.getLogger("pricing_model")

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "seed_prices.csv"

CATEGORY_BASE_HOURS = {
    "handloom": 16.0,
    "pottery": 8.0,
    "woodcraft": 14.0,
    "metalcraft": 18.0,
    "jewelry": 15.0,
    "painting": 20.0,
    "leather": 12.0,
    "bamboo": 10.0,
}


class CraftPricingModel:
    def __init__(self):
        self.model = None
        self.categories = list(CATEGORY_BASE_HOURS.keys())
        self._initialize_model()

    def _initialize_model(self):
        try:
            import pandas as pd
            from sklearn.compose import ColumnTransformer
            from sklearn.preprocessing import OneHotEncoder, StandardScaler
            from sklearn.pipeline import Pipeline
            from sklearn.linear_model import Ridge

            if not DATA_PATH.exists():
                logger.warning("seed_prices.csv not found at %s. Using fallback.", DATA_PATH)
                return

            df = pd.read_csv(DATA_PATH)
            feature_cols = [
                "category",
                "material_count",
                "raw_material_cost",
                "labour_hours_est",
                "complexity_score",
            ]
            target_col = "market_benchmark_price"

            X = df[feature_cols]
            y = df[target_col]

            categorical_features = ["category"]
            numeric_features = [
                "material_count",
                "raw_material_cost",
                "labour_hours_est",
                "complexity_score",
            ]

            preprocessor = ColumnTransformer(
                transformers=[
                    (
                        "cat",
                        OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        categorical_features,
                    ),
                    ("num", StandardScaler(), numeric_features),
                ]
            )

            self.model = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("regressor", Ridge(alpha=1.0)),
                ]
            )

            self.model.fit(X, y)
            logger.info("Successfully trained craft pricing regression model on %d seed records.", len(df))
        except Exception as e:
            logger.warning("Could not train scikit-learn model (%s). Will use fallback.", str(e))
            self.model = None

    def predict_price(
        self,
        category: str,
        materials: list[str] = None,
        raw_material_cost: float = 0.0,
        image_tags: list[str] = None,
    ) -> dict:
        materials = materials or []
        image_tags = image_tags or []
        cat_key = (category or "").lower().strip()
        if cat_key not in CATEGORY_BASE_HOURS:
            cat_key = "handloom"

        if self.model is None:
            return calculate_rule_based_price(
                category=category,
                materials=materials,
                raw_material_cost=raw_material_cost,
                image_tags=image_tags,
            )

        try:
            import pandas as pd

            material_count = max(1, len(materials))
            base_hours = CATEGORY_BASE_HOURS.get(cat_key, 12.0)
            
            # Estimate complexity score (1.0 to 3.0)
            complexity_score = 1.0
            tag_keywords = {"intricate", "fine", "carved", "silk", "silver", "gold", "brass", "embroidery", "handcrafted"}
            matching_tags = sum(1 for tag in image_tags if any(kw in tag.lower() for kw in tag_keywords))
            complexity_score += min(material_count * 0.2 + matching_tags * 0.2, 1.8)
            complexity_score = min(3.0, max(1.0, round(complexity_score, 2)))

            labour_hours_est = round(base_hours * (complexity_score / 1.5), 1)

            input_df = pd.DataFrame(
                [
                    {
                        "category": cat_key,
                        "material_count": material_count,
                        "raw_material_cost": raw_material_cost,
                        "labour_hours_est": labour_hours_est,
                        "complexity_score": complexity_score,
                    }
                ]
            )

            predicted_market_price = float(self.model.predict(input_df)[0])
            # Ensure predicted market price is never lower than cost + fair minimum wage
            hourly_rate = 60.0  # Fair hourly handicraft wage benchmark
            labour_estimate = round(labour_hours_est * hourly_rate)
            suggested_price = max(
                round(predicted_market_price),
                round(raw_material_cost + labour_estimate + (raw_material_cost * 0.3)),
            )

            suggested_margin = max(0, round(suggested_price - raw_material_cost - labour_estimate))
            min_price = round(suggested_price * 0.9)
            max_price = round(suggested_price * 1.15)
            market_benchmark = round(predicted_market_price)

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
                "modelVersion": "fastapi_ml_v1",
            }
        except Exception as e:
            logger.error("ML prediction error: %s. Falling back to rule-based.", str(e))
            return calculate_rule_based_price(
                category=category,
                materials=materials,
                raw_material_cost=raw_material_cost,
                image_tags=image_tags,
            )


pricing_model = CraftPricingModel()
