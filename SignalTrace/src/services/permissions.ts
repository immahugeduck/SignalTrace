import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions';

export async function ensureAndroidSignalPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  // Only dangerous (runtime) permissions belong here. ACCESS_NETWORK_STATE and
  // INTERNET are normal permissions declared in the manifest, and
  // PACKAGE_USAGE_STATS is a special-access permission granted from system
  // Settings (see requestUsageAccess in trafficMonitor).
  const requiredPermissions = [
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
  ];

  const checks = await checkMultiple(requiredPermissions);
  const allGranted = Object.values(checks).every((status) => status === RESULTS.GRANTED);
  if (allGranted) {
    return true;
  }

  const request = await requestMultiple(requiredPermissions);
  return Object.values(request).every((status) => status === RESULTS.GRANTED);
}
