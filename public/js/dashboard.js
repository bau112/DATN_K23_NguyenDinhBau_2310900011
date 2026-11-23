
const token = localStorage.getItem('token');

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function getRoleName(role) {
    const roles = {
        Admin: 'Quản trị viên',
        Teacher: 'Giảng viên',
        Student: 'Sinh viên'
    };

    return roles[role] || role || 'Người dùng';
}

async function apiRequest(url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error('Máy chủ trả về dữ liệu không hợp lệ');
    }

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login.html');
        throw new Error('Phiên đăng nhập đã hết hạn');
    }

    if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Không thể tải dữ liệu');
    }

    return result;
}

function getTotal(result) {
    if (typeof result.total === 'number') {
        return result.total;
    }

    if (typeof result.pagination?.total === 'number') {
        return result.pagination.total;
    }

    if (typeof result.data?.total === 'number') {
        return result.data.total;
    }

    if (Array.isArray(result.data)) {
        return result.data.length;
    }

    return 0;
}

async function loadUser() {
    if (!token) {
        window.location.replace('/login.html');
        return;
    }

    try {
        const result = await apiRequest('/api/auth/me');
        const user = result.data;

        if (!user) {
            throw new Error('Không tìm thấy thông tin tài khoản');
        }

        const displayName = user.fullName || user.username || 'Người dùng';

        setText('userName', displayName);
        setText('userRole', getRoleName(user.role));
        setText('welcomeName', displayName);
        setText('userAvatar', displayName.charAt(0).toUpperCase());

        renderMenu(user);
        await loadStatistics(user);

    } catch (error) {
        console.error('Lỗi tải tài khoản:', error);

        if (error.message !== 'Phiên đăng nhập đã hết hạn') {
            setText('userName', 'Không tải được tài khoản');
            setText('userRole', 'Vui lòng kiểm tra kết nối');
        }
    }
}

function renderMenu(user) {
    const menu = document.querySelector('.sidebar-nav');

    if (!menu) return;

    const menus = {
        Admin: [
            ['⌂', 'Tổng quan', '/dashboard.html'],
            ['♙', 'Sinh viên', '/students.html'],
            ['▦', 'Lớp học', '/classes.html'],
            ['▤', 'Môn học', '#'],
            ['▣', 'Học kỳ', '#'],
            ['▧', 'Học phần', '#'],
            ['＋', 'Đăng ký học phần', '#'],
            ['▨', 'Quản lý điểm', '#'],
            ['◷', 'Điểm danh', '#']
        ],

        Teacher: [
            ['⌂', 'Tổng quan', '/dashboard.html'],
            ['♙', 'Sinh viên', '/students.html'],
            ['▦', 'Lớp học', '/classes.html'],
            ['▧', 'Học phần giảng dạy', '#'],
            ['▨', 'Quản lý điểm', '#'],
            ['◷', 'Điểm danh', '#']
        ],

        Student: [
            ['⌂', 'Tổng quan', '/dashboard.html'],
            ['♙', 'Thông tin cá nhân', '/profile.html'],
            ['▧', 'Học phần của tôi', '#'],
            ['▨', 'Kết quả học tập','/grades.html', '#'],
            ['◷', 'Lịch sử điểm danh', '#']
        ]
    };

    const items = menus[user.role];

    if (!items) {
        setText('userRole', 'Vai trò chưa được hỗ trợ');
        return;
    }

    const systemLinks = user.role === 'Admin'
        ? `
            <p class="nav-caption system-caption">HỆ THỐNG</p>
            <a href="#" class="nav-link" data-disabled="true">
                <span class="nav-icon">⚙</span>
                <span>Cài đặt</span>
                <span class="nav-soon">Sau</span>
            </a>
            <a href="#" class="nav-link" data-disabled="true">
                <span class="nav-icon">▥</span>
                <span>Báo cáo thống kê</span>
                <span class="nav-soon">Sau</span>
            </a>
        `
        : '';

    menu.innerHTML = `
        ${items.map((item, index) => {
            const isActive = index === 0;
            const isAvailable = item[2] !== '#';

            return `
                ${index === 1 && user.role === 'Admin'
                    ? '<p class="nav-caption">QUẢN LÝ ĐÀO TẠO</p>'
                    : ''}

                <a href="${item[2]}"
                   class="nav-link ${isActive ? 'active' : ''}"
                   ${!isAvailable ? 'data-disabled="true"' : ''}>
                    <span class="nav-icon">${item[0]}</span>
                    <span>${item[1]}</span>
                    ${!isAvailable ? '<span class="nav-soon">Sau</span>' : ''}
                </a>
            `;
        }).join('')}

        ${systemLinks}
    `;

    menu.querySelectorAll('[data-disabled="true"]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            alert('Chức năng này đang được phát triển.');
        });
    });
}

async function loadStatistics(user) {
    if (user.role !== 'Admin' && user.role !== 'Teacher') {
        setText('studentCount', '—');
        setText('classCount', '—');
        setText('studentHint', 'Không có quyền xem');
        setText('classHint', 'Không có quyền xem');
        return;
    }

    try {
        const [studentResult, classResult] = await Promise.all([
            apiRequest('/api/students?page=1&limit=1'),
            apiRequest('/api/classes?page=1&limit=1')
        ]);

        setText(
            'studentCount',
            getTotal(studentResult).toLocaleString('vi-VN')
        );

        setText(
            'classCount',
            getTotal(classResult).toLocaleString('vi-VN')
        );

        setText('studentHint', 'Sinh viên trong hệ thống');
        setText('classHint', 'Lớp học trong hệ thống');

    } catch (error) {
        console.error('Lỗi tải thống kê:', error);

        setText('studentCount', '—');
        setText('classCount', '—');
        setText('studentHint', 'Chưa tải được dữ liệu');
        setText('classHint', 'Chưa tải được dữ liệu');
    }
}

function setupDate() {
    const todayElement = document.getElementById('todayText');

    if (!todayElement) return;

    todayElement.textContent = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function setupQuickSearch() {
    const searchInput = document.getElementById('quickSearch');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim().toLowerCase();

        const searchableItems = document.querySelectorAll(
            '.sidebar-nav .nav-link, .shortcut-card, .overview-row'
        );

        searchableItems.forEach(item => {
            const text = item.textContent.toLowerCase();

            item.classList.toggle(
                'search-hidden',
                keyword !== '' && !text.includes(keyword)
            );
        });
    });

    document.addEventListener('keydown', event => {
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'k'
        ) {
            event.preventDefault();
            searchInput.focus();
        }

        if (event.key === 'Escape') {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.blur();
        }
    });
}

function setupMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const menuButton = document.getElementById('mobileMenuButton');

    if (!sidebar || !backdrop || !menuButton) return;

    function closeMenu() {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
    }

    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('show');
    });

    backdrop.addEventListener('click', closeMenu);

    sidebar.addEventListener('click', event => {
        if (event.target.closest('.nav-link')) {
            closeMenu();
        }
    });
}

function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');

    if (!logoutButton) return;

    logoutButton.addEventListener('click', () => {
        const confirmed = confirm('Bạn có chắc chắn muốn đăng xuất không?');

        if (!confirmed) return;

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        window.location.replace('/login.html');
    });
}

function initializeDashboard() {
    setupDate();
    setupQuickSearch();
    setupMobileMenu();
    setupLogout();
    loadUser();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
