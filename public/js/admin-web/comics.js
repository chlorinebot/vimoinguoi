let originalComics = [];
const ITEMS_PER_PAGE = 5; // Số lượng truyện mỗi trang
let currentPage = 1; // Trang hiện tại

// Hàm lấy danh sách truyện từ API
export async function fetchComics() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cards', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách truyện: ' + response.statusText);
        }
        const comics = await response.json();
        originalComics = comics; // Lưu trữ dữ liệu gốc
        window.originalComics = comics; // Lưu vào window scope
        currentPage = 1; // Reset về trang đầu tiên
        renderComics(originalComics); // Hiển thị danh sách ban đầu
    } catch (error) {
        console.error('Lỗi trong fetchComics:', error);
        alert('Đã xảy ra lỗi khi lấy danh sách truyện: ' + error.message);
    }
}

// Hàm lấy thông tin thể loại
async function fetchGenres() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/genres', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách thể loại');
        }
        const genres = await response.json();
        window.allGenres = genres;
        return genres;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thể loại:', error);
        throw error;
    }
}

// Hàm hiển thị danh sách truyện
export function renderComics(comics) {
    const tableBody = document.getElementById('comicTableBody');
    const paginationContainer = document.getElementById('comicPagination');
    if (!tableBody || !paginationContainer) {
        console.error('Không tìm thấy phần tử comicTableBody hoặc comicPagination trong DOM');
        return;
    }

    // Tính toán dữ liệu phân trang
    const totalItems = comics.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedComics = comics.slice(startIndex, endIndex);

    // Hiển thị danh sách truyện
    tableBody.innerHTML = '';
    paginatedComics.forEach(comic => {
        const row = `
            <tr data-id="${comic.id}">
                <td>${comic.id}</td>
                <td class="title-column" title="${comic.title}">${comic.title}</td>
                <td>
                    ${comic.image && comic.image.trim() !== '' ? `<img src="${comic.image}" alt="${comic.title}" class="comic-image">` : 'N/A'}
                </td>
                <td class="author-column" title="${comic.content || 'N/A'}">${comic.content || 'N/A'}</td>
                <td class="link-column" title="${comic.link || 'N/A'}"><a href="${comic.link || '#'}" target="_blank">${comic.link || 'N/A'}</a></td>
                <td class="genre-column" title="${comic.genre_names || 'N/A'}">${comic.genre_names || 'N/A'}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-comic-btn" data-id="${comic.id}">
                        <i class="bi bi-trash"></i> Xóa
                    </button>
                    <button class="btn btn-info btn-sm show-chapters-btn" data-id="${comic.id}">
                        <i class="bi bi-book"></i> Chương
                    </button>
                    <button class="btn btn-warning btn-sm edit-comic-btn" data-id="${comic.id}">
                        <i class="bi bi-pencil"></i> Sửa
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderComics(comics);
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

// Hàm xóa truyện
export async function deleteComic(button) {
    if (confirm('Bạn có chắc chắn muốn xóa truyện này?')) {
        try {
            const row = button.closest('tr');
            const id = row.dataset.id;
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cards/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                row.remove();
                originalComics = originalComics.filter(comic => comic.id != id);
                renderComics(originalComics);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi xóa truyện');
            }
        } catch (error) {
            console.error('Lỗi trong deleteComic:', error);
            alert('Lỗi khi xóa truyện: ' + error.message);
        }
    }
}

// Hàm chỉnh sửa truyện
export async function editComic(id) {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Không tìm thấy token');

        // Tìm và xử lý thông tin truyện
        const comic = originalComics.find(c => c.id.toString() === id.toString());
        if (!comic) throw new Error('Không tìm thấy truyện trong danh sách');

        // Lấy thông tin thể loại
        const genresResponse = await fetch(`/api/cards/${id}/genres`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!genresResponse.ok) throw new Error('Không thể lấy thông tin thể loại');
        const genres = await genresResponse.json();

        // Cập nhật biến toàn cục
        window.isEditMode = true;
        window.editSelectedGenres = genres.map(g => g.genre_id.toString());
        window.currentComicGenres = genres;

        // Cập nhật form
        document.getElementById('comicId').value = comic.id;
        document.getElementById('comicTitle').value = comic.title || '';
        document.getElementById('comicImage').value = comic.image || '';
        document.getElementById('comicContent').value = comic.content || '';
        document.getElementById('comicLink').value = comic.link || '';
        document.getElementById('addComicModalLabel').textContent = 'Chỉnh Sửa Truyện';
        document.getElementById('comicSubmitButton').textContent = 'Cập Nhật';

        // Khởi tạo và hiển thị modal
        const modalElement = document.getElementById('addComicModal');
        
        // Đóng modal cũ nếu đang mở
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }

        // Xóa tất cả backdrop cũ
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Khởi tạo modal mới
        const modal = new bootstrap.Modal(modalElement);

        // Thêm event listener cho sự kiện đóng modal
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Xóa backdrop và reset body
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Reset các biến và form nếu cần
            if (!window.isEditMode) {
                window.selectedGenres = [];
                document.getElementById('comicId').value = '';
                document.getElementById('comicTitle').value = '';
                document.getElementById('comicImage').value = '';
                document.getElementById('comicContent').value = '';
                document.getElementById('comicLink').value = '';
                document.getElementById('addComicModalLabel').textContent = 'Thêm Truyện Mới';
                document.getElementById('comicSubmitButton').textContent = 'Thêm';
            }
            document.getElementById('genreInput').value = '';
            document.getElementById('genreSuggestions').style.display = 'none';
            if (typeof window.updateSelectedGenresList === 'function') {
                window.updateSelectedGenresList();
            }
        }, { once: true });
        
        // Đăng ký sự kiện shown.bs.modal một lần duy nhất
        modalElement.addEventListener('shown.bs.modal', async () => {
            try {
                if (!window.allGenres || window.allGenres.length === 0) {
                    await window.initializeGenreList();
                }
                if (typeof window.updateSelectedGenresList === 'function') {
                    window.updateSelectedGenresList();
                }
            } catch (error) {
                console.error('Lỗi khi khởi tạo danh sách thể loại:', error);
            }
        }, { once: true });

        modal.show();

    } catch (error) {
        console.error('Lỗi khi chỉnh sửa truyện:', error);
        alert('Lỗi khi chỉnh sửa truyện: ' + error.message);
    }
}

// Hàm tìm kiếm truyện
export function searchComics() {
    const searchTerm = document.getElementById('comicSearch').value.trim().toLowerCase();
    let filteredComics = [];

    if (searchTerm === '') {
        filteredComics = originalComics; // Hiển thị tất cả nếu không có từ khóa
    } else {
        filteredComics = originalComics.filter(comic => {
            const title = comic.title ? comic.title.toLowerCase() : '';
            return title.includes(searchTerm);
        });

        filteredComics.sort((a, b) => {
            const aTitle = a.title ? a.title.toLowerCase() : '';
            const bTitle = b.title ? b.title.toLowerCase() : '';
            const aMatch = aTitle.includes(searchTerm);
            const bMatch = bTitle.includes(searchTerm);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
    renderComics(filteredComics); // Hiển thị danh sách đã lọc
}

// Khởi tạo sự kiện
document.addEventListener('DOMContentLoaded', () => {
    // Đăng ký hàm fetchComics vào window scope
    window.fetchComics = fetchComics;

    // Khởi tạo các biến toàn cục nếu chưa tồn tại
    window.selectedGenres = window.selectedGenres || [];
    window.editSelectedGenres = window.editSelectedGenres || [];
    window.isEditMode = window.isEditMode || false;
    window.currentComicGenres = window.currentComicGenres || [];
    window.allGenres = window.allGenres || [];

    // Khởi tạo sự kiện cho bảng truyện
    const comicTableBody = document.getElementById('comicTableBody');
    if (comicTableBody) {
        // Xóa event listener cũ nếu có
        const oldHandler = comicTableBody.onclick;
        if (oldHandler) {
            comicTableBody.removeEventListener('click', oldHandler);
        }

        // Thêm event listener mới
        comicTableBody.onclick = async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            if (!id) {
                console.error('Không tìm thấy ID truyện');
                return;
            }

            e.preventDefault(); // Ngăn chặn hành vi mặc định

            try {
                if (target.classList.contains('delete-comic-btn')) {
                    await deleteComic(target);
                } else if (target.classList.contains('show-chapters-btn')) {
                    showChapters(id);
                } else if (target.classList.contains('edit-comic-btn')) {
                    // Đảm bảo modal và backdrop cũ được dọn dẹp
                    const modalElement = document.getElementById('addComicModal');
                    const existingModal = bootstrap.Modal.getInstance(modalElement);
                    if (existingModal) {
                        existingModal.dispose();
                    }
                    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
                    document.body.classList.remove('modal-open');
                    
                    // Sau đó mới gọi editComic
                    await editComic(id);
                }
            } catch (error) {
                console.error('Lỗi khi xử lý sự kiện:', error);
                alert('Lỗi: ' + error.message);
            }
        };
    }

    // Khởi tạo sự kiện tìm kiếm
    const searchInput = document.getElementById('comicSearch');
    if (searchInput) {
        const oldHandler = searchInput.oninput;
        if (oldHandler) {
            searchInput.removeEventListener('input', oldHandler);
        }
        searchInput.oninput = searchComics;
    }

    // Tải danh sách truyện ban đầu
    fetchComics();
});