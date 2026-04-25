import openmeteo_requests
import time
import pandas as pd
import requests_cache
from retry_requests import retry
import math
# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = 3600)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)

# Make sure all required weather variables are listed here
# The order of variables in hourly or daily is important to assign them correctly below
url = "https://api.open-meteo.com/v1/forecast"
params = {
	"latitude": 46.0667,
	"longitude": 23.5833,
	"hourly": ["precipitation_probability", "relative_humidity_2m"],
	"past_days": 0,
	"forecast_days": 1,
}
responses = openmeteo.weather_api(url, params = params)
import math

def calculate_ambient_pressure(altitude_m):
    """
    Calculates ambient pressure in millibars (mb) based on altitude in meters.
    Valid for the troposphere (up to 11,000m).
    
    Args:
        altitude_m (float): Altitude above sea level in meters.
        
    Returns:
        float: Ambient pressure in mb (hPa).
    """
    # Standard Constants
    P0 = 1013.25    # Standard sea level pressure in mb
    T0 = 288.15     # Standard sea level temperature in Kelvin
    L = 0.0065      # Temperature lapse rate (K/m)
    G = 9.80665     # Gravitational acceleration (m/s^2)
    M = 0.0289644   # Molar mass of Earth's air (kg/mol)
    R = 8.31447     # Universal gas constant (J/(mol*K))

    # Boundary check for the troposphere
    if altitude_m > 11000:
        import warnings
        warnings.warn("Altitude exceeds troposphere limit; accuracy will decrease.")

    # Barometric Formula
    exponent = (G * M) / (R * L)
    pressure = P0 * (1 - (L * altitude_m) / T0) ** exponent
    
    return round(pressure, 2)
# Process first location. Add a for-loop for multiple locations or weather models
response = responses[0]
print(f"Coordinates: {response.Latitude()}°N {response.Longitude()}°E")
print(f"Elevation: {response.Elevation()} m asl")
print(f"Timezone difference to GMT+0: {response.UtcOffsetSeconds()}s")

# Process hourly data. The order of variables needs to be the same as requested.
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
print(calculate_ambient_pressure(altitude_m = 334))
print("\nHourly data\n", hourly_dataframe[hourly_dataframe['date'] > pd.Timestamp.now(tz = "UTC")].head().to_dict(orient = "records"))
