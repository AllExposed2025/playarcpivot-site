const modeButtons = document.querySelectorAll('.mode-format-button');
const backButton = document.querySelector('.mode-back-button');

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedMode = button.dataset.mode;

    if (selectedMode) {
      sessionStorage.setItem('ap_mode', selectedMode);
    }

    button.classList.remove('is-fired');
    void button.offsetWidth;
    button.classList.add('is-fired');

    setTimeout(() => {
      window.location.href = 'arena.html';
    }, 220);
  });
});

if (backButton) {
  backButton.addEventListener('click', (event) => {
    const targetHref = backButton.getAttribute('href');

    if (!targetHref) {
      return;
    }

    event.preventDefault();
    backButton.classList.remove('is-fired');
    void backButton.offsetWidth;
    backButton.classList.add('is-fired');

    setTimeout(() => {
      window.location.href = targetHref;
    }, 220);
  });
}