// Aplica el modo claro u oscuro elegido antes de pintar la página (core/services/tema.service.ts).
try {
  var tema = localStorage.getItem('ica-tema');
  if (tema === 'claro' || tema === 'oscuro') document.documentElement.dataset.tema = tema;
} catch (e) {}
