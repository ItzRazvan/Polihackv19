import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, ScrollView } from 'react-native';
import { SensorSDK, type SensorSDKConfig } from 'react-native-polihack19sdk';

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [config] = useState<SensorSDKConfig>({
    apiUrl: 'https://your-api-endpoint.com/sensor-data',
    accelerometerFrequency: 1,
    barometricFrequency: 1,
    gpsFrequency: 1,
    batchInterval: 30000,
  });

  // Initialize SDK on mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdk = new SensorSDK();
        await sdk.initialize(config);
        setStatus('SDK initialized. Press Start to begin collection.');
      } catch (error) {
        setStatus(`Initialization error: ${error}`);
      }
    };

    initializeSDK();
  }, []);

  const handleStart = async () => {
    try {
      const sdk = new SensorSDK();
      await sdk.initialize(config);

      const success = await sdk.start();
      if (success) {
        setIsRunning(true);
        setStatus('Collecting sensor data...');
      } else {
        setStatus('Failed to start SDK');
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleStop = () => {
    try {
      const sdk = new SensorSDK();
      sdk.stop();
      setIsRunning(false);
      setStatus('SDK stopped');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleCheckPermission = async () => {
    try {
      const sdk = new SensorSDK();
      const permission = await sdk.checkLocationPermission();
      setPermissionStatus(permission);
    } catch (error) {
      setPermissionStatus(`Error: ${error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sensor Data Collection SDK</Text>

        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>{status}</Text>

        <Text style={styles.sectionTitle}>Permission Status</Text>
        <Text style={styles.statusText}>
          Location: {permissionStatus}
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.button}>
            <Button
              title="Check Permission"
              onPress={handleCheckPermission}
              color="#2196F3"
            />
          </View>
          <View style={styles.button}>
            <Button
              title={isRunning ? 'Running...' : 'Start Collection'}
              onPress={handleStart}
              disabled={isRunning}
              color="#4CAF50"
            />
          </View>
          <View style={styles.button}>
            <Button
              title="Stop Collection"
              onPress={handleStop}
              disabled={!isRunning}
              color="#f44336"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Configuration</Text>
        <View style={styles.configBox}>
          <Text style={styles.configText}>
            API URL: {config.apiUrl || 'Not set'}
          </Text>
          <Text style={styles.configText}>
            Accelerometer: {config.accelerometerFrequency} Hz
          </Text>
          <Text style={styles.configText}>
            Barometer: {config.barometricFrequency} Hz
          </Text>
          <Text style={styles.configText}>
            GPS: {config.gpsFrequency} Hz
          </Text>
          <Text style={styles.configText}>
            Batch Interval: {config.batchInterval}ms
          </Text>
        </View>

        <Text style={styles.infoText}>
          Ensure your device has location permissions enabled. The SDK will
          automatically request location permission when started. API batches
          will be sent every {(config.batchInterval || 30000) / 1000} seconds to the
          configured API endpoint.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 5,
    color: '#1565c0',
  },
  buttonContainer: {
    marginTop: 15,
    gap: 10,
  },
  button: {
    marginVertical: 5,
  },
  configBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  configText: {
    fontSize: 13,
    color: '#555',
    marginVertical: 3,
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 20,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
