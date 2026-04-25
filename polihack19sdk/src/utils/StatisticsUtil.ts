/**
 * Statistical utility functions for on-device data processing
 */
export class StatisticsUtil {
  /**
   * Calculate median of an array of numbers
   * @param values - Array of numbers
   * @returns Median value
   */
  static calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0]!;

    // Sort values in ascending order
    const sorted = [...values].sort((a, b) => a - b);

    // Get middle value(s)
    const mid = Math.floor(sorted.length / 2);

    // If odd length, return middle value; if even, return average of two middle values
    if (sorted.length % 2 !== 0) {
      return sorted[mid]!;
    }
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }

  /**
   * Calculate mean (average) of an array of numbers
   * @param values - Array of numbers
   * @returns Mean value
   */
  static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  /**
   * Calculate standard deviation of an array of numbers
   * @param values - Array of numbers
   * @returns Standard deviation value
   */
  static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }
}
