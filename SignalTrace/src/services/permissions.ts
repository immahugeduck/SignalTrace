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

  const requiredPermissions = [
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
    PERMISSIONS.ANDROID.ACCESS_NETWORK_STATE,
  ];

  const checks = await checkMultiple(requiredPermissions);
  const allGranted = Object.values(checks).every((status) => status === RESULTS.GRANTED);
  if (allGranted) {
    return true;
  }

  const request = await requestMultiple(requiredPermissions);
  return Object.values(request).every((status) => status === RESULTS.GRANTED);
}
