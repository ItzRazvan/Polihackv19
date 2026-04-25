import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import type { PermissionStatus } from '../types';

/**
 * Manages location permissions for the SDK
 */
export class PermissionsManager {
  /**
   * Request location permission from the user
   * On Android: requests FINE_LOCATION and COARSE_LOCATION
   * On iOS: requests location when in use (will request always if needed)
   */
  static async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return 'granted';
        case RESULTS.DENIED:
          return 'denied';
        case RESULTS.BLOCKED:
          return 'blocked';
        case RESULTS.UNAVAILABLE:
          return 'unavailable';
        default:
          return 'denied';
      }
    } catch (error) {
      console.error('[PermissionsManager] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Check current location permission status without prompting
   */
  static async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);

      switch (result) {
        case RESULTS.GRANTED:
          return 'granted';
        case RESULTS.DENIED:
          return 'denied';
        case RESULTS.BLOCKED:
          return 'blocked';
        case RESULTS.UNAVAILABLE:
          return 'unavailable';
        default:
          return 'denied';
      }
    } catch (error) {
      console.error('[PermissionsManager] Error checking permission:', error);
      return 'unavailable';
    }
  }
}
