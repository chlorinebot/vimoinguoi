// users.js
let originalUsers = [];
const ITEMS_PER_PAGE = 5; // Số lượng người dùng mỗi trang
let currentPage = 1; // Trang hiện tại

export async function fetchUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách người dùng: ' + response.statusText);
        }
        const users = await response.json();
        originalUsers = users; // Lưu trữ dữ liệu gốc
        currentPage = 1; // Reset về trang đầu tiên
        renderUsers(users); // Hiển thị danh sách ban đầu
    } catch (error) {
        console.error('Lỗi trong fetchUsers:', error);
        alert('Đã xảy ra lỗi khi lấy danh sách người dùng: ' + error.message);
    }
}

export function renderUsers(users) {
    const tableBody = document.getElementById('userTableBody');
    const paginationContainer = document.getElementById('userPagination');
    if (!tableBody || !paginationContainer) {
        console.error('Không tìm thấy phần tử userTableBody hoặc userPagination trong DOM');
        return;
    }

    // Tính toán dữ liệu phân trang
    const totalItems = users.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = users.slice(startIndex, endIndex);

    // Hiển thị danh sách người dùng
    tableBody.innerHTML = '';
    paginatedUsers.forEach(user => {
        const row = `
            <tr data-id="${user.id}">
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <span class="password-mask">••••••••</span>
                    <span class="password-text d-none">${user.password}</span>
                    <button class="btn btn-sm btn-outline-secondary toggle-password"><i class="bi bi-eye"></i></button>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-user-btn" data-id="${user.id}"><i class="bi bi-trash"></i> Xóa</button>
                    <button class="btn btn-warning btn-sm edit-user-btn" data-id="${user.id}"><i class="bi bi-pencil"></i> Sửa</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderUsers(users);
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

export async function deleteUser(button) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
        try {
            const row = button.closest('tr');
            const id = row.dataset.id;
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                row.remove();
                // Cập nhật lại danh sách gốc sau khi xóa
                originalUsers = originalUsers.filter(user => user.id != id);
                renderUsers(originalUsers);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi xóa người dùng');
            }
        } catch (error) {
            console.error('Lỗi khi xóa người dùng:', error);
            alert('Lỗi khi xóa người dùng: ' + error.message);
        }
    }
}

export async function editUser(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lấy danh sách người dùng');
        }
        const users = await response.json();
        const user = users.find(u => u.id == id);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('userName').value = user.username;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPassword').value = user.password;
            document.getElementById('addUserModalLabel').textContent = 'Chỉnh Sửa Người Dùng';
            document.getElementById('userSubmitButton').textContent = 'Cập Nhật';
            new bootstrap.Modal(document.getElementById('addUserModal')).show();
        }
    } catch (error) {
        console.error('Lỗi trong editUser:', error);
        alert('Lỗi khi chỉnh sửa người dùng: ' + error.message);
    }
}

export function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.trim().toLowerCase();
    let filteredUsers = [];

    if (searchTerm === '') {
        filteredUsers = originalUsers; // Hiển thị tất cả nếu không có từ khóa
    } else {
        // Lọc các người dùng khớp với từ khóa
        filteredUsers = originalUsers.filter(user => {
            const username = user.username ? user.username.toLowerCase() : '';
            return username.includes(searchTerm);
        });

        // Sắp xếp: các mục khớp với từ khóa lên đầu
        filteredUsers.sort((a, b) => {
            const aUsername = a.username ? a.username.toLowerCase() : '';
            const bUsername = b.username ? b.username.toLowerCase() : '';
            const aMatch = aUsername.includes(searchTerm);
            const bMatch = bUsername.includes(searchTerm);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
    renderUsers(filteredUsers); // Hiển thị danh sách đã lọc
}