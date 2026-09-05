import os
import logging
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .model import pricing_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pricing_api")

app = FastAPI(
    title="KalaSetu Dynamic Pricing Microservice",
    description="ML-powered handicraft pricing engine with deterministic cost-plus fallback",
    version="1.0.0",
)

cors_origins_env = os.getenv("CORS_ORIGIN", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()] if cors_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PricePredictionRequest(BaseModel):
    category: str = Field(..., description="Craft category e.g. handloom, pottery, woodcraft")
    materials: Optional[List[str]] = Field(default_factory=list, description="List of materials used")
    rawMaterialCost: float = Field(0.0, ge=0.0, description="Cost of raw materials entered by artisan")
    imageTags: Optional[List[str]] = Field(default_factory=list, description="Detected visual or tag labels")


class PriceRange(BaseModel):
    minPrice: float
    maxPrice: float


class PriceBreakdown(BaseModel):
    rawMaterialCost: float
    suggestedMargin: float
    labourEstimate: float
    marketBenchmark: float


class PricePredictionResponse(BaseModel):
    suggestedPrice: float
    priceRange: PriceRange
    breakdown: PriceBreakdown
    modelVersion: str


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "pricing-microservice",
        "modelLoaded": pricing_model.model is not None,
    }


@app.post("/predict-price", response_model=PricePredictionResponse)
def predict_price(payload: PricePredictionRequest):
    logger.info("Received price prediction request for category: %s, cost: %s", payload.category, payload.rawMaterialCost)
    result = pricing_model.predict_price(
        category=payload.category,
        materials=payload.materials or [],
        raw_material_cost=payload.rawMaterialCost,
        image_tags=payload.imageTags or [],
    )
    return result
