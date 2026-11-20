
const token = localStorage.getItem('token');

if (!token) {
    window.location.replace('/login.html');
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || '--';
    }
}

function formatDate(value) {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '--';

    return date.toLocaleDateString('vi-VN');
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');

    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
}

async function loadProfile() {
    try {
        const response = await fetch('/api/students/me', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.replace('/login.html');
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Khong the tai thong tin sinh vien');
        }

        const student = result.data;
        const studentClass = student.classId || {};

        setText('headerName', student.fullName);
        setText('fullName', student.fullName);
        setText('studentCode', `Mã sinh viên: ${student.studentCode}`);
        setText('className', `Lớp: ${studentClass.className}`);
        setText('academicYear', student.academicYear);

        setText('infoStudentCode', student.studentCode);
        setText('infoFullName', student.fullName);
        setText('dateOfBirth', formatDate(student.dateOfBirth));
        setText('gender', student.gender);

        setText('email', student.email);
        setText('phone', student.phone);
        setText('address', student.address);

        setText('classCode', studentClass.classCode);
        setText('classNameDetail', studentClass.className);
        setText('academicYearDetail', student.academicYear);
        setText('statusDetail', student.status);

        const statusNames = {
            Active: 'Đang học',
            Inactive: 'Ngừng học',
            Graduated: 'Đã tốt nghiệp'
        };

        setText('studentStatus', statusNames[student.status] || student.status);

        const avatar = document.getElementById('avatar');
        const avatarText = document.getElementById('avatarText');

        if (student.avatar) {
            avatar.style.backgroundImage = `url("${student.avatar}")`;
            avatarText.textContent = '';
        } else {
            const initials = student.fullName
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase();

            setText('avatarText', initials || 'SV');
        }

    } catch (error) {
        console.error('Lỗi tải thông tin sinh viên:', error);
        showError(error.message);
    }
}

const logoutButton = document.getElementById('logoutButton');

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất không?');

        if (!confirmed) return;

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.replace('/login.html');
    });
}

if (token) {
    loadProfile();
}
