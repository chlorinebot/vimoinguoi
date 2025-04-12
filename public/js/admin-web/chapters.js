// chapters.js
let originalChapters = [];
const ITEMS_PER_PAGE = 5; // Số lượng chương mỗi trang
let currentPage = 1; // Trang hiện tại

export async function showChapters(cardId) {
    console.log('showChapters được gọi với cardId:', cardId);
    try {
        // Đóng các modal khác nếu có
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });

        const token = localStorage.getItem('token');
        const response = await fetch('/api/chapters', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Phản hồi từ API /api/chapters:', response);
        if (!response.ok) {
            throw new Error('Lỗi khi lấy danh sách chương: ' + response.statusText);
        }
        const chapters = await response.json();
        console.log('Dữ liệu chương:', chapters);
        originalChapters = chapters[cardId] || []; // Lưu trữ danh sách chương gốc
        currentPage = 1; // Reset về trang đầu tiên
        renderChapters(originalChapters, cardId);

        // Tính số chương lớn nhất hiện có của truyện
        let defaultChapterNumber = 1; // Giá trị mặc định ban đầu
        if (originalChapters.length > 0) {
            const chapterNumbers = originalChapters.map(ch => parseInt(ch.chapterNumber)).filter(num => !isNaN(num));
            if (chapterNumbers.length > 0) {
                const maxChapterNumber = Math.max(...chapterNumbers);
                defaultChapterNumber = maxChapterNumber + 1; // Tăng dần từ số lớn nhất
            }
        }

        // Gán giá trị mặc định cho modal "Thêm Chương Mới"
        document.getElementById('chapterCardId').value = cardId;
        document.getElementById('chapterCardIdHidden').value = cardId;
        document.getElementById('chapterNumber').value = defaultChapterNumber;
        document.getElementById('chapterTitle').value = '';
        document.getElementById('chapterContent').value = '';
        document.getElementById('chapterImageFolder').value = '';
        document.getElementById('chapterImageCount').value = 0;
        document.getElementById('addChapterModalLabel').textContent = 'Thêm Chương Mới';
        document.getElementById('chapterSubmitButton').textContent = 'Thêm';

        document.getElementById('chapterModalTitle').textContent = `Chương của truyện ID: ${cardId}`;
        const chapterModal = document.getElementById('chapterModal');
        if (!chapterModal) {
            throw new Error('Không tìm thấy modal chapterModal trong DOM');
        }
        if (typeof bootstrap === 'undefined') {
            throw new Error('Bootstrap không được tải đúng cách');
        }
        console.log('Mở modal chapterModal');
        const modalInstance = new bootstrap.Modal(chapterModal);
        modalInstance.show();
        console.log('Modal đã được gọi để hiển thị');
    } catch (error) {
        console.error('Lỗi trong showChapters:', error);
        alert('Đã xảy ra lỗi khi hiển thị danh sách chương: ' + error.message);
    }
}

export function renderChapters(chapterList, cardId) {
    const chapterBody = document.getElementById('chapterTableBody');
    const paginationContainer = document.getElementById('chapterPagination');
    if (!chapterBody || !paginationContainer) {
        console.error('Không tìm thấy phần tử chapterTableBody hoặc chapterPagination trong DOM');
        return;
    }

    // Tính toán dữ liệu phân trang
    const totalItems = chapterList.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedChapters = chapterList.slice(startIndex, endIndex);

    // Hiển thị danh sách chương
    chapterBody.innerHTML = '';
    if (paginatedChapters.length === 0) {
        chapterBody.innerHTML = '<tr><td colspan="6" class="text-center">Không có chương nào cho truyện này.</td></tr>';
    } else {
        paginatedChapters.forEach(chapter => {
            const row = `
                <tr>
                    <td>${chapter.chapterNumber}</td>
                    <td>${chapter.chapterTitle || 'N/A'}</td>
                    <td>${chapter.content || 'N/A'}</td>
                    <td>${chapter.imageFolder || 'N/A'}</td>
                    <td>${chapter.imageCount || 0}</td>
                    <td>
                        <button class="btn btn-danger btn-sm delete-chapter-btn" data-card-id="${cardId}" data-chapter-number="${chapter.chapterNumber}"><i class="bi bi-trash"></i> Xóa</button>
                        <button class="btn btn-warning btn-sm edit-chapter-btn" data-card-id="${cardId}" data-chapter-number="${chapter.chapterNumber}"><i class="bi bi-pencil"></i> Sửa</button>
                    </td>
                </tr>
            `;
            chapterBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Hiển thị phân trang
    renderPagination(paginationContainer, totalPages, currentPage, (page) => {
        currentPage = page;
        renderChapters(chapterList, cardId);
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

export async function deleteChapter(cardId, chapterNumber, button) {
    console.log('deleteChapter được gọi:', cardId, chapterNumber);
    if (confirm('Bạn có chắc chắn muốn xóa chương này?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/chapters?card_id=${cardId}&chapter_number=${chapterNumber}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Phản hồi từ API /api/chapters:', response);
            if (response.ok) {
                button.closest('tr').remove();
                console.log('Chương đã được xóa thành công');
                // Cập nhật danh sách chương gốc
                originalChapters = originalChapters.filter(ch => ch.chapterNumber != chapterNumber);
                renderChapters(originalChapters, cardId);
            } else {
                const errorData = await response.json();
                console.error('Lỗi khi xóa chương:', errorData);
                throw new Error(errorData.error || 'Lỗi khi xóa chương');
            }
        } catch (error) {
            console.error('Lỗi trong deleteChapter:', error);
            alert('Lỗi khi xóa chương: ' + error.message);
        }
    }
}

export async function editChapter(cardId, chapterNumber) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chapters', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lấy danh sách chương');
        }
        const chapters = await response.json();
        const chapter = (chapters[cardId] || []).find(ch => ch.chapterNumber == chapterNumber);
        if (chapter) {
            document.getElementById('chapterCardId').value = cardId;
            document.getElementById('chapterCardIdHidden').value = cardId;
            document.getElementById('chapterNumber').value = chapter.chapterNumber;
            document.getElementById('chapterTitle').value = chapter.chapterTitle || '';
            document.getElementById('chapterContent').value = chapter.content || '';
            document.getElementById('chapterImageFolder').value = chapter.imageFolder || '';
            document.getElementById('chapterImageCount').value = chapter.imageCount || 0;
            document.getElementById('addChapterModalLabel').textContent = 'Chỉnh Sửa Chương';
            document.getElementById('chapterSubmitButton').textContent = 'Cập Nhật';
            new bootstrap.Modal(document.getElementById('addChapterModal')).show();
        }
    } catch (error) {
        console.error('Lỗi trong editChapter:', error);
        alert('Lỗi khi chỉnh sửa chương: ' + error.message);
    }
}

export function searchChapters(cardId) {
    const searchTerm = document.getElementById('chapterSearch').value.trim().toLowerCase();
    let filteredChapters = [];

    if (searchTerm === '') {
        filteredChapters = originalChapters; // Hiển thị tất cả nếu không có từ khóa
    } else {
        // Lọc các chương khớp với từ khóa (theo chapterNumber hoặc chapterTitle)
        filteredChapters = originalChapters.filter(chapter => {
            const chapterNumber = chapter.chapterNumber.toString().toLowerCase();
            const chapterTitle = chapter.chapterTitle ? chapter.chapterTitle.toLowerCase() : '';
            return chapterNumber.includes(searchTerm) || chapterTitle.includes(searchTerm);
        });

        // Sắp xếp: các mục khớp với từ khóa lên đầu
        filteredChapters.sort((a, b) => {
            const aNumber = a.chapterNumber.toString().toLowerCase();
            const bNumber = b.chapterNumber.toString().toLowerCase();
            const aTitle = a.chapterTitle ? a.chapterTitle.toLowerCase() : '';
            const bTitle = b.chapterTitle ? b.chapterTitle.toLowerCase() : '';
            const aMatch = aNumber.includes(searchTerm) || aTitle.includes(searchTerm);
            const bMatch = bNumber.includes(searchTerm) || bTitle.includes(searchTerm);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
    renderChapters(filteredChapters, cardId); // Hiển thị danh sách đã lọc
}