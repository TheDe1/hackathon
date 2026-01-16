let currentUser = null;
let events = [];
let attendanceRecords = [];
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    isInitialized = true;
    console.log('Initializing user dashboard...');
    initializeUserDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

function initializeUserDashboard() {
    const userStr = localStorage.getItem('currentUser');
    
    if (!userStr) {
        console.log('No user session found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        if (!user || user.role !== 'student') {
            console.log('User is not a student, redirecting to login');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = user;
        console.log('Student logged in:', user.email);
        
        loadUserData();
        loadEventsData();
        loadAttendanceData();
        displayUserInfo();
        displayActiveEvents();
        displayAttendanceSummary();
        loadSection('home');
        
        console.log('User dashboard initialized successfully');
    } catch (e) {
        console.error('Error initializing user dashboard:', e);
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function loadUserData() {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUser = users.find(u => u.id === currentUser.id);
        if (updatedUser) {
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

function loadEventsData() {
    try {
        events = JSON.parse(localStorage.getItem('events') || '[]');
        console.log('Events loaded:', events.length);
    } catch (e) {
        console.error('Error loading events:', e);
        events = [];
    }
}

function loadAttendanceData() {
    try {
        const allAttendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        attendanceRecords = allAttendance.filter(a => a.studentId === currentUser.id);
        console.log('Attendance records loaded:', attendanceRecords.length);
    } catch (e) {
        console.error('Error loading attendance:', e);
        attendanceRecords = [];
    }
}

function displayUserInfo() {
    const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
    
    // Update navigation bar
    const navUserName = document.getElementById('navUserName');
    if (navUserName) navUserName.textContent = fullName;
    
    const navAvatar = document.getElementById('navAvatar');
    if (navAvatar) {
        if (currentUser.profilePhoto) {
            navAvatar.src = currentUser.profilePhoto;
        } else {
            navAvatar.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect fill=%27%23ddd%27 width=%2740%27 height=%2740%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2716%27%3E' + currentUser.firstName.charAt(0) + '%3C/text%3E%3C/svg%3E';
        }
        navAvatar.onerror = function() { 
            this.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect fill=%27%23ddd%27 width=%2740%27 height=%2740%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2716%27%3E' + currentUser.firstName.charAt(0) + '%3C/text%3E%3C/svg%3E';
        };
    }
    
    // Update welcome section
    const userName = document.getElementById('userName');
    if (userName) userName.textContent = fullName;
    
    const studentId = document.getElementById('studentId');
    if (studentId) studentId.textContent = currentUser.studentId;
    
    const userEmail = document.getElementById('userEmail');
    if (userEmail) userEmail.textContent = currentUser.email;
    
    // Update status badge
    const statusBadge = document.getElementById('userStatus');
    if (statusBadge) {
        if (currentUser.status === 'verified') {
            statusBadge.textContent = 'Verified';
            statusBadge.className = 'status-badge verified';
        } else {
            statusBadge.textContent = 'Pending Verification';
            statusBadge.className = 'status-badge pending';
        }
    }
    
    // Update profile section
    const profileName = document.getElementById('profileName');
    if (profileName) profileName.textContent = fullName;
    
    const profileStudentId = document.getElementById('profileStudentId');
    if (profileStudentId) profileStudentId.textContent = `Student ID: ${currentUser.studentId}`;
    
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = currentUser.email;
    
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (currentUser.profilePhoto) {
            profileAvatar.src = currentUser.profilePhoto;
        } else {
            profileAvatar.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Crect fill=%27%23ddd%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2740%27%3E' + currentUser.firstName.charAt(0) + '%3C/text%3E%3C/svg%3E';
        }
        profileAvatar.onerror = function() { 
            this.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Crect fill=%27%23ddd%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2740%27%3E' + currentUser.firstName.charAt(0) + '%3C/text%3E%3C/svg%3E';
        };
    }
    
    const profileStatus = document.getElementById('profileStatus');
    if (profileStatus) {
        if (currentUser.status === 'verified') {
            profileStatus.textContent = 'Verified';
            profileStatus.className = 'status-badge verified';
        } else {
            profileStatus.textContent = 'Pending Verification';
            profileStatus.className = 'status-badge pending';
        }
    }
    
    // Update form fields
    const updateFirstName = document.getElementById('updateFirstName');
    if (updateFirstName) updateFirstName.value = currentUser.firstName;
    
    const updateLastName = document.getElementById('updateLastName');
    if (updateLastName) updateLastName.value = currentUser.lastName;
    
    const updateEmail = document.getElementById('updateEmail');
    if (updateEmail) updateEmail.value = currentUser.email;
    
    // Show/hide QR code section
    if (currentUser.status === 'verified' && currentUser.qrCode) {
        const qrSection = document.getElementById('qrSection');
        const pendingMessage = document.getElementById('pendingMessage');
        if (qrSection) qrSection.style.display = 'block';
        if (pendingMessage) pendingMessage.style.display = 'none';
        displayQRCode();
    } else {
        const qrSection = document.getElementById('qrSection');
        const pendingMessage = document.getElementById('pendingMessage');
        if (qrSection) qrSection.style.display = 'none';
        if (pendingMessage) pendingMessage.style.display = 'block';
    }
}

function displayQRCode() {
    const qrContainer = document.getElementById('studentQRCode');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    
    if (currentUser.qrCode) {
        const img = document.createElement('img');
        img.src = currentUser.qrCode;
        img.alt = 'Student QR Code';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        qrContainer.appendChild(img);
    }
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    };
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function displayActiveEvents() {
    const activeEvents = events.filter(e => e.status === 'active');
    const grid = document.getElementById('activeEventsGrid');
    
    if (!grid) return;
    
    if (activeEvents.length === 0) {
        grid.innerHTML = '<div class="no-events" style="text-align: center; padding: 2rem; color: #666;"><i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i><p>No active events at the moment</p></div>';
        return;
    }
    
    grid.innerHTML = activeEvents.map(event => `
        <div class="event-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; background: white;">
            <div class="event-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.2rem;">${event.name}</h3>
                <span class="event-status active" style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Active</span>
            </div>
            <div class="event-body">
                <p class="event-description" style="color: #666; margin-bottom: 1rem;">${event.description}</p>
                <div class="event-details">
                    <div class="detail" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-calendar" style="color: #007bff;"></i>
                        <span>${new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail" style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-clock" style="color: #007bff;"></i>
                        <span>${event.startTime} - ${event.endTime}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayAttendanceSummary() {
    const totalEvents = events.length;
    const attendedEvents = attendanceRecords.length;
    const attendanceRate = totalEvents > 0 ? Math.round((attendedEvents / totalEvents) * 100) : 0;
    
    const totalAttended = document.getElementById('totalAttended');
    if (totalAttended) totalAttended.textContent = attendedEvents;
    
    const attendanceRateEl = document.getElementById('attendanceRate');
    if (attendanceRateEl) attendanceRateEl.textContent = attendanceRate + '%';
    
    // Display recent attendance
    const recentAttendance = attendanceRecords.slice(-5).reverse();
    const tbody = document.getElementById('recentAttendanceBody');
    
    if (!tbody) return;
    
    if (recentAttendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data" style="text-align: center; padding: 2rem; color: #666;">No attendance records yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentAttendance.map(record => {
        const event = events.find(e => e.id === record.eventId);
        return `
            <tr>
                <td>${event ? event.name : 'Unknown Event'}</td>
                <td>${new Date(record.timestamp).toLocaleDateString()}</td>
                <td>${new Date(record.timestamp).toLocaleTimeString()}</td>
                <td><span class="status-badge verified" style="background: #28a745; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">Present</span></td>
            </tr>
        `;
    }).join('');
}

function loadSection(section) {
    console.log('Loading section:', section);
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    const sectionId = `${section}-section`;
    const element = document.getElementById(sectionId);
    if (element) {
        element.classList.add('active');
    }
    
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="#${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    if (section === 'profile') {
        loadUserData();
        displayUserInfo();
    }
}

// Avatar upload handler
const avatarUpload = document.getElementById('avatarUpload');
if (avatarUpload) {
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Image size must be less than 2MB', 'error');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageData = event.target.result;
                
                const profileAvatar = document.getElementById('profileAvatar');
                if (profileAvatar) profileAvatar.src = imageData;
                
                const navAvatar = document.getElementById('navAvatar');
                if (navAvatar) navAvatar.src = imageData;
                
                currentUser.profilePhoto = imageData;
                updateUserInDatabase(currentUser);
                
                showNotification('Profile photo updated successfully', 'success');
            };
            reader.onerror = function() {
                showNotification('Error reading image file', 'error');
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateProfile(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('updateFirstName').value.trim();
    const lastName = document.getElementById('updateLastName').value.trim();
    const email = document.getElementById('updateEmail').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Password change validation
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            showNotification('Please enter your current password', 'error');
            return;
        }
        
        if (currentPassword !== currentUser.password) {
            showNotification('Current password is incorrect', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        currentUser.password = newPassword;
    }
    
    // Update user info
    currentUser.firstName = firstName;
    currentUser.lastName = lastName;
    currentUser.email = email;
    
    updateUserInDatabase(currentUser);
    
    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    displayUserInfo();
    showNotification('Profile updated successfully', 'success');
}

function updateUserInDatabase(updatedUser) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === updatedUser.id);
        
        if (index !== -1) {
            users[index] = updatedUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return true;
        }
        return false;
    } catch (e) {
        console.error('Error updating user in database:', e);
        showNotification('Error updating profile', 'error');
        return false;
    }
}

function downloadQRCode() {
    if (!currentUser.qrCode) {
        showNotification('QR Code not available', 'error');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = currentUser.qrCode;
        link.download = `${currentUser.studentId}_QRCode.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('QR Code downloaded', 'success');
    } catch (e) {
        console.error('Error downloading QR code:', e);
        showNotification('Error downloading QR code', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification show ${type}`;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 300);
        }, 3000);
    } else {
        alert(message);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}