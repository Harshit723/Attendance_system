// Initialize socket connection
const socket = io();

// DOM elements
const navLinks = document.querySelectorAll('.nav-links a');
const views = document.querySelectorAll('.view');
const addStudentBtn = document.getElementById('add-student-btn');
const addDeviceBtn = document.getElementById('add-device-btn');
const studentModal = document.getElementById('student-modal');
const deviceModal = document.getElementById('device-modal');
const closeButtons = document.querySelectorAll('.close');
const studentForm = document.getElementById('student-form');
const deviceForm = document.getElementById('device-form');

// Dashboard elements
const studentCountElem = document.getElementById('student-count');
const todayAttendanceElem = document.getElementById('today-attendance');
const activeDevicesElem = document.getElementById('active-devices');
const recentActivityTable = document.getElementById('recent-activity-table');

// Students table
const studentsTable = document.getElementById('students-table');

// Attendance table
const attendanceTable = document.getElementById('attendance-table');
const dateFilter = document.getElementById('date-filter');
const studentFilter = document.getElementById('student-filter');
const applyFiltersBtn = document.getElementById('apply-filters');

// In-memory data store
let students = [];
let attendance = [];
let devices = [
    { id: 'ESP32-001', name: 'Entry Gate', location: 'Main Entrance', status: 'online', lastPing: new Date() },
    { id: 'ESP32-002', name: 'Library', location: 'Library Entrance', status: 'offline', lastPing: new Date(Date.now() - 2 * 60 * 60 * 1000) }
];

// Initialize the application
function init() {
    // Set current date in date filter
    dateFilter.valueAsDate = new Date();
    
    // Load initial data
    fetchStudents();
    fetchAttendance();
    
    // Update the dashboard counters
    updateDashboardCounters();
    
    // Add event listeners
    setupEventListeners();
    
    // Set up socket event listeners
    setupSocketListeners();
}

// Fetch students from the server
function fetchStudents() {
    fetch('/api/students')
        .then(response => response.json())
        .then(data => {
            students = data;
            renderStudentsTable();
            updateStudentFilter();
            updateDashboardCounters();
        })
        .catch(error => console.error('Error fetching students:', error));
}

// Fetch attendance records from the server
function fetchAttendance() {
    fetch('/api/attendance')
        .then(response => response.json())
        .then(data => {
            attendance = data;
            renderAttendanceTable();
            renderRecentActivity();
            updateDashboardCounters();
        })
        .catch(error => console.error('Error fetching attendance:', error));
}

// Update dashboard counters
function updateDashboardCounters() {
    // Update student count
    studentCountElem.textContent = students.length;
    
    // Count today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(record => 
        record.timestamp.split('T')[0] === today
    ).length;
    
    todayAttendanceElem.textContent = todayAttendance;
    
    // Count active devices
    const activeDevices = devices.filter(device => device.status === 'online').length;
    activeDevicesElem.textContent = activeDevices;
}

// Render students table
function renderStudentsTable() {
    if (students.length === 0) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">No students registered</td>
            </tr>
        `;
        return;
    }
    
    studentsTable.innerHTML = students.map(student => `
        <tr>
            <td>${student.id}</td>
            <td>${student.studentId}</td>
            <td>${student.name}</td>
            <td>${student.rfidTag}</td>
            <td>${formatDate(student.registeredAt)}</td>
            <td>
                <button class="btn small secondary" onclick="editStudent(${student.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small danger" onclick="deleteStudent(${student.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render attendance table
function renderAttendanceTable(filtered = false) {
    let records = attendance;
    
    // Apply filters if requested
    if (filtered) {
        const selectedDate = dateFilter.value;
        const selectedStudent = studentFilter.value;
        
        if (selectedDate) {
            records = records.filter(record => 
                record.timestamp.split('T')[0] === selectedDate
            );
        }
        
        if (selectedStudent) {
            records = records.filter(record => 
                record.studentId === selectedStudent
            );
        }
    }
    
    if (records.length === 0) {
        attendanceTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">No attendance records found</td>
            </tr>
        `;
        return;
    }
    
    attendanceTable.innerHTML = records.map(record => {
        const student = students.find(s => s.studentId === record.studentId) || { name: 'Unknown' };
        return `
            <tr>
                <td>${record.id}</td>
                <td>${record.studentId}</td>
                <td>${student.name}</td>
                <td>${formatDateTime(record.timestamp)}</td>
                <td>${record.deviceId}</td>
            </tr>
        `;
    }).join('');
}

// Render recent activity in dashboard
function renderRecentActivity() {
    // Get the 5 most recent attendance records
    const recentRecords = [...attendance]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    if (recentRecords.length === 0) {
        recentActivityTable.innerHTML = `
            <tr>
                <td colspan="4" class="empty-message">No recent activity</td>
            </tr>
        `;
        return;
    }
    
    recentActivityTable.innerHTML = recentRecords.map(record => {
        const student = students.find(s => s.studentId === record.studentId) || { name: 'Unknown' };
        return `
            <tr>
                <td>${record.studentId}</td>
                <td>${student.name}</td>
                <td>${formatDateTime(record.timestamp)}</td>
                <td>${record.deviceId}</td>
            </tr>
        `;
    }).join('');
}

// Update the student filter dropdown
function updateStudentFilter() {
    if (students.length === 0) {
        studentFilter.innerHTML = '<option value="">All Students</option>';
        return;
    }
    
    studentFilter.innerHTML = `
        <option value="">All Students</option>
        ${students.map(student => `
            <option value="${student.studentId}">${student.name} (${student.studentId})</option>
        `).join('')}
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            
            // Update active nav link
            navLinks.forEach(link => link.classList.remove('active'));
            link.classList.add('active');
            
            // Show the target view, hide others
            views.forEach(view => {
                if (view.id === targetView) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });
        });
    });
    
    // Modal open buttons
    addStudentBtn.addEventListener('click', () => {
        studentModal.style.display = 'block';
    });
    
    addDeviceBtn.addEventListener('click', () => {
        deviceModal.style.display = 'block';
    });
    
    // Modal close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            studentModal.style.display = 'none';
            deviceModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === studentModal) studentModal.style.display = 'none';
        if (e.target === deviceModal) deviceModal.style.display = 'none';
    });
    
    // Form submissions
    studentForm.addEventListener('submit', addStudent);
    deviceForm.addEventListener('submit', addDevice);
    
    // Filter application
    applyFiltersBtn.addEventListener('click', () => {
        renderAttendanceTable(true);
    });
}

// Add a new student
function addStudent(e) {
    e.preventDefault();
    
    const name = document.getElementById('student-name').value;
    const studentId = document.getElementById('student-id').value;
    const rfidTag = document.getElementById('rfid-tag').value;
    
    fetch('/api/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, studentId, rfidTag })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close the modal and reset form
            studentModal.style.display = 'none';
            studentForm.reset();
            
            // Refresh students data
            fetchStudents();
        }
    })
    .catch(error => console.error('Error adding student:', error));
}

// Add a new device
function addDevice(e) {
    e.preventDefault();
    
    const name = document.getElementById('device-name').value;
    const deviceId = document.getElementById('device-id').value;
    const location = document.getElementById('device-location').value;
    
    // For now, just add to local array as we don't have a backend API for devices
    devices.push({
        id: deviceId,
        name: name,
        location: location,
        status: 'offline',
        lastPing: new Date()
    });
    
    // Close the modal and reset form
    deviceModal.style.display = 'none';
    deviceForm.reset();
    
    // Update dashboard counters
    updateDashboardCounters();
}

// Setup socket event listeners
function setupSocketListeners() {
    // Listen for new attendance records
    socket.on('new-attendance', (record) => {
        attendance.push(record);
        renderAttendanceTable();
        renderRecentActivity();
        updateDashboardCounters();
        
        // Show notification
        showNotification(`New attendance recorded for ID: ${record.studentId}`);
    });
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Helper function to format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

// Show notification
function showNotification(message) {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return;
    }
    
    // Check if permission is granted
    if (Notification.permission === "granted") {
        new Notification("Attendance System", { body: message });
    } 
    // Ask for permission if not granted and not denied
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                new Notification("Attendance System", { body: message });
            }
        });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);