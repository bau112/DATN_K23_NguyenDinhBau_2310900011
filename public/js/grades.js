
const token = localStorage.getItem('token');

if (!token) {
    window.location.replace('/login.html');
}

let allGrades = [];

const element = (id) => document.getElementById(id);

function setText(id, value) {
    const target = element(id);

    if (target) {
        target.textContent = value ?? '--';
    }
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

function getSubject(grade) {
    return grade.courseOfferingId?.subjectId || {};
}

function getSemester(grade) {
    return grade.courseOfferingId?.semesterId || {};
}

function getSemesterName(grade) {
    const semester = getSemester(grade);

    return semester.semesterName ||
        semester.semesterCode ||
        'Chưa xác định';
}

function getResultName(result) {
    const names = {
        Passed: 'Đạt',
        Failed: 'Chưa đạt',
        Pending: 'Chưa có kết quả'
    };

    return names[result] || 'Chưa xác định';
}

function getResultClass(result) {
    const classes = {
        Passed: 'passed',
        Failed: 'failed',
        Pending: 'pending'
    };

    return classes[result] || 'pending';
}

function showError(message) {
    const error = element('errorMessage');

    error.textContent = message;
    error.classList.remove('hidden');
}

function calculateAverage(grades) {
    const validGrades = grades.filter(grade =>
        Number.isFinite(Number(grade.totalScore))
    );

    if (!validGrades.length) {
        return '--';
    }

    let totalScore = 0;
    let totalCredits = 0;

    validGrades.forEach(grade => {
        const credits = Number(getSubject(grade).credits) || 0;

        if (credits > 0) {
            totalScore += Number(grade.totalScore) * credits;
            totalCredits += credits;
        }
    });

    if (totalCredits > 0) {
        return (totalScore / totalCredits).toFixed(2);
    }

    const average = validGrades.reduce(
        (sum, grade) => sum + Number(grade.totalScore), 0
    ) / validGrades.length;

    return average.toFixed(2);
}

function updateSummary(grades) {
    const passed = grades.filter(grade => grade.result === 'Passed').length;
    const failed = grades.filter(grade => grade.result === 'Failed').length;

    setText('totalCourses', grades.length);
    setText('passedCourses', passed);
    setText('failedCourses', failed);
    setText('averageScore', calculateAverage(grades));
}

function loadSemesterOptions(grades) {
    const select = element('semesterFilter');
    const semesters = new Map();

    grades.forEach(grade => {
        const semester = getSemester(grade);

        if (semester._id) {
            semesters.set(
                semester._id,
                semester.semesterName || semester.semesterCode || 'Học kỳ'
            );
        }
    });

    select.innerHTML = '<option value="">Tất cả học kỳ</option>';

    semesters.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        select.appendChild(option);
    });
}

function renderGrades(grades) {
    const tbody = element('gradesTableBody');
    const emptyState = element('emptyState');
    const tableWrapper = document.querySelector('.table-wrapper');

    setText('resultCount', `${grades.length} học phần`);

    if (!grades.length) {
        tbody.innerHTML = '';
        emptyState.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    tableWrapper.classList.remove('hidden');

    tbody.innerHTML = grades.map((grade, index) => {
        const subject = getSubject(grade);
        const semester = getSemesterName(grade);
        const course = grade.courseOfferingId || {};

        return `
            <tr>
                <td>${index + 1}</td>
                <td class="subject-code">${escapeHTML(subject.subjectCode || '--')}</td>
                <td class="subject-name">${escapeHTML(subject.subjectName || 'Chưa xác định')}</td>
                <td>${escapeHTML(subject.credits ?? '--')}</td>
                <td>${escapeHTML(semester)}</td>
                <td class="score-value">${grade.totalScore ?? '--'}</td>
                <td><span class="grade-letter">${escapeHTML(grade.letterGrade || '--')}</span></td>
                <td>
                    <span class="result-badge ${getResultClass(grade.result)}">
                        ${getResultName(grade.result)}
                    </span>
                </td>
                <td>
                    <button class="detail-button" data-index="${allGrades.indexOf(grade)}">
                        Chi tiết
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function applyFilters() {
    const semesterId = element('semesterFilter').value;
    const status = element('statusFilter').value;

    const filtered = allGrades.filter(grade => {
        const semester = getSemester(grade);

        const matchesSemester = !semesterId || semester._id === semesterId;
        const matchesStatus = !status || grade.result === status;

        return matchesSemester && matchesStatus;
    });

    renderGrades(filtered);
}

function openDetail(index) {
    const grade = allGrades[index];

    if (!grade) return;

    const subject = getSubject(grade);
    const components = grade.components || [];

    setText('modalSubjectName', subject.subjectName || 'Thông tin học phần');
    setText('modalSubjectCode', subject.subjectCode);
    setText('modalCredits', subject.credits);
    setText('modalTotalScore', grade.totalScore);
    setText('modalLetterGrade', grade.letterGrade);

    const tbody = element('componentTableBody');

    if (!components.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="loading-cell">Chưa có dữ liệu thành phần điểm</td>
            </tr>
        `;
    } else {
        tbody.innerHTML = components.map(item => `
            <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${escapeHTML(item.score)}</td>
                <td>${escapeHTML(item.weight)}%</td>
            </tr>
        `).join('');
    }

    element('detailModal').classList.add('show');
}


async function loadGrades() {
    try {
        const headers = {
            Authorization: `Bearer ${token}`
        };

        const profileResponse = await fetch('/api/students/me', {
            method: 'GET',
            headers
        });

        const profileResult = await profileResponse.json();

        if (profileResponse.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.replace('/login.html');
            return;
        }

        if (!profileResponse.ok || !profileResult.success) {
            throw new Error(
                profileResult.message || 'Khong the lay thong tin sinh vien'
            );
        }

        const student = profileResult.data;

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        setText(
            'headerName',
            student.fullName || user.fullName || user.username || 'Sinh viên'
        );

        const response = await fetch('/api/grades/my-results', {
            method: 'GET',
            headers
        });

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.replace('/login.html');
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || 'Khong the tai ket qua hoc tap'
            );
        }

        allGrades = result.data || [];

        updateSummary(allGrades);
        loadSemesterOptions(allGrades);
        renderGrades(allGrades);

    } catch (error) {
        console.error('Lỗi tải kết quả học tập:', error);
        showError(error.message);

        element('gradesTableBody').innerHTML = `
            <tr>
                <td colspan="9" class="loading-cell">Không thể tải dữ liệu.</td>
            </tr>
        `;
    }
}

element('semesterFilter').addEventListener('change', applyFilters);
element('statusFilter').addEventListener('change', applyFilters);

element('resetFilter').addEventListener('click', () => {
    element('semesterFilter').value = '';
    element('statusFilter').value = '';
    applyFilters();
});

element('gradesTableBody').addEventListener('click', event => {
    const button = event.target.closest('.detail-button');

    if (button) {
        openDetail(Number(button.dataset.index));
    }
});

function closeModal() {
    element('detailModal').classList.remove('show');
}

element('closeModal').addEventListener('click', closeModal);
element('closeModalBottom').addEventListener('click', closeModal);

element('detailModal').addEventListener('click', event => {
    if (event.target === element('detailModal')) {
        closeModal();
    }
});

element('logoutButton').addEventListener('click', () => {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
        return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.replace('/login.html');
});

if (token) {
    loadGrades();
}
