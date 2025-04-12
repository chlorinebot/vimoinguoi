let chapterData = {}; // Khởi tạo rỗng, sẽ được cập nhật từ API
let currentChapterData = null;
let currentCardId = null;
let originalChapters = []; // Lưu trữ danh sách chương gốc để tìm kiếm

document.addEventListener('DOMContentLoaded', async function() {
    if (window.chapterInitialized) return;
    window.chapterInitialized = true;

    // Lấy dữ liệu chapters từ server
    try {
        // Sử dụng ApiService thay vì gọi fetch trực tiếp
        chapterData = await ApiService.getChapters();
        console.log('Chapter data loaded:', chapterData);
        if (Object.keys(chapterData).length === 0) console.warn('Không có dữ liệu chapters!');
    } catch (error) {
        console.error('Lỗi khi lấy chapterData:', error);
        chapterData = {}; // Đặt mặc định rỗng nếu lỗi
    }

    console.log("chapter.js đã được tải");

    const cardModal = document.getElementById('card');
    if (cardModal) {
        cardModal.addEventListener('show.bs.modal', function(event) {
            const comicId = currentCardData ? currentCardData.id : null;
            if (comicId) {
                currentCardId = comicId;
                originalChapters = chapterData[currentCardId] || [];
                displayChapters(originalChapters);

                // Thêm sự kiện cho nút "Đọc từ đầu"
                const readFromStartBtn = document.getElementById('readFromStartBtn');
                if (readFromStartBtn) {
                    readFromStartBtn.addEventListener('click', function() {
                        if (originalChapters.length > 0) {
                            const firstChapter = originalChapters[0]; // Chương đầu tiên
                            openReadModal(firstChapter);
                        } else {
                            alert('Không có chương nào để đọc!');
                        }
                    });
                }

                // Thêm sự kiện cho nút "Đọc chương mới nhất"
                const readLatestChapterBtn = document.getElementById('readLatestChapterBtn');
                if (readLatestChapterBtn) {
                    readLatestChapterBtn.addEventListener('click', function() {
                        if (originalChapters.length > 0) {
                            const latestChapter = originalChapters[originalChapters.length - 1]; // Chương cuối cùng
                            openReadModal(latestChapter);
                        } else {
                            alert('Không có chương nào để đọc!');
                        }
                    });
                }
            }
        });
        cardModal.addEventListener('hidden.bs.modal', function() {
            console.log("Modal #card đã đóng");
            resetModalState();
            // Reset thanh tìm kiếm khi đóng modal
            const searchInput = document.getElementById('chapterSearchInput');
            if (searchInput) searchInput.value = '';
        });
    }

    // Gắn sự kiện tìm kiếm
    const chapterSearchForm = document.getElementById('chapterSearchForm');
    if (chapterSearchForm) {
        chapterSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchChapters();
        });

        // Tìm kiếm theo thời gian thực khi người dùng nhập
        document.getElementById('chapterSearchInput').addEventListener('input', searchChapters);
    }

    setupChapterModalBehavior();
});

// Hàm thiết lập hành vi modal
function setupChapterModalBehavior() {
    const readModal = document.getElementById('doctruyen');
    if (readModal && !readModal.hasChapterListener) {
        readModal.hasChapterListener = true;
        readModal.addEventListener('hidden.bs.modal', function() {
            console.log("Modal #doctruyen đã đóng");
            const cardModal = document.getElementById('card');
            if (currentCardData) {
                const cardBsModal = new bootstrap.Modal(cardModal);
                cardBsModal.show();

                // Cập nhật URL quay lại chỉ chứa comicId
                const comicUrl = `${window.location.origin}/?comicId=${currentCardData.id}`;
                window.history.pushState({ comicId: currentCardData.id }, '', comicUrl);
            }
            resetModalState();
        });
    }
}

// Hàm reset trạng thái modal
function resetModalState() {
    console.log("Reset trạng thái modal");
    // Đếm số lượng modal hiển thị
    const visibleModals = document.querySelectorAll('.modal.show').length;
    
    // Đảm bảo không có nhiều nút yêu thích bị trùng lặp
    if (visibleModals === 0) {
        // Không có modal nào đang hiển thị, có thể xóa nút yêu thích
        const favoriteButton = document.getElementById('favoriteComicBtn');
        if (favoriteButton) {
            favoriteButton.remove();
        }
    }
    
    // Xử lý các vấn đề khác của modal
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    // Xóa backdrop nếu còn sót lại
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach(backdrop => backdrop.remove());
}

// Hàm hiển thị danh sách chapters
function displayChapters(chapters) {
    const accordion = document.getElementById('chapterAccordion');
    if (!accordion) {
        console.error('Không tìm thấy accordion!');
        return;
    }

    accordion.innerHTML = '';

    if (chapters.length === 0) {
        accordion.innerHTML = '<p class="text-center">Không có chương nào cho truyện này.</p>';
        return;
    }

    chapters.forEach((chapter, index) => {
        const chapterId = `collapseChapter${chapter.chapterNumber}`;
        const isFirst = index === 0 ? 'show' : ''; // Mở chương đầu tiên mặc định
        const row = `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button ${isFirst ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${chapterId}" aria-expanded="${isFirst ? 'true' : 'false'}" aria-controls="${chapterId}">
                        Chương ${chapter.chapterNumber}
                    </button>
                </h2>
                <div id="${chapterId}" class="accordion-collapse collapse ${isFirst}" data-bs-parent="#chapterAccordion">
                    <div class="accordion-body">
                        <button type="button" class="btn btn-primary read-chapter-btn" data-chapter-number="${chapter.chapterNumber}" data-card-id="${currentCardId}">Đọc truyện</button>
                        <strong>${chapter.chapterTitle || 'N/A'}</strong> ${chapter.content || 'N/A'}
                    </div>
                </div>
            </div>
        `;
        accordion.insertAdjacentHTML('beforeend', row);
    });

    // Gắn sự kiện cho các nút "Đọc truyện"
    document.querySelectorAll('.read-chapter-btn').forEach(button => {
        button.addEventListener('click', function() {
            const cardId = this.dataset.cardId;
            const chapterNumber = this.dataset.chapterNumber;
            openReadModal(chapterData[cardId].find(ch => ch.chapterNumber == chapterNumber));
        });
    });
}

// Hàm tìm kiếm chương
function searchChapters() {
    const searchTerm = document.getElementById('chapterSearchInput').value.trim().toLowerCase();
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

    displayChapters(filteredChapters); // Hiển thị danh sách đã lọc
}

// Hàm mở modal đọc truyện
function openReadModal(chapter) {
    currentChapterData = chapter;
    currentCardId = currentCardData ? currentCardData.id : currentCardId;

    const modal = document.getElementById('doctruyen');
    if (!modal) {
        console.error('Không tìm thấy modal #doctruyen trong DOM!');
        return;
    }

    // Cập nhật URL với comicId và chapterId
    const newUrl = `${window.location.origin}/?comicId=${currentCardId}&chapterId=${chapter.chapterNumber}`;
    window.history.pushState({ comicId: currentCardId, chapterId: chapter.chapterNumber }, '', newUrl);

    console.log("Modal #doctruyen tồn tại và đang chuẩn bị mở");
    
    // Xóa nút yêu thích cũ trước khi mở modal đọc truyện
    const favoriteButton = document.getElementById('favoriteComicBtn');
    if (favoriteButton) {
        console.log("Xóa nút yêu thích trước khi mở modal đọc truyện");
        favoriteButton.remove();
    }
    
    // Tăng số lượt xem cho truyện
    incrementComicViews(currentCardId);
    
    // Lưu lịch sử đọc truyện nếu đã đăng nhập
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const decoded = jwt_decode(token);
            const userId = decoded.id;
            saveReadingHistory(userId, currentCardId, chapter.chapterNumber);
        } catch (error) {
            console.error('Lỗi khi giải mã token:', error);
        }
    } else {
        console.log('Người dùng chưa đăng nhập, không lưu lịch sử đọc');
    }

    console.log("Modal #doctruyen tồn tại trong DOM");

    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    const modalFooter = modal.querySelector('.modal-footer');

    modalTitle.textContent = `Chương ${chapter.chapterNumber} - ${chapter.chapterTitle}`;
    modalBody.innerHTML = '';

    const contentContainer = document.createElement('div');
    contentContainer.id = 'chapter-content';

    // Xử lý hiển thị ảnh từ imageLink hoặc imageFolder
    if (chapter.imageLink && chapter.imageCount > 0) {
        let baseImageLink = chapter.imageLink;
        if (!baseImageLink.includes('raw.githubusercontent.com') && baseImageLink.includes('github.com') && baseImageLink.includes('/blob/')) {
            baseImageLink = baseImageLink
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/blob/', '/');
        }

        for (let i = 1; i <= chapter.imageCount; i++) {
            const img = document.createElement('img');
            const imageUrl = baseImageLink.replace(/page%20\(\d+\)\.jpg/, `page%20(${i}).jpg`);
            img.src = imageUrl;
            img.className = 'd-block mx-auto mb-3';
            img.alt = `Trang ${i} - Chương ${chapter.chapterNumber}`;
            img.style.maxWidth = '100%';
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/300x500?text=Image+Not+Found';
                this.alt = 'Hình ảnh không tải được';
            };
            contentContainer.appendChild(img);
        }
    } else if (chapter.imageFolder && chapter.imageCount > 0) {
        let baseFolderLink = chapter.imageFolder;
        if (baseFolderLink.includes('github.com') && baseFolderLink.includes('/tree/')) {
            baseFolderLink = baseFolderLink
                .replace('github.com', 'raw.githubusercontent.com')
                .replace('/tree/', '/');
        }

        for (let i = 1; i <= chapter.imageCount; i++) {
            const img = document.createElement('img');
            img.src = `${baseFolderLink}/page (${i}).jpg`;
            img.className = 'd-block mx-auto mb-3';
            img.alt = `Trang ${i} - Chương ${chapter.chapterNumber}`;
            img.style.maxWidth = '100%';
            img.onerror = function() {
                this.src = 'https://via.placeholder.com/300x500?text=Image+Not+Found';
                this.alt = 'Hình ảnh không tải được';
            };
            contentContainer.appendChild(img);
        }
    } else {
        contentContainer.textContent = chapter.content || 'Không có nội dung.';
    }

    const commentSection = document.createElement('div');
    commentSection.id = 'comment-section';
    commentSection.className = 'mt-3';
    commentSection.style.display = 'none';
    commentSection.innerHTML = `
        <h5>Bình luận (${chapter.commentCount || 0})</h5>
        <p>Chưa có bình luận nào.</p>
        <form class="mt-3">
            <textarea class="form-control mb-2" rows="3" placeholder="Viết bình luận..."></textarea>
            <button type="submit" class="btn btn-primary">Gửi</button>
        </form>
    `;

    modalBody.appendChild(contentContainer);
    modalBody.appendChild(commentSection);

    modalFooter.innerHTML = '';
    modalFooter.className = 'modal-footer d-flex justify-content-between align-items-center flex-wrap';

    // Thêm phần đánh giá sao vào footer
    const rightGroup = document.createElement('div');
    rightGroup.className = 'ms-auto rating-container d-flex align-items-center';
    
    const ratingText = document.createElement('span');
    ratingText.className = 'me-2';
    ratingText.textContent = 'Đánh giá:';
    
    const ratingStars = document.createElement('div');
    ratingStars.className = 'rating';
    ratingStars.innerHTML = `
        <input type="radio" id="star5" name="rating" value="5" /><label for="star5" title="Tuyệt vời"></label>
        <input type="radio" id="star4" name="rating" value="4" /><label for="star4" title="Hay"></label>
        <input type="radio" id="star3" name="rating" value="3" /><label for="star3" title="Bình thường"></label>
        <input type="radio" id="star2" name="rating" value="2" /><label for="star2" title="Không hay"></label>
        <input type="radio" id="star1" name="rating" value="1" /><label for="star1" title="Tệ"></label>
    `;
    
    rightGroup.appendChild(ratingText);
    rightGroup.appendChild(ratingStars);

    const leftGroup = document.createElement('div');
    const commentButton = document.createElement('button');
    commentButton.type = 'button';
    commentButton.className = 'btn btn-outline-primary';
    commentButton.innerHTML = `<i class="bi bi-chat"></i> Bình luận (${chapter.commentCount || 0})`;
    commentButton.addEventListener('click', async function() {
        const commentSection = document.getElementById('comment-section');
        const contentContainer = document.getElementById('chapter-content');
        
        if (commentSection.style.display === 'none') {
            // Tải bình luận khi chuyển sang tab bình luận
            await loadComments(currentChapterData.id);
            commentSection.style.display = 'block';
            contentContainer.style.display = 'none';
            this.textContent = 'Quay lại truyện';
        } else {
            commentSection.style.display = 'none';
            contentContainer.style.display = 'block';
            this.innerHTML = `<i class="bi bi-chat"></i> Bình luận (${currentChapterData.commentCount || 0})`;
        }
    });
    leftGroup.appendChild(commentButton);

    const centerGroup = document.createElement('div');
    centerGroup.className = 'd-flex align-items-center';

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'btn btn-secondary me-2';
    prevButton.textContent = 'Chương trước';
    prevButton.addEventListener('click', goToPreviousChapter);

    const chapterListContainer = document.createElement('div');
    chapterListContainer.className = 'dropdown mx-2';
    const chapterListButton = document.createElement('button');
    chapterListButton.className = 'btn btn-secondary dropdown-toggle';
    chapterListButton.type = 'button';
    chapterListButton.setAttribute('data-bs-toggle', 'dropdown');
    chapterListButton.textContent = 'Danh sách chương';
    const chapterListMenu = document.createElement('ul');
    chapterListMenu.className = 'dropdown-menu';
    const chapters = chapterData[currentCardId] || [];
    chapters.forEach(ch => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.textContent = `Chương ${ch.chapterNumber} - ${ch.chapterTitle}`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            openReadModal(ch);
        });
        li.appendChild(a);
        chapterListMenu.appendChild(li);
    });
    chapterListContainer.appendChild(chapterListButton);
    chapterListContainer.appendChild(chapterListMenu);

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'btn btn-primary ms-2';
    nextButton.textContent = 'Chương tiếp theo';
    nextButton.addEventListener('click', goToNextChapter);

    centerGroup.appendChild(prevButton);
    centerGroup.appendChild(chapterListContainer);
    centerGroup.appendChild(nextButton);

    modalFooter.appendChild(leftGroup);
    modalFooter.appendChild(centerGroup);
    modalFooter.appendChild(rightGroup);

    // Thêm sự kiện cho các sao đánh giá
    ratingStars.querySelectorAll('input[name="rating"]').forEach(star => {
        star.addEventListener('change', function() {
            const ratingValue = parseInt(this.value);
            submitChapterRating(currentCardId, chapter.chapterNumber, ratingValue);
        });
    });

    // Kiểm tra xem người dùng đã đánh giá chương này chưa và hiển thị đánh giá hiện tại
    checkUserRating(currentCardId, chapter.chapterNumber);

    updateNavigationButtons(prevButton, nextButton);

    // Tải bình luận khi mở modal
    loadComments(chapter.id);

    showModal(modal);
}

// Hàm hiển thị modal
function showModal(modalElement) {
    console.log("Thử mở modal #doctruyen");
    if (!modalElement) {
        console.error("Modal element không tồn tại!");
        return;
    }

    modalElement.style.display = 'block';
    modalElement.classList.remove('fade');

    try {
        // Thiết lập backdrop: false để không tạo backdrop cho modal đọc truyện
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement, { backdrop: false, keyboard: true });
        modalInstance.show();
        console.log("Modal #doctruyen đã được mở thành công");
        
        // Xóa backdrop của modal đọc truyện nếu có
        setTimeout(() => {
            const doctruyenZIndex = parseInt(modalElement.style.zIndex || '1050');
            const doctruyenBackdropZIndex = doctruyenZIndex - 1;
            
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                const backdropZIndex = parseInt(backdrop.style.zIndex || '1040');
                if (backdropZIndex === doctruyenBackdropZIndex) {
                    backdrop.remove();
                }
            });
        }, 10);
    } catch (error) {
        console.error("Lỗi khi mở modal:", error);
    }

    setTimeout(() => modalElement.classList.add('fade'), 100);
}

// Hàm chuyển đến chương trước
function goToPreviousChapter() {
    if (!currentCardId || !currentChapterData) return;

    const chapters = chapterData[currentCardId];
    const currentIndex = chapters.findIndex(ch => ch.chapterNumber === currentChapterData.chapterNumber);
    if (currentIndex > 0) {
        currentChapterData = chapters[currentIndex - 1];
        openReadModal(currentChapterData);
    }
}

// Hàm chuyển đến chương tiếp theo
function goToNextChapter() {
    if (!currentCardId || !currentChapterData) return;

    const chapters = chapterData[currentCardId];
    const currentIndex = chapters.findIndex(ch => ch.chapterNumber === currentChapterData.chapterNumber);
    if (currentIndex < chapters.length - 1) {
        currentChapterData = chapters[currentIndex + 1];
        openReadModal(currentChapterData);
    }
}

// Hàm cập nhật trạng thái nút điều hướng
function updateNavigationButtons(prevButton, nextButton) {
    if (!currentCardId || !currentChapterData) return;

    const chapters = chapterData[currentCardId];
    const currentIndex = chapters.findIndex(ch => ch.chapterNumber === currentChapterData.chapterNumber);

    prevButton.disabled = currentIndex <= 0;
    prevButton.classList.toggle('disabled', currentIndex <= 0);

    nextButton.disabled = currentIndex >= chapters.length - 1;
    nextButton.classList.toggle('disabled', currentIndex >= chapters.length - 1);
}

// Hàm lưu lịch sử đọc truyện
async function saveReadingHistory(userId, cardId, chapterId) {
    if (!userId) {
        console.log('Người dùng chưa đăng nhập, không lưu lịch sử đọc');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Không tìm thấy token, không lưu lịch sử đọc');
            return;
        }

        // Tìm chapter_id thực tế (id trong bảng chapters) dựa vào chapter_number
        const chapterResponse = await fetch(`/api/chapters/${cardId}/${chapterId}`);
        if (!chapterResponse.ok) {
            throw new Error('Không thể lấy thông tin chapter');
        }
        
        const chapterData = await chapterResponse.json();
        const actualChapterId = chapterData.id; // Lấy ID thực tế của chapter từ database
        
        // Gọi API để lưu lịch sử đọc
        const response = await fetch('/api/reading-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: userId,
                card_id: cardId,
                chapter_id: actualChapterId
            })
        });

        if (!response.ok) {
            throw new Error('Không thể lưu lịch sử đọc');
        }

        console.log('Đã lưu lịch sử đọc truyện');
    } catch (error) {
        console.error('Lỗi khi lưu lịch sử đọc truyện:', error);
    }
}

// Hàm tải và hiển thị chapter
async function loadChapter(cardId, chapterId) {
    console.log(`Đang tải chương ${chapterId} của truyện ${cardId}`);
    
    try {
        // Cập nhật URL để có thể F5 tải lại đúng trang
        const newUrl = `/?comicId=${cardId}&chapterId=${chapterId}`;
        window.history.pushState({ cardId, chapterId }, "", newUrl);
        
        // Lấy thông tin userId từ token nếu đã đăng nhập
        let userId = null;
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwt_decode(token);
            userId = decoded.id;
        }
        
        // Hiển thị loading spinner
        document.getElementById('chapterContentContainer').innerHTML = `
            <div class="text-center my-5 py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3">Đang tải nội dung chương...</p>
            </div>
        `;
        
        // Lưu lịch sử đọc nếu người dùng đã đăng nhập
        if (userId) {
            saveReadingHistory(userId, cardId, chapterId);
        }
        
        // Tiếp tục tải nội dung chapter...
    } catch (error) {
        console.error('Lỗi khi tải chương:', error);
    }
}

// Hàm submit đánh giá chương
async function submitChapterRating(cardId, chapterId, rating) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Vui lòng đăng nhập để đánh giá', 'warning');
            return;
        }

        const decoded = jwt_decode(token);
        const userId = decoded.id;

        // Lấy chapter_id thực tế từ API
        const chapterResponse = await fetch(`/api/chapters/${cardId}/${chapterId}`);
        if (!chapterResponse.ok) {
            throw new Error('Không thể lấy thông tin chapter');
        }
        
        const chapterData = await chapterResponse.json();
        const actualChapterId = chapterData.id;

        const response = await fetch('/api/ratings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                user_id: userId,
                chapter_id: actualChapterId,
                card_id: cardId,
                rating: rating
            })
        });

        if (response.ok) {
            const result = await response.json();
            showToast('Cảm ơn bạn đã đánh giá!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Lỗi khi gửi đánh giá');
        }
    } catch (error) {
        console.error('Lỗi khi đánh giá:', error);
        showToast(error.message || 'Đã xảy ra lỗi khi đánh giá', 'error');
    }
}

// Kiểm tra đánh giá của người dùng cho một chương
async function checkUserRating(cardId, chapterId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return; // Không được đăng nhập, không cần kiểm tra
        }

        const decoded = jwt_decode(token);
        const userId = decoded.id;

        // Lấy chapter_id thực tế từ API
        const chapterResponse = await fetch(`/api/chapters/${cardId}/${chapterId}`);
        if (!chapterResponse.ok) {
            throw new Error('Không thể lấy thông tin chapter');
        }
        
        const chapterData = await chapterResponse.json();
        const actualChapterId = chapterData.id;

        const response = await fetch(`/api/ratings?user_id=${userId}&chapter_id=${actualChapterId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const ratingData = await response.json();
            if (ratingData && ratingData.rating) {
                // Hiển thị đánh giá hiện tại
                const starInput = document.querySelector(`input[name="rating"][value="${ratingData.rating}"]`);
                if (starInput) {
                    starInput.checked = true;
                }
            }
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra đánh giá:', error);
        showToast('Không thể tải đánh giá của bạn', 'error');
    }
}

// Hiển thị thông báo
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        const newToastContainer = document.createElement('div');
        newToastContainer.id = 'toast-container';
        newToastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(newToastContainer);
    }
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type}`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const toastContainerEl = document.getElementById('toast-container') || newToastContainer;
    toastContainerEl.appendChild(toastElement);
    
    const toast = new bootstrap.Toast(toastElement, {
        delay: 2000
    });
    
    toast.show();
}

// Hàm tải và hiển thị bình luận
async function loadComments(chapterId) {
    const commentSection = document.getElementById('comment-section');
    if (!commentSection) return;

    try {
        // Lấy chapter_id thực tế từ API
        const chapterResponse = await fetch(`/api/chapters/${currentCardId}/${currentChapterData.chapterNumber}`);
        if (!chapterResponse.ok) {
            throw new Error('Không thể lấy thông tin chapter');
        }
        
        const chapterData = await chapterResponse.json();
        const actualChapterId = chapterData.id;

        const response = await fetch(`/api/comments/${actualChapterId}`);
        if (!response.ok) {
            throw new Error('Không thể tải bình luận');
        }

        const comments = await response.json();

        // Cập nhật số lượng bình luận
        const commentCount = comments.length;
        const commentButton = document.querySelector('.modal-footer button.btn-outline-primary');
        if (commentButton) {
            commentButton.innerHTML = `<i class="bi bi-chat"></i> Bình luận (${commentCount})`;
        }

        // Tạo container cho danh sách bình luận (hiển thị trước form)
        const commentList = document.createElement('div');
        commentList.className = 'comment-list';

        // Xóa nội dung cũ trong comment section
        commentSection.innerHTML = '';

        // Thêm tiêu đề phần bình luận
        const commentTitle = document.createElement('h5');
        commentTitle.textContent = `Bình luận (${commentCount})`;
        commentSection.appendChild(commentTitle);

        // Thêm danh sách bình luận
        if (comments.length === 0) {
            commentList.innerHTML = '<p class="text-center text-muted">Chưa có bình luận nào.</p>';
        } else {
            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentList.appendChild(commentElement);
            });
        }
        commentSection.appendChild(commentList);

        // Thêm form bình luận ở cuối (sẽ cố định nhờ CSS)
        commentSection.appendChild(createCommentForm());
        
    } catch (error) {
        console.error('Lỗi khi tải bình luận:', error);
        commentSection.innerHTML = '<div class="alert alert-danger">Có lỗi xảy ra khi tải bình luận</div>';
    }
}

// Hàm tạo form bình luận
function createCommentForm() {
    const form = document.createElement('form');
    form.className = 'comment-form mb-4';
    form.id = 'commentForm';

    form.innerHTML = `
        <div class="replying-to">
            <div class="reply-info">
                <i class="bi bi-reply-fill"></i>
                <span>Đang trả lời bình luận của <strong class="reply-to-username"></strong></span>
            </div>
            <button type="button" class="cancel-reply" title="Hủy phản hồi">×</button>
        </div>
        <div class="form-group position-relative">
            <textarea class="form-control" rows="3" placeholder="Viết bình luận của bạn..." required></textarea>
            <div class="emoji-picker mt-2">
                <button type="button" class="emoji-button" title="Chèn emoji">
                    <i class="bi bi-emoji-smile"></i>
                </button>
                <div class="emoji-popup">
                    ${generateEmojiList()}
                </div>
            </div>
        </div>
        <div class="d-flex justify-content-end mt-2">
            <button type="submit" class="btn btn-primary submit-btn">Gửi bình luận</button>
        </div>
    `;

    const textarea = form.querySelector('textarea');
    const emojiButton = form.querySelector('.emoji-button');
    const emojiPopup = form.querySelector('.emoji-popup');
    const submitBtn = form.querySelector('.submit-btn');
    const replyingToDiv = form.querySelector('.replying-to');
    const cancelReplyBtn = form.querySelector('.cancel-reply');
    const replyToUsername = form.querySelector('.reply-to-username');

    let currentCommentId = null;
    let isReplyMode = false;

    // Xử lý emoji picker
    emojiButton.addEventListener('click', (e) => {
        e.preventDefault();
        emojiPopup.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!emojiButton.contains(e.target) && !emojiPopup.contains(e.target)) {
            emojiPopup.classList.remove('show');
        }
    });

    emojiPopup.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            const emoji = e.target.textContent;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            textarea.value = text.substring(0, start) + emoji + text.substring(end);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        }
    });

    // Xử lý hủy phản hồi
    cancelReplyBtn.addEventListener('click', () => {
        resetForm();
        textarea.focus();
    });

    // Xử lý submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = textarea.value.trim();
        if (!content) return;

        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Vui lòng đăng nhập để bình luận', 'warning');
            return;
        }

        try {
            const decoded = jwt_decode(token);
            const userId = decoded.id;

            // Lấy chapter_id thực tế từ API
            const chapterResponse = await fetch(`/api/chapters/${currentCardId}/${currentChapterData.chapterNumber}`);
            if (!chapterResponse.ok) {
                throw new Error('Không thể lấy thông tin chapter');
            }
            
            const chapterData = await chapterResponse.json();
            const actualChapterId = chapterData.id;

            let response;
            if (isReplyMode && currentCommentId) {
                // Gửi phản hồi
                response = await fetch(`/api/comments/${currentCommentId}/replies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        content: content
                    })
                });
            } else {
                // Gửi bình luận mới
                response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    chapter_id: actualChapterId,
                    content: content
                })
            });
            }

            if (response.ok) {
                const result = await response.json();
                showToast(isReplyMode ? 'Đã gửi phản hồi thành công' : 'Đã gửi bình luận thành công', 'success');
                
                // Cập nhật giao diện
                await loadComments(currentChapterData.id);
                resetForm();
            } else {
                throw new Error('Không thể gửi bình luận');
            }
        } catch (error) {
            console.error('Lỗi khi gửi bình luận:', error);
            showToast(error.message || 'Có lỗi xảy ra', 'error');
        }
    });

    // Hàm chuyển form sang chế độ phản hồi
    function setReplyMode(comment) {
        isReplyMode = true;
        currentCommentId = comment.id;
        replyToUsername.textContent = comment.username;
        replyingToDiv.classList.add('active');
        textarea.placeholder = `Viết phản hồi cho ${comment.username}...`;
        submitBtn.textContent = 'Gửi phản hồi';
        form.scrollIntoView({ behavior: 'smooth' });
        textarea.focus();
    }

    // Hàm reset form về trạng thái ban đầu
    function resetForm() {
        isReplyMode = false;
        currentCommentId = null;
        replyingToDiv.classList.remove('active');
        textarea.placeholder = 'Viết bình luận của bạn...';
        submitBtn.textContent = 'Gửi bình luận';
        textarea.value = '';
        emojiPopup.classList.remove('show');
    }

    // Thêm các phương thức vào form
    form.setReplyMode = setReplyMode;
    form.resetForm = resetForm;

    return form;
}

// Hàm tạo danh sách emoji
function generateEmojiList() {
    const emojis = [
        '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
        '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
        '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪',
        '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒',
        '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
        '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡',
        '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰',
        '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
        '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮',
        '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴'
    ];
    
    return emojis.map(emoji => `<div class="emoji-item" role="button">${emoji}</div>`).join('');
}

// Hàm cập nhật số lượng bình luận
function updateCommentCount() {
    const commentCount = document.querySelectorAll('.comment-list > div').length;
    const commentButton = document.querySelector('.modal-footer button.btn-outline-primary');
    if (commentButton) {
        commentButton.innerHTML = `<i class="bi bi-chat"></i> Bình luận (${commentCount})`;
    }
    // Cập nhật hiển thị số lượng trong tiêu đề phần bình luận
    const commentTitle = document.querySelector('#comment-section h5');
    if (commentTitle) {
        commentTitle.textContent = `Bình luận (${commentCount})`;
    }
}

// Hàm tạo phần tử bình luận
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item card mb-3';
    commentElement.dataset.commentId = comment.id;

    const token = localStorage.getItem('token');
    let currentUserId = null;
    if (token) {
        const decoded = jwt_decode(token);
        currentUserId = decoded.id;
    }

    commentElement.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-start">
                <img src="${comment.avatar || 'https://via.placeholder.com/40'}" class="rounded-circle me-2" width="40" height="40" alt="${comment.username}">
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-1">${comment.username}</h6>
                        <small class="text-muted">${getTimeAgo(new Date(comment.created_at))}</small>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-actions mt-2">
                        <button class="btn btn-sm btn-link reply-btn">Phản hồi</button>
                        ${comment.reply_count > 0 ? 
                            `<button class="btn btn-sm btn-link view-replies-btn">Xem ${comment.reply_count} phản hồi</button>` : 
                            ''}
                        ${currentUserId === comment.user_id ? `
                            <button class="btn btn-sm btn-link edit-btn">Sửa</button>
                            <button class="btn btn-sm btn-link text-danger delete-btn">Xóa</button>
                        ` : ''}
                    </div>
                    <div class="replies-container mt-3" style="display: none;"></div>
                    <div class="reply-form-container mt-3" style="display: none;">
                        <form class="reply-form">
                            <div class="form-group position-relative">
                                <textarea class="form-control" rows="2" placeholder="Viết phản hồi..." required></textarea>
                                <div class="emoji-picker mt-2">
                                    <button type="button" class="emoji-button" title="Chèn emoji">
                                        <i class="bi bi-emoji-smile"></i>
                                    </button>
                                    <div class="emoji-popup">
                                        ${generateEmojiList()}
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end mt-2">
                                <button type="button" class="btn btn-sm btn-secondary me-2 cancel-reply-btn">Hủy</button>
                                <button type="submit" class="btn btn-sm btn-primary">Gửi</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Xử lý sự kiện cho các nút
    const replyBtn = commentElement.querySelector('.reply-btn');
    const viewRepliesBtn = commentElement.querySelector('.view-replies-btn');
    const editBtn = commentElement.querySelector('.edit-btn');
    const deleteBtn = commentElement.querySelector('.delete-btn');
    const replyForm = commentElement.querySelector('.reply-form');
    const cancelReplyBtn = commentElement.querySelector('.cancel-reply-btn');
    const repliesContainer = commentElement.querySelector('.replies-container');
    const replyFormContainer = commentElement.querySelector('.reply-form-container');

    if (replyBtn) {
        replyBtn.addEventListener('click', () => {
            if (!token) {
                showToast('Vui lòng đăng nhập để phản hồi', 'warning');
                return;
            }
            const commentForm = document.getElementById('commentForm');
            if (commentForm && commentForm.setReplyMode) {
                const replyData = {
                    id: comment.id,
                    username: comment.username
                };
                commentForm.setReplyMode(replyData);
            }
        });
    }

    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', () => {
            replyFormContainer.style.display = 'none';
            replyForm.reset();
        });
    }

    if (viewRepliesBtn) {
        viewRepliesBtn.addEventListener('click', async () => {
            if (repliesContainer.style.display === 'none') {
                try {
                    const response = await fetch(`/api/comments/${comment.id}/replies`);
                    const replies = await response.json();
                    
                    repliesContainer.innerHTML = replies.map(reply => `
                        <div class="reply-item ms-4 mt-2" data-reply-id="${reply.id}">
                            <div class="d-flex align-items-start">
                                <img src="${reply.avatar || 'https://via.placeholder.com/32'}" class="rounded-circle me-2" width="32" height="32" alt="${reply.username}">
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="mb-1">${reply.username}</h6>
                                        <small class="text-muted">${getTimeAgo(new Date(reply.created_at))}</small>
                                    </div>
                                    <div class="reply-content">${reply.content}</div>
                                    <div class="reply-actions mt-2">
                                        <button class="btn btn-sm btn-link reply-to-reply-btn">Phản hồi</button>
                                        ${currentUserId === reply.user_id ? `
                                            <button class="btn btn-sm btn-link edit-reply-btn">Sửa</button>
                                            <button class="btn btn-sm btn-link text-danger delete-reply-btn">Xóa</button>
                                        ` : ''}
                                    </div>
                                    <div class="reply-form-container mt-2" style="display: none;">
                                        <form class="reply-form">
                                            <div class="form-group position-relative">
                                                <textarea class="form-control" rows="2" placeholder="Viết phản hồi..." required></textarea>
                                                <div class="emoji-picker mt-2">
                                                    <button type="button" class="emoji-button" title="Chèn emoji">
                                                        <i class="bi bi-emoji-smile"></i>
                                                    </button>
                                                    <div class="emoji-popup">
                                                        ${generateEmojiList()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="d-flex justify-content-end mt-2">
                                                <button type="button" class="btn btn-sm btn-secondary me-2 cancel-reply-btn">Hủy</button>
                                                <button type="submit" class="btn btn-sm btn-primary">Gửi</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    
                    // Thêm xử lý sự kiện cho các nút trong phản hồi
                    repliesContainer.querySelectorAll('.reply-item').forEach(replyItem => {
                        const replyId = replyItem.dataset.replyId;
                        const replyToReplyBtn = replyItem.querySelector('.reply-to-reply-btn');
                        const editReplyBtn = replyItem.querySelector('.edit-reply-btn');
                        const deleteReplyBtn = replyItem.querySelector('.delete-reply-btn');
                        const replyContent = replyItem.querySelector('.reply-content');

                        // Xử lý nút phản hồi cho phản hồi
                        if (replyToReplyBtn) {
                            replyToReplyBtn.addEventListener('click', () => {
                                if (!token) {
                                    showToast('Vui lòng đăng nhập để phản hồi', 'warning');
                                    return;
                                }
                                const commentForm = document.getElementById('commentForm');
                                if (commentForm && commentForm.setReplyMode) {
                                    const replyData = {
                                        id: replyId,
                                        username: replyItem.querySelector('h6').textContent
                                    };
                                    commentForm.setReplyMode(replyData);
            }
        });
    }

                        // Xử lý nút sửa phản hồi
                        if (editReplyBtn) {
                            editReplyBtn.addEventListener('click', async () => {
                                const currentContent = replyContent.textContent;
                                
                                replyContent.innerHTML = `
                                    <form class="edit-reply-form">
                                        <div class="form-group position-relative">
                                            <textarea class="form-control" rows="2" required>${currentContent}</textarea>
                                            <div class="emoji-picker mt-2">
                                                <button type="button" class="emoji-button" title="Chèn emoji">
                                                    <i class="bi bi-emoji-smile"></i>
                                                </button>
                                                <div class="emoji-popup">
                                                    ${generateEmojiList()}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-end mt-2">
                                            <button type="button" class="btn btn-sm btn-secondary me-2 cancel-edit-btn">Hủy</button>
                                            <button type="submit" class="btn btn-sm btn-primary">Lưu</button>
                                        </div>
                                    </form>
                                `;

                                const editForm = replyContent.querySelector('.edit-reply-form');
                                const cancelEditBtn = replyContent.querySelector('.cancel-edit-btn');
                                const textarea = editForm.querySelector('textarea');
                                const emojiButton = editForm.querySelector('.emoji-button');
                                const emojiPopup = editForm.querySelector('.emoji-popup');

                                // Xử lý emoji picker
                                emojiButton.addEventListener('click', (e) => {
                e.preventDefault();
                                    emojiPopup.classList.toggle('show');
                                });

                                document.addEventListener('click', (e) => {
                                    if (!emojiButton.contains(e.target) && !emojiPopup.contains(e.target)) {
                                        emojiPopup.classList.remove('show');
                                    }
                                });

                                emojiPopup.addEventListener('click', (e) => {
                                    if (e.target.classList.contains('emoji-item')) {
                                        const emoji = e.target.textContent;
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const text = textarea.value;
                                        textarea.value = text.substring(0, start) + emoji + text.substring(end);
                                        textarea.focus();
                                        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                                    }
                                });

                                // Xử lý nút hủy
                                cancelEditBtn.addEventListener('click', () => {
                                    replyContent.textContent = currentContent;
                                });

                                // Xử lý form sửa
                                editForm.addEventListener('submit', async (e) => {
                                    e.preventDefault();
                                    const newContent = textarea.value.trim();
                                    if (!newContent || newContent === currentContent) {
                                        replyContent.textContent = currentContent;
                                        return;
                                    }

                                    try {
                                        const token = localStorage.getItem('token');
                                        if (!token) {
                                            showToast('Vui lòng đăng nhập để sửa phản hồi', 'warning');
                                            replyContent.textContent = currentContent;
                                            return;
                                        }

                const decoded = jwt_decode(token);
                const userId = decoded.id;

                                        const response = await fetch(`/api/comments/replies/${replyId}`, {
                                            method: 'PUT',
                    headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                                                content: newContent
                    })
                });

                                        if (!response.ok) {
                                            const error = await response.text();
                                            throw new Error(error || 'Không thể cập nhật phản hồi');
                                        }

                                        replyContent.textContent = newContent;
                                        showToast('Đã cập nhật phản hồi thành công', 'success');
                                    } catch (error) {
                                        console.error('Lỗi khi cập nhật phản hồi:', error);
                                        showToast(error.message || 'Có lỗi xảy ra khi cập nhật phản hồi', 'error');
                                        replyContent.textContent = currentContent;
                                    }
                                });
                            });
                        }

                        // Xử lý nút xóa phản hồi
                        if (deleteReplyBtn) {
                            deleteReplyBtn.addEventListener('click', async () => {
                                if (!confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) return;

                                try {
                                    const token = localStorage.getItem('token');
                                    if (!token) {
                                        showToast('Vui lòng đăng nhập để xóa phản hồi', 'warning');
                                        return;
                                    }

                                    const decoded = jwt_decode(token);
                                    const userId = decoded.id;

                                    const response = await fetch(`/api/comments/replies/${replyId}`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            user_id: userId
                                        })
                                    });

                                    if (!response.ok) {
                                        const error = await response.text();
                                        throw new Error(error || 'Không thể xóa phản hồi');
                                    }

                                    // Xóa phần tử khỏi DOM
                                    replyItem.remove();
                                    
                                    // Cập nhật số lượng phản hồi
                                    const commentElement = replyItem.closest('.comment-item');
                                    const viewRepliesBtn = commentElement.querySelector('.view-replies-btn');
                                    if (viewRepliesBtn) {
                                        const currentCount = parseInt(viewRepliesBtn.textContent.match(/\d+/)[0]) - 1;
                                        if (currentCount > 0) {
                                            viewRepliesBtn.textContent = `Xem ${currentCount} phản hồi`;
                } else {
                                            viewRepliesBtn.remove();
                }
                                    }
                                    
                                    showToast('Đã xóa phản hồi thành công', 'success');
            } catch (error) {
                                    console.error('Lỗi khi xóa phản hồi:', error);
                                    showToast(error.message || 'Có lỗi xảy ra khi xóa phản hồi', 'error');
                                }
                            });
                        }
                    });

                    repliesContainer.style.display = 'block';
                    viewRepliesBtn.textContent = 'Ẩn phản hồi';
                } catch (error) {
                    console.error('Lỗi khi tải phản hồi:', error);
                    showToast('Có lỗi xảy ra khi tải phản hồi', 'error');
                }
            } else {
                repliesContainer.style.display = 'none';
                viewRepliesBtn.textContent = `Xem ${comment.reply_count} phản hồi`;
            }
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const contentDiv = commentElement.querySelector('.comment-content');
            const currentContent = contentDiv.textContent;
            
            contentDiv.innerHTML = `
                <form class="edit-form">
                    <div class="form-group position-relative">
                        <textarea class="form-control" rows="3" required>${currentContent}</textarea>
                        <div class="emoji-picker mt-2">
                            <button type="button" class="emoji-button" title="Chèn emoji">
                                <i class="bi bi-emoji-smile"></i>
                            </button>
                            <div class="emoji-popup">
                                ${generateEmojiList()}
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end mt-2">
                        <button type="button" class="btn btn-sm btn-secondary me-2 cancel-edit-btn">Hủy</button>
                        <button type="submit" class="btn btn-sm btn-primary">Lưu</button>
                    </div>
                </form>
            `;

            const editForm = contentDiv.querySelector('.edit-form');
            const cancelEditBtn = contentDiv.querySelector('.cancel-edit-btn');
            const emojiButton = editForm.querySelector('.emoji-button');
            const emojiPopup = editForm.querySelector('.emoji-popup');
            const textarea = editForm.querySelector('textarea');

            // Xử lý emoji picker cho form chỉnh sửa
            emojiButton.addEventListener('click', (e) => {
                e.preventDefault();
                emojiPopup.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!emojiButton.contains(e.target) && !emojiPopup.contains(e.target)) {
                    emojiPopup.classList.remove('show');
                }
            });
            
            // Xử lý nút hủy
            cancelEditBtn.addEventListener('click', () => {
                contentDiv.textContent = currentContent;
            });

            // Xử lý sự kiện submit form
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newContent = textarea.value.trim();
                if (!newContent || newContent === currentContent) {
                    contentDiv.textContent = currentContent;
                    return;
                }

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        showToast('Vui lòng đăng nhập để sửa bình luận', 'warning');
                        contentDiv.textContent = currentContent;
                        return;
                    }

                    const response = await fetch(`/api/comments/${comment.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            content: newContent
                        })
                    });

                    if (response.ok) {
                        contentDiv.textContent = newContent;
                        showToast('Đã cập nhật bình luận', 'success');
                    } else {
                        throw new Error('Không thể cập nhật bình luận');
                    }
                } catch (error) {
                    console.error('Lỗi khi cập nhật bình luận:', error);
                    showToast('Có lỗi xảy ra khi cập nhật bình luận', 'error');
                    contentDiv.textContent = currentContent;
                }
            });
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    showToast('Vui lòng đăng nhập để xóa bình luận', 'warning');
                    return;
                }

                const response = await fetch(`/api/comments/${comment.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ user_id: userId })
                });

                if (response.ok) {
                    commentElement.remove();
                    updateCommentCount();
                    showToast('Đã xóa bình luận', 'success');
                } else {
                    throw new Error('Không thể xóa bình luận');
                }
            } catch (error) {
                console.error('Lỗi khi xóa bình luận:', error);
                showToast('Có lỗi xảy ra khi xóa bình luận', 'error');
            }
        });
    }

    // Xử lý emoji picker cho form phản hồi
    const replyEmojiButton = commentElement.querySelector('.reply-form .emoji-button');
    const replyEmojiPopup = commentElement.querySelector('.reply-form .emoji-popup');
    const replyTextarea = commentElement.querySelector('.reply-form textarea');

    if (replyEmojiButton && replyEmojiPopup && replyTextarea) {
        replyEmojiButton.addEventListener('click', (e) => {
            e.preventDefault();
            replyEmojiPopup.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!replyEmojiButton.contains(e.target) && !replyEmojiPopup.contains(e.target)) {
                replyEmojiPopup.classList.remove('show');
            }
        });

        replyEmojiPopup.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-item')) {
                const emoji = e.target.textContent;
                const start = replyTextarea.selectionStart;
                const end = replyTextarea.selectionEnd;
                const text = replyTextarea.value;
                replyTextarea.value = text.substring(0, start) + emoji + text.substring(end);
                replyTextarea.focus();
                replyTextarea.selectionStart = replyTextarea.selectionEnd = start + emoji.length;
            }
        });
    }

    return commentElement;
}

// Hàm khởi tạo emoji picker cho các form phản hồi của phản hồi
function initializeReplyToReplyEmojiPickers(container) {
    const replyToReplyForms = container.querySelectorAll('.reply-to-reply-form');
    
    replyToReplyForms.forEach(form => {
        const emojiButton = form.querySelector('.emoji-button');
        const emojiPopup = form.querySelector('.emoji-popup');
        const textarea = form.querySelector('textarea');
        
        if (emojiButton && emojiPopup && textarea) {
            // Hiển thị/ẩn emoji popup
            emojiButton.addEventListener('click', (e) => {
                e.preventDefault();
                emojiPopup.classList.toggle('show');
            });
            
            // Đóng emoji popup khi click ra ngoài
            document.addEventListener('click', (e) => {
                if (!emojiButton.contains(e.target) && !emojiPopup.contains(e.target)) {
                    emojiPopup.classList.remove('show');
                }
            });
            
            // Xử lý khi chọn emoji
            emojiPopup.addEventListener('click', (e) => {
                if (e.target.classList.contains('emoji-item')) {
                    const emoji = e.target.textContent;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    textarea.value = text.substring(0, start) + emoji + text.substring(end);
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                }
            });
        }
    });
}