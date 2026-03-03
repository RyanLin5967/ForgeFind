document.body.classList.add('notransition');

window.addEventListener('load', () => {
    document.body.classList.remove('notransition');
});
document.getElementById('select-img').addEventListener('click', () => {
  document.getElementById('imginput').click();
});