let authInitialized = false;

// Initialize default admin user
function initializeDefaultUsers() {
    try {
        const users = getUsers();
        
        // Check if default admin exists
        const adminExists = users.some(u => u.email === 'hckthon2026@gmail.com');
        
        if (!adminExists) {
            const defaultAdmin = {
                id: 'admin_' + Date.now(),
                email: 'hckthon2026@gmail.com',
                password: 'hckthon2026',
                role: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                createdAt: new Date().toISOString()
            };
            users.push(defaultAdmin);
            saveUsers(users);
            console.log('Default admin created successfully');
        }
    } catch (error) {
        console.error('Error initializing default users:', error);
    }
}

// Get users from localStorage
function getUsers() {
    try {
        const usersData = localStorage.getItem('users');
        return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

// Save users to localStorage
function saveUsers(users) {
    try {
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        showToast('Error saving data. Please check your browser storage.', 'error');
        return false;
    }
}

// Get current logged-in user
function getCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error reading current user:', error);
        return null;
    }
}

// Save current user session
function saveCurrentUser(user) {
    try {
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    } catch (error) {
        console.error('Error saving current user:', error);
        return false;
    }
}

// Check if user is already logged in and redirect based on role
function checkExistingSession() {
    const currentUser = getCurrentUser();
    
    if (currentUser) {
        const currentPath = window.location.pathname;
        const isOnLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('/');
        
        if (isOnLoginPage) {
            try {
                console.log('User already logged in, redirecting based on role...');
                // Redirect based on user's current role
                if (currentUser.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (currentUser.role === 'student') {
                    window.location.href = 'user.html';
                }
            } catch (error) {
                console.error('Redirect error:', error);
                localStorage.removeItem('currentUser');
            }
        }
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show signup form
function showSignup() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.classList.remove('active');
    if (signupForm) signupForm.classList.add('active');
}

// Show login form
function showLogin() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    
    if (signupForm) signupForm.classList.remove('active');
    if (loginForm) loginForm.classList.add('active');
}

// Sanitize user input
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

// Validate email format
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Handle user signup
function handleSignup(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const studentId = sanitizeInput(formData.get('student_id'));
        const firstName = sanitizeInput(formData.get('first_name'));
        const lastName = sanitizeInput(formData.get('last_name'));
        const email = sanitizeInput(formData.get('email')).toLowerCase();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        
        // Validation
        if (!studentId || !firstName || !lastName || !email || !password) {
            showToast('Please fill in all fields', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        const users = getUsers();
        
        // Check for duplicate email
        if (users.some(u => u.email.toLowerCase() === email)) {
            showToast('Email already registered. Please login or use a different email.', 'error');
            if (submitBtn) submitBtn.disabled = false;
            setTimeout(() => showLogin(), 1500);
            return;
        }
        
        // Check for duplicate student ID
        if (users.some(u => u.studentId === studentId)) {
            showToast('Student ID already registered. Please use a different ID.', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        // Create new user (default role is student)
        const newUser = {
            id: 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            studentId: studentId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            role: 'student', // Default role
            status: 'pending',
            qrCode: null,
            profilePhoto: null,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        const saved = saveUsers(users);
        
        if (saved) {
            showToast('Registration successful! Your account is pending admin verification. Please login.', 'success');
            
            // Reset form and show login
            e.target.reset();
            setTimeout(() => showLogin(), 2000);
        } else {
            showToast('Failed to save user data. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        showToast('An error occurred during registration. Please try again.', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Handle user login with role-based redirection
function handleLogin(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    
    try {
        const formData = new FormData(e.target);
        const email = sanitizeInput(formData.get('email')).toLowerCase();
        const password = formData.get('password');
        
        console.log('Login attempt for email:', email);
        
        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        const users = getUsers();
        console.log('Total users in database:', users.length);
        
        const user = users.find(u => u.email.toLowerCase() === email && u.password === password);
        
        if (user) {
            console.log('Login successful for user:', user.email, 'Role:', user.role);
            const saved = saveCurrentUser(user);
            
            if (saved) {
                showToast('Login successful! Redirecting...', 'success');
                
                // Redirect based on user's CURRENT role (handles role changes)
                setTimeout(() => {
                    if (user.role === 'admin') {
                        console.log('Redirecting to admin dashboard');
                        window.location.href = 'admin.html';
                    } else if (user.role === 'student') {
                        console.log('Redirecting to student dashboard');
                        window.location.href = 'user.html';
                    } else {
                        // Fallback for unknown roles
                        console.log('Unknown role, redirecting to student dashboard');
                        window.location.href = 'user.html';
                    }
                }, 500);
            } else {
                showToast('Failed to save session. Please try again.', 'error');
                if (submitBtn) submitBtn.disabled = false;
            }
        } else {
            console.log('Login failed - invalid credentials');
            showToast('Invalid email or password! Please check your credentials.', 'error');
            if (submitBtn) submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login. Please try again.', 'error');
        if (submitBtn) submitBtn.disabled = false;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('toastNotification');
    
    if (toastEl && typeof bootstrap !== 'undefined') {
        const toastBody = toastEl.querySelector('.toast-body');
        const toastHeader = toastEl.querySelector('.toast-header');
        
        if (toastBody) toastBody.textContent = message;
        
        // Set icon based on type
        if (toastHeader) {
            const icon = toastHeader.querySelector('i');
            if (icon) {
                icon.className = '';
                switch(type) {
                    case 'success':
                        icon.className = 'fas fa-check-circle me-2 text-success';
                        break;
                    case 'error':
                        icon.className = 'fas fa-exclamation-circle me-2 text-danger';
                        break;
                    case 'warning':
                        icon.className = 'fas fa-exclamation-triangle me-2 text-warning';
                        break;
                    default:
                        icon.className = 'fas fa-info-circle me-2 text-info';
                }
            }
        }
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        // Fallback to alert
        alert(message);
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', function() {
    if (authInitialized) return;
    authInitialized = true;
    
    console.log('Auth system initializing...');
    
    // Initialize default admin user
    initializeDefaultUsers();
    
    // Check for existing session (with role-based redirect)
    checkExistingSession();
    
    // Set up event listeners
    const loginForm = document.getElementById('loginFormElement');
    const signupForm = document.getElementById('signupFormElement');
    const showSignupLink = document.getElementById('showSignupLink');
    const showLoginLink = document.getElementById('showLoginLink');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form listener attached');
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        console.log('Signup form listener attached');
    }
    
    if (showSignupLink) {
        showSignupLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSignup();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLogin();
        });
    }
    
    console.log('Auth system initialized successfully');
});

// Expose toggle function globally
window.togglePassword = togglePassword;