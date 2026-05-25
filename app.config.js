// app.config.js — extends app.json to inject Google Maps API key from env (kept out of git via .env / EAS Secrets)
const baseConfig = require('./app.json').expo

module.exports = {
  ...baseConfig,
  android: {
    ...baseConfig.android,
    // On EAS the GOOGLE_SERVICES_JSON file env var resolves to a path on the
    // build server; locally fall back to the gitignored file on disk.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? baseConfig.android.googleServicesFile,
    config: {
      ...(baseConfig.android && baseConfig.android.config),
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
  },
  ios: {
    ...baseConfig.ios,
    config: {
      ...(baseConfig.ios && baseConfig.ios.config),
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    },
  },
}
