let currentAdmin = null;
let users = [];
let events = [];
let attendance = [];
let currentFilter = 'all';
let scannerActive = false;
let selectedEvent = null;
let scanInterval = null;
let isInitialized = false;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    isInitialized = true;
    console.log('Initializing admin dashboard...');
    initializeAdminDashboard();
});

function initializeAdminDashboard() {
    const userStr = localStorage.getItem('currentUser');
    
    if (!userStr) {
        console.log('No user session found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        if (!user || user.role !== 'admin') {
            console.log('User is not admin, redirecting to login');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }
        
        currentAdmin = user;
        console.log('Admin logged in:', user.email);
        
        document.getElementById('adminName').textContent = `${user.firstName} ${user.lastName}`;
        updateAdminAvatar();
        
        loadAllData();
        updateDashboardStats();
        initializeCharts();
        loadSection('dashboard');
        
        // Setup admin avatar upload
        setupAdminAvatarUpload();
        
        console.log('Admin dashboard initialized successfully');
    } catch (e) {
        console.error('Error initializing admin dashboard:', e);
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function setupAdminAvatarUpload() {
    const avatarUpload = document.getElementById('adminAvatarUpload');
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
                    
                    currentAdmin.profilePhoto = imageData;
                    updateAdminInDatabase(currentAdmin);
                    updateAdminAvatar();
                    
                    showNotification('Profile photo updated successfully', 'success');
                };
                reader.onerror = function() {
                    showNotification('Error reading image file', 'error');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function updateAdminAvatar() {
    const avatarUrl = currentAdmin.profilePhoto || 
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect fill='%23ddd' width='150' height='150'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='60'%3E${currentAdmin.firstName.charAt(0)}%3C/text%3E%3C/svg%3E`;
    
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar) headerAvatar.src = avatarUrl;
    
    const profileAvatar = document.getElementById('adminProfileAvatar');
    if (profileAvatar) profileAvatar.src = avatarUrl;
}

function updateAdminProfile(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('adminUpdateFirstName').value.trim();
    const lastName = document.getElementById('adminUpdateLastName').value.trim();
    const email = document.getElementById('adminUpdateEmail').value.trim();
    const currentPassword = document.getElementById('adminCurrentPassword').value;
    const newPassword = document.getElementById('adminNewPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (newPassword || confirmPassword) {
        if (!currentPassword) {
            showNotification('Please enter your current password', 'error');
            return;
        }
        
        if (currentPassword !== currentAdmin.password) {
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
        
        currentAdmin.password = newPassword;
    }
    
    currentAdmin.firstName = firstName;
    currentAdmin.lastName = lastName;
    currentAdmin.email = email;
    
    updateAdminInDatabase(currentAdmin);
    
    document.getElementById('adminCurrentPassword').value = '';
    document.getElementById('adminNewPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';
    
    document.getElementById('adminName').textContent = `${firstName} ${lastName}`;
    document.getElementById('adminProfileName').textContent = `${firstName} ${lastName}`;
    
    showNotification('Profile updated successfully', 'success');
}

function updateAdminInDatabase(updatedAdmin) {
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === updatedAdmin.id);
        
        if (index !== -1) {
            users[index] = updatedAdmin;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(updatedAdmin));
            return true;
        }
        return false;
    } catch (e) {
        console.error('Error updating admin in database:', e);
        showNotification('Error updating profile', 'error');
        return false;
    }
}

function loadAllData() {
    try {
        users = JSON.parse(localStorage.getItem('users') || '[]');
        events = JSON.parse(localStorage.getItem('events') || '[]');
        attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
        console.log('Data loaded - Users:', users.length, 'Events:', events.length, 'Attendance:', attendance.length);
    } catch (e) {
        console.error('Error loading data:', e);
        users = [];
        events = [];
        attendance = [];
    }
}

function loadSection(section) {
    console.log('Loading section:', section);
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sectionElement = document.getElementById(`${section}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="#${section}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    switch(section) {
        case 'users':
            loadUsersTable();
            break;
        case 'events':
            loadEventsTable();
            break;
        case 'attendance':
            loadScanAttendance();
            break;
        case 'profile':
            loadAdminProfile();
            break;
    }
}

function loadAdminProfile() {
    // Reload current admin data
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        currentAdmin = JSON.parse(userStr);
    }
    
    document.getElementById('adminProfileName').textContent = `${currentAdmin.firstName} ${currentAdmin.lastName}`;
    document.getElementById('adminProfileEmail').textContent = currentAdmin.email;
    document.getElementById('adminUpdateFirstName').value = currentAdmin.firstName;
    document.getElementById('adminUpdateLastName').value = currentAdmin.lastName;
    document.getElementById('adminUpdateEmail').value = currentAdmin.email;
    
    updateAdminAvatar();
}

function updateDashboardStats() {
    const students = users.filter(u => u.role === 'student');
    const pending = students.filter(u => u.status === 'pending');
    const verified = students.filter(u => u.status === 'verified');
    
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('pendingStudents').textContent = pending.length;
    document.getElementById('verifiedStudents').textContent = verified.length;
    document.getElementById('totalEvents').textContent = events.length;
    document.getElementById('totalAttendance').textContent = attendance.length;
}

function initializeCharts() {
    initializeAttendanceChart();
    initializeVerificationChart();
}

function initializeAttendanceChart() {
    const canvas = document.getElementById('attendanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const eventNames = events.slice(0, 5).map(e => e.name || 'Event');
    const attendanceCounts = events.slice(0, 5).map(e => {
        return attendance.filter(a => a.eventId === e.id).length;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: eventNames.length > 0 ? eventNames : ['No Events'],
            datasets: [{
                label: 'Attendance Count',
                data: attendanceCounts.length > 0 ? attendanceCounts : [0],
                backgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function initializeVerificationChart() {
    const canvas = document.getElementById('verificationChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const students = users.filter(u => u.role === 'student');
    const pending = students.filter(u => u.status === 'pending').length;
    const verified = students.filter(u => u.status === 'verified').length;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Verified', 'Pending'],
            datasets: [{
                data: [verified, pending],
                backgroundColor: ['#28a745', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function loadUsersTable() {
    loadAllData();
    
    let filteredUsers = users;
    
    if (currentFilter === 'pending') {
        filteredUsers = users.filter(u => u.role === 'student' && u.status === 'pending');
    } else if (currentFilter === 'verified') {
        filteredUsers = users.filter(u => u.role === 'student' && u.status === 'verified');
    } else if (currentFilter === 'admin') {
        filteredUsers = users.filter(u => u.role === 'admin');
    }
    
    const tbody = document.getElementById('usersTableBody');
    const pendingCount = users.filter(u => u.role === 'student' && u.status === 'pending').length;
    document.getElementById('pendingCount').textContent = pendingCount;
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <img src="${user.profilePhoto || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23ddd' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3E${user.firstName.charAt(0)}%3C/text%3E%3C/svg%3E`}" 
                     alt="Profile" class="table-avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>${user.studentId || '-'}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>
                ${user.role === 'student' ? 
                    `<span class="status-badge ${user.status}">${user.status}</span>` : 
                    '-'}
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    ${user.role === 'student' && user.status === 'pending' ? 
                        `<button class="btn-primary btn-sm" onclick="openVerifyModal('${user.id}')">
                            <i class="fas fa-check"></i> Verify
                        </button>` : ''}
                    ${user.role === 'student' && user.status === 'verified' ?
                        `<button class="btn-secondary btn-sm" onclick="viewUser('${user.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>` : ''}
                    ${user.id !== currentAdmin.id ? 
                        `<button class="btn-role btn-sm" onclick="openChangeRoleModal('${user.id}')">
                            <i class="fas fa-user-cog"></i> Change Role
                        </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function openChangeRoleModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const modalContent = document.getElementById('changeRoleContent');
    modalContent.innerHTML = `
        <div class="change-role-info">
            <img src="${user.profilePhoto || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='40'%3E${user.firstName.charAt(0)}%3C/text%3E%3C/svg%3E`}" 
                 alt="Profile">
            <h3>${user.firstName} ${user.lastName}</h3>
            <p><strong>Student ID:</strong> ${user.studentId || 'N/A'}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Current Role:</strong> <span class="role-badge ${user.role}">${user.role}</span></p>
        </div>
        
        <div class="role-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Warning:</strong> Changing the role will affect user permissions and dashboard access.
        </div>
        
        <div class="role-selection">
            <label for="newRole">Select New Role:</label>
            <select id="newRole" class="form-control">
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
            </select>
        </div>
        
        <div class="role-actions">
            <button class="btn-primary" onclick="changeUserRole('${user.id}')">
                <i class="fas fa-check"></i> Change Role
            </button>
            <button class="btn-secondary" onclick="closeModal('changeRoleModal')">
                Cancel
            </button>
        </div>
    `;
    
    openModal('changeRoleModal');
}

function changeUserRole(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = document.getElementById('newRole').value;
    const oldRole = user.role;
    
    if (newRole === oldRole) {
        showNotification('User already has this role', 'warning');
        return;
    }
    
    // Confirm the change
    if (!confirm(`Are you sure you want to change ${user.firstName} ${user.lastName}'s role from ${oldRole} to ${newRole}?`)) {
        return;
    }
    
    // Update user role
    user.role = newRole;
    
    // If changing to admin, ensure they have verified status
    if (newRole === 'admin') {
        user.status = 'verified';
    }
    
    // Update in database
    const userIndex = users.findIndex(u => u.id === userId);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));
    
    // If this user is currently logged in, update their session
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === userId) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Show notification that they need to refresh
            showNotification('Role changed successfully! The user needs to log out and log back in for changes to take effect.', 'success');
        } else {
            showNotification(`Role changed from ${oldRole} to ${newRole} successfully!`, 'success');
        }
    } else {
        showNotification(`Role changed from ${oldRole} to ${newRole} successfully!`, 'success');
    }
    
    closeModal('changeRoleModal');
    loadUsersTable();
    updateDashboardStats();
}

function filterUsers(filter) {
    currentFilter = filter;
    loadUsersTable();
    
    document.querySelectorAll('#users-section .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function searchUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = users.filter(u => 
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.studentId && u.studentId.toLowerCase().includes(query))
    );
    
    const tbody = document.getElementById('usersTableBody');
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <img src="${user.profilePhoto || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect fill='%23ddd' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='16'%3E${user.firstName.charAt(0)}%3C/text%3E%3C/svg%3E`}" 
                     alt="Profile" class="table-avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>${user.studentId || '-'}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>
                ${user.role === 'student' ? 
                    `<span class="status-badge ${user.status}">${user.status}</span>` : 
                    '-'}
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    ${user.role === 'student' && user.status === 'pending' ? 
                        `<button class="btn-primary btn-sm" onclick="openVerifyModal('${user.id}')">
                            <i class="fas fa-check"></i> Verify
                        </button>` : ''}
                    ${user.id !== currentAdmin.id ? 
                        `<button class="btn-role btn-sm" onclick="openChangeRoleModal('${user.id}')">
                            <i class="fas fa-user-cog"></i> Change Role
                        </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function clearUserSearch() {
    document.getElementById('userSearch').value = '';
    loadUsersTable();
}

function openVerifyModal(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const modalContent = document.getElementById('verifyStudentContent');
    modalContent.innerHTML = `
        <div class="verify-student-info">
            <img src="${user.profilePhoto || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='40'%3E${user.firstName.charAt(0)}%3C/text%3E%3C/svg%3E`}" 
                 alt="Profile" class="verify-avatar" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; display: block;">
            <h3>${user.firstName} ${user.lastName}</h3>
            <p><strong>Student ID:</strong> ${user.studentId}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Registered:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
        </div>
        <div class="verify-actions">
            <button class="btn-primary" onclick="verifyStudent('${user.id}')">
                <i class="fas fa-check"></i> Verify & Generate QR Code
            </button>
            <button class="btn-secondary" onclick="closeModal('verifyStudentModal')">
                Cancel
            </button>
        </div>
    `;
    
    openModal('verifyStudentModal');
}

function verifyStudent(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const qrData = JSON.stringify({
        studentId: user.studentId,
        id: user.id,
        name: `${user.firstName} ${user.lastName}`
    });
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);
    
    const qr = new QRCode(tempDiv, {
        text: qrData,
        width: 256,
        height: 256
    });
    
    setTimeout(() => {
        const qrImage = tempDiv.querySelector('img');
        if (qrImage) {
            user.qrCode = qrImage.src;
            user.status = 'verified';
            
            const userIndex = users.findIndex(u => u.id === userId);
            users[userIndex] = user;
            localStorage.setItem('users', JSON.stringify(users));
            
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                if (currentUser.id === userId) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                }
            }
            
            document.body.removeChild(tempDiv);
            
            closeModal('verifyStudentModal');
            loadUsersTable();
            updateDashboardStats();
            showNotification('Student verified and QR code generated successfully!', 'success');
        } else {
            document.body.removeChild(tempDiv);
            showNotification('Error generating QR code', 'error');
        }
    }, 500);
}

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    alert(`Student: ${user.firstName} ${user.lastName}\nStudent ID: ${user.studentId}\nEmail: ${user.email}\nStatus: ${user.status}`);
}

function loadEventsTable() {
    loadAllData();
    const tbody = document.getElementById('eventsTableBody');
    
    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No events created yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = events.map(event => {
        const attendeeCount = attendance.filter(a => a.eventId === event.id).length;
        return `
            <tr>
                <td><strong>${event.name}</strong></td>
                <td>${event.description}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td><span class="status-badge ${event.status}">${event.status}</span></td>
                <td>${attendeeCount}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="toggleEventStatus('${event.id}')">
                        <i class="fas fa-toggle-on"></i> ${event.status === 'active' ? 'Complete' : 'Activate'}
                    </button>
                    <button class="btn-danger btn-sm" onclick="deleteEvent('${event.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterEvents(status) {
    let filtered = events;
    if (status !== 'all') {
        filtered = events.filter(e => e.status === status);
    }
    
    const tbody = document.getElementById('eventsTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No events found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(event => {
        const attendeeCount = attendance.filter(a => a.eventId === event.id).length;
        return `
            <tr>
                <td><strong>${event.name}</strong></td>
                <td>${event.description}</td>
                <td>${new Date(event.date).toLocaleDateString()}</td>
                <td>${event.startTime} - ${event.endTime}</td>
                <td><span class="status-badge ${event.status}">${event.status}</span></td>
                <td>${attendeeCount}</td>
                <td>
                    <button class="btn-secondary btn-sm" onclick="toggleEventStatus('${event.id}')">
                        ${event.status === 'active' ? 'Complete' : 'Activate'}
                    </button>
                    <button class="btn-danger btn-sm" onclick="deleteEvent('${event.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('#events-section .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function createEvent(e) {
    e.preventDefault();
    
    const newEvent = {
        id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: document.getElementById('eventName').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        startTime: document.getElementById('eventStartTime').value,
        endTime: document.getElementById('eventEndTime').value,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    
    closeModal('createEventModal');
    e.target.reset();
    loadEventsTable();
    updateDashboardStats();
    showNotification('Event created successfully!', 'success');
}

function toggleEventStatus(eventId) {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        events[eventIndex].status = events[eventIndex].status === 'active' ? 'completed' : 'active';
        localStorage.setItem('events', JSON.stringify(events));
        loadEventsTable();
        showNotification('Event status updated', 'success');
    }
}

function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem('events', JSON.stringify(events));
    loadEventsTable();
    updateDashboardStats();
    showNotification('Event deleted', 'success');
}

function exportUsers() {
    const csvContent = 'Student ID,Name,Email,Role,Status,Registered\n' + 
        users.map(u => 
            `${u.studentId || 'N/A'},"${u.firstName} ${u.lastName}",${u.email},${u.role},${u.status || 'N/A'},${new Date(u.createdAt).toLocaleDateString()}`
        ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export_' + Date.now() + '.csv';
    a.click();
    
    showNotification('Users exported successfully', 'success');
}

function loadScanAttendance() {
    loadAllData();
    
    const select = document.getElementById('eventSelect');
    const activeEvents = events.filter(e => e.status === 'active');
    
    select.innerHTML = '<option value="">-- Select an Event --</option>' +
        activeEvents.map(e => `<option value="${e.id}">${e.name} - ${new Date(e.date).toLocaleDateString()}</option>`).join('');
}

function selectEvent() {
    const eventId = document.getElementById('eventSelect').value;
    
    if (!eventId) {
        document.getElementById('scannerArea').style.display = 'none';
        document.getElementById('eventAttendance').style.display = 'none';
        document.getElementById('scanStats').style.display = 'none';
        stopScanner();
        return;
    }
    
    selectedEvent = events.find(e => e.id === eventId);
    document.getElementById('scanStats').style.display = 'flex';
    document.getElementById('scannerArea').style.display = 'block';
    document.getElementById('eventAttendance').style.display = 'block';
    
    updateAttendanceList();
    startScanner();
}

function startScanner() {
    if (scannerActive) return;
    
    const video = document.getElementById('qrVideo');
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            scannerActive = true;
            
            scanInterval = setInterval(() => {
                if (!scannerActive) {
                    clearInterval(scanInterval);
                    return;
                }
                
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height);
                    
                    if (code) {
                        processQRScan(code.data);
                    }
                }
            }, 100);
        })
        .catch(err => {
            console.error('Camera error:', err);
            showNotification('Camera access denied or not available', 'error');
        });
}

function stopScanner() {
    scannerActive = false;
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    const video = document.getElementById('qrVideo');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

function processQRScan(qrData) {
    try {
        const studentData = JSON.parse(qrData);
        const student = users.find(u => u.id === studentData.id);
        
        if (!student || student.status !== 'verified') {
            showScanResult('Student not verified', 'error');
            return;
        }
        
        const existingAttendance = attendance.find(a => 
            a.eventId === selectedEvent.id && a.studentId === student.id
        );
        
        if (existingAttendance) {
            showScanResult('Student already scanned for this event', 'warning');
            return;
        }
        
        const newAttendance = {
            id: 'attendance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            eventId: selectedEvent.id,
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            studentPhoto: student.profilePhoto,
            timestamp: new Date().toISOString()
        };
        
        attendance.push(newAttendance);
        localStorage.setItem('attendance', JSON.stringify(attendance));
        
        updateAttendanceList();
        updateDashboardStats();
        showScanResult(`✓ ${student.firstName} ${student.lastName} - Attendance recorded`, 'success');
        
        setTimeout(() => {
            document.getElementById('scanResult').innerHTML = '';
        }, 2000);
    } catch (err) {
        console.error('QR scan error:', err);
        showScanResult('Invalid QR code', 'error');
    }
}

function showScanResult(message, type) {
    const resultDiv = document.getElementById('scanResult');
    resultDiv.innerHTML = `<div class="scan-message ${type}">${message}</div>`;
}

function updateAttendanceList() {
    const eventAttendance = attendance.filter(a => a.eventId === selectedEvent.id);
    document.getElementById('totalScanned').textContent = eventAttendance.length;
    
    const tbody = document.getElementById('eventAttendanceBody');
    
    if (eventAttendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No attendance recorded yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = eventAttendance.map(a => {
        const student = users.find(u => u.id === a.studentId);
        return `
            <tr>
                <td>
                    <img src="${a.studentPhoto || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2740%27 height=%2740%27%3E%3Crect fill=%27%23ddd%27 width=%2740%27 height=%2740%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23999%27 font-size=%2716%27%3ES%3C/text%3E%3C/svg%3E'}" 
                         alt="Profile" class="table-avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                </td>
                <td>${student ? student.studentId : a.studentId}</td>
                <td>${a.studentName}</td>
                <td>${new Date(a.timestamp).toLocaleString()}</td>
                <td>
                    <button class="btn-danger btn-sm" onclick="removeAttendance('${a.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function removeAttendance(attendanceId) {
    if (!confirm('Remove this attendance record?')) return;
    
    attendance = attendance.filter(a => a.id !== attendanceId);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    updateAttendanceList();
    updateDashboardStats();
    showNotification('Attendance record removed', 'success');
}

function manualEntry() {
    openModal('manualEntryModal');
}

function submitManualEntry(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('manualStudentId').value.trim();
    const student = users.find(u => u.studentId === studentId && u.status === 'verified');
    
    if (!student) {
        showNotification('Student not found or not verified', 'error');
        return;
    }
    
    const existingAttendance = attendance.find(a => 
        a.eventId === selectedEvent.id && a.studentId === student.id
    );
    
    if (existingAttendance) {
        showNotification('Student already has attendance for this event', 'warning');
        return;
    }
    
    const newAttendance = {
        id: 'attendance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        eventId: selectedEvent.id,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentPhoto: student.profilePhoto,
        timestamp: new Date().toISOString()
    };
    
    attendance.push(newAttendance);
    localStorage.setItem('attendance', JSON.stringify(attendance));
    
    updateAttendanceList();
    updateDashboardStats();
    closeModal('manualEntryModal');
    showNotification('Attendance recorded manually', 'success');
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    
    loadAllData();
    
    let reportData = [];
    let headers = [];
    
    if (reportType === 'event') {
        headers = ['Event Name', 'Date', 'Total Students', 'Attended', 'Attendance Rate'];
        reportData = events.map(event => {
            const eventAttendance = attendance.filter(a => a.eventId === event.id);
            const totalStudents = users.filter(u => u.role === 'student' && u.status === 'verified').length;
            const attendanceRate = totalStudents > 0 ? Math.round((eventAttendance.length / totalStudents) * 100) : 0;
            
            return [
                event.name,
                new Date(event.date).toLocaleDateString(),
                totalStudents,
                eventAttendance.length,
                attendanceRate + '%'
            ];
        });
    } else if (reportType === 'student') {
        headers = ['Student ID', 'Name', 'Total Events', 'Attended', 'Attendance Rate'];
        const students = users.filter(u => u.role === 'student' && u.status === 'verified');
        reportData = students.map(student => {
            const studentAttendance = attendance.filter(a => a.studentId === student.id);
            const totalEvents = events.length;
            const attendanceRate = totalEvents > 0 ? Math.round((studentAttendance.length / totalEvents) * 100) : 0;
            
            return [
                student.studentId,
                `${student.firstName} ${student.lastName}`,
                totalEvents,
                studentAttendance.length,
                attendanceRate + '%'
            ];
        });
    } else if (reportType === 'summary') {
        headers = ['Metric', 'Value'];
        const totalStudents = users.filter(u => u.role === 'student' && u.status === 'verified').length;
        const totalEvents = events.length;
        const totalAttendance = attendance.length;
        const avgAttendance = totalEvents > 0 ? Math.round(totalAttendance / totalEvents) : 0;
        
        reportData = [
            ['Total Verified Students', totalStudents],
            ['Total Events', totalEvents],
            ['Total Attendance Records', totalAttendance],
            ['Average Attendance per Event', avgAttendance]
        ];
    }
    
    displayReport(headers, reportData);
}

function displayReport(headers, data) {
    const thead = document.getElementById('reportTableHead');
    const tbody = document.getElementById('reportTableBody');
    
    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + headers.length + '" class="no-data">No data available for this report</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(row => 
        '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>'
    ).join('');
}

function exportReport() {
    const table = document.querySelector('#reportDisplay table');
    const rows = table.querySelectorAll('tr');
    
    let csv = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const csvRow = [];
        cols.forEach(col => csvRow.push(col.textContent));
        csv.push(csvRow.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_report_' + Date.now() + '.csv';
    a.click();
    
    showNotification('Report exported successfully', 'success');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        e.target.style.display = 'none';
    }
});

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
        stopScanner();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

const toggleBtn = document.querySelector('.toggle-sidebar');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}