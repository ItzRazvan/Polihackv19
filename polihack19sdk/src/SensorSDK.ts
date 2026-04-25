import { PermissionsManager } from './services/PermissionsManager';
import { DataCollector } from './services/DataCollector';
import { APIClient } from './services/APIClient';
import { BackgroundTaskManager } from './services/BackgroundTaskManager';
import type { SensorSDKConfig, PermissionStatus } from './types';

/**
 * Main SDK controller for collecting and sending sensor data
 */
export class SensorSDK {
  private permissionsManager = PermissionsManager;
  private dataCollector: DataCollector | null = null;
  private apiClient: APIClient | null = null;
  private backgroundTaskManager: BackgroundTaskManager | null = null;

  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  private isStarting: boolean = false;
  private config: SensorSDKConfig = {
    apiUrl: '',
    accelerometerFrequency: 1,
    barometricFrequency: 1,
    gpsFrequency: 1,
    batchInterval: 30000,
  };

  /**
   * Initialize the SDK with configuration
   */
  async initialize(config: SensorSDKConfig): Promise<void> {
    console.log('[SensorSDK] Initializing with config:', {
      apiUrl: config.apiUrl || 'not set',
      accelerometerFrequency: config.accelerometerFrequency || 'default',
      barometricFrequency: config.barometricFrequency || 'default',
      gpsFrequency: config.gpsFrequency || 'default',
      batchInterval: config.batchInterval || 'default',
    });

    // Update config with defaults
    this.config = {
      apiUrl: config.apiUrl || '',
      apiKey: config.apiKey || '',
      accelerometerFrequency: config.accelerometerFrequency || 1,
      barometricFrequency: config.barometricFrequency || 1,
      gpsFrequency: config.gpsFrequency || 1,
      batchInterval: config.batchInterval || 30000,
    };

    // Initialize services
    this.dataCollector = new DataCollector(
      this.config.accelerometerFrequency,
      this.config.barometricFrequency,
      this.config.gpsFrequency
    );

    this.apiClient = new APIClient(
      this.config.apiUrl,
      this.config.apiKey || ''
    );

    this.backgroundTaskManager = new BackgroundTaskManager();
    this.backgroundTaskManager.initialize(
      this.dataCollector,
      this.apiClient,
      this.config.batchInterval
    );

    this.isInitialized = true;
    console.log('[SensorSDK] Initialization complete');
  }

  /**
   * Start collecting and sending sensor data
   */
  async start(): Promise<boolean> {
    if (this.isRunning) {
      console.warn('[SensorSDK] SDK is already running');
      return true;
    }

    if (this.isStarting) {
      console.warn('[SensorSDK] SDK is currently starting, please wait');
      return false;
    }

    if (!this.isInitialized) {
      console.error(
        '[SensorSDK] SDK not initialized. Call initialize() first.'
      );
      return false;
    }

    if (!this.dataCollector || !this.apiClient || !this.backgroundTaskManager) {
      console.error(
        '[SensorSDK] SDK services not properly initialized.'
      );
      return false;
    }

    this.isStarting = true;

    try {
      // Request location permission
      console.log('[SensorSDK] Requesting location permission...');
      const permissionStatus = await this.permissionsManager.requestLocationPermission();

      if (permissionStatus !== 'granted') {
        console.error(
          `[SensorSDK] Location permission not granted: ${permissionStatus}`
        );
        return false;
      }

      console.log('[SensorSDK] Location permission granted');

      // Start data collection
      console.log('[SensorSDK] Starting data collection...');
      this.dataCollector.start();

      // Start background task
      console.log('[SensorSDK] Starting background task...');
      this.backgroundTaskManager.start();

      this.isRunning = true;
      console.log('[SensorSDK] SDK started successfully');

      return true;
    } catch (error) {
      console.error('[SensorSDK] Error starting SDK:', error);
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop collecting and sending sensor data
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('[SensorSDK] SDK is not running');
      return;
    }

    try {
      console.log('[SensorSDK] Stopping SDK...');

      if (this.backgroundTaskManager) {
        this.backgroundTaskManager.stop();
      }

      if (this.dataCollector) {
        this.dataCollector.stop();
      }

      this.isRunning = false;
      console.log('[SensorSDK] SDK stopped');
    } catch (error) {
      console.error('[SensorSDK] Error stopping SDK:', error);
    }
  }

  /**
   * Clean up all resources and reset SDK to uninitialized state
   */
  destroy(): void {
    console.log('[SensorSDK] Destroying SDK...');

    if (this.isRunning) {
      this.stop();
    }

    this.dataCollector = null;
    this.apiClient = null;
    this.backgroundTaskManager = null;
    this.isInitialized = false;
    this.isStarting = false;

    console.log('[SensorSDK] SDK destroyed');
  }

  /**
   * Update SDK configuration without restarting
   */
  configure(config: Partial<SensorSDKConfig>): void {
    console.log('[SensorSDK] Updating configuration:', config);

    // Update API configuration if provided (combine both checks to avoid stale state)
    if ((config.apiUrl || config.apiKey) && this.apiClient) {
      const newApiUrl = config.apiUrl || this.config.apiUrl;
      const newApiKey = config.apiKey || this.config.apiKey || '';
      this.apiClient.configure(newApiUrl, newApiKey);
      if (config.apiUrl) this.config.apiUrl = config.apiUrl;
      if (config.apiKey) this.config.apiKey = config.apiKey;
    }

    // Update sampling frequencies if provided
    if (
      (config.accelerometerFrequency ||
        config.barometricFrequency ||
        config.gpsFrequency) &&
      this.dataCollector
    ) {
      this.dataCollector.updateFrequencies(
        config.accelerometerFrequency || this.config.accelerometerFrequency || 1,
        config.barometricFrequency || this.config.barometricFrequency || 1,
        config.gpsFrequency || this.config.gpsFrequency || 1
      );

      if (config.accelerometerFrequency)
        this.config.accelerometerFrequency = config.accelerometerFrequency;
      if (config.barometricFrequency)
        this.config.barometricFrequency = config.barometricFrequency;
      if (config.gpsFrequency)
        this.config.gpsFrequency = config.gpsFrequency;
    }

    // Update batch interval if provided
    if (config.batchInterval && this.backgroundTaskManager) {
      this.backgroundTaskManager.setBatchInterval(config.batchInterval);
      this.config.batchInterval = config.batchInterval;
    }

    console.log('[SensorSDK] Configuration updated');
  }

  /**
   * Check if SDK is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if SDK is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): SensorSDKConfig {
    return { ...this.config };
  }

  /**
   * Check location permission status without prompting
   */
  async checkLocationPermission(): Promise<PermissionStatus> {
    return await this.permissionsManager.checkLocationPermission();
  }
}
