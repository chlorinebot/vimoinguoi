// Khai báo biến toàn cục
let currentChapter = null;  // Thông tin chương hiện tại
let currentPage = 1;        // Trang hiện tại đang xem
let totalPages = 0;         // Tổng số trang của chương
let isFullscreen = false;   // Trạng thái toàn màn hình

// Tải và hiển thị chương đọc
async function loadReadChapter(cardId, chapterNumber) {
    try {
        // Đóng modal chi tiết truyện nếu đang mở
        const cardModal = document.getElementById('card-modal');
        const bsCardModal = bootstrap.Modal.getInstance(cardModal);
        if (bsCardModal) {
            bsCardModal.hide();
        }
        
        // Hiển thị loading
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // Lấy thông tin chương từ ApiService
        const chapter = await ApiService.getChapter(cardId, chapterNumber);
        
        // Kiểm tra dữ liệu chương
        if (!chapter) {
            throw new Error('Không tìm thấy dữ liệu chương');
        }
        
        // Lưu thông tin chương hiện tại
        currentChapter = chapter;
        currentPage = 1;
        totalPages = chapter.totalPages || 0;
        
        // Cập nhật modal đọc truyện
        updateReadModal(chapter, cardId);
        
        // Hiển thị modal đọc truyện
        const readModal = new bootstrap.Modal(document.getElementById('read-modal'));
        readModal.show();
        
        // Cập nhật URL (nếu cần)
        updateURL(cardId, chapterNumber);
        
        // Tăng lượt xem cho chương này
        ApiService.incrementViewCount(cardId, chapterNumber)
            .catch(error => console.error('Lỗi khi cập nhật lượt xem:', error));
        
        // Tải bình luận
        loadComments(cardId, chapter.chapterNumber);
        
    } catch (error) {
        console.error('Lỗi khi tải chương:', error);
        alert('Không thể tải chương truyện. Vui lòng thử lại sau.');
    } finally {
        // Ẩn loading
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// Cập nhật modal đọc truyện
function updateReadModal(chapter, cardId) {
    const modal = document.getElementById('read-modal');
    
    // Cập nhật tiêu đề
    modal.querySelector('.modal-title').textContent = `Chương ${chapter.chapterNumber}: ${chapter.chapterTitle || ''}`;
    
    // Thiết lập các nút điều hướng chương
    setupChapterNavigation(cardId, chapter);
    
    // Thiết lập các nút điều hướng trang
    setupPageNavigation();
    
    // Tải và hiển thị trang đầu tiên
    loadPage(1);
}

// Thiết lập điều hướng giữa các chương
function setupChapterNavigation(cardId, chapter) {
    const prevChapterBtn = document.getElementById('prev-chapter-btn');
    const nextChapterBtn = document.getElementById('next-chapter-btn');
    
    // Xóa các sự kiện cũ
    const prevClone = prevChapterBtn.cloneNode(true);
    const nextClone = nextChapterBtn.cloneNode(true);
    
    prevChapterBtn.parentNode.replaceChild(prevClone, prevChapterBtn);
    nextChapterBtn.parentNode.replaceChild(nextClone, nextChapterBtn);
    
    // Kiểm tra và thiết lập nút chương trước
    if (chapter.prevChapter) {
        prevClone.disabled = false;
        prevClone.addEventListener('click', () => {
            loadReadChapter(cardId, chapter.prevChapter);
        });
    } else {
        prevClone.disabled = true;
    }
    
    // Kiểm tra và thiết lập nút chương tiếp theo
    if (chapter.nextChapter) {
        nextClone.disabled = false;
        nextClone.addEventListener('click', () => {
            loadReadChapter(cardId, chapter.nextChapter);
        });
    } else {
        nextClone.disabled = true;
    }
}

// Thiết lập điều hướng giữa các trang
function setupPageNavigation() {
    const firstPageBtn = document.getElementById('first-page-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const lastPageBtn = document.getElementById('last-page-btn');
    const currentPageInput = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    // Cập nhật tổng số trang
    totalPagesSpan.textContent = totalPages;
    currentPageInput.value = currentPage;
    
    // Xóa các sự kiện cũ
    const elements = [firstPageBtn, prevPageBtn, nextPageBtn, lastPageBtn, currentPageInput, fullscreenBtn];
    elements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
    });
    
    // Lấy lại các tham chiếu mới
    const newFirstPageBtn = document.getElementById('first-page-btn');
    const newPrevPageBtn = document.getElementById('prev-page-btn');
    const newNextPageBtn = document.getElementById('next-page-btn');
    const newLastPageBtn = document.getElementById('last-page-btn');
    const newCurrentPageInput = document.getElementById('current-page');
    const newFullscreenBtn = document.getElementById('fullscreen-btn');
    
    // Thêm sự kiện cho nút trang đầu tiên
    newFirstPageBtn.addEventListener('click', () => {
        loadPage(1);
    });
    
    // Thêm sự kiện cho nút trang trước
    newPrevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadPage(currentPage - 1);
        }
    });
    
    // Thêm sự kiện cho nút trang tiếp theo
    newNextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadPage(currentPage + 1);
        }
    });
    
    // Thêm sự kiện cho nút trang cuối cùng
    newLastPageBtn.addEventListener('click', () => {
        loadPage(totalPages);
    });
    
    // Thêm sự kiện cho ô nhập trang
    newCurrentPageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const pageNumber = parseInt(this.value);
            if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
                loadPage(pageNumber);
            } else {
                this.value = currentPage;
            }
        }
    });
    
    // Thêm sự kiện cho nút toàn màn hình
    newFullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Thêm sự kiện phím tắt
    document.addEventListener('keydown', handleKeyboardNavigation);
}

// Xử lý điều hướng bằng bàn phím
function handleKeyboardNavigation(event) {
    // Kiểm tra xem modal đọc có đang mở không
    const readModal = document.getElementById('read-modal');
    if (!readModal.classList.contains('show')) {
        return;
    }
    
    switch (event.key) {
        case 'ArrowLeft':
            // Trang trước
            if (currentPage > 1) {
                loadPage(currentPage - 1);
            }
            break;
        case 'ArrowRight':
            // Trang tiếp theo
            if (currentPage < totalPages) {
                loadPage(currentPage + 1);
            }
            break;
        case 'Home':
            // Trang đầu tiên
            loadPage(1);
            break;
        case 'End':
            // Trang cuối cùng
            loadPage(totalPages);
            break;
        case 'f':
        case 'F':
            // Toàn màn hình
            toggleFullscreen();
            break;
    }
}

// Chuyển đổi chế độ toàn màn hình
function toggleFullscreen() {
    const readModal = document.getElementById('read-modal');
    
    if (!isFullscreen) {
        // Vào chế độ toàn màn hình
        if (readModal.requestFullscreen) {
            readModal.requestFullscreen();
        } else if (readModal.mozRequestFullScreen) {
            readModal.mozRequestFullScreen();
        } else if (readModal.webkitRequestFullscreen) {
            readModal.webkitRequestFullscreen();
        } else if (readModal.msRequestFullscreen) {
            readModal.msRequestFullscreen();
        }
        
        // Thay đổi icon
        document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        // Thoát chế độ toàn màn hình
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        // Thay đổi icon
        document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-expand"></i>';
    }
    
    // Đảo trạng thái
    isFullscreen = !isFullscreen;
}

// Tải và hiển thị trang
function loadPage(pageNumber) {
    if (!currentChapter || pageNumber < 1 || pageNumber > totalPages) {
        return;
    }
    
    // Cập nhật trang hiện tại
    currentPage = pageNumber;
    document.getElementById('current-page').value = pageNumber;
    
    // Tạo URL hình ảnh
    const imageUrl = generateImageUrl(currentChapter, pageNumber);
    
    // Hiển thị hình ảnh
    const contentContainer = document.getElementById('chapter-content');
    contentContainer.innerHTML = `<img src="${imageUrl}" class="img-fluid" alt="Trang ${pageNumber}">`;
    
    // Cuộn lên đầu nội dung
    contentContainer.scrollTop = 0;
    
    // Cập nhật trạng thái nút điều hướng
    updateNavigationState();
}

// Tạo URL hình ảnh từ thông tin chương và số trang
function generateImageUrl(chapter, pageNumber) {
    // Kiểm tra xem chapter có chứa đường dẫn cơ sở không
    if (chapter.imagesPath) {
        // Định dạng số trang, ví dụ: "001.jpg" thay vì "1.jpg"
        const formattedPageNumber = String(pageNumber).padStart(3, '0');
        
        // Tạo đường dẫn đầy đủ
        return `${chapter.imagesPath}/${formattedPageNumber}.jpg`;
    } else {
        // Nếu không có đường dẫn cơ sở, sử dụng URL mặc định
        return `images/chapters/${chapter.mangaId}/${chapter.chapterNumber}/${pageNumber}.jpg`;
    }
}

// Cập nhật trạng thái nút điều hướng
function updateNavigationState() {
    // Cập nhật nút trang đầu và trang trước
    document.getElementById('first-page-btn').disabled = (currentPage === 1);
    document.getElementById('prev-page-btn').disabled = (currentPage === 1);
    
    // Cập nhật nút trang tiếp theo và trang cuối
    document.getElementById('next-page-btn').disabled = (currentPage === totalPages);
    document.getElementById('last-page-btn').disabled = (currentPage === totalPages);
}

// Cập nhật URL trình duyệt
function updateURL(cardId, chapterNumber) {
    // Sử dụng History API để cập nhật URL mà không tải lại trang
    const url = `?manga=${cardId}&chapter=${chapterNumber}`;
    history.pushState({ cardId, chapterNumber }, '', url);
}

// Tải bình luận cho chương
async function loadComments(cardId, chapterNumber) {
    const commentsContainer = document.getElementById('comments-container');
    const commentCountElement = document.getElementById('comment-count');
    
    try {
        // Hiển thị loading
        commentsContainer.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải bình luận...</span>
                </div>
                <p class="mt-2">Đang tải bình luận...</p>
            </div>
        `;
        
        // Lấy thông tin chương
        const chapterId = await ApiService.getChapterId(cardId, chapterNumber);
        
        // Lấy danh sách bình luận từ ApiService
        const comments = await ApiService.getComments(chapterId);
        
        // Cập nhật số lượng bình luận
        commentCountElement.textContent = comments.length;
        
        // Kiểm tra có bình luận không
        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                </div>
            `;
            return;
        }
        
        // Xóa nội dung hiện tại
        commentsContainer.innerHTML = '';
        
        // Hiển thị từng bình luận
        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
        
    } catch (error) {
        console.error('Lỗi khi tải bình luận:', error);
        commentsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Lỗi khi tải bình luận. Vui lòng thử lại sau.
            </div>
        `;
    }
}

// Tạo phần tử bình luận
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment mb-3 p-3 border rounded';
    
    const timeAgo = timeSince(new Date(comment.created_at));
    
    commentDiv.innerHTML = `
        <div class="d-flex justify-content-between">
            <div class="d-flex align-items-center">
                <img src="${comment.user.avatar || 'images/default-avatar.png'}" 
                     class="rounded-circle me-2" 
                     width="40" height="40" 
                     alt="${comment.user.username}">
                <div>
                    <h6 class="mb-0">${comment.user.username}</h6>
                    <small class="text-muted">${timeAgo}</small>
                </div>
            </div>
            <div>
                <button class="btn btn-sm like-btn" data-comment-id="${comment.id}">
                    <i class="far fa-thumbs-up me-1"></i>
                    <span class="like-count">${comment.likes || 0}</span>
                </button>
            </div>
        </div>
        <div class="mt-2">
            ${comment.content}
        </div>
    `;
    
    // Thêm sự kiện cho nút like
    const likeBtn = commentDiv.querySelector('.like-btn');
    likeBtn.addEventListener('click', async function() {
        try {
            const commentId = this.dataset.commentId;
            const result = await ApiService.likeComment(commentId);
            
            if (result.success) {
                // Cập nhật số lượng like
                const likeCountElement = this.querySelector('.like-count');
                likeCountElement.textContent = result.likeCount;
                
                // Thay đổi icon
                const iconElement = this.querySelector('i');
                iconElement.className = 'fas fa-thumbs-up me-1';
                
                // Vô hiệu hóa nút
                this.disabled = true;
            }
        } catch (error) {
            console.error('Lỗi khi thích bình luận:', error);
        }
    });
    
    return commentDiv;
}

// Xử lý gửi bình luận mới
async function submitComment(event) {
    event.preventDefault();
    
    const commentInput = document.getElementById('comment-input');
    const content = commentInput.value.trim();
    
    if (!content) {
        return;
    }
    
    try {
        // Lấy chapterId
        const chapterId = await ApiService.getChapterId(
            currentChapter.mangaId, 
            currentChapter.chapterNumber
        );
        
        // Gửi bình luận
        const result = await ApiService.addComment(chapterId, content);
        
        if (result.success) {
            // Xóa nội dung input
            commentInput.value = '';
            
            // Tải lại bình luận
            loadComments(currentChapter.mangaId, currentChapter.chapterNumber);
        }
    } catch (error) {
        console.error('Lỗi khi gửi bình luận:', error);
        alert('Không thể gửi bình luận. Vui lòng thử lại sau.');
    }
}

// Hàm tính thời gian đã trôi qua
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;  // Số giây trong một năm
    
    if (interval > 1) {
        return Math.floor(interval) + " năm trước";
    }
    
    interval = seconds / 2592000;  // Số giây trong một tháng
    if (interval > 1) {
        return Math.floor(interval) + " tháng trước";
    }
    
    interval = seconds / 86400;  // Số giây trong một ngày
    if (interval > 1) {
        return Math.floor(interval) + " ngày trước";
    }
    
    interval = seconds / 3600;  // Số giây trong một giờ
    if (interval > 1) {
        return Math.floor(interval) + " giờ trước";
    }
    
    interval = seconds / 60;  // Số giây trong một phút
    if (interval > 1) {
        return Math.floor(interval) + " phút trước";
    }
    
    return "vừa xong";
} 