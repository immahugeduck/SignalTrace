import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  Permission,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions';

/**
 * A granted result includes both GRANTED and (on OS versions where the
 * permission doesn't exist) UNAVAILABLE, which we treat as "nothing to ask".
 */
function isSatisfied(status: string): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE;
}

async function ensure(permissions: Permission[]): Promise<boolean> {
  const checks = await checkMultiple(permissions);
  if (Object.values(checks).every(isSatisfied)) {
    return true;
  }
  const request = await requestMultiple(permissions);
  return Object.values(request).every(isSatisfied);
}

export async function ensureAndroidSignalPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // Only dangerous (runtime) permissions belong here. ACCESS_NETWORK_STATE and
  // INTERNET are normal permissions declared in the manifest, and
  // PACKAGE_USAGE_STATS is a special-access permission granted from system
  // Settings (see requestUsageAccess in trafficMonitor).
  return ensure([
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
  ]);
}

/**
 * Requests the permissions needed for Bluetooth LE scanning. On Android 12+
 * these are the BLUETOOTH_SCAN/CONNECT runtime permissions; on older releases
 * BLE scanning is gated by location, so we fall back to fine location. The
 * permission constants report UNAVAILABLE on OS versions that lack them, which
 * {@link ensure} treats as already satisfied.
 */
export async function ensureBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
  if (apiLevel >= 31) {
    return ensure([
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    ]);
  }

  return ensure([PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
}
