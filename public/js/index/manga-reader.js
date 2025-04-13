// Các biến toàn cục
let currentPage = 1;
let totalPages = 1;
let pageUrls = [];
let isFullscreen = false;

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các thành phần khi DOM được tải
    initializeReader();
    
    // Xử lý sự kiện toggle fullscreen
    document.getElementById('toggleFullscreen').addEventListener('click', toggleFullscreen);
    
    // Xử lý sự kiện chuyển trang
    setupPageNavigation();
    
    // Xử lý sự kiện phím tắt
    setupKeyboardNavigation();
    
    // Xử lý sự kiện khi đóng modal
    document.getElementById('readingModal').addEventListener('hidden.bs.modal', function() {
        // Thoát chế độ fullscreen khi đóng modal
        exitFullscreen();
    });
});

// Khởi tạo trình đọc truyện
function initializeReader() {
    // Mặc định ẩn loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Xử lý sự kiện tải ảnh
    const mangaPageImage = document.getElementById('mangaPageImage');
    if (mangaPageImage) {
        mangaPageImage.addEventListener('load', function() {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            // Thêm hiệu ứng chuyển trang
            this.classList.add('page-transition');
        });
        
        mangaPageImage.addEventListener('error', function() {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            this.src = 'https://via.placeholder.com/800x1100?text=Hình+ảnh+lỗi';
            this.alt = 'Hình ảnh lỗi';
        });
    }
}

// Thiết lập điều hướng trang
function setupPageNavigation() {
    // Nút chuyển trang trước/sau
    const prevPageBtns = document.querySelectorAll('#prevPageBtn, #prevPageBtnBottom');
    const nextPageBtns = document.querySelectorAll('#nextPageBtn, #nextPageBtnBottom');
    
    prevPageBtns.forEach(btn => {
        btn.addEventListener('click', () => navigatePage(-1));
    });
    
    nextPageBtns.forEach(btn => {
        btn.addEventListener('click', () => navigatePage(1));
    });
    
    // Nút chuyển chương trước/sau
    const prevChapterBtns = document.querySelectorAll('#prevChapterBtn, #prevChapterBtnBottom');
    const nextChapterBtns = document.querySelectorAll('#nextChapterBtn, #nextChapterBtnBottom');
    
    prevChapterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Thực hiện trong chapter.js
            if (typeof goToPreviousChapter === 'function') {
                goToPreviousChapter();
            }
        });
    });
    
    nextChapterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Thực hiện trong chapter.js
            if (typeof goToNextChapter === 'function') {
                goToNextChapter();
            }
        });
    });
}

// Thiết lập phím tắt
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(event) {
        const readingModal = document.getElementById('readingModal');
        if (!readingModal || !readingModal.classList.contains('show')) {
            // Chỉ xử lý khi modal đang mở
            return;
        }
        
        switch (event.key) {
            case 'ArrowLeft':
                navigatePage(-1);
                break;
            case 'ArrowRight':
                navigatePage(1);
                break;
            case 'Home':
                navigateToPage(1);
                break;
            case 'End':
                navigateToPage(totalPages);
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
        }
    });
}

// Chuyển trang
function navigatePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        navigateToPage(newPage);
    } else if (newPage < 1) {
        // Nếu ở trang đầu, chuyển chương trước (nếu có)
        const prevChapterBtn = document.getElementById('prevChapterBtn');
        if (prevChapterBtn && !prevChapterBtn.disabled) {
            prevChapterBtn.click();
        }
    } else if (newPage > totalPages) {
        // Nếu ở trang cuối, chuyển chương tiếp (nếu có)
        const nextChapterBtn = document.getElementById('nextChapterBtn');
        if (nextChapterBtn && !nextChapterBtn.disabled) {
            nextChapterBtn.click();
        }
    }
}

// Chuyển đến trang cụ thể
function navigateToPage(pageNumber) {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
        return;
    }
    
    currentPage = pageNumber;
    
    // Hiển thị loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Cập nhật hiển thị trang
    const currentPageElements = document.querySelectorAll('#currentPage, #currentPageBottom');
    currentPageElements.forEach(element => {
        element.textContent = currentPage;
    });
    
    // Cập nhật ảnh
    const mangaPageImage = document.getElementById('mangaPageImage');
    if (mangaPageImage && pageUrls.length >= currentPage) {
        mangaPageImage.classList.remove('page-transition');
        // Hơi delay một chút để hiệu ứng rõ ràng hơn
        setTimeout(() => {
            mangaPageImage.src = pageUrls[currentPage - 1];
            mangaPageImage.alt = `Trang ${currentPage}`;
        }, 50);
    }
    
    // Cập nhật trạng thái nút
    updateButtonStates();
}

// Cập nhật trạng thái các nút
function updateButtonStates() {
    // Nút trang trước
    const prevPageBtns = document.querySelectorAll('#prevPageBtn, #prevPageBtnBottom');
    prevPageBtns.forEach(btn => {
        btn.disabled = currentPage <= 1;
        btn.classList.toggle('disabled', currentPage <= 1);
    });
    
    // Nút trang sau
    const nextPageBtns = document.querySelectorAll('#nextPageBtn, #nextPageBtnBottom');
    nextPageBtns.forEach(btn => {
        btn.disabled = currentPage >= totalPages;
        btn.classList.toggle('disabled', currentPage >= totalPages);
    });
}

// Chuyển đổi chế độ fullscreen
function toggleFullscreen() {
    const mangaContainer = document.getElementById('mangaImageContainer');
    const modalContent = document.querySelector('#readingModal .modal-content');
    
    if (isFullscreen) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// Vào chế độ fullscreen
function enterFullscreen() {
    if (isFullscreen) return;
    
    const mangaContainer = document.getElementById('mangaImageContainer');
    const modalContent = document.querySelector('#readingModal .modal-content');
    
    if (mangaContainer && modalContent) {
        isFullscreen = true;
        modalContent.classList.add('manga-fullscreen');
        
        // Cập nhật icon
        const toggleBtn = document.getElementById('toggleFullscreen');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-fullscreen-exit"></i>';
            toggleBtn.title = 'Thoát toàn màn hình';
        }
        
        // Ẩn phần bình luận
        const commentSection = document.querySelector('#readingModal .row.mt-3');
        if (commentSection) {
            commentSection.style.display = 'none';
        }
    }
}

// Thoát chế độ fullscreen
function exitFullscreen() {
    if (!isFullscreen) return;
    
    const mangaContainer = document.getElementById('mangaImageContainer');
    const modalContent = document.querySelector('#readingModal .modal-content');
    
    if (mangaContainer && modalContent) {
        isFullscreen = false;
        modalContent.classList.remove('manga-fullscreen');
        
        // Cập nhật icon
        const toggleBtn = document.getElementById('toggleFullscreen');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
            toggleBtn.title = 'Toàn màn hình';
        }
        
        // Hiện lại phần bình luận
        const commentSection = document.querySelector('#readingModal .row.mt-3');
        if (commentSection) {
            commentSection.style.display = 'block';
        }
    }
}

// Tải danh sách trang của một chương
function loadPages(urls) {
    pageUrls = Array.isArray(urls) ? urls : [];
    totalPages = pageUrls.length;
    currentPage = 1;
    
    // Cập nhật hiển thị tổng số trang
    const totalPagesElements = document.querySelectorAll('#totalPages, #totalPagesBottom');
    totalPagesElements.forEach(element => {
        element.textContent = totalPages;
    });
    
    // Tạo dropdown chọn trang
    populatePageDropdowns();
    
    // Cập nhật trạng thái nút
    updateButtonStates();
    
    // Hiển thị trang đầu tiên
    if (pageUrls.length > 0) {
        const mangaPageImage = document.getElementById('mangaPageImage');
        if (mangaPageImage) {
            // Hiển thị loading indicator
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            mangaPageImage.src = pageUrls[0];
            mangaPageImage.alt = 'Trang 1';
        }
    }
}

// Tạo dropdown chọn trang
function populatePageDropdowns() {
    const dropdowns = [
        document.getElementById('pageDropdown'),
        document.getElementById('pageDropdownBottom')
    ];
    
    dropdowns.forEach(dropdown => {
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            if (i === currentPage) {
                a.classList.add('active');
            }
            a.href = '#';
            a.textContent = `Trang ${i}`;
            
            a.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(i);
                
                // Đóng dropdown sau khi chọn
                const dropdownToggle = dropdown.previousElementSibling;
                const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
                if (bsDropdown) {
                    bsDropdown.hide();
                }
            });
            
            li.appendChild(a);
            dropdown.appendChild(li);
        }
    });
} 