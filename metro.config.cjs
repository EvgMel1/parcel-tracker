const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // подключаем SVG transformer
  config.transformer.babelTransformerPath = require.resolve(
    "react-native-svg-transformer"
  );

  // исключаем SVG из ассетов
  config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== "svg"
  );

  // добавляем SVG как код
  config.resolver.sourceExts.push("svg");

  return config;
})();
