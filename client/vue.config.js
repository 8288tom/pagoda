const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: {
        runtimeErrors: error => {
          const ignoreErrors = [
            'ResizeObserver loop completed with undelivered notifications.'
          ];
          return !ignoreErrors.includes(error.message);
        }
      }
    }
  }
});
