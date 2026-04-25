import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SensorSDK } from '../SensorSDK';
import { DataCollector } from '../services/DataCollector';
import { APIClient } from '../services/APIClient';
import { BackgroundTaskManager } from '../services/BackgroundTaskManager';
import type { SensorSDKConfig, BatchData } from '../types';

// Mock react-native-sensors
jest.mock('react-native-sensors', () => ({
  accelerometer: {
    subscribe: jest.fn((_callback: unknown) => ({
      unsubscribe: jest.fn(),
    })),
  },
  barometer: {
    subscribe: jest.fn((_callback: unknown) => ({
      unsubscribe: jest.fn(),
    })),
  },
}));

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: {
    IOS: { LOCATION_WHEN_IN_USE: 'ios.permission' },
    ANDROID: { ACCESS_FINE_LOCATION: 'android.permission' },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
}));

// Mock react-native-background-timer
jest.mock('react-native-background-timer', () => ({
  setInterval: jest.fn((callback: unknown, interval: unknown) => {
    return setInterval(callback as () => void, interval as number);
  }),
  clearInterval: jest.fn((id: unknown) => {
    clearInterval(id as number);
  }),
}));

describe('SensorSDK', () => {
  let sdk: SensorSDK;

  beforeEach(() => {
    sdk = new SensorSDK();
    jest.clearAllMocks();
  });

  it('should initialize with config', async () => {
    const config: SensorSDKConfig = {
      apiUrl: 'https://api.example.com/data',
      apiKey: 'test-key',
      accelerometerFrequency: 2,
      barometricFrequency: 1,
      gpsFrequency: 0.5,
      batchInterval: 15000,
    };

    await sdk.initialize(config);

    const currentConfig = sdk.getConfig();
    expect(currentConfig.apiUrl).toBe('https://api.example.com/data');
    expect(currentConfig.apiKey).toBe('test-key');
    expect(currentConfig.accelerometerFrequency).toBe(2);
    expect(currentConfig.batchInterval).toBe(15000);
  });

  it('should use default values when not provided', async () => {
    const config: SensorSDKConfig = {
      apiUrl: 'https://api.example.com/data',
    };

    await sdk.initialize(config);

    const currentConfig = sdk.getConfig();
    expect(currentConfig.accelerometerFrequency).toBe(1);
    expect(currentConfig.barometricFrequency).toBe(1);
    expect(currentConfig.gpsFrequency).toBe(1);
    expect(currentConfig.batchInterval).toBe(30000);
  });

  it('should not be running initially', () => {
    expect(sdk.getIsRunning()).toBe(false);
  });

  it('should update configuration', async () => {
    const initialConfig: SensorSDKConfig = {
      apiUrl: 'https://api.example.com/data',
      batchInterval: 30000,
    };

    await sdk.initialize(initialConfig);
    sdk.configure({
      apiUrl: 'https://new-api.example.com/data',
      batchInterval: 60000,
    });

    const updatedConfig = sdk.getConfig();
    expect(updatedConfig.apiUrl).toBe('https://new-api.example.com/data');
    expect(updatedConfig.batchInterval).toBe(60000);
  });
});

describe('DataCollector', () => {
  let collector: DataCollector;

  beforeEach(() => {
    collector = new DataCollector(1, 1, 1);
  });

  it('should initialize with default frequencies', () => {
    const collector2 = new DataCollector();
    expect(collector2).toBeDefined();
  });

  it('should initialize with custom frequencies', () => {
    const collector2 = new DataCollector(2, 3, 4);
    expect(collector2).toBeDefined();
  });

  it('should return empty buffer initially', () => {
    const buffer = collector.getAndClearBuffer();
    expect(buffer.accelerometerReadings).toEqual([]);
    expect(buffer.barometerReadings).toEqual([]);
    expect(buffer.altitudeReadings).toEqual([]);
  });

  it('should update frequencies', () => {
    expect(() => {
      collector.updateFrequencies(2, 3, 4);
    }).not.toThrow();
  });
});

describe('APIClient', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient('https://api.example.com/data', 'test-key');
  });

  it('should initialize with URL and key', () => {
    expect(apiClient).toBeDefined();
  });

  it('should handle empty batch data', async () => {
    const batch: BatchData = {
      timestamp: Date.now(),
      accelerometerReadings: [],
      barometerReadings: [],
      altitudeReadings: [],
    };

    const result = await apiClient.sendBatch(batch);
    expect(result).toBe(true);
  });

  it('should reconfigure API settings', () => {
    expect(() => {
      apiClient.configure(
        'https://new-api.example.com/data',
        'new-key'
      );
    }).not.toThrow();
  });
});

describe('BackgroundTaskManager', () => {
  let manager: BackgroundTaskManager;
  let dataCollector: DataCollector;
  let apiClient: APIClient;

  beforeEach(() => {
    manager = new BackgroundTaskManager();
    dataCollector = new DataCollector();
    apiClient = new APIClient('https://api.example.com/data');
  });

  it('should initialize', () => {
    manager.initialize(dataCollector, apiClient, 30000);
    expect(manager).toBeDefined();
  });

  it('should not be running initially', () => {
    expect(manager.isRunning()).toBe(false);
  });

  it('should update batch interval', () => {
    manager.initialize(dataCollector, apiClient, 30000);
    expect(() => {
      manager.setBatchInterval(60000);
    }).not.toThrow();
  });
});
