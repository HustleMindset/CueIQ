const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Metro config loaded:', config);
  }
  return config;
})();