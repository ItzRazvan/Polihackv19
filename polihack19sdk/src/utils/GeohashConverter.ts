import geohash from 'latlon-geohash';

/**
 * Converts GPS coordinates to geohash
 * Precision level 5-6 provides approximately 1km x 1km accuracy
 * Precision 5: ~2.4km x 1.2km
 * Precision 6: ~0.6km x 0.6km (best for 1km x 1km requirement)
 */
export class GeohashConverter {
  private static readonly GEOHASH_PRECISION = 6; // ~0.6km x 0.6km

  /**
   * Convert latitude/longitude to geohash
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Geohash string
   */
  static toGeohash(latitude: number, longitude: number): string {
    try {
      const hash = geohash.encode(latitude, longitude, this.GEOHASH_PRECISION);
      return hash;
    } catch (error) {
      console.error('[GeohashConverter] Error converting to geohash:', error);
      return '';
    }
  }

  /**
   * Decode geohash back to coordinates (for reference)
   * @param hash - Geohash string
   * @returns Object with latitude and longitude
   */
  static fromGeohash(
    hash: string
  ): { latitude: number; longitude: number } | null {
    try {
      const [latitude, longitude] = geohash.decode(hash);
      return { latitude, longitude };
    } catch (error) {
      console.error('[GeohashConverter] Error decoding geohash:', error);
      return null;
    }
  }

  /**
   * Get precision information
   */
  static getPrecisionInfo() {
    return {
      precision: this.GEOHASH_PRECISION,
      description: 'Precision 6 provides approximately 0.6km x 0.6km accuracy',
      coverageInfo: 'Covers roughly 1km x 1km area for privacy',
    };
  }
}
