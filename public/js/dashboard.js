
const token = localStorage.getItem('token');

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function getRoleName(role) {
    const roles = {
        Admin: 'Quản trị viên',
        Teacher: 'Giảng viên',
        Student: 'Sinh viên'
    };

    return roles[role] || 'Người dùng';
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
    if (typeof result.total === 'number') return result.total;
    if (typeof result.pagination?.total === 'number') return result.pagination.total;
    if (typeof result.data?.total === 'number') return result.data.total;
    if (Array.isArray(result.data)) return result.data.length;
    return 0;
}

function setupDate() {
    const element = document.getElementById('todayText');

    if (!element) return;

    element.textContent = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
            ['♙', 'Sinh viên', '#'],
            ['▧', 'Học phần giảng dạy', '#'],
            ['▨', 'Quản lý điểm', '#'],
            ['◷', 'Điểm danh', '#']
        ],
        Student: [
            ['⌂', 'Tổng quan', '/dashboard.html'],
            ['♙', 'Thông tin cá nhân', '/profile.html'],
            ['▧', 'Học phần của tôi', '#myEnrollments'],
            ['▨', 'Kết quả học tập', '/grades.html'],
            ['◷', 'Lịch sử điểm danh', '#myAttendance']
        ]
    };

    const items = menus[user.role];

    if (!items) {
        menu.innerHTML = '<p class="nav-caption">Vai trò chưa được hỗ trợ</p>';
        return;
    }

    menu.innerHTML = `
        ${items.map((item, index) => {
            const disabled = item[2] === '#';

            return `
                ${index === 1
                    ? `<p class="nav-caption">${user.role === 'Admin' ? 'QUẢN LÝ ĐÀO TẠO' : 'CHỨC NĂNG'}</p>`
                    : ''}
                <a href="${item[2]}"
                   class="nav-link ${index === 0 ? 'active' : ''}"
                   ${disabled ? 'data-disabled="true"' : ''}>
                    <span class="nav-icon">${item[0]}</span>
                    <span>${item[1]}</span>
                    ${disabled ? '<span class="nav-soon">Sau</span>' : ''}
                </a>
            `;
        }).join('')}

        ${user.role === 'Admin' ? `
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
        ` : ''}
    `;

    menu.querySelectorAll('[data-disabled="true"]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            alert('Chức năng này đang được phát triển.');
        });
    });
}

function renderAdminDashboard() {
    const content = document.getElementById('dashboardContent');

    content.innerHTML = `
        <section class="page-intro">
            <div>
                <p class="eyebrow">NTU · CỔNG QUẢN LÝ ĐÀO TẠO</p>
                <h1>Tổng quan hệ thống</h1>
                <p class="intro-text">
                    Xin chào <strong id="welcomeName">Quản trị viên</strong>,
                    chúc bạn một ngày làm việc hiệu quả.
                </p>
            </div>

            <div class="academic-year">
                <span class="calendar-icon">▦</span>
                <span>
                    <small>NĂM HỌC</small>
                    <strong>2026 – 2027</strong>
                </span>
            </div>
        </section>

        <section class="stats-grid">
            <article class="stat-card stat-blue">
                <div class="stat-icon">♙</div>
                <div class="stat-info">
                    <span>Tổng số sinh viên</span>
                    <strong id="studentCount">—</strong>
                    <small id="studentHint">Đang tải dữ liệu</small>
                </div>
                <span class="stat-decoration">01</span>
            </article>

            <article class="stat-card stat-green">
                <div class="stat-icon">▦</div>
                <div class="stat-info">
                    <span>Lớp học</span>
                    <strong id="classCount">—</strong>
                    <small id="classHint">Đang tải dữ liệu</small>
                </div>
                <span class="stat-decoration">02</span>
            </article>

            <article class="stat-card stat-amber">
                <div class="stat-icon">▤</div>
                <div class="stat-info">
                    <span>Môn học</span>
                    <strong>—</strong>
                    <small>Chưa kết nối thống kê</small>
                </div>
                <span class="stat-decoration">03</span>
            </article>

            <article class="stat-card stat-violet">
                <div class="stat-icon">✓</div>
                <div class="stat-info">
                    <span>Điểm danh</span>
                    <strong>—</strong>
                    <small>Chưa kết nối thống kê</small>
                </div>
                <span class="stat-decoration">04</span>
            </article>
        </section>

        <section class="content-grid">
            <article class="panel activity-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">THEO DÕI HỆ THỐNG</p>
                        <h2>Tình hình quản lý đào tạo</h2>
                    </div>
                    <span class="live-label"><i></i> Dữ liệu trực tiếp</span>
                </div>

                <div class="overview-list">
                    <a href="/students.html" class="overview-row">
                        <span class="overview-symbol blue-symbol">♙</span>
                        <span class="overview-copy">
                            <strong>Quản lý sinh viên</strong>
                            <small>Hồ sơ, thông tin và trạng thái sinh viên</small>
                        </span>
                        <span class="overview-action">Mở quản lý <b>→</b></span>
                    </a>

                    <a href="/classes.html" class="overview-row">
                        <span class="overview-symbol green-symbol">▦</span>
                        <span class="overview-copy">
                            <strong>Quản lý lớp học</strong>
                            <small>Danh sách lớp, khoa và năm học</small>
                        </span>
                        <span class="overview-action">Mở quản lý <b>→</b></span>
                    </a>

                    <div class="overview-row disabled-row">
                        <span class="overview-symbol amber-symbol">▤</span>
                        <span class="overview-copy">
                            <strong>Quản lý môn học</strong>
                            <small>Danh mục môn học trong chương trình đào tạo</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>

                    <div class="overview-row disabled-row">
                        <span class="overview-symbol violet-symbol">✓</span>
                        <span class="overview-copy">
                            <strong>Quản lý điểm và điểm danh</strong>
                            <small>Theo dõi kết quả học tập và chuyên cần</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>
                </div>
            </article>

            <article class="panel notice-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">THÔNG TIN</p>
                        <h2>Thông tin hệ thống</h2>
                    </div>
                    <span class="notice-icon">ⓘ</span>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-blue"></span>
                    <div>
                        <strong>Quản lý sinh viên</strong>
                        <p>Thêm mới, cập nhật, tìm kiếm và theo dõi hồ sơ sinh viên.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-green"></span>
                    <div>
                        <strong>Quản lý lớp học</strong>
                        <p>Quản lý mã lớp, tên lớp, khoa, năm học và trạng thái.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-orange"></span>
                    <div>
                        <strong>Nhận diện khuôn mặt</strong>
                        <p>Chức năng điểm danh thông minh sẽ được tích hợp trong hệ thống.</p>
                    </div>
                </div>

                <div class="system-note">
                    <strong>NTU System</strong>
                    <span>Hệ thống quản lý điểm học tập sinh viên</span>
                </div>
            </article>
        </section>

        <section class="bottom-grid">
            <article class="panel shortcuts-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">TRUY CẬP NHANH</p>
                        <h2>Chức năng thường dùng</h2>
                    </div>
                </div>

                <div class="shortcut-grid">
                    <a href="/students.html" class="shortcut-card">
                        <span class="shortcut-icon blue-symbol">♙</span>
                        <strong>Sinh viên</strong>
                        <small>Quản lý hồ sơ</small>
                    </a>

                    <a href="/classes.html" class="shortcut-card">
                        <span class="shortcut-icon green-symbol">▦</span>
                        <strong>Lớp học</strong>
                        <small>Quản lý danh sách lớp</small>
                    </a>

                    <div class="shortcut-card disabled-shortcut">
                        <span class="shortcut-icon amber-symbol">▤</span>
                        <strong>Quản lý điểm</strong>
                        <small>Đang phát triển</small>
                    </div>

                    <div class="shortcut-card disabled-shortcut">
                        <span class="shortcut-icon violet-symbol">✓</span>
                        <strong>Điểm danh</strong>
                        <small>Đang phát triển</small>
                    </div>
                </div>
            </article>

            <article class="campus-banner">
                <div class="banner-content">
                    <p>TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI</p>
                    <h2>Tri thức hôm nay<br>Kiến tạo ngày mai</h2>
                    <span>Hệ thống quản lý đào tạo NTU</span>
                </div>
                <div class="banner-seal">NTU</div>
            </article>
        </section>

        <footer class="page-footer">
            © 2026 NTU System · Hệ thống quản lý điểm học tập sinh viên
        </footer>
    `;
}

async function loadAdminStatistics() {
    try {
        const [studentResult, classResult] = await Promise.all([
            apiRequest('/api/students?page=1&limit=1'),
            apiRequest('/api/classes?page=1&limit=1')
        ]);

        setText('studentCount', getTotal(studentResult).toLocaleString('vi-VN'));
        setText('classCount', getTotal(classResult).toLocaleString('vi-VN'));
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

function renderStudentDashboard(user) {
    const content = document.getElementById('dashboardContent');

    content.innerHTML = `
        <section class="page-intro">
            <div>
                <p class="eyebrow">NTU · CỔNG THÔNG TIN SINH VIÊN</p>
                <h1>Không gian học tập</h1>
                <p class="intro-text">
                    Xin chào <strong id="welcomeName">${escapeHTML(user.fullName || user.username)}</strong>,
                    chúc bạn có một ngày học tập hiệu quả.
                </p>
            </div>

            <div class="academic-year">
                <span class="calendar-icon">▦</span>
                <span>
                    <small>NĂM HỌC</small>
                    <strong>2026 – 2027</strong>
                </span>
            </div>
        </section>

        <section class="stats-grid">
            <article class="stat-card stat-blue">
                <div class="stat-icon">♙</div>
                <div class="stat-info">
                    <span>Mã sinh viên</span>
                    <strong id="studentCode">—</strong>
                    <small>Thông tin cá nhân</small>
                </div>
                <span class="stat-decoration">01</span>
            </article>

            <article class="stat-card stat-green">
                <div class="stat-icon">▧</div>
                <div class="stat-info">
                    <span>Lớp hành chính</span>
                    <strong id="studentClass">—</strong>
                    <small>Lớp đang theo học</small>
                </div>
                <span class="stat-decoration">02</span>
            </article>

            <article class="stat-card stat-amber">
                <div class="stat-icon">▨</div>
                <div class="stat-info">
                    <span>Số học phần có điểm</span>
                    <strong id="gradeCount">—</strong>
                    <small>Kết quả đã ghi nhận</small>
                </div>
                <span class="stat-decoration">03</span>
            </article>

            <article class="stat-card stat-violet">
                <div class="stat-icon">★</div>
                <div class="stat-info">
                    <span>Điểm trung bình</span>
                    <strong id="averageScore">—</strong>
                    <small>Trung bình các học phần có điểm</small>
                </div>
                <span class="stat-decoration">04</span>
            </article>
        </section>

        <section class="content-grid">
            <article class="panel activity-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">HỌC TẬP</p>
                        <h2>Kết quả học tập gần đây</h2>
                    </div>
                    <a href="/grades.html" class="overview-action">Xem tất cả →</a>
                </div>

                <div id="recentGrades" class="overview-list">
                    <p>Đang tải kết quả học tập...</p>
                </div>
            </article>

            <article class="panel notice-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">HỒ SƠ SINH VIÊN</p>
                        <h2>Thông tin của tôi</h2>
                    </div>
                    <span class="notice-icon">ⓘ</span>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-blue"></span>
                    <div>
                        <strong>Thông tin cá nhân</strong>
                        <p>Xem và kiểm tra thông tin hồ sơ sinh viên của bạn.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-green"></span>
                    <div>
                        <strong>Kết quả học tập</strong>
                        <p>Theo dõi điểm số và kết quả các học phần đã học.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-orange"></span>
                    <div>
                        <strong>Điểm danh</strong>
                        <p>Theo dõi tình hình chuyên cần trong quá trình học tập.</p>
                    </div>
                </div>

                <div class="system-note">
                    <strong>NTU Student Portal</strong>
                    <span>Cổng thông tin sinh viên</span>
                </div>
            </article>
        </section>

        <section class="panel enrollment-panel" id="myEnrollments">
            <div class="panel-heading">
                <div>
                    <p class="eyebrow">KẾ HOẠCH HỌC TẬP</p>
                    <h2>Học phần đã đăng ký</h2>
                </div>
                <span class="overview-action" id="enrollmentCount">0 học phần</span>
            </div>

            <div id="enrollmentList" class="overview-list">
                <p>Đang tải danh sách học phần...</p>
            </div>
        </section>

        <section class="panel enrollment-panel" id="myAttendance">
            <div class="panel-heading">
                <div>
                    <p class="eyebrow">THEO DÕI CHUYÊN CẦN</p>
                    <h2>Lịch sử điểm danh</h2>
                </div>
                <span class="overview-action" id="attendanceCount">0 buổi học</span>
            </div>

            <div id="attendanceList" class="overview-list">
                <p>Đang tải lịch sử điểm danh...</p>
            </div>
        </section>

        <section class="bottom-grid">
            <article class="panel shortcuts-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">TIỆN ÍCH</p>
                        <h2>Truy cập nhanh</h2>
                    </div>
                </div>

                <div class="shortcut-grid">
                    <a href="/profile.html" class="shortcut-card">
                        <span class="shortcut-icon blue-symbol">♙</span>
                        <strong>Hồ sơ cá nhân</strong>
                        <small>Thông tin sinh viên</small>
                    </a>

                    <a href="/grades.html" class="shortcut-card">
                        <span class="shortcut-icon green-symbol">▨</span>
                        <strong>Kết quả học tập</strong>
                        <small>Xem bảng điểm</small>
                    </a>

                    <a href="#myEnrollments" class="shortcut-card">
                        <span class="shortcut-icon amber-symbol">▧</span>
                        <strong>Học phần</strong>
                        <small>Xem học phần đã đăng ký</small>
                    </a>

                    <a href="#myAttendance" class="shortcut-card">
                        <span class="shortcut-icon violet-symbol">◷</span>
                        <strong>Lịch sử điểm danh</strong>
                        <small>Xem tình hình chuyên cần</small>
                    </a>
                </div>
            </article>

            <article class="campus-banner">
                <div class="banner-content">
                    <p>TRƯỜNG ĐẠI HỌC NGUYỄN TRÃI</p>
                    <h2>Chủ động học tập<br>Vững bước tương lai</h2>
                    <span>Hệ thống quản lý đào tạo NTU</span>
                </div>
                <div class="banner-seal">NTU</div>
            </article>
        </section>

        <footer class="page-footer">
            © 2026 NTU System · Cổng thông tin sinh viên
        </footer>
    `;

    loadStudentData(user);
}

async function loadStudentData(user) {
    const [
        profileResponse,
        gradesResponse,
        enrollmentsResponse,
        attendanceResponse
    ] = await Promise.allSettled([
        apiRequest('/api/students/me'),
        apiRequest('/api/grades/my-results'),
        apiRequest('/api/enrollments/my-enrollments'),
        apiRequest('/api/attendance/my-attendance')
    ]);

    if (profileResponse.status === 'fulfilled') {
        const raw = profileResponse.value.data || {};
        const student = raw.student || raw.profile || raw;

        setText(
            'studentCode',
            student.studentCode || student.studentId || user.studentId || 'Chưa có'
        );

        const classInfo = student.class || {};

        setText(
            'studentClass',
            classInfo.className || student.className || student.classCode || 'Chưa cập nhật'
        );
    } else {
        console.error('Lỗi tải hồ sơ:', profileResponse.reason);
        setText('studentCode', 'Chưa liên kết');
        setText('studentClass', 'Chưa có dữ liệu');
    }

    if (gradesResponse.status === 'fulfilled') {
        const responseData = gradesResponse.value.data;

        const grades = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.grades)
                ? responseData.grades
                : [];

        renderStudentGrades(grades);
    } else {
        console.error('Lỗi tải điểm:', gradesResponse.reason);

        setText('gradeCount', '—');
        setText('averageScore', '—');

        const container = document.getElementById('recentGrades');

        if (container) {
            container.innerHTML = '<p>Không tải được kết quả học tập.</p>';
        }
    }

    if (enrollmentsResponse.status === 'fulfilled') {
        const responseData = enrollmentsResponse.value.data;

        const enrollments = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.enrollments)
                ? responseData.enrollments
                : [];

        renderStudentEnrollments(enrollments);
    } else {
        console.error('Lỗi tải học phần:', enrollmentsResponse.reason);

        const container = document.getElementById('enrollmentList');

        if (container) {
            container.innerHTML = '<p>Không tải được danh sách học phần.</p>';
        }

        setText('enrollmentCount', '— học phần');
    }

    if (attendanceResponse.status === 'fulfilled') {
        const responseData = attendanceResponse.value.data;

        const attendances = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.attendances)
                ? responseData.attendances
                : [];

        renderStudentAttendance(attendances);
    } else {
        console.error('Lỗi tải điểm danh:', attendanceResponse.reason);

        const container = document.getElementById('attendanceList');

        if (container) {
            container.innerHTML = '<p>Không tải được lịch sử điểm danh.</p>';
        }

        setText('attendanceCount', '— buổi học');
    }
}

function renderStudentGrades(grades) {
    const validScores = grades
        .map(item => Number(item.totalScore))
        .filter(score => Number.isFinite(score));

    const average = validScores.length
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
        : null;

    setText('gradeCount', String(grades.length));
    setText('averageScore', average === null ? '—' : average.toFixed(2));

    const container = document.getElementById('recentGrades');

    if (!container) return;

    if (grades.length === 0) {
        container.innerHTML = `
            <div class="overview-row">
                <span class="overview-symbol blue-symbol">▨</span>
                <span class="overview-copy">
                    <strong>Chưa có kết quả học tập</strong>
                    <small>Kết quả học phần sẽ hiển thị tại đây khi được cập nhật.</small>
                </span>
            </div>
        `;
        return;
    }

    container.innerHTML = grades.slice(0, 5).map(item => {
        const offering = item.courseOffering || item.courseOfferingId || {};

        const courseName = offering.courseCode
            || offering.subjectName
            || item.courseCode
            || item.courseName
            || 'Học phần';

        const score = Number(item.totalScore);
        const scoreText = Number.isFinite(score) ? score.toFixed(1) : '—';
        const letter = item.letterGrade || 'Chưa xếp loại';
        const result = item.result || 'Chưa xác định';

        return `
            <div class="overview-row">
                <span class="overview-symbol green-symbol">▨</span>
                <span class="overview-copy">
                    <strong>${escapeHTML(courseName)}</strong>
                    <small>Điểm chữ: ${escapeHTML(letter)} · ${escapeHTML(result)}</small>
                </span>
                <span class="overview-action">${escapeHTML(scoreText)}</span>
            </div>
        `;
    }).join('');
}

function renderStudentEnrollments(enrollments) {
    const container = document.getElementById('enrollmentList');

    if (!container) return;

    setText('enrollmentCount', `${enrollments.length} học phần`);

    if (enrollments.length === 0) {
        container.innerHTML = `
            <div class="overview-row">
                <span class="overview-symbol blue-symbol">▧</span>
                <span class="overview-copy">
                    <strong>Chưa có học phần đăng ký</strong>
                    <small>Các học phần bạn đã đăng ký sẽ hiển thị tại đây.</small>
                </span>
            </div>
        `;
        return;
    }

    const statusNames = {
        Enrolled: 'Đã đăng ký',
        Cancelled: 'Đã hủy',
        Completed: 'Đã hoàn thành'
    };

    container.innerHTML = enrollments.map(item => {
        const offering = item.courseOfferingId || item.courseOffering || {};
        const subject = offering.subjectId || {};
        const semester = offering.semesterId || {};
        const teacher = offering.teacherId || {};

        const subjectName = subject.subjectName || offering.courseCode || 'Học phần';
        const subjectCode = subject.subjectCode || '';
        const courseCode = offering.courseCode || '';
        const credits = subject.credits ?? '—';
        const semesterName = semester.semesterName || semester.semesterCode || 'Chưa cập nhật';
        const teacherName = teacher.fullName || 'Chưa phân công';
        const status = statusNames[item.status] || item.status || 'Chưa xác định';

        const enrollmentDate = item.enrollmentDate
            ? new Date(item.enrollmentDate).toLocaleDateString('vi-VN')
            : 'Chưa cập nhật';

        return `
            <div class="overview-row enrollment-row">
                <span class="overview-symbol blue-symbol">▧</span>

                <span class="overview-copy">
                    <strong>${escapeHTML(subjectName)}</strong>
                    <small>
                        ${escapeHTML(subjectCode)}
                        ${courseCode ? ` · ${escapeHTML(courseCode)}` : ''}
                        · ${escapeHTML(credits)} tín chỉ
                    </small>
                    <small>
                        ${escapeHTML(semesterName)}
                        · Giảng viên: ${escapeHTML(teacherName)}
                    </small>
                    <small>Ngày đăng ký: ${escapeHTML(enrollmentDate)}</small>
                </span>

                <span class="overview-action">${escapeHTML(status)}</span>
            </div>
        `;
    }).join('');
}

function renderStudentAttendance(attendances) {
    const container = document.getElementById('attendanceList');

    if (!container) return;

    setText('attendanceCount', `${attendances.length} buổi học`);

    if (attendances.length === 0) {
        container.innerHTML = `
            <div class="overview-row">
                <span class="overview-symbol blue-symbol">◷</span>
                <span class="overview-copy">
                    <strong>Chưa có dữ liệu điểm danh</strong>
                    <small>Lịch sử điểm danh sẽ hiển thị tại đây khi được ghi nhận.</small>
                </span>
            </div>
        `;
        return;
    }

    const attendanceNames = {
        Present: 'Có mặt',
        Absent: 'Vắng',
        Late: 'Đi muộn',
        Excused: 'Vắng có phép'
    };

    const recognitionNames = {
        Recognized: 'Đã nhận diện',
        NotRecognized: 'Không nhận diện',
        Pending: 'Chờ nhận diện'
    };

    const methodNames = {
        FaceRecognition: 'Nhận diện khuôn mặt',
        Manual: 'Điểm danh thủ công'
    };

    container.innerHTML = attendances.map(item => {
        const offering = item.courseOfferingId || item.courseOffering || {};
        const subject = offering.subjectId || {};
        const semester = offering.semesterId || {};

        const subjectName =
            subject.subjectName ||
            offering.courseCode ||
            'Học phần';

        const courseCode = offering.courseCode || '';
        const subjectCode = subject.subjectCode || '';

        const sessionDate = item.sessionDate
            ? new Date(item.sessionDate).toLocaleDateString('vi-VN')
            : 'Chưa cập nhật';

        const checkInTime = item.checkInTime
            ? new Date(item.checkInTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Chưa ghi nhận';

        const sessionNumber = item.sessionNumber || '—';

        const attendanceStatus =
            attendanceNames[item.attendanceStatus] ||
            item.attendanceStatus ||
            'Chưa xác định';

        const recognitionStatus =
            recognitionNames[item.recognitionStatus] ||
            item.recognitionStatus ||
            'Chưa xác định';

        const method =
            methodNames[item.method] ||
            item.method ||
            'Chưa xác định';

        const semesterName =
            semester.semesterName ||
            semester.semesterCode ||
            '';

        return `
            <div class="overview-row enrollment-row">
                <span class="overview-symbol violet-symbol">◷</span>

                <span class="overview-copy">
                    <strong>${escapeHTML(subjectName)}</strong>

                    <small>
                        ${escapeHTML(subjectCode)}
                        ${courseCode ? ` · ${escapeHTML(courseCode)}` : ''}
                        · Buổi ${escapeHTML(sessionNumber)}
                    </small>

                    <small>
                        Ngày học: ${escapeHTML(sessionDate)}
                        ${semesterName ? ` · ${escapeHTML(semesterName)}` : ''}
                    </small>

                    <small>
                        Giờ điểm danh: ${escapeHTML(checkInTime)}
                    </small>

                    <small>
                        ${escapeHTML(recognitionStatus)}
                        · ${escapeHTML(method)}
                    </small>
                </span>

                <span class="overview-action">
                    ${escapeHTML(attendanceStatus)}
                </span>
            </div>
        `;
    }).join('');
}

function renderTeacherDashboard(user) {
    const content = document.getElementById('dashboardContent');

    content.innerHTML = `
        <section class="page-intro">
            <div>
                <p class="eyebrow">NTU · CỔNG QUẢN LÝ ĐÀO TẠO</p>
                <h1>Không gian giảng viên</h1>
                <p class="intro-text">
                    Xin chào <strong id="welcomeName">${escapeHTML(user.fullName || user.username)}</strong>,
                    chúc thầy/cô có một ngày làm việc hiệu quả.
                </p>
            </div>

            <div class="academic-year">
                <span class="calendar-icon">▦</span>
                <span>
                    <small>NĂM HỌC</small>
                    <strong>2026 – 2027</strong>
                </span>
            </div>
        </section>

        <section class="stats-grid">
            <article class="stat-card stat-blue">
                <div class="stat-icon">▧</div>
                <div class="stat-info">
                    <span>Học phần phụ trách</span>
                    <strong>—</strong>
                    <small>Chưa kết nối dữ liệu</small>
                </div>
                <span class="stat-decoration">01</span>
            </article>

            <article class="stat-card stat-green">
                <div class="stat-icon">♙</div>
                <div class="stat-info">
                    <span>Sinh viên giảng dạy</span>
                    <strong>—</strong>
                    <small>Chưa kết nối dữ liệu</small>
                </div>
                <span class="stat-decoration">02</span>
            </article>

            <article class="stat-card stat-amber">
                <div class="stat-icon">▨</div>
                <div class="stat-info">
                    <span>Bảng điểm</span>
                    <strong>—</strong>
                    <small>Chưa kết nối dữ liệu</small>
                </div>
                <span class="stat-decoration">03</span>
            </article>

            <article class="stat-card stat-violet">
                <div class="stat-icon">◷</div>
                <div class="stat-info">
                    <span>Điểm danh</span>
                    <strong>—</strong>
                    <small>Chưa kết nối dữ liệu</small>
                </div>
                <span class="stat-decoration">04</span>
            </article>
        </section>

        <section class="content-grid">
            <article class="panel activity-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">CÔNG VIỆC GIẢNG DẠY</p>
                        <h2>Chức năng giảng viên</h2>
                    </div>
                </div>

                <div class="overview-list">
                    <div class="overview-row disabled-row">
                        <span class="overview-symbol blue-symbol">▧</span>
                        <span class="overview-copy">
                            <strong>Học phần giảng dạy</strong>
                            <small>Theo dõi các học phần được phân công</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>

                    <div class="overview-row disabled-row">
                        <span class="overview-symbol green-symbol">♙</span>
                        <span class="overview-copy">
                            <strong>Danh sách sinh viên</strong>
                            <small>Tra cứu sinh viên theo từng học phần</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>

                    <div class="overview-row disabled-row">
                        <span class="overview-symbol amber-symbol">▨</span>
                        <span class="overview-copy">
                            <strong>Quản lý điểm</strong>
                            <small>Cập nhật và theo dõi kết quả học tập</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>

                    <div class="overview-row disabled-row">
                        <span class="overview-symbol violet-symbol">◷</span>
                        <span class="overview-copy">
                            <strong>Điểm danh</strong>
                            <small>Quản lý tình hình chuyên cần của sinh viên</small>
                        </span>
                        <span class="coming-label">Đang phát triển</span>
                    </div>
                </div>
            </article>

            <article class="panel notice-panel">
                <div class="panel-heading">
                    <div>
                        <p class="eyebrow">THÔNG TIN</p>
                        <h2>Khu vực giảng viên</h2>
                    </div>
                    <span class="notice-icon">ⓘ</span>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-blue"></span>
                    <div>
                        <strong>Học phần</strong>
                        <p>Thông tin học phần được phân công giảng dạy.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-green"></span>
                    <div>
                        <strong>Kết quả học tập</strong>
                        <p>Hỗ trợ theo dõi và đánh giá kết quả học tập.</p>
                    </div>
                </div>

                <div class="notice-item">
                    <span class="notice-dot dot-orange"></span>
                    <div>
                        <strong>Điểm danh</strong>
                        <p>Hỗ trợ quản lý tình hình tham gia học tập.</p>
                    </div>
                </div>

                <div class="system-note">
                    <strong>NTU Teacher Portal</strong>
                    <span>Khu vực làm việc giảng viên</span>
                </div>
            </article>
        </section>

        <footer class="page-footer">
            © 2026 NTU System · Hệ thống quản lý điểm học tập sinh viên
        </footer>
    `;
}

function setupQuickSearch() {
    const searchInput = document.getElementById('quickSearch');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim().toLowerCase();

        const items = document.querySelectorAll(
            '.sidebar-nav .nav-link, .shortcut-card, .overview-row'
        );

        items.forEach(item => {
            item.classList.toggle(
                'search-hidden',
                keyword !== '' && !item.textContent.toLowerCase().includes(keyword)
            );
        });
    });

    document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
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
        if (event.target.closest('.nav-link')) closeMenu();
    });
}

function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');

    if (!logoutButton) return;

    logoutButton.addEventListener('click', () => {
        if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) return;

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.replace('/login.html');
    });
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
        setText('userAvatar', displayName.charAt(0).toUpperCase());

        renderMenu(user);

        if (user.role === 'Admin') {
            renderAdminDashboard();
            setText('welcomeName', displayName);
            await loadAdminStatistics();
        } else if (user.role === 'Student') {
            renderStudentDashboard(user);
        } else if (user.role === 'Teacher') {
            renderTeacherDashboard(user);
        } else {
            document.getElementById('dashboardContent').innerHTML = `
                <section class="page-intro">
                    <div>
                        <h1>Không có quyền truy cập</h1>
                        <p class="intro-text">Vai trò tài khoản chưa được hỗ trợ.</p>
                    </div>
                </section>
            `;
        }
    } catch (error) {
        console.error('Lỗi tải tài khoản:', error);

        if (error.message !== 'Phiên đăng nhập đã hết hạn') {
            setText('userName', 'Không tải được tài khoản');
            setText('userRole', 'Vui lòng kiểm tra kết nối');
        }
    }
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
