/**
 * Module quản lý báo cáo trong Admin Dashboard
 */

// Biến dùng để lưu trữ danh sách báo cáo
let reports = [];
let currentReportId = null;
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let filterState = 'all'; // 'all', 'pending', 'processed'

// Xử lý khi DOM đã được tải
document.addEventListener('DOMContentLoaded', async () => {
    // Chờ đến khi sidenavAccordion đã tồn tại trên DOM
    if (document.getElementById('sidenavAccordion')) {
        initReportManagement();
    } else {
        // Nếu chưa tồn tại, thiết lập MutationObserver để theo dõi thay đổi DOM
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('sidenavAccordion')) {
                initReportManagement();
                obs.disconnect(); // Ngừng theo dõi khi đã tìm thấy phần tử
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});

/**
 * Khởi tạo quản lý báo cáo
 */
function initReportManagement() {
    // Thêm tab listener
    document.querySelector('a[href="#report-management"]').addEventListener('click', () => {
        loadReports();
    });

    // Thêm filter listeners
    document.getElementById('toggleAllButton').addEventListener('click', () => toggleFilter('all'));
    document.getElementById('togglePendingButton').addEventListener('click', () => toggleFilter('pending'));
    document.getElementById('toggleProcessedButton').addEventListener('click', () => toggleFilter('processed'));

    // Thêm search listener
    document.getElementById('reportSearch').addEventListener('input', handleSearch);

    // Thêm listener cho checkbox chọn tất cả
    document.getElementById('selectAllReports').addEventListener('change', toggleSelectAll);

    // Thêm listener cho nút xóa nhiều báo cáo
    document.getElementById('deleteSelectedReportsButton').addEventListener('click', deleteSelectedReports);

    // Thêm listeners cho các nút trong modal
    document.getElementById('markAsProcessedButton').addEventListener('click', () => updateReportStatus('processed'));
    document.getElementById('markAsPendingButton').addEventListener('click', () => updateReportStatus('pending'));
    document.getElementById('deleteReportButton').addEventListener('click', deleteReport);

    // Load báo cáo ban đầu
    loadReports();
}

/**
 * Lấy danh sách báo cáo từ API
 */
async function loadReports() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');

        const response = await fetch('/report', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách báo cáo');
        }

        reports = await response.json();
        renderReports();
    } catch (error) {
        console.error('Lỗi khi tải báo cáo:', error);
        alert('Không thể tải danh sách báo cáo: ' + error.message);
    }
}

/**
 * Hiển thị danh sách báo cáo trên giao diện
 */
function renderReports() {
    const tableBody = document.getElementById('reportTableBody');
    const paginationContainer = document.getElementById('reportPagination');
    
    if (!tableBody) {
        console.error('Không tìm thấy phần tử reportTableBody trong DOM');
        return;
    }

    // Lọc báo cáo theo trạng thái nếu cần
    let filteredReports = reports;
    if (filterState === 'pending') {
        filteredReports = reports.filter(report => report.status === 'pending');
    } else if (filterState === 'processed') {
        filteredReports = reports.filter(report => report.status === 'processed');
    }

    // Tính toán dữ liệu phân trang
    const totalItems = filteredReports.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);

    // Hiển thị danh sách báo cáo
    tableBody.innerHTML = '';
    
    if (paginatedReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center">Không có báo cáo nào</td></tr>`;
        return;
    }

    paginatedReports.forEach(report => {
        // Format thời gian
        const reportedAt = new Date(report.reported_at).toLocaleString('vi-VN');
        const processedAt = report.processed_at ? new Date(report.processed_at).toLocaleString('vi-VN') : '—';
        
        // Xác định class và text cho trạng thái
        let statusClass = '';
        let statusText = '';
        if (report.status === 'pending') {
            statusClass = 'bg-warning text-dark';
            statusText = 'Đang chờ';
        } else if (report.status === 'processed') {
            statusClass = 'bg-success text-white';
            statusText = 'Đã xử lý';
        }

        // Tạo hàng cho báo cáo
        const row = `
            <tr data-id="${report.id}">
                <td>
                    <input type="checkbox" class="report-checkbox" data-id="${report.id}">
                </td>
                <td>${report.id}</td>
                <td>${report.username || 'Không xác định'}</td>
                <td>${report.title}</td>
                <td class="text-truncate" style="max-width: 150px;" title="${report.content}">${report.content}</td>
                <td>${report.email}</td>
                <td>${reportedAt}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${processedAt}</td>
                <td>
                    <button class="btn btn-info btn-sm view-report-btn" data-id="${report.id}"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-danger btn-sm delete-report-btn" data-id="${report.id}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Thêm listener cho các nút xem chi tiết và xóa
    document.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', () => showReportDetails(button.getAttribute('data-id')));
    });

    document.querySelectorAll('.delete-report-btn').forEach(button => {
        button.addEventListener('click', () => deleteReportConfirm(button.getAttribute('data-id')));
    });

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderReports();
    });
}

/**
 * Hiển thị thành phần phân trang
 */
function renderPagination(container, totalPages, currentPage, callback) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (totalPages <= 1) return;

    const pagination = document.createElement('nav');
    pagination.setAttribute('aria-label', 'Page navigation');
    
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) callback(currentPage - 1);
    });
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    // Hiển thị tối đa 5 trang
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Các trang số
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            callback(i);
        });
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }
    
    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) callback(currentPage + 1);
    });
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    pagination.appendChild(ul);
    container.appendChild(pagination);
}

/**
 * Chuyển đổi giữa các filter trạng thái
 */
function toggleFilter(filter) {
    // Reset lại trang khi đổi filter
    currentPage = 1;
    
    // Cập nhật trạng thái filter
    filterState = filter;
    
    // Cập nhật UI cho các nút filter
    const allButton = document.getElementById('toggleAllButton');
    const pendingButton = document.getElementById('togglePendingButton');
    const processedButton = document.getElementById('toggleProcessedButton');
    
    allButton.classList.remove('active', 'btn-primary');
    pendingButton.classList.remove('active', 'btn-warning');
    processedButton.classList.remove('active', 'btn-success');
    
    allButton.classList.add('btn-outline-primary');
    pendingButton.classList.add('btn-outline-warning');
    processedButton.classList.add('btn-outline-success');
    
    if (filter === 'all') {
        allButton.classList.add('active', 'btn-primary');
        allButton.classList.remove('btn-outline-primary');
    } else if (filter === 'pending') {
        pendingButton.classList.add('active', 'btn-warning');
        pendingButton.classList.remove('btn-outline-warning');
    } else if (filter === 'processed') {
        processedButton.classList.add('active', 'btn-success');
        processedButton.classList.remove('btn-outline-success');
    }
    
    // Hiển thị lại danh sách báo cáo
    renderReports();
}

/**
 * Xử lý tìm kiếm báo cáo
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm === '') {
        // Nếu không có từ khóa, hiển thị tất cả báo cáo
        renderReports();
        return;
    }
    
    // Lọc báo cáo theo trạng thái nếu cần
    let filteredReports = reports;
    if (filterState === 'pending') {
        filteredReports = reports.filter(report => report.status === 'pending');
    } else if (filterState === 'processed') {
        filteredReports = reports.filter(report => report.status === 'processed');
    }
    
    // Tìm kiếm trong các trường
    filteredReports = filteredReports.filter(report => 
        report.title.toLowerCase().includes(searchTerm) ||
        report.content.toLowerCase().includes(searchTerm) ||
        report.email.toLowerCase().includes(searchTerm) ||
        (report.username && report.username.toLowerCase().includes(searchTerm))
    );
    
    // Hiển thị kết quả tìm kiếm
    const tableBody = document.getElementById('reportTableBody');
    if (filteredReports.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center">Không tìm thấy báo cáo nào phù hợp</td></tr>`;
        document.getElementById('reportPagination').innerHTML = '';
        return;
    }
    
    // Tính toán phân trang cho kết quả tìm kiếm
    const totalItems = filteredReports.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    // Hiển thị danh sách báo cáo
    tableBody.innerHTML = '';
    
    paginatedReports.forEach(report => {
        // Format thời gian
        const reportedAt = new Date(report.reported_at).toLocaleString('vi-VN');
        const processedAt = report.processed_at ? new Date(report.processed_at).toLocaleString('vi-VN') : '—';
        
        // Xác định class và text cho trạng thái
        let statusClass = '';
        let statusText = '';
        if (report.status === 'pending') {
            statusClass = 'bg-warning text-dark';
            statusText = 'Đang chờ';
        } else if (report.status === 'processed') {
            statusClass = 'bg-success text-white';
            statusText = 'Đã xử lý';
        }

        // Tạo hàng cho báo cáo
        const row = `
            <tr data-id="${report.id}">
                <td>
                    <input type="checkbox" class="report-checkbox" data-id="${report.id}">
                </td>
                <td>${report.id}</td>
                <td>${report.username || 'Không xác định'}</td>
                <td>${report.title}</td>
                <td class="text-truncate" style="max-width: 150px;" title="${report.content}">${report.content}</td>
                <td>${report.email}</td>
                <td>${reportedAt}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${processedAt}</td>
                <td>
                    <button class="btn btn-info btn-sm view-report-btn" data-id="${report.id}"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-danger btn-sm delete-report-btn" data-id="${report.id}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    
    // Thêm listener cho các nút xem chi tiết và xóa
    document.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', () => showReportDetails(button.getAttribute('data-id')));
    });

    document.querySelectorAll('.delete-report-btn').forEach(button => {
        button.addEventListener('click', () => deleteReportConfirm(button.getAttribute('data-id')));
    });
    
    // Hiển thị phân trang
    renderPagination(
        document.getElementById('reportPagination'),
        totalPages,
        currentPage,
        (page) => {
            currentPage = page;
            handleSearch({ target: { value: searchTerm } });
        }
    );
}

/**
 * Chọn/bỏ chọn tất cả các báo cáo
 */
function toggleSelectAll(e) {
    const isChecked = e.target.checked;
    document.querySelectorAll('.report-checkbox').forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

/**
 * Xóa các báo cáo đã chọn
 */
async function deleteSelectedReports() {
    const selectedCheckboxes = document.querySelectorAll('.report-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Vui lòng chọn ít nhất một báo cáo để xóa');
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedCheckboxes.length} báo cáo đã chọn?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');
        
        // Tạo mảng các promise xóa báo cáo
        const deletePromises = Array.from(selectedCheckboxes).map(checkbox => {
            const reportId = checkbox.getAttribute('data-id');
            return fetch(`/report/${reportId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (!response.ok) throw new Error(`Không thể xóa báo cáo #${reportId}`);
                return response.json();
            });
        });
        
        // Chờ tất cả các promise hoàn thành
        await Promise.all(deletePromises);
        
        alert('Xóa báo cáo thành công');
        
        // Tải lại danh sách báo cáo
        loadReports();
    } catch (error) {
        console.error('Lỗi khi xóa báo cáo:', error);
        alert('Không thể xóa báo cáo: ' + error.message);
    }
}

/**
 * Hiển thị chi tiết báo cáo trong modal
 */
function showReportDetails(reportId) {
    const report = reports.find(r => r.id.toString() === reportId.toString());
    if (!report) {
        alert('Không tìm thấy báo cáo');
        return;
    }
    
    // Lưu ID báo cáo hiện tại
    currentReportId = reportId;
    
    // Cập nhật thông tin trong modal
    document.getElementById('detailReportId').textContent = report.id;
    document.getElementById('detailUsername').textContent = report.username || 'Không xác định';
    document.getElementById('detailEmail').textContent = report.email;
    document.getElementById('detailTitle').textContent = report.title;
    document.getElementById('detailContent').textContent = report.content;
    document.getElementById('detailReportedAt').textContent = new Date(report.reported_at).toLocaleString('vi-VN');
    
    // Cập nhật trạng thái
    let statusText = '';
    if (report.status === 'pending') {
        statusText = 'Đang chờ';
        document.getElementById('detailStatus').textContent = statusText;
        document.getElementById('detailStatus').className = 'form-control bg-warning text-dark';
        
        document.getElementById('markAsPendingButton').disabled = true;
        document.getElementById('markAsProcessedButton').disabled = false;
    } else if (report.status === 'processed') {
        statusText = 'Đã xử lý';
        document.getElementById('detailStatus').textContent = statusText;
        document.getElementById('detailStatus').className = 'form-control bg-success text-white';
        
        document.getElementById('markAsProcessedButton').disabled = true;
        document.getElementById('markAsPendingButton').disabled = false;
    }
    
    // Cập nhật thời gian xử lý
    document.getElementById('detailProcessedAt').textContent = report.processed_at 
        ? new Date(report.processed_at).toLocaleString('vi-VN') 
        : '—';
    
    // Hiển thị ghi chú nếu có
    document.getElementById('detailNotes').value = report.notes || '';
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('reportDetailModal'));
    modal.show();
}

/**
 * Cập nhật trạng thái báo cáo
 */
async function updateReportStatus(status) {
    if (!currentReportId) {
        alert('Không có báo cáo nào được chọn');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');
        
        const notes = document.getElementById('detailNotes').value.trim();
        
        const response = await fetch(`/report/${currentReportId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, notes })
        });
        
        if (!response.ok) {
            throw new Error('Không thể cập nhật trạng thái báo cáo');
        }
        
        // Tải lại danh sách báo cáo
        await loadReports();
        
        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reportDetailModal'));
        modal.hide();
        
        alert('Cập nhật trạng thái báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái báo cáo:', error);
        alert('Không thể cập nhật trạng thái báo cáo: ' + error.message);
    }
}

/**
 * Xác nhận xóa báo cáo
 */
function deleteReportConfirm(reportId) {
    if (confirm('Bạn có chắc muốn xóa báo cáo này?')) {
        currentReportId = reportId;
        deleteReport();
    }
}

/**
 * Xóa báo cáo
 */
async function deleteReport() {
    if (!currentReportId) {
        alert('Không có báo cáo nào được chọn');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');
        
        const response = await fetch(`/report/${currentReportId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể xóa báo cáo');
        }
        
        // Tải lại danh sách báo cáo
        await loadReports();
        
        // Đóng modal nếu đang mở
        const modal = bootstrap.Modal.getInstance(document.getElementById('reportDetailModal'));
        if (modal) modal.hide();
        
        alert('Xóa báo cáo thành công');
    } catch (error) {
        console.error('Lỗi khi xóa báo cáo:', error);
        alert('Không thể xóa báo cáo: ' + error.message);
    }
}

// Cập nhật cơ sở dữ liệu reports
function updateReportsDatabase() {
    const token = localStorage.getItem('token');
    
    // Thêm card cho số liệu thống kê báo cáo trong dashboard
    const cardRow = document.querySelector('.row');
    if (cardRow && !document.getElementById('reportStatsCard')) {
        const reportCard = document.createElement('div');
        reportCard.className = 'col-xl-3 col-md-6';
        reportCard.id = 'reportStatsCard';
        reportCard.innerHTML = `
            <div class="card bg-info text-white mb-4">
                <div class="card-body">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <div class="small text-white">Tổng số báo cáo</div>
                            <div class="display-6 text-white" id="totalReports">${reports.length}</div>
                        </div>
                        <div>
                            <i class="fas fa-flag fa-2x text-white"></i>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex align-items-center justify-content-between">
                    <a class="small text-white text-decoration-none" href="#report-management">Xem chi tiết</a>
                    <div class="small text-white"><i class="fas fa-angle-right"></i></div>
                </div>
            </div>
        `;
        
        cardRow.appendChild(reportCard);
    } else if (document.getElementById('totalReports')) {
        document.getElementById('totalReports').textContent = reports.length;
    }
} 