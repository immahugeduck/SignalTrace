import Config from 'react-native-config';

export const appConfig = {
  openCellIdApiKey: Config.OPENCELLID_API_KEY ?? '',
  wigleApiToken: Config.WIGLE_API_TOKEN ?? '',
  signalTraceApiBaseUrl: Config.SIGNALTRACE_API_BASE_URL ?? '',
};

export const hasTowerApisConfigured =
  appConfig.openCellIdApiKey.length > 0 || appConfig.wigleApiToken.length > 0;
