/**
 * Sensor reading with timestamp
 */
export interface SensorReading {
  timestamp: number;
  x?: number;
  y?: number;
  z?: number;
}

/**
 * Accelerometer reading (Z axis only) in m/s²
 * Stores median value calculated on-device for efficiency
 */
export interface AccelerometerReading extends SensorReading {
  z: number; // Z axis median value
}

/**
 * Barometric pressure reading in hPa
 */
export interface BarometerReading extends SensorReading {
  pressure: number;
}

/**
 * GPS altitude reading in meters with geohash calculated from median coordinates
 * Geohash provides ~0.6km x 0.6km precision for privacy
 * Median calculated on-device from all collected GPS points in batch
 */
export interface AltitudeReading extends SensorReading {
  altitude: number;
  geohash: string; // Calculated from median latitude/longitude for privacy
}

/**
 * Batch data sent to API
 */
export interface BatchData {
  timestamp: number;
  accelerometerReadings: AccelerometerReading[];
  barometerReadings: BarometerReading[];
  altitudeReadings: AltitudeReading[];
}

/**
 * SDK configuration
 */
export interface SensorSDKConfig {
  apiUrl: string;
  apiKey?: string;
  accelerometerFrequency?: number; // Hz (readings per second)
  barometricFrequency?: number; // Hz (readings per second)
  gpsFrequency?: number; // Hz (readings per second)
  batchInterval?: number; // milliseconds
}

/**
 * Success response from API processing
 */
export interface APIResponse {
  status: string;
  readingsStored: number;
  timestamp: number;
  updateInterval?: number;
}

/**
 * Permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';
