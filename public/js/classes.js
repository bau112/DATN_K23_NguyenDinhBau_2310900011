
const token = localStorage.getItem('token');

if (!token) {
    window.location.replace('/login.html');
}

let currentPage = 1;
const pageSize = 10;
let totalPages = 1;
let editingClassId = null;
let currentUser = null;

const classTableBody = document.getElementById('classTableBody');
const classModal = document.getElementById('classModal');
const classForm = document.getElementById('classForm');
const message = document.getElementById('message');
const formMessage = document.getElementById('formMessage');

const classCodeInput = document.getElementById('classCode');
const classNameInput = document.getElementById('className');
const departmentInput = document.getElementById('department');
const academicYearInput = document.getElementById('academicYear');
const statusInput = document.getElementById('status');

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login.html');
        throw new Error('Phiên đăng nhập đã hết hạn');
    }

    if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra');
    }

    return data;
}

function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = type === 'success' ? 'message success' : 'message';
}

function clearMessage() {
    message.textContent = '';
    message.className = 'message';
}

function showFormMessage(text, type = 'error') {
    formMessage.textContent = text;
    formMessage.className = type === 'success'
        ? 'form-message success'
        : 'form-message';
}

async function loadUser() {
    try {
        const result = await apiRequest('/api/auth/me');
        currentUser = result.user || result.data;

        if (!currentUser) {
            throw new Error('Không lấy được thông tin tài khoản');
        }

        document.getElementById('userName').textContent =
            currentUser.fullName || currentUser.username || 'Người dùng';

        const isAdmin = currentUser.role === 'Admin';

        document.getElementById('addClassButton').style.display =
            isAdmin ? '' : 'none';

        document.querySelectorAll('.edit-button, .delete-button')
            .forEach(button => {
                button.style.display = isAdmin ? '' : 'none';
            });

        await loadClasses();
    } catch (error) {
        showMessage(error.message);
    }
}

async function loadClasses() {
    try {
        clearMessage();

        const keyword = document.getElementById('keywordInput').value.trim();
        const status = document.getElementById('statusFilter').value;

        const params = new URLSearchParams({
            page: currentPage,
            limit: pageSize
        });

        if (keyword) params.append('keyword', keyword);
        if (status) params.append('status', status);

        const result = await apiRequest(`/api/classes?${params.toString()}`);

        const classes = result.data || [];
        totalPages = Math.max(1, result.totalPages || 1);

        renderClasses(classes, result.total || 0);
        updatePagination(result.total || 0);
    } catch (error) {
        classTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">${escapeHTML(error.message)}</td>
            </tr>
        `;
        showMessage(error.message);
    }
}

function renderClasses(classes, total) {
    if (!classes.length) {
        classTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">Không có lớp học nào</td>
            </tr>
        `;
        return;
    }

    const isAdmin = currentUser && currentUser.role === 'Admin';

    classTableBody.innerHTML = classes.map((item, index) => {
        const advisor = item.advisorId
            ? item.advisorId.fullName || item.advisorId.username || 'Chưa có thông tin'
            : 'Chưa phân công';

        const statusHTML = item.status === 'Active'
            ? '<span class="status status-active">Đang hoạt động</span>'
            : '<span class="status status-inactive">Ngừng hoạt động</span>';

        const actions = isAdmin
            ? `
                <button class="edit-button" data-id="${escapeHTML(item._id)}">Sửa</button>
                <button class="delete-button" data-id="${escapeHTML(item._id)}">Xóa</button>
            `
            : '<span>Không có quyền</span>';

        return `
            <tr>
                <td>${(currentPage - 1) * pageSize + index + 1}</td>
                <td>${escapeHTML(item.classCode)}</td>
                <td>${escapeHTML(item.className)}</td>
                <td>${escapeHTML(item.department)}</td>
                <td>${escapeHTML(item.academicYear)}</td>
                <td>${escapeHTML(advisor)}</td>
                <td>${statusHTML}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

function updatePagination(total) {
    document.getElementById('totalText').textContent =
        `Tổng số: ${total} lớp học`;

    document.getElementById('pageInfo').textContent =
        `Trang ${currentPage} / ${totalPages}`;

    document.getElementById('previousButton').disabled =
        currentPage <= 1;

    document.getElementById('nextButton').disabled =
        currentPage >= totalPages;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function openModal() {
    if (!currentUser || currentUser.role !== 'Admin') {
        showMessage('Bạn không có quyền thực hiện chức năng này');
        return;
    }

    editingClassId = null;
    classForm.reset();

    classCodeInput.disabled = false;
    statusInput.value = 'Active';

    document.getElementById('modalTitle').textContent = 'Thêm lớp học';
    document.getElementById('saveClassButton').textContent = 'Thêm lớp học';

    showFormMessage('');
    classModal.classList.add('show');
}

function closeModal() {
    classModal.classList.remove('show');
    classForm.reset();
    editingClassId = null;
    showFormMessage('');
}

async function editClass(id) {
    try {
        const result = await apiRequest(`/api/classes/${id}`);
        const item = result.data;

        if (!item) {
            throw new Error('Không tìm thấy lớp học');
        }

        editingClassId = id;

        classCodeInput.value = item.classCode || '';
        classCodeInput.disabled = true;

        classNameInput.value = item.className || '';
        departmentInput.value = item.department || '';
        academicYearInput.value = item.academicYear || '';
        statusInput.value = item.status || 'Active';

        document.getElementById('modalTitle').textContent = 'Cập nhật lớp học';
        document.getElementById('saveClassButton').textContent = 'Lưu thay đổi';

        showFormMessage('');
        classModal.classList.add('show');
    } catch (error) {
        showMessage(error.message);
    }
}

async function deleteClass(id) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa lớp học này không?');

    if (!confirmed) return;

    try {
        const result = await apiRequest(`/api/classes/${id}`, {
            method: 'DELETE'
        });

        showMessage(result.message || 'Xóa lớp học thành công', 'success');

        if (classTableBody.querySelectorAll('tr').length === 1 && currentPage > 1) {
            currentPage--;
        }

        await loadClasses();
    } catch (error) {
        showMessage(error.message);
    }
}

classForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!currentUser || currentUser.role !== 'Admin') {
        showFormMessage('Bạn không có quyền thực hiện chức năng này');
        return;
    }

    const classData = {
        classCode: classCodeInput.value.trim(),
        className: classNameInput.value.trim(),
        department: departmentInput.value.trim(),
        academicYear: academicYearInput.value.trim()
    };

    if (editingClassId) {
        classData.status = statusInput.value;
    }

    if (
        !classData.classCode ||
        !classData.className ||
        !classData.department ||
        !classData.academicYear
    ) {
        showFormMessage('Vui lòng nhập đầy đủ thông tin bắt buộc');
        return;
    }

    try {
        const url = editingClassId
            ? `/api/classes/${editingClassId}`
            : '/api/classes';

        const method = editingClassId ? 'PUT' : 'POST';

        const result = await apiRequest(url, {
            method,
            body: JSON.stringify(classData)
        });

        closeModal();
        showMessage(
            result.message || (editingClassId
                ? 'Cập nhật lớp học thành công'
                : 'Thêm lớp học thành công'),
            'success'
        );

        currentPage = 1;
        await loadClasses();
    } catch (error) {
        showFormMessage(error.message);
    }
});

document.getElementById('addClassButton').addEventListener('click', openModal);

document.getElementById('closeModalButton').addEventListener('click', closeModal);
document.getElementById('cancelButton').addEventListener('click', closeModal);

classModal.addEventListener('click', event => {
    if (event.target === classModal) closeModal();
});

classTableBody.addEventListener('click', event => {
    const editButton = event.target.closest('.edit-button');
    const deleteButton = event.target.closest('.delete-button');

    if (editButton) editClass(editButton.dataset.id);
    if (deleteButton) deleteClass(deleteButton.dataset.id);
});

document.getElementById('searchButton').addEventListener('click', () => {
    currentPage = 1;
    loadClasses();
});

document.getElementById('keywordInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        currentPage = 1;
        loadClasses();
    }
});

document.getElementById('statusFilter').addEventListener('change', () => {
    currentPage = 1;
    loadClasses();
});

document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('keywordInput').value = '';
    document.getElementById('statusFilter').value = '';
    currentPage = 1;
    loadClasses();
});

document.getElementById('previousButton').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadClasses();
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadClasses();
    }
});

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.replace('/login.html');
});

loadUser();
