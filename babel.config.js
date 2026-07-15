module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // worklets プラグイン（reanimated 4 系）は必ず最後に置く
      'react-native-worklets/plugin',
    ],
  };
};
