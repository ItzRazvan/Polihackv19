import type { BatchData, APIResponse } from '../types';

/**
 * Handles API communication for sending sensor data batches
 */
export class APIClient {
  private apiUrl: string = '';
  private apiKey: string = '';

  constructor(apiUrl: string, apiKey: string = '') {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Update API configuration
   */
  configure(apiUrl: string, apiKey: string = ''): void {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Send a batch of sensor data to the API
   * Returns APIResponse if successful, null otherwise
   */
  async sendBatch(batchData: BatchData): Promise<APIResponse | null> {
    if (!this.apiUrl) {
      console.error('[APIClient] API URL not configured');
      return null;
    }

    // If no data in batch, skip sending
    if (
      batchData.accelerometerReadings.length === 0 &&
      batchData.barometerReadings.length === 0 &&
      batchData.altitudeReadings.length === 0
    ) {
      return null;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key to headers if configured
      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        console.error(
          `[APIClient] API returned status ${response.status}: ${response.statusText}`
        );
        return null;
      }

      // Parse the JSON response
      const data = await response.json() as APIResponse;

      console.log(
        '[APIClient] Batch sent successfully. Accelerometer readings:',
        batchData.accelerometerReadings.length,
        'Barometer readings:',
        batchData.barometerReadings.length,
        'Altitude readings:',
        batchData.altitudeReadings.length
      );

      return data;
    } catch (error) {
      console.error('[APIClient] Error sending batch:', error);
      return null;
    }
  }
}

