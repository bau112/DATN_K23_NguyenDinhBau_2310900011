
const token = localStorage.getItem('token');

let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let editingStudentId = null;

const tableBody = document.getElementById('studentTableBody');
const keywordInput = document.getElementById('keyword');
const statusFilter = document.getElementById('statusFilter');
const messageBox = document.getElementById('message');

const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const classSelect = document.getElementById('classId');
const formMessage = document.getElementById('formMessage');

function showMessage(message) {
    messageBox.textContent = message;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('vi-VN');
}

function getDateInputValue(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

function getStatus(status) {
    const statuses = {
        Active: ['Đang học', 'status-active'],
        Inactive: ['Ngừng học', 'status-inactive'],
        Graduated: ['Đã tốt nghiệp', 'status-graduated']
    };

    return statuses[status] || [status || 'Không xác định', ''];
}

async function checkPermission() {
    if (!token) {
        window.location.replace('/login.html');
        return false;
    }

    try {
        const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error('Phiên đăng nhập không hợp lệ');
        }

        const user = result.data;

        if (user.role !== 'Admin') {
            alert('Bạn không có quyền truy cập trang quản lý sinh viên');
            window.location.replace('/dashboard.html');
            return false;
        }

        document.getElementById('userName').textContent = user.fullName;
        return true;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login.html');
        return false;
    }
}

async function loadStudents() {
    try {
        showMessage('');

        tableBody.innerHTML = `
            <tr><td colspan="9" class="empty">Đang tải dữ liệu...</td></tr>
        `;

        const params = new URLSearchParams({
            page: currentPage,
            limit: pageSize
        });

        const keyword = keywordInput.value.trim();
        const status = statusFilter.value;

        if (keyword) params.append('keyword', keyword);
        if (status) params.append('status', status);

        const response = await fetch(`/api/students?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Không thể tải danh sách sinh viên');
        }

        const students = result.data || [];
        totalPages = Math.max(1, result.totalPages || 1);

        document.getElementById('totalText').textContent =
            `Tổng cộng ${result.total || 0} sinh viên`;

        document.getElementById('pageInfo').textContent =
            `Trang ${result.currentPage || currentPage} / ${totalPages}`;

        document.getElementById('previousButton').disabled = currentPage <= 1;
        document.getElementById('nextButton').disabled = currentPage >= totalPages;

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr><td colspan="9" class="empty">Không tìm thấy sinh viên</td></tr>
            `;
            return;
        }

        tableBody.innerHTML = students.map((student, index) => {
            const [statusText, statusClass] = getStatus(student.status);

            const className = student.classId
                ? `${student.classId.classCode || ''} - ${student.classId.className || ''}`
                : 'Chưa có lớp';

            return `
                <tr>
                    <td>${(currentPage - 1) * pageSize + index + 1}</td>
                    <td>${escapeHTML(student.studentCode)}</td>
                    <td>${escapeHTML(student.fullName)}</td>
                    <td>${escapeHTML(student.email || '—')}</td>
                    <td>${escapeHTML(className)}</td>
                    <td>${escapeHTML(student.gender || '—')}</td>
                    <td>
                        <span class="status ${statusClass}">
                            ${escapeHTML(statusText)}
                        </span>
                    </td>
                    <td>${formatDate(student.dateOfBirth)}</td>
                    <td>
                        <button class="edit-button" data-id="${escapeHTML(student._id)}" type="button">Sửa</button>
                        <button class="delete-button" data-id="${escapeHTML(student._id)}" type="button">Xóa</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tableBody.innerHTML = `
            <tr><td colspan="9" class="empty">Không thể tải dữ liệu</td></tr>
        `;
        showMessage(error.message);
    }
}

async function loadClasses(selectedClassId = '') {
    try {
        classSelect.innerHTML = '<option value="">Đang tải danh sách lớp...</option>';

        const response = await fetch('/api/classes?limit=100&page=1&status=Active', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Không thể tải danh sách lớp');
        }

        const classes = result.data || [];
        classSelect.innerHTML = '<option value="">-- Chọn lớp học --</option>';

        classes.forEach(item => {
            const option = document.createElement('option');
            option.value = item._id;
            option.textContent = `${item.classCode} - ${item.className}`;
            option.dataset.academicYear = item.academicYear || '';
            classSelect.appendChild(option);
        });

        if (selectedClassId) {
            classSelect.value = selectedClassId;
        }

        if (classes.length === 0) {
            classSelect.innerHTML = '<option value="">Chưa có lớp đang hoạt động</option>';
        }
    } catch (error) {
        classSelect.innerHTML = '<option value="">Không tải được danh sách lớp</option>';
        formMessage.textContent = error.message;
    }
}

function openModal() {
    editingStudentId = null;
    studentForm.reset();

    document.getElementById('modalTitle').textContent = 'Thêm sinh viên';
    document.getElementById('studentCode').disabled = false;
    document.getElementById('saveStudentButton').textContent = 'Lưu sinh viên';

    formMessage.textContent = '';
    studentModal.classList.add('show');

    loadClasses();
}

async function editStudent(id) {
    try {
        const response = await fetch(`/api/students/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Không thể lấy thông tin sinh viên');
        }

        const student = result.data;
        editingStudentId = id;

        studentForm.reset();
        formMessage.textContent = '';

        document.getElementById('modalTitle').textContent = 'Cập nhật sinh viên';
        document.getElementById('studentCode').value = student.studentCode || '';
        document.getElementById('studentCode').disabled = true;
        document.getElementById('fullName').value = student.fullName || '';
        document.getElementById('dateOfBirth').value = getDateInputValue(student.dateOfBirth);
        document.getElementById('gender').value = student.gender || '';
        document.getElementById('email').value = student.email || '';
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('academicYear').value = student.academicYear || '';
        document.getElementById('address').value = student.address || '';

        studentModal.classList.add('show');

        await loadClasses(student.classId?._id || student.classId || '');

        document.getElementById('saveStudentButton').textContent = 'Cập nhật sinh viên';
    } catch (error) {
        showMessage(error.message);
    }
}

function closeModal() {
    studentModal.classList.remove('show');
    document.getElementById('studentCode').disabled = false;
    editingStudentId = null;
}

async function deleteStudent(id) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa sinh viên này không?');

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Xóa sinh viên thất bại');
        }

        alert('Xóa sinh viên thành công');

        if (currentPage > 1 && tableBody.querySelectorAll('tr').length === 1) {
            currentPage--;
        }

        loadStudents();
    } catch (error) {
        showMessage(error.message);
    }
}

document.getElementById('addStudentButton').addEventListener('click', openModal);
document.getElementById('closeModalButton').addEventListener('click', closeModal);
document.getElementById('cancelButton').addEventListener('click', closeModal);

studentModal.addEventListener('click', event => {
    if (event.target === studentModal) closeModal();
});

tableBody.addEventListener('click', event => {
    const editButton = event.target.closest('.edit-button');
    const deleteButton = event.target.closest('.delete-button');

    if (editButton) editStudent(editButton.dataset.id);
    if (deleteButton) deleteStudent(deleteButton.dataset.id);
});

classSelect.addEventListener('change', () => {
    const selectedOption = classSelect.options[classSelect.selectedIndex];

    if (selectedOption?.dataset.academicYear) {
        document.getElementById('academicYear').value =
            selectedOption.dataset.academicYear;
    }
});

studentForm.addEventListener('submit', async event => {
    event.preventDefault();

    const data = {
        fullName: document.getElementById('fullName').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value || undefined,
        gender: document.getElementById('gender').value || undefined,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        classId: classSelect.value,
        academicYear: document.getElementById('academicYear').value.trim()
    };

    if (!editingStudentId) {
        data.studentCode = document.getElementById('studentCode').value.trim();
    }

    if (
        (!editingStudentId && !data.studentCode) ||
        !data.fullName ||
        !data.email ||
        !data.classId
    ) {
        formMessage.textContent = 'Vui lòng nhập đầy đủ các trường bắt buộc';
        return;
    }

    const saveButton = document.getElementById('saveStudentButton');
    saveButton.disabled = true;
    saveButton.textContent = 'Đang lưu...';
    formMessage.textContent = '';

    try {
        const url = editingStudentId
            ? `/api/students/${editingStudentId}`
            : '/api/students';

        const response = await fetch(url, {
            method: editingStudentId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Lưu thông tin sinh viên thất bại');
        }

        alert(editingStudentId
            ? 'Cập nhật sinh viên thành công'
            : 'Thêm sinh viên thành công');

        closeModal();
        currentPage = 1;
        await loadStudents();
    } catch (error) {
        formMessage.textContent = error.message;
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingStudentId
            ? 'Cập nhật sinh viên'
            : 'Lưu sinh viên';
    }
});

document.getElementById('searchButton').addEventListener('click', () => {
    currentPage = 1;
    loadStudents();
});

keywordInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        currentPage = 1;
        loadStudents();
    }
});

statusFilter.addEventListener('change', () => {
    currentPage = 1;
    loadStudents();
});

document.getElementById('resetButton').addEventListener('click', () => {
    keywordInput.value = '';
    statusFilter.value = '';
    currentPage = 1;
    loadStudents();
});

document.getElementById('previousButton').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadStudents();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadStudents();
    }
});

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login.html');
});

async function initializePage() {
    const permitted = await checkPermission();

    if (permitted) {
        loadStudents();
    }
}

initializePage();
