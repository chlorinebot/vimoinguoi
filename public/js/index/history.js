// public/js/index/history.js
document.addEventListener('DOMContentLoaded', () => {
    // Xử lý sự kiện khi tab lịch sử đọc được chọn
    const historyTab = document.getElementById('history-tab');
    if (historyTab) {
        historyTab.addEventListener('click', loadReadingHistory);
    }

    // Xử lý nút tìm kiếm lịch sử
    const searchHistoryBtn = document.getElementById('searchHistoryBtn');
    if (searchHistoryBtn) {
        searchHistoryBtn.addEventListener('click', searchInHistory);
    }

    // Xử lý input tìm kiếm khi nhấn Enter
    const searchHistory = document.getElementById('searchHistory');
    if (searchHistory) {
        searchHistory.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchInHistory();
            }
        });
    }

    // Xử lý nút xóa tất cả lịch sử
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', confirmClearHistory);
    }
});

// Hàm tải lịch sử đọc truyện
async function loadReadingHistory() {
    const readingHistoryList = document.getElementById('readingHistoryList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    
    if (!readingHistoryList || !noHistoryMessage) {
        console.error('Không tìm thấy các phần tử DOM cần thiết!');
        return;
    }

    try {
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (!token) {
            noHistoryMessage.textContent = 'Vui lòng đăng nhập để xem lịch sử đọc truyện!';
            noHistoryMessage.classList.remove('d-none');
            readingHistoryList.classList.add('d-none');
            return;
        }

        // Giải mã token để lấy userId
        const decoded = jwt_decode(token);
        const userId = decoded.id;

        // Hiển thị trạng thái đang tải
        readingHistoryList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Đang tải lịch sử đọc...</p></div>';

        // Gọi API để lấy lịch sử đọc
        const response = await fetch(`/api/reading-history/${userId}`);
        if (!response.ok) {
            throw new Error('Không thể tải lịch sử đọc truyện');
        }

        const historyData = await response.json();

        if (historyData.length === 0) {
            noHistoryMessage.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-2"></i><div>Bạn chưa có lịch sử đọc truyện nào.</div>';
            noHistoryMessage.classList.remove('d-none');
            readingHistoryList.classList.add('d-none');
            return;
        }

        // Hiển thị danh sách lịch sử
        noHistoryMessage.classList.add('d-none');
        readingHistoryList.classList.remove('d-none');
        readingHistoryList.innerHTML = '';

        // Sắp xếp lịch sử theo thời gian giảm dần (mới nhất lên đầu)
        historyData.sort((a, b) => new Date(b.read_at) - new Date(a.read_at));

        historyData.forEach(item => {
            const historyItem = document.createElement('a');
            historyItem.href = `/?comicId=${item.card_id}&chapterId=${item.chapter_id}`;
            historyItem.className = 'list-group-item list-group-item-action d-flex gap-3 py-3';
            historyItem.dataset.title = item.card_title;
            historyItem.dataset.chapter = item.chapter_number;
            
            // Tính thời gian tương đối
            const timeAgo = getTimeAgo(new Date(item.read_at));
            
            historyItem.innerHTML = `
                <img src="${item.card_image || 'https://via.placeholder.com/50'}" class="rounded flex-shrink-0" width="50" height="50" alt="Ảnh bìa">
                <div class="d-flex gap-2 w-100 justify-content-between">
                    <div>
                        <h6 class="mb-0">${item.card_title}</h6>
                        <p class="mb-0 opacity-75">Chương ${item.chapter_number}${item.chapter_title ? ' - ' + item.chapter_title : ''}</p>
                    </div>
                    <small class="opacity-50 text-nowrap">${timeAgo}</small>
                </div>
            `;
            
            // Xử lý sự kiện click để mở truyện
            historyItem.addEventListener('click', function(e) {
                e.preventDefault();
                // Đóng modal profile
                const profileModal = bootstrap.Modal.getInstance(document.getElementById('userProfileModal'));
                if (profileModal) {
                    profileModal.hide();
                }
                
                // Mở truyện
                openComic(item.card_id, item.chapter_id);
            });
            
            readingHistoryList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Lỗi khi tải lịch sử đọc:', error);
        readingHistoryList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Không thể tải lịch sử đọc truyện. Vui lòng thử lại sau!
            </div>
        `;
    }
}

// Hàm tìm kiếm trong lịch sử
function searchInHistory() {
    const searchInput = document.getElementById('searchHistory');
    const historyItems = document.querySelectorAll('#readingHistoryList a');
    
    if (!searchInput || historyItems.length === 0) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        // Hiển thị lại tất cả mục nếu không có từ khóa tìm kiếm
        historyItems.forEach(item => item.style.display = 'flex');
        return;
    }
    
    // Lọc và hiển thị các mục phù hợp
    historyItems.forEach(item => {
        const title = item.dataset.title.toLowerCase();
        const chapter = item.dataset.chapter.toLowerCase();
        
        if (title.includes(searchTerm) || chapter.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Hàm chuyển đổi thời gian sang định dạng "cách đây X phút/giờ/ngày"
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval + ' năm trước';
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + ' tháng trước';
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + ' ngày trước';
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + ' giờ trước';
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + ' phút trước';
    }
    
    return 'Vừa xong';
}

// Hàm mở truyện từ lịch sử đọc
function openComic(cardId, chapterId) {
    // Điều hướng đến trang chi tiết truyện với ID và chương cần đọc
    window.location.href = `/?comicId=${cardId}&chapterId=${chapterId}`;
}

// Hàm xác nhận và xóa tất cả lịch sử
function confirmClearHistory() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử đọc truyện không?')) {
        clearReadingHistory();
    }
}

// Hàm xóa tất cả lịch sử đọc
async function clearReadingHistory() {
    try {
        // Kiểm tra đăng nhập
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để thực hiện chức năng này!');
            return;
        }

        // Hiển thị trạng thái đang xử lý
        const readingHistoryList = document.getElementById('readingHistoryList');
        if (readingHistoryList) {
            readingHistoryList.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Đang xóa lịch sử...</p></div>';
        }

        // Gọi API để xóa tất cả lịch sử
        const response = await fetch('/api/reading-history/clear/all', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xóa lịch sử đọc truyện');
        }

        const result = await response.json();
        console.log('Đã xóa lịch sử đọc:', result);
        
        // Tải lại danh sách lịch sử (sẽ hiển thị thông báo không có lịch sử)
        loadReadingHistory();
        
        // Thông báo thành công
        alert('Đã xóa tất cả lịch sử đọc truyện!');
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử đọc:', error);
        alert('Có lỗi xảy ra khi xóa lịch sử đọc truyện!');
        
        // Tải lại lịch sử để hiển thị lại danh sách
        loadReadingHistory();
    }
}

// Quản lý lịch sử đọc truyện
document.addEventListener('DOMContentLoaded', function() {
    // Các elements
    const historySearchForm = document.getElementById('historySearchForm');
    const historySearchInput = document.getElementById('historySearchInput');
    const searchHistoryInput = document.getElementById('searchHistory');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const readingHistoryList = document.getElementById('readingHistoryList');
    const noHistoryMessage = document.querySelectorAll('#noHistoryMessage');

    // Khởi tạo mảng lịch sử từ localStorage
    let readingHistory = JSON.parse(localStorage.getItem('readingHistory')) || [];

    // Hiển thị lịch sử
    function displayHistory(historyItems = readingHistory) {
        if (!readingHistoryList) return;

        if (historyItems.length === 0) {
            noHistoryMessage.forEach(msg => msg.classList.remove('d-none'));
            readingHistoryList.innerHTML = '';
            return;
        }

        noHistoryMessage.forEach(msg => msg.classList.add('d-none'));
        readingHistoryList.innerHTML = historyItems.map((item, index) => `
            <div class="list-group-item list-group-item-action" aria-current="true">
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${item.title}</h6>
                        <p class="mb-1 text-muted">Chương ${item.chapter}</p>
                    </div>
                    <div>
                        <small class="text-muted">${new Date(item.timestamp).toLocaleString()}</small>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeHistoryItem(${index})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Thêm vào lịch sử
    window.addToHistory = function(title, chapter) {
        const historyItem = {
            title,
            chapter,
            timestamp: new Date().toISOString()
        };

        readingHistory.unshift(historyItem);
        localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
        displayHistory();
    };

    // Xóa một mục khỏi lịch sử
    window.removeHistoryItem = function(index) {
        readingHistory.splice(index, 1);
        localStorage.setItem('readingHistory', JSON.stringify(readingHistory));
        displayHistory();
    };

    // Xóa toàn bộ lịch sử
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc?')) {
                readingHistory = [];
                localStorage.removeItem('readingHistory');
                displayHistory();
            }
        });
    }

    // Tìm kiếm trong lịch sử
    function searchHistory(query) {
        if (!query) {
            displayHistory();
            return;
        }

        const searchResults = readingHistory.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.chapter.toString().includes(query)
        );
        displayHistory(searchResults);
    }

    // Xử lý sự kiện tìm kiếm
    if (historySearchForm) {
        historySearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchHistory(historySearchInput.value);
        });
    }

    if (searchHistoryInput) {
        searchHistoryInput.addEventListener('input', function(e) {
            searchHistory(e.target.value);
        });
    }

    // Hiển thị lịch sử ban đầu
    displayHistory();
});