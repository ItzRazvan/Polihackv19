# Polihack19 Sensor Data API - Setup & Deployment Guide

## Overview
This is a **Swagger-compliant REST API** built with FastAPI + Firebase Functions that:
- ✅ Receives sensor data (barometer, accelerometer, altitude) from mobile SDK
- ✅ Validates requests using API keys stored in Firestore
- ✅ Processes and aggregates data (max, min, mean, trend)
- ✅ Auto-generates Swagger documentation at `/docs`
- ✅ Supports multi-user with isolated data per API key

---

## Prerequisites
- Firebase project with Firestore enabled
- Python 3.13+
- Firebase CLI (`npm install -g firebase-tools`)
- Service account key (JSON file) for Firebase Admin SDK

---

## 1. Firestore Setup

### Create Collections
Run the following commands to set up Firestore collections:

**Option A: Using Firebase Console (Web UI)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Firestore Database
3. Create these collections:

#### Collection: `api_keys`
```
Document ID: auto-generate
Fields:
  - key (string): "your-secret-api-key-here"
  - userId (string): "user123"
  - deviceName (string): "iPhone 14 Pro"
  - createdAt (timestamp): now
  - isActive (boolean): true
  - rateLimit (number, optional): 100 (readings/min)
```

#### Collection: `users`
```
Document ID: "user123" (same as userId above)
Sub-collection: sensor_readings
  - auto-populated by API when readings are stored
```

**Option B: Using Python Script**
```python
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Add sample API key
api_key_data = {
    "key": "sk-test-1234567890abcdef",
    "userId": "user123",
    "deviceName": "Test Device",
    "createdAt": datetime.utcnow(),
    "isActive": True,
    "rateLimit": 100
}
db.collection("api_keys").document().set(api_key_data)
print("✅ API key created successfully!")
```

---

## 2. Local Testing

### Install Dependencies
```bash
cd polihack19functions/functions
pip install -r requirements.txt
```

### Run Locally with Emulator
```bash
# Install Firebase emulator (if not already installed)
firebase setup:emulators:firestore

# Start Firebase emulator in a separate terminal
firebase emulators:start --only firestore

# In another terminal, run the API locally
cd polihack19functions/functions
python main.py
```

### Access Swagger Documentation
Open browser: **http://localhost:8000/docs**

You'll see interactive API documentation with:
- All endpoints listed
- Request/response schemas
- Try-it-out feature to test endpoints

---

## 3. Testing Endpoints

### Get Health Check
```bash
curl http://localhost:8000/
```

Response:
```json
{
  "status": "ok",
  "service": "Polihack19 Sensor Data API",
  "version": "1.0.0"
}
```

### POST: Store Sensor Readings
```bash
curl -X POST http://localhost:8000/api/readings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk-test-1234567890abcdef" \
  -d '{
    "timestamp": 1704067200000,
    "barometerReadings": [
      {"timestamp": 1704067200000, "pressure": 1013.25}
    ],
    "accelerometerReadings": [
      {"timestamp": 1704067200000, "x": 0.1, "y": 0.2, "z": 9.8}
    ],
    "altitudeReadings": [
      {
        "timestamp": 1704067200000,
        "altitude": 100,
        "latitude": 44.4268,
        "longitude": 26.1025,
        "accuracy": 5
      }
    ]
  }'
```

Response (success):
```json
{
  "status": "success",
  "readingsStored": 3,
  "timestamp": 1704067201234
}
```

### GET: Retrieve Aggregated Data
```bash
# Last 24 hours with all aggregations
curl -X GET "http://localhost:8000/api/readings" \
  -H "X-API-Key: sk-test-1234567890abcdef"
```

```bash
# Last 7 days with only max and mean
curl -X GET "http://localhost:8000/api/readings?start_time=1703980800000&end_time=1704585600000&aggregation=max,mean" \
  -H "X-API-Key: sk-test-1234567890abcdef"
```

Response:
```json
{
  "userId": "user123",
  "timeRange": {
    "start": 1703980800000,
    "end": 1704585600000
  },
  "readingsCount": 150,
  "aggregations": {
    "barometer": {
      "max": 1013.5,
      "min": 1013.0,
      "mean": 1013.25,
      "trend": 0.01
    },
    "altitude": {
      "max": 250,
      "min": 240,
      "mean": 245,
      "trend": 1.5
    },
    "accelerometer": {
      "max": 15.5,
      "min": 0.5,
      "mean": 9.2,
      "trend": -0.3
    }
  }
}
```

---

## 4. Authentication

### API Key Management

**Valid API Key Request:**
```bash
curl -X GET "http://localhost:8000/api/readings" \
  -H "X-API-Key: sk-valid-key-from-firestore"
# Returns: 200 OK with data
```

**Invalid/Missing API Key:**
```bash
curl -X GET "http://localhost:8000/api/readings"
# Returns: 401 Unauthorized - "Missing X-API-Key header"

curl -X GET "http://localhost:8000/api/readings" \
  -H "X-API-Key: sk-invalid-key"
# Returns: 401 Unauthorized - "Invalid or inactive API key"
```

**Disable API Key (Deactivate):**
```python
# In Firestore, set isActive = false for that key document
db.collection("api_keys").document("key_doc_id").update({"isActive": False})
```

---

## 5. Deployment to Firebase

### Prerequisites
- Logged in to Firebase CLI: `firebase login`
- Firebase project set up: `firebase init`

### Deploy
```bash
# From project root
firebase deploy

# Or just deploy functions
firebase deploy --only functions
```

### Monitor Deployment
```bash
firebase functions:log
```

### After Deployment
- **API URL**: `https://<region>-<project-id>.cloudfunctions.net/sensor_api`
- **Swagger Docs**: `https://<region>-<project-id>.cloudfunctions.net/sensor_api/docs`

Update SDK configuration in `polihack19sdk` with new API URL

---

## 6. SDK Integration

In your React Native app (polihack19sdk):

```typescript
import { SensorSDK } from '@polihack19sdk/sensor-sdk';

const sdk = new SensorSDK({
  apiUrl: 'https://your-deployed-api-url.com',
  apiKey: 'sk-your-api-key-from-firestore',
  batchInterval: 30000 // Send batch every 30 seconds
});

// Data automatically collected and sent via POST /api/readings
```

---

## 7. Troubleshooting

### **Error: "Missing X-API-Key header"**
- ❌ Solution: Add `-H "X-API-Key: your-key"` to request

### **Error: "Invalid or inactive API key"**
- ❌ Check Firestore: key document might not exist or `isActive=false`
- ✅ Verify key value matches exactly in Firestore

### **Error: "Error validating API key: PERMISSION_DENIED"**
- ❌ Firebase security rules not configured
- ✅ Solution: Check [Firestore Security Rules](#firestore-security-rules)

### **No data appearing in GET request**
- ❌ POST request might have failed (check response code)
- ❌ start_time/end_time might be outside data range
- ✅ Solution: Check timestamps are in milliseconds, not seconds

### **Swagger docs not loading (/docs returns 404)**
- ❌ API running locally with wrong path
- ✅ Ensure `docs_url="/docs"` parameter in FastAPI app

---

## 8. Firestore Security Rules

To restrict access to your own user's data only:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // API keys collection - allow read by functions only
    match /api_keys/{document=**} {
      allow read, write: if request.auth.uid != null;
    }

    // Users collection - allow access to own user's data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 9. Performance Optimization

### Rate Limiting (Optional)
Implement in middleware:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/readings")
@limiter.limit("100/minute")
async def store_readings(...):
    ...
```

### Data Archival (Optional)
Periodically move old readings to archive collection:
```python
# Move readings older than 90 days to archive
archive_readings_older_than_days(db, days=90)
```

### Indexing (Firestore)
For faster queries, create composite indexes:
- Collection: `users/{userId}/sensor_readings`
- Index: `timestamp (Ascending)`, `type (Ascending)`

---

## 10. Monitoring & Logging

### View Logs
```bash
firebase functions:log
```

### Set Up Alerts (Firebase Console)
- Navigate to Functions → Your function → Metrics tab
- Set alerts for:
  - Error rate > 1%
  - Duration > 30s
  - Memory usage > 500MB

---

## 11. API Documentation

### OpenAPI/Swagger Schema
- **Endpoint**: `/openapi.json`
- Use to auto-generate client SDKs:
  ```bash
  openapi-generator-cli generate -i https://your-api.com/openapi.json -g python-client
  ```

### Redoc Documentation
- **Endpoint**: `/redoc`
- Alternative to Swagger UI (better for reading)

---

## Summary

✅ **API Setup Complete with:**
- FastAPI + Pydantic for type validation
- Firebase Firestore for persistence
- API key authentication
- Multi-user data isolation
- Aggregation endpoints (max, min, mean, trend)
- Auto-generated Swagger docs
- Production-ready error handling

🚀 **Next Steps:**
1. Create API keys in Firestore
2. Test locally with Swagger UI (`/docs`)
3. Deploy to Firebase Functions
4. Integrate SDK in mobile app
5. Monitor logs and performance

---

**Questions?** Check [Troubleshooting](#7-troubleshooting) section or review code comments.
