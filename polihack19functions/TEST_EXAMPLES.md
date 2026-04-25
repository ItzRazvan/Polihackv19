# Test Examples - Polihack19 Sensor Data API

This file contains ready-to-use test requests for all API endpoints.

## Prerequisites
- API running locally: `python main.py` (or Firebase deployed)
- Valid API key from Firestore in `X-API-Key` header
- Base URL: `http://localhost:8000` (local) or `https://your-deployed-api.com` (production)

---

## 1. Health Check

### Request
```bash
curl -X GET http://localhost:8000/
```

### Expected Response
```json
{
  "status": "ok",
  "service": "Polihack19 Sensor Data API",
  "version": "1.0.0"
}
```

---

## 2. POST - Store Sensor Readings (Minimal)

Stores single readings from each sensor type.

### Request
```bash
curl -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-your-api-key-here" \
  -d '{
    "timestamp": 1704067200000,
    "barometerReadings": [
      {
        "timestamp": 1704067200000,
        "pressure": 1013.25
      }
    ],
    "accelerometerReadings": [
      {
        "timestamp": 1704067200000,
        "x": 0.5,
        "y": 0.3,
        "z": 9.8
      }
    ],
    "altitudeReadings": [
      {
        "timestamp": 1704067200000,
        "altitude": 150,
        "latitude": 44.4268,
        "longitude": 26.1025,
        "accuracy": 10
      }
    ]
  }'
```

### Expected Response
```json
{
  "status": "success",
  "readingsStored": 3,
  "timestamp": 1704067201234
}
```

---

## 3. POST - Store Sensor Readings (Batch with multiple readings)

Multiple readings from sensors in one batch.

### Request
```bash
curl -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-your-api-key-here" \
  -d '{
    "timestamp": 1704153600000,
    "barometerReadings": [
      {"timestamp": 1704153600000, "pressure": 1013.10},
      {"timestamp": 1704153605000, "pressure": 1013.15},
      {"timestamp": 1704153610000, "pressure": 1013.20},
      {"timestamp": 1704153615000, "pressure": 1013.25},
      {"timestamp": 1704153620000, "pressure": 1013.30}
    ],
    "accelerometerReadings": [
      {"timestamp": 1704153600000, "x": 0.1, "y": 0.2, "z": 9.8},
      {"timestamp": 1704153605000, "x": 0.2, "y": 0.3, "z": 9.7},
      {"timestamp": 1704153610000, "x": 0.3, "y": 0.4, "z": 9.9},
      {"timestamp": 1704153615000, "x": 0.2, "y": 0.2, "z": 9.8},
      {"timestamp": 1704153620000, "x": 0.1, "y": 0.1, "z": 9.7}
    ],
    "altitudeReadings": [
      {"timestamp": 1704153600000, "altitude": 100, "latitude": 44.4268, "longitude": 26.1025},
      {"timestamp": 1704153610000, "altitude": 105, "latitude": 44.4270, "longitude": 26.1027},
      {"timestamp": 1704153620000, "altitude": 110, "latitude": 44.4272, "longitude": 26.1029}
    ]
  }'
```

### Expected Response
```json
{
  "status": "success",
  "readingsStored": 13,
  "timestamp": 1704153601234
}
```

---

## 4. GET - All Aggregations (Last 24 hours)

Default query returns all aggregations for the last 24 hours.

### Request
```bash
curl -X GET "http://localhost:8000/api/readings" \
  -H "X-API-Key: sk-your-api-key-here"
```

### Expected Response
```json
{
  "userId": "demo-user-001",
  "timeRange": {
    "start": 1703980800000,
    "end": 1704067200000
  },
  "readingsCount": 13,
  "aggregations": {
    "barometer": {
      "max": 1013.30,
      "min": 1013.10,
      "mean": 1013.20,
      "trend": 0.02
    },
    "altitude": {
      "max": 110,
      "min": 100,
      "mean": 105,
      "trend": 1.5
    },
    "accelerometer": {
      "max": 10.0,
      "min": 9.5,
      "mean": 9.75,
      "trend": -0.15
    }
  }
}
```

---

## 5. GET - Specific Aggregations (max and mean only)

Returns only max and mean values.

### Request
```bash
curl -X GET "http://localhost:8000/api/readings?aggregation=max,mean" \
  -H "X-API-Key: sk-your-api-key-here"
```

### Expected Response
```json
{
  "userId": "demo-user-001",
  "timeRange": {
    "start": 1703980800000,
    "end": 1704067200000
  },
  "readingsCount": 13,
  "aggregations": {
    "barometer": {
      "max": 1013.30,
      "mean": 1013.20
    },
    "altitude": {
      "max": 110,
      "mean": 105
    },
    "accelerometer": {
      "max": 10.0,
      "mean": 9.75
    }
  }
}
```

---

## 6. GET - Trend Only

Returns only trend (rate of change per hour).

### Request
```bash
curl -X GET "http://localhost:8000/api/readings?aggregation=trend" \
  -H "X-API-Key: sk-your-api-key-here"
```

### Expected Response
```json
{
  "userId": "demo-user-001",
  "timeRange": {
    "start": 1703980800000,
    "end": 1704067200000
  },
  "readingsCount": 13,
  "aggregations": {
    "barometer": {
      "trend": 0.02
    },
    "altitude": {
      "trend": 1.5
    },
    "accelerometer": {
      "trend": -0.15
    }
  }
}
```

---

## 7. GET - Custom Time Range (Last 7 days)

Specify start_time and end_time for custom range.

### Calculating Timestamps
```python
# Last 7 days from now
import time
now_ms = int(time.time() * 1000)
start_ms = now_ms - (7 * 24 * 60 * 60 * 1000)

# Example: April 25, 2026
# 7 days ago: April 18, 2026
start_time = 1703894400000  # April 18, 2026
end_time = 1704499200000    # April 25, 2026
```

### Request
```bash
curl -X GET "http://localhost:8000/api/readings?start_time=1703894400000&end_time=1704499200000&aggregation=max,min,mean" \
  -H "X-API-Key: sk-your-api-key-here"
```

### Expected Response
```json
{
  "userId": "demo-user-001",
  "timeRange": {
    "start": 1703894400000,
    "end": 1704499200000
  },
  "readingsCount": 87,
  "aggregations": {
    "barometer": {
      "max": 1014.50,
      "min": 1012.80,
      "mean": 1013.45
    },
    "altitude": {
      "max": 250,
      "min": 100,
      "mean": 145
    },
    "accelerometer": {
      "max": 15.0,
      "min": 8.5,
      "mean": 10.2
    }
  }
}
```

---

## Error Test Cases

### Missing API Key
```bash
curl -X GET "http://localhost:8000/api/readings"
```

**Expected Response (401)**:
```json
{
  "detail": "Missing X-API-Key header"
}
```

### Invalid API Key
```bash
curl -X GET "http://localhost:8000/api/readings" \
  -H "X-API-Key: invalid-key-12345"
```

**Expected Response (401)**:
```json
{
  "detail": "Invalid or inactive API key"
}
```

### Invalid Time Range (start >= end)
```bash
curl -X GET "http://localhost:8000/api/readings?start_time=1704067200000&end_time=1703067200000" \
  -H "X-API-Key: sk-your-api-key-here"
```

**Expected Response (400)**:
```json
{
  "detail": "start_time must be before end_time"
}
```

### Invalid POST Data (missing required fields)
```bash
curl -X POST "http://localhost:8000/api/readings" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-your-api-key-here" \
  -d '{"timestamp": 1704067200000}'
```

**Expected Response (422)**:
```json
{
  "detail": [
    {
      "loc": ["body", "accelerometerReadings"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

---

## Automated Testing with Postman

### Import Collection
1. Open Postman
2. Click **Import** → paste the JSON below:

```json
{
  "info": {
    "name": "Polihack19 Sensor API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/"
      }
    },
    {
      "name": "POST - Store Readings",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/readings",
        "header": [
          {
            "key": "X-API-Key",
            "value": "{{api_key}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"timestamp\": 1704067200000, \"barometerReadings\": [{\"timestamp\": 1704067200000, \"pressure\": 1013.25}], \"accelerometerReadings\": [{\"timestamp\": 1704067200000, \"x\": 0.1, \"y\": 0.2, \"z\": 9.8}], \"altitudeReadings\": [{\"timestamp\": 1704067200000, \"altitude\": 100, \"latitude\": 44.4268, \"longitude\": 26.1025, \"accuracy\": 5}]}"
        }
      }
    },
    {
      "name": "GET - All Aggregations",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/readings",
        "header": [
          {
            "key": "X-API-Key",
            "value": "{{api_key}}"
          }
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "api_key",
      "value": "sk-your-api-key-here"
    }
  ]
}
```

3. **Set Variables** in Postman:
   - `base_url`: `http://localhost:8000`
   - `api_key`: Your API key from Firestore

---

## Python Testing Script

```python
import requests
import time
import json

BASE_URL = "http://localhost:8000"
API_KEY = "sk-your-api-key-here"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

def test_health():
    """Test health check"""
    response = requests.get(f"{BASE_URL}/", headers=HEADERS)
    print(f"Health Check: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_post_readings():
    """Test POST /api/readings"""
    now_ms = int(time.time() * 1000)
    payload = {
        "timestamp": now_ms,
        "barometerReadings": [
            {"timestamp": now_ms, "pressure": 1013.25}
        ],
        "accelerometerReadings": [
            {"timestamp": now_ms, "x": 0.1, "y": 0.2, "z": 9.8}
        ],
        "altitudeReadings": [
            {
                "timestamp": now_ms,
                "altitude": 100,
                "latitude": 44.4268,
                "longitude": 26.1025,
                "accuracy": 5
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/readings",
        headers=HEADERS,
        json=payload
    )
    print(f"\nPOST /api/readings: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_get_aggregations():
    """Test GET /api/readings"""
    response = requests.get(
        f"{BASE_URL}/api/readings",
        headers=HEADERS
    )
    print(f"\nGET /api/readings: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_get_aggregations_custom():
    """Test GET /api/readings with custom params"""
    now_ms = int(time.time() * 1000)
    start_ms = now_ms - (24 * 60 * 60 * 1000)  # 24 hours ago
    
    response = requests.get(
        f"{BASE_URL}/api/readings",
        headers=HEADERS,
        params={
            "start_time": start_ms,
            "end_time": now_ms,
            "aggregation": "max,mean"
        }
    )
    print(f"\nGET /api/readings (custom): {response.status_code}")
    print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_health()
    test_post_readings()
    test_get_aggregations()
    test_get_aggregations_custom()
```

Run with:
```bash
pip install requests
python test_api.py
```

---

## Integration Test with SDK

```typescript
import { SensorSDK } from '@polihack19sdk/sensor-sdk';

const sdk = new SensorSDK({
  apiUrl: 'http://localhost:8000',
  apiKey: 'sk-your-api-key-here',
  batchInterval: 5000  // Send every 5 seconds for faster testing
});

// Start collecting sensor data automatically
sdk.startCollection();

// After 30 seconds, stop and verify data was sent
setTimeout(() => {
  sdk.stopCollection();
  console.log('✅ Sensor data sent to API');
}, 30000);
```

---

## Swagger UI Documentation

**Endpoint**: `http://localhost:8000/docs`

Features:
- ✅ Interactive API testing
- ✅ Request/response examples
- ✅ Schema validation
- ✅ Try it out button for each endpoint
- ✅ Automatic curl command generation

**Alternative Redoc**: `http://localhost:8000/redoc`
