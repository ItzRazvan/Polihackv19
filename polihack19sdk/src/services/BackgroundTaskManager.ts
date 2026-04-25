// @ts-ignore - react-native-background-timer doesn't have type definitions
import BackgroundTimer from 'react-native-background-timer';
import type { DataCollector } from './DataCollector';
import type { APIClient } from './APIClient';
import type { BatchData } from '../types';

/**
 * Manages background task execution for periodic data collection and API submission
 */
export class BackgroundTaskManager {
  private taskId: number | null = null;
  private dataCollector: DataCollector | null = null;
  private apiClient: APIClient | null = null;
  private batchInterval: number = 30000; // 30 seconds default

  /**
   * Initialize the background task manager
   */
  initialize(
    dataCollector: DataCollector,
    apiClient: APIClient,
    batchInterval: number = 30000
  ): void {
    this.dataCollector = dataCollector;
    this.apiClient = apiClient;
    this.batchInterval = batchInterval;
  }

  /**
   * Start the background task that periodically sends batches
   */
  start(): void {
    if (this.taskId !== null) {
      console.warn('[BackgroundTaskManager] Task already running');
      return;
    }

    try {
      this.taskId = BackgroundTimer.setInterval(() => {
        this.processBatch();
      }, this.batchInterval);

      console.log(
        `[BackgroundTaskManager] Background task started with interval: ${this.batchInterval}ms`
      );
    } catch (error) {
      console.error('[BackgroundTaskManager] Error starting background task:', error);
    }
  }

  /**
   * Stop the background task
   */
  stop(): void {
    if (this.taskId !== null) {
      BackgroundTimer.clearInterval(this.taskId);
      this.taskId = null;
      console.log('[BackgroundTaskManager] Background task stopped');
    }
  }

  /**
   * Update batch interval (in milliseconds)
   */
  setBatchInterval(interval: number): void {
    this.batchInterval = interval;

    // If task is running, restart with new interval
    if (this.taskId !== null) {
      this.stop();
      this.start();
    }
  }

  /**
   * Process and send current batch of collected data
   */
  private async processBatch(): Promise<void> {
    if (!this.dataCollector || !this.apiClient) {
      console.error('[BackgroundTaskManager] Dependencies not initialized');
      return;
    }

    try {
      // Get all buffered readings
      const { accelerometerReadings, barometerReadings, altitudeReadings } =
        this.dataCollector.getAndClearBuffer();

      // Create batch data
      const batchData: BatchData = {
        timestamp: Date.now(),
        accelerometerReadings,
        barometerReadings,
        altitudeReadings,
      };

      // Send to API
      await this.apiClient.sendBatch(batchData);
    } catch (error) {
      console.error('[BackgroundTaskManager] Error processing batch:', error);
    }
  }

  /**
   * Check if background task is currently running
   */
  isRunning(): boolean {
    return this.taskId !== null;
  }
}
