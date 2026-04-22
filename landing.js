const landingButtons = document.querySelectorAll('.landing-button');

landingButtons.forEach((button) => {
  const targetHref = button.getAttribute('href');

  button.addEventListener('click', (event) => {
    if (!targetHref) return;

    event.preventDefault();
    button.classList.remove('is-fired');
    void button.offsetWidth;
    button.classList.add('is-fired');

    setTimeout(() => {
      window.location.href = targetHref;
    }, 240);
  });
});

const countdownElement = document.getElementById('landing-countdown');
let totalSeconds = 2 * 60 + 24;

function renderCountdown() {
  if (!countdownElement) return;

  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  countdownElement.textContent = `${minutes}:${seconds}`;
}

renderCountdown();

setInterval(() => {
  totalSeconds = totalSeconds > 0 ? totalSeconds - 1 : 2 * 60 + 24;
  renderCountdown();
}, 1000);
