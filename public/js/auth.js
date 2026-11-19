
const API_URL = '/api/auth';

function showMessage(message, type) {
    const messageBox = document.getElementById('authMessage');

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `auth-message ${type}`;
}

document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.textContent = isPassword ? 'Ẩn' : 'Hiện';
    });
});

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async event => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const button = document.getElementById('loginButton');

        button.disabled = true;
        button.textContent = 'Đang đăng nhập...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Đăng nhập thất bại');
            }

            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.data));

            showMessage('Đăng nhập thành công!', 'success');

            window.location.href = '/dashboard.html';
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = 'Đăng nhập';
        }
    });
}

const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async event => {
        event.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const button = document.getElementById('registerButton');

        if (password.length < 8) {
            showMessage('Mật khẩu phải có ít nhất 8 ký tự', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        button.disabled = true;
        button.textContent = 'Đang tạo tài khoản...';

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName,
                    username,
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Đăng ký thất bại');
            }

            showMessage('Đăng ký thành công! Đang chuyển đến đăng nhập...', 'success');

            registerForm.reset();

            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            button.disabled = false;
            button.textContent = 'Tạo tài khoản';
        }
    });
}
