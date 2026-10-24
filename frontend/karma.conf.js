// Configuración de Karma para las pruebas unitarias de la interfaz.
// Referencia: https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      // Opciones de Jasmine: https://jasmine.github.io/api/edge/Configuration.html
      jasmine: {},
    },
    jasmineHtmlReporter: {
      suppressAll: true // evita trazas duplicadas en la consola
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/frontend'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    // Para CI y contenedores: Chrome sin interfaz y sin sandbox.
    customLaunchers: {
      ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox'] },
    },
    restartOnFileChange: true
  });
};
