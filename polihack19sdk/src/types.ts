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
 * Accelerometer reading in m/s²
 */
export interface AccelerometerReading extends SensorReading {
  x: number;
  y: number;
  z: number;
}

/**
 * Barometric pressure reading in hPa
 */
export interface BarometerReading extends SensorReading {
  pressure: number;
}

/**
 * GPS altitude reading in meters
 */
export interface AltitudeReading extends SensorReading {
  altitude: number;
  latitude: number;
  longitude: number;
  accuracy: number;
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
 * Permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';
