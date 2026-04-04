document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('time[datetime]').forEach(function (el) {
    var date = new Date(el.getAttribute('datetime'));
    if (!isNaN(date.getTime())) {
      el.textContent = new Intl.DateTimeFormat(navigator.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
  });
});
