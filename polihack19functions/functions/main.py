# Polihack19 Sensor Data API - Swagger Compliant with FastAPI & Firebase
# Receives barometer/accelerometer/altitude data from mobile SDK
# Returns processed aggregations (max, min, mean, trend)

from datetime import datetime
from copy import deepcopy
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Request, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from pydantic import BaseModel, Field
from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, firestore
import firebase_admin
import openmeteo_requests

import pandas as pd
import requests_cache
from retry_requests import retry
# Geohash utility for decoding location from geohash
try:
    import geohash2
    HAS_GEOHASH2 = True
except ImportError:
    HAS_GEOHASH2 = False

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)
url = "https://api.open-meteo.com/v1/forecast"
import numpy as np

def calculate_trend_probability(humidity_series, pressure_series, timestamp_series, altitude_m):
    """
    Args:
        humidity_series: List of recent humidity %
        pressure_series: List of recent ambient pressure mb
        timestamp_series: List of unix timestamps (seconds)
        altitude_m: Constant altitude
    """
    # 1. Normalize all pressure readings to Sea Level first
    # This ensures altitude changes (if the sensor is moving) don't fake a pressure drop
    p_sl = [p * (1 - (0.0065 * altitude_m) / 288.15)**-5.255 for p in pressure_series]
    
    # 2. Calculate Pressure Slope (mb per hour) using Linear Regression
    # We convert timestamps to "hours from start" for a readable slope
    start_time = timestamp_series[0]
    hours = [(t - start_time) / 3600 for t in timestamp_series]
    
    # Perform linear fit: y = mx + c (m is the slope)
    slope, intercept = np.polyfit(hours, p_sl, 1)
    
    # 3. Calculate Current Humidity (Average of the last few readings for stability)
    avg_humidity = np.mean(humidity_series[-5:])
    
    # 4. Probability Logic
    # Standard threshold: A drop of 1.6mb/hr is considered "Very Rapid"
    # We normalize the slope: a drop of -2.0 mb/hr = 100% tendency score
    tendency_score = max(0, min(1, slope / -2.0))
    
    # Current Pressure Score (Is it already low?)
    current_p = p_sl[-1]
    pressure_score = max(0, min(1, (1013 - current_p) / 20))
    
    # Humidity Score (Must be > 60% for significant rain)
    humidity_score = max(0, (avg_humidity - 60) / 40)
    
    # 5. Weighted Forecast
    # If slope is falling fast, it's the strongest predictor (50%)
    prob = (tendency_score * 0.5) + (humidity_score * 0.3) + (pressure_score * 0.2)
    
    return {
        "rain_probability_pct": round(prob * 100, 2),
        "pressure_trend_mb_per_hr": round(slope, 3),
        "is_falling": slope < -0.2
    }
def get_weather(lat, long):
    """
    Get current weather data for given coordinates using Open-Meteo API.
    Caches results for 1 hour to reduce API calls.
    
    Args:
        coords: Dictionary with 'latitude' and 'longitude' keys.
    Returns:
        Dictionary with weather data (temperature, pressure, etc.) or None on error.
    """
    params = {
	"latitude": lat,
	"longitude": long,
	"hourly": ["precipitation_probability", "relative_humidity_2m"],
	"past_days": 0,
	"forecast_days": 1,
    }
    responses = openmeteo.weather_api(url, params = params)
    response = responses[0]
    hourly = response.Hourly()
    hourly_precipitation_probability = hourly.Variables(0).ValuesAsNumpy()
    hourly_relative_humidity_2m = hourly.Variables(1).ValuesAsNumpy()
    hourly_data = {"date": pd.date_range(
	start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
	end =  pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
	freq = pd.Timedelta(seconds = hourly.Interval()),
	inclusive = "left"
    )}
    hourly_data["precipitation_probability"] = hourly_precipitation_probability
    hourly_data["relative_humidity_2m"] = hourly_relative_humidity_2m
    hourly_dataframe = pd.DataFrame(data = hourly_data)
    return hourly_dataframe[hourly_dataframe['date'] > pd.Timestamp.now(tz = "UTC")].head().to_dict(orient = "records")
def decode_geohash(gh: str) -> Optional[tuple]:
    """
    Decode geohash to approximate latitude and longitude.
    Returns tuple (lat, lon) or None if geohash2 not available.
    
    Example: "u14u2e" -> (44.4268, 26.1025) approximately
    """
    if not HAS_GEOHASH2 or not gh:
        return None
    try:
        lat, lon = geohash2.decode(gh)
        return round(lat, 4), round(lon, 4)
    except Exception:
        return None
set_global_options(max_instances=10)

# Initialize Firebase Admin SDK
try:
    app_instance = firebase_admin.get_app()
except ValueError:
    initialize_app()

# Lazy initialization of Firestore client (only when needed)
_db = None

def get_db():
    """Get Firestore client instance (lazy-initialized)"""
    global _db
    if _db is None:
        _db = firestore.client()
    return _db


CURRENT_OPENAPI_SERVER_URL: Optional[str] = None


def set_current_openapi_server_url(path: str) -> None:
    """Infer and store the externally visible base path for Swagger/OpenAPI."""
    global CURRENT_OPENAPI_SERVER_URL

    if not path:
        CURRENT_OPENAPI_SERVER_URL = None
        return

    if "/sensor_api" in path:
        CURRENT_OPENAPI_SERVER_URL = path.split("/sensor_api", 1)[0] + "/sensor_api"
        return

    CURRENT_OPENAPI_SERVER_URL = None

# ============================================================================
# PYDANTIC MODELS - Data Validation (matching types.ts from SDK)
# ============================================================================

class BarometerReading(BaseModel):
    """Barometer pressure reading from phone sensor"""
    timestamp: int = Field(..., description="Milliseconds since epoch")
    pressure: float = Field(..., description="Pressure in hPa")


class AccelerometerReading(BaseModel):
    """Z-axis accelerometer reading from phone sensor"""
    timestamp: int = Field(..., description="Milliseconds since epoch")
    z: float = Field(..., description="Acceleration on Z axis (m/s²), median value computed on-device")


class AltitudeReading(BaseModel):
    """GPS altitude reading with geohash for location privacy"""
    timestamp: int = Field(..., description="Milliseconds since epoch")
    altitude: float = Field(..., description="Altitude in meters")
    geohash: str = Field(..., description="Geohash string (~0.6km x 0.6km precision) - replaces lat/lon for privacy")
    accuracy: Optional[float] = Field(None, description="GPS accuracy in meters")


class BatchData(BaseModel):
    """Batch of sensor readings sent by SDK - includes all sensor types"""
    timestamp: int = Field(..., description="Batch timestamp (ms)")
    accelerometerReadings: List[AccelerometerReading] = Field(default_factory=list)
    barometerReadings: List[BarometerReading] = Field(default_factory=list)
    altitudeReadings: List[AltitudeReading] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": 1704067200000,
                "barometerReadings": [
                    {"timestamp": 1704067200000, "pressure": 1013.25}
                ],
                "accelerometerReadings": [
                    {"timestamp": 1704067200000, "z": 9.8}
                ],
                "altitudeReadings": [
                    {
                        "timestamp": 1704067200000,
                        "altitude": 100,
                        "geohash": "u14u2e",
                        "accuracy": 5
                    }
                ]
            }
        }


class ReadingsQuery(BaseModel):
    """Query parameters for GET /api/readings"""
    start_time: Optional[int] = Field(None, description="Start timestamp (ms), default -24h")
    end_time: Optional[int] = Field(None, description="End timestamp (ms), default now")
    aggregation: Optional[str] = Field("all", description="Comma-separated: max,min,mean,trend")


class AggregationResult(BaseModel):
    """Aggregation results for a sensor type"""
    max: Optional[float] = None
    min: Optional[float] = None
    mean: Optional[float] = None
    trend: Optional[float] = None


class ReadingsResponse(BaseModel):
    """Response format for GET /api/readings with aggregations"""
    userId: str
    timeRange: Dict[str, int]
    readingsCount: int
    aggregations: Dict[str, Any]


class RegionReadingsResponse(ReadingsResponse):
    """Response format for GET /api/readings/region with geohash metadata"""
    region: Dict[str, Any]


class SuccessResponse(BaseModel):
    """Standard success response for POST operations"""
    status: str
    readingsStored: int
    timestamp: int
    updateInterval: int

class WeatherData():
    date: pd.Timestamp
    precipitation_probability: float
    relative_humidity_2m: float

class ForecastResult(BaseModel):
    rain_probability_pct: float
    pressure_trend_mb_per_hr: float
    is_falling: bool

class RainProbabilityResponse(BaseModel):
    status: str
    coordinates: Dict[str, float]
    data_points_used: int
    oldest_reading_mins_ago: float
    forecast: ForecastResult
# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Polihack19 Sensor Data API",
    description="Swagger-compliant API for receiving and processing barometer, accelerometer, and altitude sensor data",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# Add CORS middleware for SDK requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    # Relative path keeps Firebase emulator function prefix intact.
    return get_swagger_ui_html(
        openapi_url="openapi.json",
        title=f"{app.title} - Swagger UI",
    )


@app.get("/redoc", include_in_schema=False)
async def custom_redoc_html():
    # Relative path keeps Firebase emulator function prefix intact.
    return get_redoc_html(
        openapi_url="openapi.json",
        title=f"{app.title} - ReDoc",
    )


@app.get("/openapi.json", include_in_schema=False)
async def custom_openapi_json():
    schema = deepcopy(app.openapi())

    if CURRENT_OPENAPI_SERVER_URL:
        schema["servers"] = [{"url": CURRENT_OPENAPI_SERVER_URL}]
    else:
        schema.pop("servers", None)

    return JSONResponse(schema)


# ============================================================================
# API KEY AUTHENTICATION MIDDLEWARE
# ============================================================================

async def verify_api_key(request: Request) -> Dict[str, Any]:
    """
    Extract and validate API key from X-API-Key header.
    Verifies key exists in Firestore and is active.
    Returns user info if valid, raises 401 if invalid.
    """
    api_key = request.headers.get("X-API-Key")
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing X-API-Key header"
        )
    
    try:
        # Search for API key in Firestore api_keys collection
        keys_ref = get_db().collection("api_keys")
        query = keys_ref.where("key", "==", api_key).where("isActive", "==", True).limit(1)
        docs = query.stream()
        
        key_doc = None
        for doc in docs:
            key_doc = doc
            break
        
        if not key_doc:
            raise HTTPException(
                status_code=401,
                detail="Invalid or inactive API key"
            )
        
        key_data = key_doc.to_dict()
        return {
            "userId": key_data.get("userId"),
            "deviceName": key_data.get("deviceName"),
            "key_id": key_doc.id,
            "key": api_key
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating API key: {str(e)}"
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Polihack19 Sensor Data API",
        "version": "1.0.0"
    }


@app.post(
    "/api/readings",
    response_model=SuccessResponse,
    summary="Store sensor readings",
    tags=["Sensor Data"],
    responses={
        200: {"description": "Readings stored successfully"},
        400: {"description": "Invalid request data"},
        401: {"description": "Invalid API key"},
        500: {"description": "Server error"}
    }
)
async def store_readings(
    batch_data: BatchData,
    auth: Dict[str, Any] = Depends(verify_api_key)
) -> SuccessResponse:
    """
    POST endpoint to receive and store sensor readings from mobile SDK.
    
    Accepts a batch of barometer, accelerometer, and altitude readings.
    Stores them in Firestore under the authenticated user's collection.
    
    **Authentication**: Requires X-API-Key header
    
    **Example request**:
    ```json
    {
        "timestamp": 1704067200000,
        "barometerReadings": [
            {"timestamp": 1704067200000, "pressure": 1013.25}
        ],
        "accelerometerReadings": [
            {"timestamp": 1704067200000, "z": 9.8}
        ],
        "altitudeReadings": [
            {"timestamp": 1704067200000, "altitude": 100, "geohash": "u14u2e", "accuracy": 5}
        ]
    }
    ```
    """
    userId = auth["userId"]
    
    try:
        if len(batch_data.barometerReadings) > 1:
            raise HTTPException(
                status_code=400,
                detail="Only one barometer reading is allowed per request"
            )
        if len(batch_data.accelerometerReadings) > 1:
            raise HTTPException(
                status_code=400,
                detail="Only one accelerometer reading is allowed per request"
            )
        if len(batch_data.altitudeReadings) > 1:
            raise HTTPException(
                status_code=400,
                detail="Only one altitude reading is allowed per request"
            )

        barometer_reading = batch_data.barometerReadings[0] if batch_data.barometerReadings else None
        accelerometer_reading = batch_data.accelerometerReadings[0] if batch_data.accelerometerReadings else None
        altitude_reading = batch_data.altitudeReadings[0] if batch_data.altitudeReadings else None
        lat, long = (geohash2.decode(altitude_reading.geohash) if altitude_reading and altitude_reading.geohash else (None, None))

        # Get user's readings collection and store one flattened document per batch
        user_readings_ref = get_db().collection("users").document(userId).collection("sensor_readings")
        user_readings_ref.document().set({
            "userId": userId,
            "deviceName": auth["deviceName"],
            "timestamp": batch_data.timestamp,
            "barometer_pressure": barometer_reading.pressure if barometer_reading else None,
            "accelerometer_z": accelerometer_reading.z if accelerometer_reading else None,
            "altitude": altitude_reading.altitude if altitude_reading else None,
            "geohash": altitude_reading.geohash if altitude_reading else None,
            "accuracy": altitude_reading.accuracy if altitude_reading else None,
            "storedAt": datetime.utcnow().timestamp() * 1000,
        })
        # Check weather and set updateInterval accordingly
        # Default: 30 minutes (30*60*1000 ms) to save battery
        # Rain (>70% probability): 5 minutes (5*60*1000 ms) for more frequent updates during rain events
        update_interval = 30*60*1000  # default: 30 minutes in milliseconds
        
        if altitude_reading and lat is not None and long is not None:
            try:
                weather_data = get_weather(lat, long)
                if weather_data:
                    # Check first (current) hour for rain probability
                    current_hour = weather_data[0] if isinstance(weather_data, list) else weather_data
                    rain_probability = current_hour.get('precipitation_probability', 0)
                    
                    # If rain > 70%, increase updateInterval to 5 minutes to conserve battery
                    if rain_probability > 70:
                        update_interval = 5*60*1000  # 5 minutes in milliseconds
            except Exception as weather_error:
                # Log weather error but don't fail the request
                print(f"Weather API error: {str(weather_error)}")
                update_interval = 30*60*1000  # default on error
        
        return SuccessResponse(
            status="success",
            readingsStored=1,
            timestamp=int(datetime.utcnow().timestamp() * 1000),
            updateInterval=update_interval
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error storing readings: {str(e)}"
        )


@app.get(
    "/api/readings",
    response_model=ReadingsResponse,
    summary="Retrieve processed sensor aggregations",
    tags=["Sensor Data"],
    responses={
        200: {"description": "Aggregations retrieved successfully"},
        400: {"description": "Invalid query parameters"},
        401: {"description": "Invalid API key"},
        500: {"description": "Server error"}
    }
)
async def get_readings_aggregated(
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    aggregation: str = "all",
    auth: Dict[str, Any] = Depends(verify_api_key)
) -> ReadingsResponse:
    """
    GET endpoint to retrieve processed sensor data with aggregations.
    
    Returns aggregated statistics (max, min, mean, trend) for each sensor type
    across all users within the specified time range.
    
    **Authentication**: Requires X-API-Key header
    
    **Query Parameters**:
    - `start_time`: Start timestamp in milliseconds (default: 24 hours ago)
    - `end_time`: End timestamp in milliseconds (default: current time)
    - `aggregation`: Comma-separated aggregation types (default: all)
      - Options: `max`, `min`, `mean`, `trend`
      - Example: `max,mean` returns only max and mean
    
    **Returns**:
    - `barometer`: max/min/mean pressure in hPa, trend in hPa/hour
    - `altitude`: max/min/mean altitude in meters, trend in m/hour (geohash stored for privacy)
    - `accelerometer`: max/min/mean z-axis values, trend
    
    **Note on Privacy**: Altitude readings include geohash (~0.6km x 0.6km precision) instead of raw GPS coordinates.
    Use `geohash2.decode()` to recover approximate lat/lon if needed.
    
    **Example response**:
    ```json
    {
        "userId": "all-users",
        "timeRange": {"start": 1704067200000, "end": 1704153600000},
        "readingsCount": 1000,
        "aggregations": {
            "barometer": {
                "max": 1013.5,
                "min": 1013.0,
                "mean": 1013.2,
                "trend": 0.01
            },
            "altitude": {
                "max": 250,
                "min": 240,
                "mean": 245,
                "trend": 1.5
            }
        }
    }
    ```
    """
    userId = auth["userId"]
    
    # Set default time range (24 hours ago to now)
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if end_time is None:
        end_time = now_ms
    if start_time is None:
        start_time = now_ms - (24 * 60 * 60 * 1000)  # 24 hours in ms
    
    # Validate time range
    if start_time >= end_time:
        raise HTTPException(
            status_code=400,
            detail="start_time must be before end_time"
        )
    
    # Parse aggregation types requested
    requested_aggs = set(agg.strip().lower() for agg in aggregation.split(","))
    valid_aggs = {"max", "min", "mean", "trend"}
    if requested_aggs == {"all"}:
        requested_aggs = valid_aggs
    else:
        requested_aggs = requested_aggs & valid_aggs
    
    try:
        # Fetch readings from Firestore across all users
        query = (
            get_db().collection_group("sensor_readings")
            .where("timestamp", ">=", start_time)
            .where("timestamp", "<=", end_time)
        )
        docs = query.stream()
        
        # Organize flattened readings
        barometer_values = []
        altitude_values = []
        accelerometer_z_values = []
        readings_list = []
        
        for doc in docs:
            reading = doc.to_dict()
            readings_list.append(reading)
            
            if reading.get("barometer_pressure") is not None:
                barometer_values.append(reading["barometer_pressure"])
            if reading.get("altitude") is not None:
                altitude_values.append(reading["altitude"])
            if reading.get("accelerometer_z") is not None:
                accelerometer_z_values.append(reading["accelerometer_z"])
        
        # Calculate aggregations
        aggregations = {}
        
        # Barometer aggregations
        if barometer_values:
            baro_result = {}
            if "max" in requested_aggs:
                baro_result["max"] = round(max(barometer_values), 2)
            if "min" in requested_aggs:
                baro_result["min"] = round(min(barometer_values), 2)
            if "mean" in requested_aggs:
                baro_result["mean"] = round(sum(barometer_values) / len(barometer_values), 2)
            if "trend" in requested_aggs and len(barometer_values) > 1:
                # Trend: rate of change per hour
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (barometer_values[-1] - barometer_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                baro_result["trend"] = round(trend, 4)
            aggregations["barometer"] = baro_result
        
        # Altitude aggregations
        if altitude_values:
            alt_result = {}
            if "max" in requested_aggs:
                alt_result["max"] = round(max(altitude_values), 2)
            if "min" in requested_aggs:
                alt_result["min"] = round(min(altitude_values), 2)
            if "mean" in requested_aggs:
                alt_result["mean"] = round(sum(altitude_values) / len(altitude_values), 2)
            if "trend" in requested_aggs and len(altitude_values) > 1:
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (altitude_values[-1] - altitude_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                alt_result["trend"] = round(trend, 4)
            aggregations["altitude"] = alt_result
        
        # Accelerometer aggregations
        if accelerometer_z_values:
            accel_result = {}
            if "max" in requested_aggs:
                accel_result["max"] = round(max(accelerometer_z_values), 2)
            if "min" in requested_aggs:
                accel_result["min"] = round(min(accelerometer_z_values), 2)
            if "mean" in requested_aggs:
                accel_result["mean"] = round(sum(accelerometer_z_values) / len(accelerometer_z_values), 2)
            if "trend" in requested_aggs and len(accelerometer_z_values) > 1:
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (accelerometer_z_values[-1] - accelerometer_z_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                accel_result["trend"] = round(trend, 4)
            aggregations["accelerometer"] = accel_result
        
        return ReadingsResponse(
            userId="all-users",
            timeRange={"start": start_time, "end": end_time},
            readingsCount=len(readings_list),
            aggregations=aggregations
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving readings: {str(e)}"
        )


@app.get(
    "/api/readings/region",
    response_model=RegionReadingsResponse,
    summary="Retrieve processed sensor aggregations for a geohash region",
    tags=["Sensor Data"],
    responses={
        200: {"description": "Region aggregations retrieved successfully"},
        400: {"description": "Invalid query parameters"},
        401: {"description": "Invalid API key"},
        500: {"description": "Server error"}
    }
)
async def get_readings_by_region(
    geohash_prefix: str = Query(..., min_length=1, description="Geohash prefix that defines the region"),
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    aggregation: str = "all",
    auth: Dict[str, Any] = Depends(verify_api_key)
) -> RegionReadingsResponse:
    """
    GET endpoint to retrieve processed sensor data for a specific region.

    The region is defined by a geohash prefix. Shorter prefixes cover a larger area,
    while longer prefixes cover a smaller area.

    **Examples**:
    - `u` -> very large region
    - `u14` -> city-level region
    - `u14u2` -> neighborhood-level region
    """
    geohash_prefix = geohash_prefix.strip().lower()

    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if end_time is None:
        end_time = now_ms
    if start_time is None:
        start_time = now_ms - (24 * 60 * 60 * 1000)

    if start_time >= end_time:
        raise HTTPException(
            status_code=400,
            detail="start_time must be before end_time"
        )

    requested_aggs = set(agg.strip().lower() for agg in aggregation.split(","))
    valid_aggs = {"max", "min", "mean", "trend"}
    if requested_aggs == {"all"}:
        requested_aggs = valid_aggs
    else:
        requested_aggs = requested_aggs & valid_aggs

    try:
        query = (
            get_db().collection_group("sensor_readings")
            .where("geohash", ">=", geohash_prefix)
            .where("geohash", "<=", geohash_prefix + "\uf8ff")
            .where("timestamp", ">=", start_time)
            .where("timestamp", "<=", end_time)
        )
        docs = query.stream()

        barometer_values = []
        altitude_values = []
        accelerometer_z_values = []
        readings_list = []

        for doc in docs:
            reading = doc.to_dict()
            readings_list.append(reading)

            if reading.get("barometer_pressure") is not None:
                barometer_values.append(reading["barometer_pressure"])
            if reading.get("altitude") is not None:
                altitude_values.append(reading["altitude"])
            if reading.get("accelerometer_z") is not None:
                accelerometer_z_values.append(reading["accelerometer_z"])

        aggregations = {}

        if barometer_values:
            baro_result = {}
            if "max" in requested_aggs:
                baro_result["max"] = round(max(barometer_values), 2)
            if "min" in requested_aggs:
                baro_result["min"] = round(min(barometer_values), 2)
            if "mean" in requested_aggs:
                baro_result["mean"] = round(sum(barometer_values) / len(barometer_values), 2)
            if "trend" in requested_aggs and len(barometer_values) > 1:
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (barometer_values[-1] - barometer_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                baro_result["trend"] = round(trend, 4)
            aggregations["barometer"] = baro_result

        if altitude_values:
            alt_result = {}
            if "max" in requested_aggs:
                alt_result["max"] = round(max(altitude_values), 2)
            if "min" in requested_aggs:
                alt_result["min"] = round(min(altitude_values), 2)
            if "mean" in requested_aggs:
                alt_result["mean"] = round(sum(altitude_values) / len(altitude_values), 2)
            if "trend" in requested_aggs and len(altitude_values) > 1:
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (altitude_values[-1] - altitude_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                alt_result["trend"] = round(trend, 4)
            aggregations["altitude"] = alt_result

        if accelerometer_z_values:
            accel_result = {}
            if "max" in requested_aggs:
                accel_result["max"] = round(max(accelerometer_z_values), 2)
            if "min" in requested_aggs:
                accel_result["min"] = round(min(accelerometer_z_values), 2)
            if "mean" in requested_aggs:
                accel_result["mean"] = round(sum(accelerometer_z_values) / len(accelerometer_z_values), 2)
            if "trend" in requested_aggs and len(accelerometer_z_values) > 1:
                time_diff_hours = (end_time - start_time) / (60 * 60 * 1000)
                trend = (accelerometer_z_values[-1] - accelerometer_z_values[0]) / time_diff_hours if time_diff_hours > 0 else 0
                accel_result["trend"] = round(trend, 4)
            aggregations["accelerometer"] = accel_result

        return RegionReadingsResponse(
            userId="all-users",
            timeRange={"start": start_time, "end": end_time},
            readingsCount=len(readings_list),
            aggregations=aggregations,
            region={
                "geohashPrefix": geohash_prefix,
                "precision": len(geohash_prefix),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving regional readings: {str(e)}"
        )

@app.get(
    "/api/forecast/rain",
    response_model=RainProbabilityResponse,
    summary="Calculează probabilitatea de ploaie",
    tags=["Forecast"],
    responses={
        200: {"description": "Probabilitate calculată cu succes"},
        400: {"description": "Date insuficiente pentru calcul"},
        401: {"description": "API key invalid"},
        500: {"description": "Eroare de server"}
    }
)
async def get_rain_probability(
    lat: float = Query(..., description="Latitudinea locației"),
    lon: float = Query(..., description="Longitudinea locației"),
    auth: Dict[str, Any] = Depends(verify_api_key)
) -> RainProbabilityResponse:
    """
    GET endpoint care calculează probabilitatea de ploaie pe baza datelor de presiune 
    din ultimele 3 ore (sau cel mai vechi entry disponibil în această fereastră) și 
    a umidității preluate de la Open-Meteo pentru coordonatele date.
    """
    userId = auth["userId"]
    
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    # Fereastra maximă: acum 3 ore
    start_time_ms = now_ms - (3 * 60 * 60 * 1000)
    
    try:
        # Interogăm citirile user-ului din ultimele 3 ore, ordonate cronologic
        user_readings_ref = get_db().collection_group("sensor_readings")
        query = (
            user_readings_ref
            .where("timestamp", ">=", start_time_ms)
            .where("timestamp", "<=", now_ms)
            .order_by("timestamp", direction=firestore.Query.ASCENDING)
        )
        docs = query.stream()
        
        pressure_series = []
        timestamp_series = []
        altitudes = []
        
        for doc in docs:
            data = doc.to_dict()
            # Avem nevoie neapărat de presiune și altitudine pentru calcule
            if data.get("barometer_pressure") is not None and data.get("altitude") is not None:
                pressure_series.append(data["barometer_pressure"])
                # Conversie din ms în secunde pentru funcția de trend
                timestamp_series.append(data["timestamp"] / 1000.0) 
                altitudes.append(data["altitude"])
                
        if len(pressure_series) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Nu există suficiente citiri de barometru în ultimele 3 ore pentru a calcula un trend (minim 2 necesare)."
            )
            
        # Folosim altitudinea medie a citirilor din acest interval pentru a normaliza presiunea
        avg_altitude = sum(altitudes) / len(altitudes)
        
        # Preluăm datele meteo (umiditatea) pentru coordonatele date
        weather_data = get_weather(lat, lon)
        if not weather_data:
            raise HTTPException(status_code=500, detail="Nu s-au putut prelua datele de la Open-Meteo.")
            
        humidity_series = [w['relative_humidity_2m'] for w in weather_data]
        
        # Apelăm logica de calculare a probabilității
        forecast = calculate_trend_probability(
            humidity_series=humidity_series,
            pressure_series=pressure_series,
            timestamp_series=timestamp_series,
            altitude_m=avg_altitude
        )
        
        # Calculăm cu câte minute în urmă a fost înregistrat cel mai vechi punct folosit
        oldest_point_seconds = (now_ms / 1000.0) - timestamp_series[0]
        
        return RainProbabilityResponse(
            status="success",
            coordinates={"lat": lat, "lon": lon},
            data_points_used=len(pressure_series),
            oldest_reading_mins_ago=round(oldest_point_seconds / 60.0, 1),
            forecast=forecast
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Eroare la calcularea probabilității: {str(e)}"
        )
# ============================================================================
# FIREBASE FUNCTIONS WRAPPER
# ============================================================================

# For local development: run with uvicorn
# uvicorn main:app --reload --port 8000
#
# For Firebase deployment: the sensor_api function wraps the FastAPI app
#
# When deployed to Firebase, this function receives HTTP requests and 
# converts them to ASGI calls for the FastAPI

@https_fn.on_request(max_instances=10)
def sensor_api(req: https_fn.Request) -> https_fn.Response:
    """
    Firebase HTTP Cloud Function that wraps the FastAPI ASGI app.
    Converts incoming HTTP requests to ASGI format and processes them through FastAPI.
    """
    # Import here to avoid early initialization in local development
    from starlette.testclient import TestClient
    
    # Create ASGI-compatible wrapper for Firebase
    # This allows the FastAPI app to work within Firebase Functions environment
    
    # Convert Firebase request to a FastAPI-compatible path.
    # Firebase emulator/deploy adds function prefixes like:
    # /<project>/<region>/sensor_api/<route>
    # We normalize everything to /<route> so /openapi.json works.
    path = req.path or "/"
    marker = "/sensor_api"
    marker_index = path.find(marker)
    if marker_index != -1:
        path = path[marker_index + len(marker):] or "/"

    set_current_openapi_server_url(req.path or "")

    query_string = req.query_string.decode("utf-8") if req.query_string else ""
    if query_string:
        path = f"{path}?{query_string}"

    method = req.method
    headers = dict(req.headers)
    
    # Handle body
    body = b''
    if req.method in ['POST', 'PUT', 'PATCH']:
        body = req.get_data()
    
    # Create test client to handle the request through ASGI
    client = TestClient(app)
    
    # Make the request
    response = client.request(
        method=method,
        url=path,
        headers=headers,
        content=body if body else None
    )
    
    return https_fn.Response(
        response=response.content,
        status=response.status_code,
        headers=dict(response.headers)
    )
