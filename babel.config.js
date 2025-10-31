module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Temporairement désactivé à cause de l'erreur react-native-worklets/plugin
      // 'react-native-reanimated/plugin',
    ],
  };
};
