from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime
import qrcode
from io import BytesIO

app = Flask(__name__)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    section = db.Column(db.String(50))
    campus = db.Column(db.String(50))
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  
    role = db.Column(db.String(10), default='student')    

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(100))
    start_time = db.Column(db.Time)
    full_cutoff = db.Column(db.Time, nullable=False)   
    late_cutoff = db.Column(db.Time, nullable=False)   

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    check_in = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create DB
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and user.password == password:  
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid email or password', 'danger')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        student_id = request.form['student_id']
        name = request.form['name']
        section = request.form['section']
        campus = request.form['campus']
        email = request.form['email']
        password = request.form['password']  

        if User.query.filter_by(email=email).first() or User.query.filter_by(student_id=student_id).first():
            flash('Email or Student ID already registered', 'danger')
            return redirect(url_for('signup'))

        new_user = User(student_id=student_id, name=name, section=section, campus=campus,
                        email=email, password=password, role='student')
        db.session.add(new_user)
        db.session.commit()
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'admin':
        total_students = User.query.filter_by(role='student').count()
        total_events = Event.query.count()
        active_events = Event.query.filter_by(active=True).count()
        return render_template('admin_dashboard.html',
                              total_students=total_students,
                              total_events=total_events,
                              active_events=active_events)
    else:
        active_events = Event.query.filter_by(active=True).all()
        return render_template('student_dashboard.html', active_events=active_events)


@app.route('/admin/events')
@login_required
def admin_events():
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    events = Event.query.all()
    return render_template('admin_events.html', events=events)

@app.route('/admin/create_event', methods=['GET', 'POST'])
@login_required
def create_event():
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        name = request.form['name']
        date = datetime.strptime(request.form['date'], '%Y-%m-%d').date()
        location = request.form['location']
        start_time = datetime.strptime(request.form['start_time'], '%H:%M').time()
        full_cutoff = datetime.strptime(request.form['full_cutoff'], '%H:%M').time()
        late_cutoff = datetime.strptime(request.form['late_cutoff'], '%H:%M').time()

        event = Event(name=name, date=date, location=location,
                      start_time=start_time, full_cutoff=full_cutoff, late_cutoff=late_cutoff)
        db.session.add(event)
        db.session.commit()
        flash('Event created successfully', 'success')
        return redirect(url_for('admin_events'))
    return render_template('create_event.html')

@app.route('/admin/event/<int:event_id>/qr')
@login_required
def event_qr(event_id):
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    event = Event.query.get_or_404(event_id)
    qr_url = url_for('scan_attendance', event_id=event.id, _external=True)
    img = qrcode.make(qr_url)
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png', as_attachment=True, download_name=f'qr_event_{event_id}.png')

@app.route('/admin/event/<int:event_id>/attendance')
@login_required
def event_attendance_view(event_id):
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    event = Event.query.get_or_404(event_id)
    attendances = Attendance.query.filter_by(event_id=event_id).all()
    all_students = User.query.filter_by(role='student').all()
    return render_template('event_attendance.html', event=event, attendances=attendances, students=all_students)

@app.route('/admin/students')
@login_required
def admin_students():
    if current_user.role != 'admin':
        return redirect(url_for('dashboard'))
    students = User.query.filter_by(role='student').all()
    return render_template('admin_students.html', students=students)


@app.route('/scan/<int:event_id>', methods=['POST'])
@login_required
def scan_attendance(event_id):
    if current_user.role != 'student':
        return jsonify({'success': False, 'message': 'Not allowed'})

    event = Event.query.get_or_404(event_id)
    if not event.active:
        return jsonify({'success': False, 'message': 'Event is not active'})

    existing = Attendance.query.filter_by(user_id=current_user.id, event_id=event_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Already checked in'})

    now = datetime.now()
    full_cutoff_dt = datetime.combine(event.date, event.full_cutoff)
    late_cutoff_dt = datetime.combine(event.date, event.late_cutoff)

    if now <= full_cutoff_dt:
        status = 'Full Day'
    elif now <= late_cutoff_dt:
        status = 'Late'
    else:
        status = 'Absent'

    attendance = Attendance(user_id=current_user.id, event_id=event_id, check_in=now, status=status)
    db.session.add(attendance)
    db.session.commit()

    return jsonify({'success': True, 'status': status, 'time': now.strftime('%H:%M:%S')})

@app.route('/my_attendance')
@login_required
def my_attendance():
    if current_user.role != 'student':
        return redirect(url_for('dashboard'))
    records = Attendance.query.filter_by(user_id=current_user.id).all()
    return render_template('my_attendance.html', records=records)

if __name__ == '__main__':
    app.run(debug=True)