from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pandas as pd

from xgboost import XGBRegressor

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ============================================================
# CONFIG
# ============================================================

DATASET_PATH = "used_car_price_dataset_1500.csv"


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="AutoValue AI",
    description="Used Car Price Prediction API using XGBoost",
    version="1.0.0",
)


# ============================================================
# REQUEST MODEL
# ============================================================

class CarInput(BaseModel):

    brand: str

    model: str

    year: int = Field(
        ...,
        ge=1900,
        le=2030
    )

    km_driven: int = Field(
        ...,
        ge=0
    )

    fuel: str

    transmission: str

    owner: str

    location: str

    engine_cc: int = Field(
        ...,
        gt=0
    )

    mileage_kmpl: float = Field(
        ...,
        gt=0
    )


# ============================================================
# TRAIN MODEL
# ============================================================

def train_model():

    print("Dataset loading...")

    df = pd.read_csv(DATASET_PATH)

    print(
        f"Dataset loaded successfully! "
        f"Total records: {len(df)}"
    )


    # --------------------------------------------------------
    # Features and target
    # --------------------------------------------------------

    target = "price_lakh"

    X = df.drop(
        columns=[target]
    )

    y = df[target]


    # --------------------------------------------------------
    # Column types
    # --------------------------------------------------------

    categorical_columns = [
        "brand",
        "model",
        "fuel",
        "transmission",
        "owner",
        "location"
    ]


    numerical_columns = [
        "year",
        "km_driven",
        "engine_cc",
        "mileage_kmpl"
    ]


    # --------------------------------------------------------
    # Preprocessor
    # --------------------------------------------------------

    preprocessor = ColumnTransformer(

        transformers=[

            (
                "categorical",

                OneHotEncoder(
                    handle_unknown="ignore"
                ),

                categorical_columns
            ),

            (
                "numerical",

                "passthrough",

                numerical_columns
            )
        ]
    )


    # --------------------------------------------------------
    # XGBoost
    # --------------------------------------------------------

    model = XGBRegressor(

        n_estimators=500,

        max_depth=6,

        learning_rate=0.05,

        subsample=0.8,

        colsample_bytree=0.8,

        objective="reg:squarederror",

        random_state=42
    )


    # --------------------------------------------------------
    # Pipeline
    # --------------------------------------------------------

    pipeline = Pipeline(

        steps=[

            (
                "preprocessor",
                preprocessor
            ),

            (
                "model",
                model
            )
        ]
    )


    # --------------------------------------------------------
    # Train / Test
    # --------------------------------------------------------

    X_train, X_test, y_train, y_test = train_test_split(

        X,

        y,

        test_size=0.20,

        random_state=42
    )


    print(
        f"Training records: {len(X_train)}"
    )

    print(
        f"Testing records: {len(X_test)}"
    )


    # --------------------------------------------------------
    # Train
    # --------------------------------------------------------

    print("Training XGBoost model...")

    pipeline.fit(
        X_train,
        y_train
    )

    print("Training completed!")


    # --------------------------------------------------------
    # Evaluation
    # --------------------------------------------------------

    predictions = pipeline.predict(
        X_test
    )


    mae = mean_absolute_error(
        y_test,
        predictions
    )


    mse = mean_squared_error(
        y_test,
        predictions
    )


    rmse = mse ** 0.5


    r2 = r2_score(
        y_test,
        predictions
    )


    metrics = {

        "mae_lakh":
            round(float(mae), 4),

        "rmse_lakh":
            round(float(rmse), 4),

        "r2":
            round(float(r2), 4)
    }


    print()
    print("========================================")
    print("MODEL PERFORMANCE")
    print("========================================")

    print(
        f"MAE  : {metrics['mae_lakh']} lakh"
    )

    print(
        f"RMSE : {metrics['rmse_lakh']} lakh"
    )

    print(
        f"R²   : {metrics['r2']}"
    )


    # VERY IMPORTANT
    # Return both model and metrics

    return pipeline, metrics


# ============================================================
# TRAIN MODEL WHEN API STARTS
# ============================================================

try:

    pipeline, model_metrics = train_model()

    model_ready = True

except Exception as error:

    pipeline = None

    model_metrics = {}

    model_ready = False

    print(
        "Model training failed:",
        error
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "message":
            "AutoValue AI - Used Car Price Prediction API",

        "model_ready":
            model_ready,

        "docs":
            "/docs",

        "prediction_endpoint":
            "POST /predict"
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy"
            if model_ready
            else "model_not_ready",

        "model_metrics":
            model_metrics
    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict_car_price(
    car: CarInput
):

    # Make sure model exists

    if pipeline is None:

        raise HTTPException(

            status_code=500,

            detail="ML model is not available."
        )


    # --------------------------------------------------------
    # Convert request to DataFrame
    # --------------------------------------------------------

    car_data = pd.DataFrame(
        [
            {
                "brand": car.brand,

                "model": car.model,

                "year": car.year,

                "km_driven": car.km_driven,

                "fuel": car.fuel,

                "transmission": car.transmission,

                "owner": car.owner,

                "location": car.location,

                "engine_cc": car.engine_cc,

                "mileage_kmpl": car.mileage_kmpl
            }
        ]
    )


    # --------------------------------------------------------
    # Prediction
    # --------------------------------------------------------

    prediction = pipeline.predict(
        car_data
    )[0]


    # --------------------------------------------------------
    # Convert to price
    # --------------------------------------------------------

    price_lakh = float(
        prediction
    )


    price_rupees = (
        price_lakh * 100000
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "success": True,

        "car": car.model_dump(),

        "prediction": {

            "price_lakh":
                round(
                    price_lakh,
                    2
                ),

            "price_rupees":
                round(
                    price_rupees
                )
        },

        "model_metrics":
            model_metrics
    }