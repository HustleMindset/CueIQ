module.exports = {
  expo: {
    name: 'CueIQ',
    slug: 'CueIQ',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    main: './App.js', // Explicitly match the file name and path
    ios: {
      bundleIdentifier: 'com.FirasAwad.cueiq', // Replace with your unique identifier
      buildNumber: '1.0.0',
    },
    android: {
      package: 'com.FirasAwad.cueiq', // Replace with your unique identifier, matching iOS
      versionCode: 1,
    },
  },
};