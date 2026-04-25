const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withMonorepoAsyncStorage(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Notice the ../../ to correctly target the root node_modules!
      const mavenBlock = `maven { url("$rootDir/../../node_modules/@react-native-async-storage/async-storage/android/build/outputs/maven") }`;
      
      if (!config.modResults.contents.includes('async-storage/android/build/outputs/maven')) {
        config.modResults.contents = config.modResults.contents.replace(
          /mavenLocal\(\)/,
          `mavenLocal()\n        ${mavenBlock}`
        );
      }
    }
    return config;
  });
};