import { accelerometer, barometer } from 'react-native-sensors';
import Geolocation from 'react-native-geolocation-service';
import type {
  AccelerometerReading,
  BarometerReading,
  AltitudeReading,
} from '../types';

/**
 * Collects sensor readings from accelerometer, barometer, and GPS
 */
export class DataCollector {
  private accelerometerReadings: AccelerometerReading[] = [];
  private barometerReadings: BarometerReading[] = [];
  private altitudeReadings: AltitudeReading[] = [];

  private accelerometerFrequency: number = 1; // Hz
  private barometricFrequency: number = 1; // Hz
  private gpsFrequency: number = 1; // Hz

  private accelerometerSubscription: any = null;
  private barometerSubscription: any = null;
  private gpsWatchId: number | null = null;

  private lastAccelerometerTime: number = 0;
  private lastBarometerTime: number = 0;
  private lastGpsTime: number = 0;

  constructor(
    accelerometerFreq: number = 1,
    barometricFreq: number = 1,
    gpsFreq: number = 1
  ) {
    this.accelerometerFrequency = accelerometerFreq;
    this.barometricFrequency = barometricFreq;
    this.gpsFrequency = gpsFreq;
  }

  /**
   * Start collecting sensor data
   */
  start(): void {
    this.startAccelerometerCollection();
    this.startBarometerCollection();
    this.startGpsCollection();
  }

  /**
   * Stop collecting sensor data
   */
  stop(): void {
    this.stopAccelerometerCollection();
    this.stopBarometerCollection();
    this.stopGpsCollection();
  }

  /**
   * Get all buffered readings and clear the buffer
   */
  getAndClearBuffer(): {
    accelerometerReadings: AccelerometerReading[];
    barometerReadings: BarometerReading[];
    altitudeReadings: AltitudeReading[];
  } {
    const result = {
      accelerometerReadings: [...this.accelerometerReadings],
      barometerReadings: [...this.barometerReadings],
      altitudeReadings: [...this.altitudeReadings],
    };

    this.accelerometerReadings = [];
    this.barometerReadings = [];
    this.altitudeReadings = [];

    return result;
  }

  /**
   * Update sampling frequencies
   */
  updateFrequencies(
    accelerometerFreq: number,
    barometricFreq: number,
    gpsFreq: number
  ): void {
    this.accelerometerFrequency = accelerometerFreq;
    this.barometricFrequency = barometricFreq;
    this.gpsFrequency = gpsFreq;
  }

  private startAccelerometerCollection(): void {
    try {
      this.accelerometerSubscription = accelerometer.subscribe(
        ({ x, y, z }) => {
          const now = Date.now();
          const interval = 1000 / this.accelerometerFrequency;

          // Rate limit based on frequency
          if (now - this.lastAccelerometerTime >= interval) {
            this.accelerometerReadings.push({
              timestamp: now,
              x,
              y,
              z,
            });
            this.lastAccelerometerTime = now;
          }
        },
        (error) => {
          console.error('[DataCollector] Accelerometer error:', error);
        }
      );
    } catch (error) {
      console.error(
        '[DataCollector] Failed to start accelerometer collection:',
        error
      );
    }
  }

  private stopAccelerometerCollection(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.unsubscribe();
      this.accelerometerSubscription = null;
    }
  }

  private startBarometerCollection(): void {
    try {
      this.barometerSubscription = barometer.subscribe(
        ({ pressure }) => {
          const now = Date.now();
          const interval = 1000 / this.barometricFrequency;

          // Rate limit based on frequency
          if (now - this.lastBarometerTime >= interval) {
            this.barometerReadings.push({
              timestamp: now,
              pressure,
            });
            this.lastBarometerTime = now;
          }
        },
        (error) => {
          console.error('[DataCollector] Barometer error:', error);
        }
      );
    } catch (error) {
      console.error(
        '[DataCollector] Failed to start barometer collection:',
        error
      );
    }
  }

  private stopBarometerCollection(): void {
    if (this.barometerSubscription) {
      this.barometerSubscription.unsubscribe();
      this.barometerSubscription = null;
    }
  }

  private startGpsCollection(): void {
    try {
      this.gpsWatchId = Geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          const interval = 1000 / this.gpsFrequency;

          // Rate limit based on frequency
          if (now - this.lastGpsTime >= interval) {
            const { latitude, longitude, altitude, accuracy } =
              position.coords;

            this.altitudeReadings.push({
              timestamp: now,
              altitude: altitude || 0,
              latitude,
              longitude,
              accuracy: accuracy || 0,
            });
            this.lastGpsTime = now;
          }
        },
        (error) => {
          console.error('[DataCollector] GPS error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
        }
      );
    } catch (error) {
      console.error('[DataCollector] Failed to start GPS collection:', error);
    }
  }

  private stopGpsCollection(): void {
    if (this.gpsWatchId !== null) {
      Geolocation.clearWatch(this.gpsWatchId);
      this.gpsWatchId = null;
    }
  }
}
