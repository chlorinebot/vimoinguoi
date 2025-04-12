// genres.js
let originalGenres = [];
const ITEMS_PER_PAGE = 5; // Số lượng thể loại mỗi trang
let currentPage = 1; // Trang hiện tại

// Hàm lấy danh sách thể loại từ API
export async function fetchGenres() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/genres', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách thể loại: ' + response.statusText);
        }
        const genres = await response.json();
        originalGenres = genres; // Lưu trữ dữ liệu gốc
        currentPage = 1; // Reset về trang đầu tiên
        renderGenres(genres); // Hiển thị danh sách ban đầu
    } catch (error) {
        console.error('Lỗi trong fetchGenres:', error);
        alert('Đã xảy ra lỗi khi lấy danh sách thể loại: ' + error.message);
    }
}

// Hàm hiển thị danh sách thể loại
export function renderGenres(genres) {
    const tableBody = document.getElementById('genreTableBody');
    const paginationContainer = document.getElementById('genrePagination');
    if (!tableBody || !paginationContainer) {
        console.error('Không tìm thấy phần tử genreTableBody hoặc genrePagination trong DOM');
        return;
    }

    // Tính toán dữ liệu phân trang
    const totalItems = genres.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedGenres = genres.slice(startIndex, endIndex);

    // Hiển thị danh sách thể loại
    tableBody.innerHTML = '';
    paginatedGenres.forEach(genre => {
        const row = `
            <tr data-id="${genre.genre_id}">
                <td>${genre.genre_id}</td>
                <td>${genre.genre_name}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-genre-btn" data-id="${genre.genre_id}"><i class="bi bi-trash"></i> Xóa</button>
                    <button class="btn btn-warning btn-sm edit-genre-btn" data-id="${genre.genre_id}"><i class="bi bi-pencil"></i> Sửa</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderGenres(genres);
    });
}

// Hàm render phân trang
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

// Hàm xóa thể loại
export async function deleteGenre(button) {
    if (confirm('Bạn có chắc chắn muốn xóa thể loại này?')) {
        try {
            const row = button.closest('tr');
            const id = row.dataset.id;
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/genres/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                row.remove();
                // Cập nhật lại danh sách gốc sau khi xóa
                originalGenres = originalGenres.filter(genre => genre.genre_id != id);
                renderGenres(originalGenres);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi xóa thể loại');
            }
        } catch (error) {
            console.error('Lỗi khi xóa thể loại:', error);
            alert('Lỗi khi xóa thể loại: ' + error.message);
        }
    }
}

// Hàm chỉnh sửa thể loại
export async function editGenre(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/genres', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lấy danh sách thể loại');
        }
        const genres = await response.json();
        const genre = genres.find(g => g.genre_id == id);
        if (genre) {
            document.getElementById('genreId').value = genre.genre_id;
            document.getElementById('genreName').value = genre.genre_name;
            document.getElementById('addGenreModalLabel').textContent = 'Chỉnh Sửa Thể Loại';
            document.getElementById('genreSubmitButton').textContent = 'Cập Nhật';
            new bootstrap.Modal(document.getElementById('addGenreModal')).show();
        }
    } catch (error) {
        console.error('Lỗi trong editGenre:', error);
        alert('Lỗi khi chỉnh sửa thể loại: ' + error.message);
    }
}

// Hàm tìm kiếm thể loại
export function searchGenres() {
    const searchTerm = document.getElementById('genreSearch').value.trim().toLowerCase();
    let filteredGenres = [];

    if (searchTerm === '') {
        filteredGenres = originalGenres; // Hiển thị tất cả nếu không có từ khóa
    } else {
        // Lọc các thể loại khớp với từ khóa
        filteredGenres = originalGenres.filter(genre => {
            const genreName = genre.genre_name ? genre.genre_name.toLowerCase() : '';
            return genreName.includes(searchTerm);
        });

        // Sắp xếp: các mục khớp với từ khóa lên đầu
        filteredGenres.sort((a, b) => {
            const aGenreName = a.genre_name ? a.genre_name.toLowerCase() : '';
            const bGenreName = b.genre_name ? b.genre_name.toLowerCase() : '';
            const aMatch = aGenreName.includes(searchTerm);
            const bMatch = bGenreName.includes(searchTerm);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
    renderGenres(filteredGenres); // Hiển thị danh sách đã lọc
}