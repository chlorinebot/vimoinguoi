// Khai báo biến toàn cục
let currentCardId = null;  // ID của truyện hiện tại
let filteredCards = [];   // Danh sách truyện đã được lọc

// Sự kiện khi trang đã tải xong
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Tải danh sách truyện từ ApiService
        const cards = await ApiService.getCards();
        if (!cards || !Array.isArray(cards)) {
            throw new Error('Không lấy được dữ liệu truyện');
        }
        
        // Lưu trữ danh sách truyện đã lọc ban đầu
        filteredCards = [...cards];
        
        // Tải danh sách thể loại từ ApiService
        const genres = await ApiService.getGenres();
        
        // Hiển thị danh sách thể loại
        populateGenreFilter(genres);
        
        // Hiển thị danh sách truyện
        displayCards(cards);
        
        // Thiết lập sự kiện cho các nút điều hướng
        setupPagination();
        
        // Thiết lập sự kiện cho tìm kiếm
        setupSearch();
        
        // Thiết lập sự kiện cho bộ lọc
        setupFilters();
        
        // Thiết lập sự kiện cho nút đăng nhập/đăng ký
        setupAuthButtons();
        
    } catch (error) {
        console.error('Lỗi khi khởi tạo ứng dụng:', error);
        document.getElementById('cards-container').innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Không thể tải dữ liệu truyện. Vui lòng thử lại sau.
            </div>
        `;
    }
});

// Hiển thị danh sách truyện
function displayCards(cards) {
    const container = document.getElementById('cards-container');
    container.innerHTML = ''; // Xóa nội dung hiện tại
    
    if (!cards || cards.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Không tìm thấy truyện nào phù hợp với tiêu chí tìm kiếm.
                </div>
            </div>
        `;
        return;
    }
    
    // Hiển thị từng truyện
    cards.forEach(card => {
        // Tạo phần tử card
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
}

// Tạo phần tử card cho một truyện
function createCardElement(card) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';
    
    // Tạo hashtags
    const hashtagsHtml = card.hashtags ? card.hashtags.map(tag => 
        `<span class="badge bg-secondary me-1">#${tag}</span>`
    ).join('') : '';
    
    // Xác định trạng thái cập nhật
    const updateStatus = card.status === 'completed' ? 
        '<span class="badge bg-success">Hoàn thành</span>' : 
        '<span class="badge bg-primary">Đang cập nhật</span>';
    
    col.innerHTML = `
        <div class="card h-100 manga-card" data-id="${card.id}">
            <div class="card-img-container position-relative">
                <img src="${card.image}" class="card-img-top" alt="${card.title}" loading="lazy">
                <div class="position-absolute top-0 end-0 p-2">
                    ${updateStatus}
                </div>
            </div>
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${card.title}</h5>
                <p class="card-text text-muted small mb-2">Tác giả: ${card.author}</p>
                <div class="genre-tags mb-2">
                    ${card.genre.map(g => `<span class="badge bg-primary me-1">${g}</span>`).join('')}
                </div>
                <div class="hashtag-container mb-2 small">
                    ${hashtagsHtml}
                </div>
                <p class="card-text small text-truncate">${card.content}</p>
                <div class="mt-auto">
                    <button class="btn btn-outline-primary btn-sm w-100 view-details-btn">
                        <i class="fas fa-info-circle me-1"></i>Chi tiết
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Thêm sự kiện click cho nút chi tiết
    const viewDetailsBtn = col.querySelector('.view-details-btn');
    viewDetailsBtn.addEventListener('click', () => openCardModal(card));
    
    return col;
}

// Mở modal chi tiết truyện
async function openCardModal(card) {
    // Lưu ID truyện hiện tại
    currentCardId = card.id;
    
    // Cập nhật nội dung modal
    const modal = document.getElementById('card-modal');
    
    // Cập nhật tiêu đề và thông tin cơ bản
    modal.querySelector('.modal-title').textContent = card.title;
    modal.querySelector('#card-author').textContent = card.author;
    modal.querySelector('#card-content').textContent = card.content;
    modal.querySelector('#card-image').src = card.image;
    
    // Cập nhật thể loại
    const genresContainer = modal.querySelector('#card-genres');
    genresContainer.innerHTML = '';
    card.genre.forEach(genre => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-1';
        badge.textContent = genre;
        genresContainer.appendChild(badge);
    });
    
    // Cập nhật hashtags
    const hashtagsContainer = modal.querySelector('#card-hashtags');
    hashtagsContainer.innerHTML = '';
    if (card.hashtags && card.hashtags.length > 0) {
        card.hashtags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary me-1';
            badge.textContent = `#${tag}`;
            hashtagsContainer.appendChild(badge);
        });
    } else {
        hashtagsContainer.innerHTML = '<em class="text-muted">Không có hashtag</em>';
    }
    
    // Tải danh sách chương
    try {
        // Hiển thị loading
        modal.querySelector('#chapters-container').innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <p class="mt-2">Đang tải danh sách chương...</p>
            </div>
        `;
        
        // Lấy danh sách chương từ ApiService
        const chapters = await ApiService.getChapters(card.id);
        
        // Hiển thị danh sách chương
        displayChapters(chapters, card.id);
        
    } catch (error) {
        console.error('Lỗi khi tải danh sách chương:', error);
        modal.querySelector('#chapters-container').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Lỗi khi tải danh sách chương. Vui lòng thử lại sau.
            </div>
        `;
    }
    
    // Hiển thị modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Hiển thị danh sách chương
function displayChapters(chapters, cardId) {
    const container = document.getElementById('chapters-container');
    container.innerHTML = ''; // Xóa nội dung hiện tại
    
    if (!chapters || chapters.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Chưa có chương nào.</div>';
        return;
    }
    
    // Sắp xếp chương theo thứ tự giảm dần
    const sortedChapters = [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber);
    
    // Tạo danh sách chương
    const chapterList = document.createElement('div');
    chapterList.className = 'list-group';
    
    sortedChapters.forEach(chapter => {
        const chapterItem = document.createElement('a');
        chapterItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        chapterItem.href = '#';
        
        const updateDate = new Date(chapter.updated_at || Date.now());
        const formattedDate = updateDate.toLocaleDateString('vi-VN');
        
        chapterItem.innerHTML = `
            <div>
                <h6 class="mb-0">Chương ${chapter.chapterNumber}: ${chapter.chapterTitle || ''}</h6>
                <small class="text-muted">Cập nhật: ${formattedDate}</small>
            </div>
            <div>
                <span class="badge bg-secondary me-1">
                    <i class="far fa-comment me-1"></i>${chapter.comment_count || 0}
                </span>
                <span class="badge bg-primary">
                    <i class="far fa-eye me-1"></i>${chapter.view_count || 0}
                </span>
            </div>
        `;
        
        // Thêm sự kiện click để mở chương
        chapterItem.addEventListener('click', function(e) {
            e.preventDefault();
            loadReadChapter(cardId, chapter.chapterNumber);
        });
        
        chapterList.appendChild(chapterItem);
    });
    
    container.appendChild(chapterList);
}

// Thiết lập sự kiện cho ô tìm kiếm
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // Hàm tìm kiếm
    const performSearch = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            // Hiển thị lại tất cả truyện nếu không có từ khóa tìm kiếm
            filteredCards = getAllCards();
        } else {
            // Lọc truyện theo từ khóa
            filteredCards = getAllCards().filter(card => {
                return card.title.toLowerCase().includes(searchTerm) ||
                       card.author.toLowerCase().includes(searchTerm) ||
                       card.content.toLowerCase().includes(searchTerm) ||
                       (card.hashtags && card.hashtags.some(tag => tag.toLowerCase().includes(searchTerm)));
            });
        }
        
        // Hiển thị lại danh sách truyện
        displayCards(filteredCards);
    };
    
    // Sự kiện khi click nút tìm kiếm
    searchBtn.addEventListener('click', performSearch);
    
    // Sự kiện khi nhấn Enter trong ô tìm kiếm
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Hiển thị danh sách thể loại cho bộ lọc
function populateGenreFilter(genres) {
    const genreFilter = document.getElementById('genre-filter');
    if (!genreFilter) return;
    
    // Xóa nội dung hiện tại
    genreFilter.innerHTML = '';
    
    // Thêm option "Tất cả"
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Tất cả thể loại';
    genreFilter.appendChild(allOption);
    
    // Thêm các option cho từng thể loại
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.name.toLowerCase();
        option.textContent = genre.name;
        genreFilter.appendChild(option);
    });
}

// Thiết lập sự kiện cho bộ lọc
function setupFilters() {
    const genreFilter = document.getElementById('genre-filter');
    const statusFilter = document.getElementById('status-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    // Hàm lọc và sắp xếp
    const filterAndSortCards = () => {
        const selectedGenre = genreFilter.value;
        const selectedStatus = statusFilter.value;
        const selectedSort = sortFilter.value;
        
        // Lấy tất cả truyện
        let result = getAllCards();
        
        // Lọc theo thể loại
        if (selectedGenre !== 'all') {
            result = result.filter(card => 
                card.genre.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
            );
        }
        
        // Lọc theo trạng thái
        if (selectedStatus !== 'all') {
            result = result.filter(card => card.status === selectedStatus);
        }
        
        // Sắp xếp
        switch (selectedSort) {
            case 'newest':
                result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
                break;
            case 'a-z':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'z-a':
                result.sort((a, b) => b.title.localeCompare(a.title));
                break;
            default:
                // Không sắp xếp
                break;
        }
        
        // Cập nhật danh sách đã lọc
        filteredCards = result;
        
        // Hiển thị lại danh sách truyện
        displayCards(result);
    };
    
    // Thêm sự kiện thay đổi cho các bộ lọc
    genreFilter.addEventListener('change', filterAndSortCards);
    statusFilter.addEventListener('change', filterAndSortCards);
    sortFilter.addEventListener('change', filterAndSortCards);
}

// Thiết lập sự kiện cho phân trang
function setupPagination() {
    // Nếu có nhiều truyện, có thể thêm phân trang ở đây
}

// Lấy tất cả truyện từ API hoặc cache
async function getAllCards() {
    try {
        const cards = await ApiService.getCards();
        return cards;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách truyện:', error);
        return [];
    }
}

// Thiết lập sự kiện cho nút đăng nhập/đăng ký
function setupAuthButtons() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    // Kiểm tra trạng thái đăng nhập (giả định)
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'Người dùng';
    
    if (isLoggedIn) {
        // Đã đăng nhập: Hiển thị dropdown người dùng
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userDropdown.style.display = 'block';
        
        // Cập nhật tên người dùng
        const userNameElement = userDropdown.querySelector('.username');
        if (userNameElement) {
            userNameElement.textContent = username;
        }
        
        // Sự kiện đăng xuất
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            window.location.reload();
        });
    } else {
        // Chưa đăng nhập: Hiển thị nút đăng nhập/đăng ký
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userDropdown.style.display = 'none';
        
        // Sự kiện đăng nhập (giả định)
        loginBtn.addEventListener('click', function() {
            // Hiển thị modal đăng nhập
            const loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
            loginModal.show();
        });
        
        // Sự kiện đăng ký (giả định)
        registerBtn.addEventListener('click', function() {
            // Hiển thị modal đăng ký
            const registerModal = new bootstrap.Modal(document.getElementById('register-modal'));
            registerModal.show();
        });
    }
}

// Xử lý đăng nhập (giả định)
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Giả định xác thực thành công
    if (email && password) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', email.split('@')[0]);
        
        // Đóng modal
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
        loginModal.hide();
        
        // Tải lại trang
        window.location.reload();
    }
}

// Xử lý đăng ký (giả định)
function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // Giả định đăng ký thành công
    if (username && email && password) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        // Đóng modal
        const registerModal = bootstrap.Modal.getInstance(document.getElementById('register-modal'));
        registerModal.hide();
        
        // Tải lại trang
        window.location.reload();
    }
} 