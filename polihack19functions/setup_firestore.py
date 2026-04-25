#!/usr/bin/env python3
"""
Firestore Setup Script for Polihack19 Sensor Data API
Initializes collections and creates sample API keys

Usage:
    python setup_firestore.py

Required:
    - GOOGLE_APPLICATION_CREDENTIALS environment variable pointing to service account key
    - Or specify path with: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json python setup_firestore.py
"""

import os
import sys
import secrets
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if Firebase app already initialized
        firebase_admin.get_app()
        print("✓ Firebase app already initialized")
    except ValueError:
        # Initialize with credentials
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not cred_path:
            print("❌ Error: GOOGLE_APPLICATION_CREDENTIALS not set")
            print("   Set it with: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json")
            sys.exit(1)
        
        if not os.path.exists(cred_path):
            print(f"❌ Error: Service account key not found at {cred_path}")
            sys.exit(1)
        
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✓ Firebase initialized with service account")
    
    return firestore.client()


def create_collections(db):
    """Create Firestore collections and sample data"""
    print("\n📁 Creating Firestore Collections...")
    
    # Create api_keys collection with sample key
    print("\n  • api_keys collection")
    api_key = f"sk-{secrets.token_hex(24)}"
    
    api_key_doc = {
        "key": api_key,
        "userId": "demo-user-001",
        "deviceName": "Demo iPhone 14 Pro",
        "createdAt": datetime.utcnow(),
        "isActive": True,
        "rateLimit": 100,
        "description": "Demo API key for testing"
    }
    
    key_ref = db.collection("api_keys").document()
    key_ref.set(api_key_doc)
    print(f"    ✓ Created with demo API key: {api_key}")
    print(f"    ✓ User ID: demo-user-001")
    
    # Create users collection with structure
    print("\n  • users collection")
    user_doc = {
        "userId": "demo-user-001",
        "name": "Demo User",
        "email": "demo@polihack19.local",
        "createdAt": datetime.utcnow(),
        "devices": 1
    }
    
    db.collection("users").document("demo-user-001").set(user_doc)
    print(f"    ✓ Created user document: demo-user-001")
    
    # Create sub-collection for sensor readings
    print("\n  • users/demo-user-001/sensor_readings (sub-collection)")
    print("    ✓ Sub-collection will be auto-created on first write")
    
    return api_key


def verify_setup(db):
    """Verify that collections are properly set up"""
    print("\n✓ Verifying Setup...")
    
    # Check api_keys collection
    api_keys = db.collection("api_keys").stream()
    api_keys_count = sum(1 for _ in api_keys)
    print(f"  • api_keys collection: {api_keys_count} document(s)")
    
    # Check users collection
    users = db.collection("users").stream()
    users_count = sum(1 for _ in users)
    print(f"  • users collection: {users_count} document(s)")
    
    if api_keys_count > 0 and users_count > 0:
        print("\n✅ Firestore setup completed successfully!")
        return True
    else:
        print("\n❌ Setup incomplete - missing collections")
        return False


def print_instructions(api_key):
    """Print testing instructions"""
    print("\n" + "="*70)
    print("🚀 NEXT STEPS - Testing the API")
    print("="*70)
    
    print(f"""
1. **Install dependencies**:
   cd polihack19functions/functions
   pip install -r requirements.txt

2. **Run locally**:
   python main.py
   
   Or with Firebase Emulator:
   firebase emulators:start --only firestore
   # (in another terminal)
   cd polihack19functions/functions && python main.py

3. **Access Swagger documentation**:
   Open: http://localhost:8000/docs
   
   You'll see all endpoints with interactive testing

4. **Test POST endpoint** (store readings):
   curl -X POST http://localhost:8000/api/readings \\
     -H "Content-Type: application/json" \\
     -H "X-API-Key: {api_key}" \\
     -d '{{
       "timestamp": 1704067200000,
       "barometerReadings": [
         {{"timestamp": 1704067200000, "pressure": 1013.25}}
       ],
       "accelerometerReadings": [
         {{"timestamp": 1704067200000, "x": 0.1, "y": 0.2, "z": 9.8}}
       ],
       "altitudeReadings": [
         {{
           "timestamp": 1704067200000,
           "altitude": 100,
           "latitude": 44.4268,
           "longitude": 26.1025,
           "accuracy": 5
         }}
       ]
     }}'

5. **Test GET endpoint** (retrieve aggregations):
   curl -X GET "http://localhost:8000/api/readings" \\
     -H "X-API-Key: {api_key}"

6. **Deploy to Firebase**:
   firebase deploy

📚 For detailed setup guide, see: SETUP_GUIDE.md
""")
    print("="*70)


def main():
    """Main setup flow"""
    print("\n🔧 Polihack19 Sensor Data API - Firestore Setup")
    print("="*70)
    
    try:
        # Initialize Firebase
        db = initialize_firebase()
        
        # Create collections and sample data
        api_key = create_collections(db)
        
        # Verify setup
        if verify_setup(db):
            # Print instructions
            print_instructions(api_key)
            print("\n✅ Setup complete!\n")
            return 0
        else:
            print("\n❌ Setup verification failed\n")
            return 1
    
    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")
        print(f"   Details: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
