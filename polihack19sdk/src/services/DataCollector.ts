import { accelerometer, barometer } from 'react-native-sensors';
import Geolocation from 'react-native-geolocation-service';
import { GeohashConverter } from '../utils/GeohashConverter';
import { StatisticsUtil } from '../utils/StatisticsUtil';
import type {
  AccelerometerReading,
  BarometerReading,
  AltitudeReading,
} from '../types';

/**
 * Collects sensor readings from accelerometer (Z-axis only), barometer, and GPS
 */
export class DataCollector {
  private accelerometerReadings: AccelerometerReading[] = [];
  private accelerometerZBuffer: number[] = []; // Buffer for Z-axis raw values to calculate median
  private barometerReadings: BarometerReading[] = [];
  private altitudeReadings: AltitudeReading[] = [];

  private latitudeBuffer: number[] = []; // Buffer for latitude values to calculate median
  private longitudeBuffer: number[] = []; // Buffer for longitude values to calculate median
  private altitudeBuffer: number[] = []; // Buffer for altitude values

  private barometricFrequency: number = 1; // Hz
  private gpsFrequency: number = 1; // Hz

  private accelerometerSubscription: any = null;
  private barometerSubscription: any = null;
  private gpsWatchId: number | null = null;

  private lastBarometerTime: number = 0;
  private lastGpsTime: number = 0;

  constructor(
    _accelerometerFreq: number = 1,
    barometricFreq: number = 1,
    gpsFreq: number = 1
  ) {
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
   * Calculates median for accelerometer Z-axis and GPS coordinates on-device
   */
  getAndClearBuffer(): {
    accelerometerReadings: AccelerometerReading[];
    barometerReadings: BarometerReading[];
    altitudeReadings: AltitudeReading[];
  } {
    // Calculate median of Z-axis values
    let zMedian = 0;
    let barMedian = 0;
    if (this.barometerReadings.length > 0) {
      barMedian = StatisticsUtil.calculateMedian(
        this.barometerReadings.map((r) => r.pressure)
      );
    }
    if (this.accelerometerZBuffer.length > 0) {
      zMedian = StatisticsUtil.calculateMedian(this.accelerometerZBuffer);
    }

    // If we have Z-axis data, create a single reading with median
    if (this.accelerometerZBuffer.length > 0) {
      this.accelerometerReadings = [
        {
          timestamp: Date.now(),
          z: zMedian,
        },
      ];
    }
    //If we have barometer data, create a single reading with median
    if (this.barometerReadings.length > 0) {
      this.barometerReadings = [
        {
          timestamp: Date.now(),
          pressure: barMedian,
        },
      ];
    }


    // Calculate median GPS coordinates and convert to geohash
    if (this.latitudeBuffer.length > 0 && this.longitudeBuffer.length > 0) {
      const medianLatitude = StatisticsUtil.calculateMedian(
        this.latitudeBuffer
      );
      const medianLongitude = StatisticsUtil.calculateMedian(
        this.longitudeBuffer
      );
      const medianAltitude =
        this.altitudeBuffer.length > 0
          ? StatisticsUtil.calculateMedian(this.altitudeBuffer)
          : 0;

      // Convert median point to geohash for privacy
      const geohash = GeohashConverter.toGeohash(
        medianLatitude,
        medianLongitude
      );

      this.altitudeReadings = [
        {
          timestamp: Date.now(),
          altitude: medianAltitude,
          geohash,
        },
      ];
    }

    const result = {
      accelerometerReadings: [...this.accelerometerReadings],
      barometerReadings: [...this.barometerReadings],
      altitudeReadings: [...this.altitudeReadings],
    };

    this.accelerometerReadings = [];
    this.barometerReadings = [];
    this.altitudeReadings = [];
    this.accelerometerZBuffer = [];
    this.latitudeBuffer = [];
    this.longitudeBuffer = [];
    this.altitudeBuffer = [];

    return result;
  }

  /**
   * Update sampling frequencies
   */
  updateFrequencies(
    _accelerometerFreq: number,
    barometricFreq: number,
    gpsFreq: number
  ): void {
    this.barometricFrequency = barometricFreq;
    this.gpsFrequency = gpsFreq;
  }

  private startAccelerometerCollection(): void {
    try {
      this.accelerometerSubscription = accelerometer.subscribe(
        ({ z }) => {
          // Collect Z-axis values for median calculation
          this.accelerometerZBuffer.push(z);
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
            const { latitude, longitude, altitude } = position.coords;
            // Buffer raw coordinates for median calculation
            this.latitudeBuffer.push(latitude);
            this.longitudeBuffer.push(longitude);
            this.altitudeBuffer.push(altitude || 0);

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
