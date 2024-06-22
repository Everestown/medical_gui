document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', {
        method: 'POST',
        credentials: 'include'
    })
        .then(response => {
            if (response.ok) {
                console.log("Успешный выход из системы. Перенаправление на страницу входа.")
                window.location.href = '/login';
            } else {
                throw new Error('Проблема при выходе из системы');
            }
        })
        .catch(error => console.error('Ошибка:', error));
});

function checkSession() {
    fetch('/check-session', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                window.location.href = '/login';
            }
        })
        .catch(error => console.error('Ошибка проверки сессии:', error));
}

setInterval(checkSession, 100);
