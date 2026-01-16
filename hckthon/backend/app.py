from flask import Flask, request, jsonify, session
from flask_cors import CORS
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
import os
import uuid

app = Flask(__name__)
app.secret_key = 'hckthon2026-super-secret-key-change-this'

# Configure CORS to allow requests from XAMPP
CORS(app, 
     supports_credentials=True,
     origins=["http://localhost", "http://localhost:80", "http://127.0.0.1", "http://127.0.0.1:80"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Data directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
EVENTS_FILE = os.path.join(DATA_DIR, 'events.json')
ATTENDANCE_FILE = os.path.join(DATA_DIR, 'attendance.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

def init_data_files() -> None:
    """Initialize data files with default data"""
    if not os.path.exists(USERS_FILE):
        default_admin: Dict[str, Any] = {
            'id': str(uuid.uuid4()),
            'email': 'hckthon2026@gmail.com',
            'password': 'hckthon2026',
            'role': 'admin',
            'firstName': 'Admin',
            'lastName': 'User',
            'createdAt': datetime.now().isoformat()
        }
        save_data(USERS_FILE, [default_admin])
        print("✓ Created default admin user")
    
    if not os.path.exists(EVENTS_FILE):
        save_data(EVENTS_FILE, [])
        print("✓ Created events file")
    
    if not os.path.exists(ATTENDANCE_FILE):
        save_data(ATTENDANCE_FILE, [])
        print("✓ Created attendance file")

def load_data(filename: str) -> List[Dict[str, Any]]:
    """Load data from JSON file"""
    try:
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

def save_data(filename: str, data: List[Dict[str, Any]]) -> bool:
    """Save data to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

# ============= AUTH ROUTES =============

@app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        email = str(data.get('email', '')).lower().strip()
        password = str(data.get('password', ''))
        
        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400
        
        users = load_data(USERS_FILE)
        user = None
        for u in users:
            if str(u.get('email', '')).lower() == email and str(u.get('password', '')) == password:
                user = u
                break
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Don't send password to frontend
        user_data = {k: v for k, v in user.items() if k != 'password'}
        session['user_id'] = user.get('id')
        
        return jsonify({'success': True, 'user': user_data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required = ['studentId', 'firstName', 'lastName', 'email', 'password']
        missing = [field for field in required if not data.get(field)]
        
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        users = load_data(USERS_FILE)
        
        # Check for duplicates
        email = str(data['email']).lower().strip()
        student_id = str(data['studentId']).strip()
        
        for u in users:
            if str(u.get('email', '')).lower() == email:
                return jsonify({'error': 'Email already registered'}), 409
            if str(u.get('studentId', '')) == student_id:
                return jsonify({'error': 'Student ID already registered'}), 409
        
        # Create new user
        new_user: Dict[str, Any] = {
            'id': str(uuid.uuid4()),
            'studentId': student_id,
            'firstName': str(data['firstName']).strip(),
            'lastName': str(data['lastName']).strip(),
            'email': email,
            'password': str(data['password']),
            'role': 'student',
            'status': 'pending',
            'qrCode': None,
            'profilePhoto': None,
            'createdAt': datetime.now().isoformat()
        }
        
        users.append(new_user)
        save_data(USERS_FILE, users)
        
        return jsonify({'success': True, 'message': 'Registration successful'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 204
        
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'}), 200

# ============= USER ROUTES =============

@app.route('/api/users', methods=['GET', 'OPTIONS'])
def get_users():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        users = load_data(USERS_FILE)
        # Remove passwords from response
        safe_users = [{k: v for k, v in u.items() if k != 'password'} for u in users]
        return jsonify({'success': True, 'users': safe_users}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['GET', 'OPTIONS'])
def get_user(user_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        users = load_data(USERS_FILE)
        user = None
        for u in users:
            if u.get('id') == user_id:
                user = u
                break
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        safe_user = {k: v for k, v in user.items() if k != 'password'}
        return jsonify({'success': True, 'user': safe_user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['PUT', 'OPTIONS'])
def update_user(user_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        users = load_data(USERS_FILE)
        
        user_index = None
        for i, u in enumerate(users):
            if u.get('id') == user_id:
                user_index = i
                break
                
        if user_index is None:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed fields
        allowed_fields = ['firstName', 'lastName', 'email', 'profilePhoto', 'studentId']
        for field in allowed_fields:
            if field in data:
                users[user_index][field] = data[field]
        
        # Handle password update separately
        if 'newPassword' in data and data.get('currentPassword'):
            if users[user_index].get('password') == data['currentPassword']:
                users[user_index]['password'] = data['newPassword']
            else:
                return jsonify({'error': 'Current password incorrect'}), 400
        
        save_data(USERS_FILE, users)
        
        safe_user = {k: v for k, v in users[user_index].items() if k != 'password'}
        return jsonify({'success': True, 'user': safe_user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['DELETE', 'OPTIONS'])
def delete_user(user_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        users = load_data(USERS_FILE)
        users = [u for u in users if u.get('id') != user_id]
        save_data(USERS_FILE, users)
        return jsonify({'success': True, 'message': 'User deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>/verify', methods=['POST', 'OPTIONS'])
def verify_user(user_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        users = load_data(USERS_FILE)
        
        user_index = None
        for i, u in enumerate(users):
            if u.get('id') == user_id:
                user_index = i
                break
                
        if user_index is None:
            return jsonify({'error': 'User not found'}), 404
        
        users[user_index]['status'] = 'verified'
        if data:
            users[user_index]['qrCode'] = data.get('qrCode')
        
        save_data(USERS_FILE, users)
        
        safe_user = {k: v for k, v in users[user_index].items() if k != 'password'}
        return jsonify({'success': True, 'user': safe_user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>/role', methods=['PUT', 'OPTIONS'])
def update_user_role(user_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        new_role = data.get('role')
        
        if new_role not in ['admin', 'student']:
            return jsonify({'error': 'Invalid role'}), 400
        
        users = load_data(USERS_FILE)
        user_index = None
        for i, u in enumerate(users):
            if u.get('id') == user_id:
                user_index = i
                break
        
        if user_index is None:
            return jsonify({'error': 'User not found'}), 404
        
        users[user_index]['role'] = new_role
        save_data(USERS_FILE, users)
        
        safe_user = {k: v for k, v in users[user_index].items() if k != 'password'}
        return jsonify({'success': True, 'user': safe_user}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= EVENT ROUTES =============

@app.route('/api/events', methods=['GET', 'OPTIONS'])
def get_events():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        events = load_data(EVENTS_FILE)
        return jsonify({'success': True, 'events': events}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events', methods=['POST', 'OPTIONS'])
def create_event():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required = ['name', 'description', 'date', 'startTime', 'endTime']
        missing = [field for field in required if not data.get(field)]
        
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
        
        events = load_data(EVENTS_FILE)
        
        new_event: Dict[str, Any] = {
            'id': str(uuid.uuid4()),
            'name': str(data['name']).strip(),
            'description': str(data['description']).strip(),
            'date': str(data['date']),
            'startTime': str(data['startTime']),
            'endTime': str(data['endTime']),
            'status': 'active',
            'createdAt': datetime.now().isoformat()
        }
        
        events.append(new_event)
        save_data(EVENTS_FILE, events)
        
        return jsonify({'success': True, 'event': new_event}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<event_id>', methods=['PUT', 'OPTIONS'])
def update_event(event_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        events = load_data(EVENTS_FILE)
        
        event_index = None
        for i, e in enumerate(events):
            if e.get('id') == event_id:
                event_index = i
                break
                
        if event_index is None:
            return jsonify({'error': 'Event not found'}), 404
        
        # Update allowed fields
        allowed_fields = ['name', 'description', 'date', 'startTime', 'endTime', 'status']
        for field in allowed_fields:
            if field in data:
                events[event_index][field] = data[field]
        
        save_data(EVENTS_FILE, events)
        return jsonify({'success': True, 'event': events[event_index]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<event_id>', methods=['DELETE', 'OPTIONS'])
def delete_event(event_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        events = load_data(EVENTS_FILE)
        events = [e for e in events if e.get('id') != event_id]
        save_data(EVENTS_FILE, events)
        
        # Also delete related attendance records
        attendance = load_data(ATTENDANCE_FILE)
        attendance = [a for a in attendance if a.get('eventId') != event_id]
        save_data(ATTENDANCE_FILE, attendance)
        
        return jsonify({'success': True, 'message': 'Event deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= ATTENDANCE ROUTES =============

@app.route('/api/attendance', methods=['GET', 'OPTIONS'])
def get_attendance():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        attendance = load_data(ATTENDANCE_FILE)
        return jsonify({'success': True, 'attendance': attendance}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/attendance', methods=['POST', 'OPTIONS'])
def record_attendance():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required = ['eventId', 'studentId']
        if not all(data.get(field) for field in required):
            return jsonify({'error': 'Event ID and Student ID required'}), 400
        
        attendance = load_data(ATTENDANCE_FILE)
        
        # Check for duplicate attendance
        existing = None
        for a in attendance:
            if a.get('eventId') == data['eventId'] and a.get('studentId') == data['studentId']:
                existing = a
                break
        
        if existing:
            return jsonify({'error': 'Attendance already recorded'}), 409
        
        # Get student info
        users = load_data(USERS_FILE)
        student = None
        for u in users:
            if u.get('id') == data['studentId']:
                student = u
                break
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        if student.get('status') != 'verified':
            return jsonify({'error': 'Student not verified'}), 403
        
        new_attendance: Dict[str, Any] = {
            'id': str(uuid.uuid4()),
            'eventId': str(data['eventId']),
            'studentId': str(data['studentId']),
            'studentName': f"{student.get('firstName', '')} {student.get('lastName', '')}",
            'studentPhoto': student.get('profilePhoto'),
            'timestamp': datetime.now().isoformat()
        }
        
        attendance.append(new_attendance)
        save_data(ATTENDANCE_FILE, attendance)
        
        return jsonify({'success': True, 'attendance': new_attendance}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/attendance/<attendance_id>', methods=['DELETE', 'OPTIONS'])
def delete_attendance(attendance_id: str):
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        attendance = load_data(ATTENDANCE_FILE)
        attendance = [a for a in attendance if a.get('id') != attendance_id]
        save_data(ATTENDANCE_FILE, attendance)
        return jsonify({'success': True, 'message': 'Attendance deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= STATS ROUTES =============

@app.route('/api/stats/dashboard', methods=['GET', 'OPTIONS'])
def get_dashboard_stats():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        users = load_data(USERS_FILE)
        events = load_data(EVENTS_FILE)
        attendance = load_data(ATTENDANCE_FILE)
        
        students = [u for u in users if u.get('role') == 'student']
        pending = [u for u in students if u.get('status') == 'pending']
        verified = [u for u in students if u.get('status') == 'verified']
        
        stats: Dict[str, int] = {
            'totalStudents': len(students),
            'pendingStudents': len(pending),
            'verifiedStudents': len(verified),
            'totalEvents': len(events),
            'totalAttendance': len(attendance)
        }
        
        return jsonify({'success': True, 'stats': stats}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============= HEALTH CHECK =============

@app.route('/', methods=['GET'])
@app.route('/api', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'running',
        'message': 'Attendance System API',
        'version': '1.0.0',
        'endpoints': {
            'auth': ['/api/auth/login', '/api/auth/signup', '/api/auth/logout'],
            'users': ['/api/users', '/api/users/<id>'],
            'events': ['/api/events', '/api/events/<id>'],
            'attendance': ['/api/attendance'],
            'stats': ['/api/stats/dashboard']
        }
    }), 200

# ============= ERROR HANDLERS =============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============= MAIN =============

if __name__ == '__main__':
    print("=" * 50)
    print(" Starting Attendance System API")
    print("=" * 50)
    init_data_files()
    print("\n✓ Server ready!")
    print(" API running at: http://localhost:5000")
    print("Health check: http://localhost:5000/api")
    print("\nDefault Admin Login:")
    print("   Email: hckthon2026@gmail.com")
    print("   Password: hckthon2026")
    print("=" * 50)
    print("\nPress CTRL+C to stop the server\n")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=True,
        threaded=True
    )