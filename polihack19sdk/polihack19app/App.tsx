import { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SensorSDK, type SensorSDKConfig } from 'react-native-polihack19sdk';

type AppButtonProps = {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  variant: 'primary' | 'success' | 'danger' | 'accent';
};

function AppButton({ title, onPress, disabled = false, variant }: AppButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.buttonBase,
        styles[`${variant}Button`],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export default function App() {
  const sdkRef = useRef(new SensorSDK());
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [config, setConfig] = useState<SensorSDKConfig>({
    apiUrl: 'https://us-central1-polihack19.cloudfunctions.net/sensor_api/api/readings',
    apiKey: 'pk_live_he7uu4tv0if3noniryk6qmdc245xwpacp',
    accelerometerFrequency: 500,
    barometricFrequency: 500,
    gpsFrequency: 500,
    batchInterval: 3000,
  });

  // Initialize SDK on mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await sdkRef.current.initialize(config);
        setStatus('SDK initialized. Press Start to begin collection.');
      } catch (error) {
        setStatus(`Initialization error: ${error}`);
      }
    };

    initializeSDK();
  }, []);

  useEffect(() => {
    const unsubscribe = sdkRef.current.onConfigChange((updatedConfig) => {
      setConfig(updatedConfig);
    });

    return unsubscribe;
  }, []);

  const updateSDKConfig = (partialConfig: Partial<SensorSDKConfig>) => {
    sdkRef.current.configure(partialConfig);
    setConfig((previousConfig) => ({ ...previousConfig, ...partialConfig }));
  };
  
  const handleStart = async () => {
    try {
      const success = await sdkRef.current.start();
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
      sdkRef.current.stop();
      setIsRunning(false);
      setStatus('SDK stopped');
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const handleCheckPermission = async () => {
    try {
      const permission = await sdkRef.current.checkLocationPermission();
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
            <AppButton
              title="Check Permission"
              onPress={handleCheckPermission}
              variant="primary"
            />
          </View>
          <View style={styles.button}>
            <AppButton
              title={isRunning ? 'Running...' : 'Start Collection'}
              onPress={handleStart}
              disabled={isRunning}
              variant="success"
            />
          </View>
          <View style={styles.button}>
            <AppButton
              title="Stop Collection"
              onPress={handleStop}
              disabled={!isRunning}
              variant="danger"
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
        <AppButton
          title="Force Send Batch"
          onPress={async () => {
            try {
              updateSDKConfig({ batchInterval: 1 });
              handleStop();
              await handleStart();
              setStatus('Batch sent successfully');
            } catch (error) {
              setStatus(`Error sending batch: ${error}`);
            }
          }}
          variant="accent"
        />
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
  buttonBase: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
  },
  successButton: {
    backgroundColor: '#15803d',
  },
  dangerButton: {
    backgroundColor: '#b91c1c',
  },
  accentButton: {
    backgroundColor: '#0f766e',
    marginTop: 14,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
