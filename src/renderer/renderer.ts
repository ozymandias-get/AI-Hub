const splashScreen = document.getElementById('splash-screen')!;
const errorScreen = document.getElementById('error-screen')!;
const retryButton = document.getElementById('retry-button')!;
const openBrowserButton = document.getElementById('open-browser-button')!;

window.addEventListener('DOMContentLoaded', () => {
  splashScreen.classList.add('active');
});

retryButton.addEventListener('click', () => {
  errorScreen.classList.add('hidden');
  splashScreen.classList.remove('done', 'hidden');
  splashScreen.classList.add('active');
  window.chatgptDesktop.retryLoad();
});

openBrowserButton.addEventListener('click', () => {
  window.chatgptDesktop.openExternal(window.chatgptDesktop.chatgptUrl);
});
