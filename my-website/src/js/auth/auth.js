class Auth {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupAuthForms();
    }

    checkAuth() {
        const user = localStorage.getItem('user');
        if (user) {
            this.user = JSON.parse(user);
            this.updateAuthUI();
        }
    }

    setupAuthForms() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    updateAuthUI() {
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            if (this.user) {
                authSection.innerHTML = `
                    <span class="user-info">
                        <img src="${this.user.avatar || 'assets/default-avatar.png'}" alt="Avatar">
                        ${this.user.username}
                    </span>
                    <button onclick="auth.logout()" class="auth-btn">Logout</button>
                `;
            } else {
                authSection.innerHTML = `
                    <a href="login.html" class="auth-btn">Login</a>
                    <a href="register.html" class="auth-btn">Register</a>
                `;
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                window.location.href = 'index.html';
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('verification-message').classList.remove('hidden');
                document.getElementById('register-form').reset();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }

    async verifyEmail(token) {
        try {
            const response = await fetch(`http://localhost:3000/auth/verify/${token}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Verification error:', error);
            return { success: false, message: 'Verification failed' };
        }
    }

    logout() {
        this.user = null;
        localStorage.removeItem('user');
        this.updateAuthUI();
        window.location.href = 'index.html';
    }
}

// Initialize authentication
const auth = new Auth();