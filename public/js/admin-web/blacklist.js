// blacklist.js
let originalBlacklist = [];
const ITEMS_PER_PAGE = 5; // Số lượng người dùng mỗi trang
let currentPage = 1; // Trang hiện tại

export async function fetchBlacklist() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blacklist', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách đen: ' + response.statusText);
        }
        const blacklist = await response.json();
        originalBlacklist = blacklist; // Lưu trữ dữ liệu gốc
        currentPage = 1; // Reset về trang đầu tiên
        renderBlacklist(blacklist); // Hiển thị danh sách ban đầu
    } catch (error) {
        console.error('Lỗi trong fetchBlacklist:', error);
        alert('Đã xảy ra lỗi khi lấy danh sách đen: ' + error.message);
    }
}

export function renderBlacklist(blacklist) {
    const tableBody = document.getElementById('blacklistTableBody');
    const paginationContainer = document.getElementById('blacklistPagination');
    if (!tableBody || !paginationContainer) {
        console.error('Không tìm thấy phần tử blacklistTableBody hoặc blacklistPagination trong DOM');
        return;
    }

    // Tính toán dữ liệu phân trang
    const totalItems = blacklist.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedBlacklist = blacklist.slice(startIndex, endIndex);

    // Hiển thị danh sách người dùng trong blacklist
    tableBody.innerHTML = '';
    if (paginatedBlacklist.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không có người dùng nào trong danh sách đen</td></tr>';
        return;
    }

    paginatedBlacklist.forEach(item => {
        const createdAt = new Date(item.created_at).toLocaleString();
        const row = `
            <tr data-id="${item.id}" data-user-id="${item.user_id}">
                <td>${item.id}</td>
                <td>${item.user_id}</td>
                <td>${item.username}</td>
                <td>${item.email}</td>
                <td>${item.reason || 'Không có lý do'}</td>
                <td>${createdAt}</td>
                <td>
                    <button class="btn btn-success btn-sm remove-blacklist-btn" data-user-id="${item.user_id}">
                        <i class="bi bi-unlock"></i> Gỡ Khỏi Danh Sách Đen
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderBlacklist(blacklist);
    });

    // Thêm event listener cho các nút gỡ khỏi danh sách đen
    document.querySelectorAll('.remove-blacklist-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const userId = e.currentTarget.dataset.userId;
            await removeFromBlacklist(userId);
        });
    });
}

function renderPagination(container, totalPages, currentPage, onPageChange) {
    container.innerHTML = '';
    if (totalPages <= 1) return; // Không cần phân trang nếu chỉ có 1 trang

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    });
    ul.appendChild(prevLi);

    // Các trang số
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(i);
        });
        ul.appendChild(li);
    }

    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    });
    ul.appendChild(nextLi);

    container.appendChild(ul);
}

export async function addToBlacklist(userId, reason) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/blacklist', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, reason })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi thêm vào danh sách đen');
        }
        
        const result = await response.json();
        alert(result.message || 'Đã thêm người dùng vào danh sách đen thành công');
        
        // Cập nhật lại danh sách
        await fetchBlacklist();
        
        return result;
    } catch (error) {
        console.error('Lỗi khi thêm vào danh sách đen:', error);
        alert('Lỗi khi thêm vào danh sách đen: ' + error.message);
        throw error;
    }
}

export async function removeFromBlacklist(userId) {
    if (confirm('Bạn có chắc chắn muốn gỡ người dùng này khỏi danh sách đen?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/blacklist/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi gỡ khỏi danh sách đen');
            }
            
            const result = await response.json();
            alert(result.message || 'Đã gỡ người dùng khỏi danh sách đen thành công');
            
            // Cập nhật lại danh sách
            await fetchBlacklist();
            
            return result;
        } catch (error) {
            console.error('Lỗi khi gỡ khỏi danh sách đen:', error);
            alert('Lỗi khi gỡ khỏi danh sách đen: ' + error.message);
            throw error;
        }
    }
}

export function searchBlacklist() {
    const searchTerm = document.getElementById('blacklistSearch').value.trim().toLowerCase();
    let filteredBlacklist = [];

    if (searchTerm === '') {
        filteredBlacklist = originalBlacklist; // Hiển thị tất cả nếu không có từ khóa
    } else {
        // Lọc các người dùng khớp với từ khóa
        filteredBlacklist = originalBlacklist.filter(item => {
            const username = item.username ? item.username.toLowerCase() : '';
            const email = item.email ? item.email.toLowerCase() : '';
            const reason = item.reason ? item.reason.toLowerCase() : '';
            return username.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   reason.includes(searchTerm) ||
                   item.user_id.toString().includes(searchTerm);
        });
    }

    currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
    renderBlacklist(filteredBlacklist); // Hiển thị danh sách đã lọc
}

// Khởi tạo các event listener
export function initBlacklistEvents() {
    // Form thêm vào blacklist
    const addBlacklistForm = document.getElementById('addBlacklistForm');
    if (addBlacklistForm) {
        addBlacklistForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('blacklistUserId').value;
            const reason = document.getElementById('blacklistReason').value;
            
            try {
                await addToBlacklist(userId, reason);
                // Đóng modal sau khi thêm thành công
                const modal = bootstrap.Modal.getInstance(document.getElementById('addBlacklistModal'));
                modal.hide();
                // Reset form
                addBlacklistForm.reset();
            } catch (error) {
                console.error('Lỗi khi thêm vào blacklist:', error);
            }
        });
    }

    // Tìm kiếm trong blacklist
    const blacklistSearch = document.getElementById('blacklistSearch');
    if (blacklistSearch) {
        blacklistSearch.addEventListener('input', () => {
            searchBlacklist();
        });
    }
}
