// card_title.js
let cardData = []; // Danh sách truyện
let originalCardData = []; // Lưu trữ dữ liệu gốc để lọc
let genres = []; // Danh sách thể loại
let currentCardData = null;

// Hàm để trộn ngẫu nhiên mảng (thuật toán Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', async function() {
    if (window.cardInitialized) return;
    window.cardInitialized = true;
    
    // Lấy danh sách thể loại từ API
    try {
        const genreResponse = await fetch('http://localhost:3000/api/genres');
        if (!genreResponse.ok) throw new Error('Lỗi khi lấy danh sách thể loại');
        genres = await genreResponse.json();
        console.log('Genres loaded:', genres);
        populateGenreDropdown(); // Đổ danh sách thể loại vào dropdown
    } catch (error) {
        console.error('Lỗi khi lấy danh sách thể loại:', error);
        genres = [];
    }

    // Lấy danh sách truyện từ API
    try {
        const cardResponse = await fetch('http://localhost:3000/api/cards');
        if (!cardResponse.ok) throw new Error('Lỗi khi lấy danh sách truyện');
        cardData = await cardResponse.json();
        originalCardData = [...cardData]; // Lưu trữ dữ liệu gốc
        console.log('Card data loaded:', cardData);
        if (cardData.length === 0) console.warn('Không có dữ liệu truyện!');
        
        // Trộn ngẫu nhiên danh sách truyện
        cardData = shuffleArray([...cardData]);
        console.log('Shuffled card data:', cardData);
    } catch (error) {
        console.error('Lỗi khi lấy cardData:', error);
        cardData = [];
        originalCardData = [];
    }

    const cardContainer = document.querySelector('.row.row-cols-1.row-cols-md-6.g-4');
    if (!cardContainer) {
        console.error('Không tìm thấy container cho cards!');
        return;
    }

    const itemsPerPage = 12;
    const totalPages = Math.ceil(cardData.length / itemsPerPage);

    setupCardPagination();
    displayCardsForPage(1);

    setupCardModalBehavior();
    
    // Kích hoạt điều hướng bàn phím cho phân trang
    setupKeyboardNavigation();

    // Xử lý URL chia sẻ khi trang được tải
    handleShareLink();
    
    // Thêm hiệu ứng chỉ dẫn cho người dùng
    showKeyboardNavTip();
    
    // Thêm nút để trộn lại thứ tự hiển thị
    addRandomizeButton();
});

// Hàm đổ danh sách thể loại vào dropdown
function populateGenreDropdown() {
    const genreDropdownMenu = document.getElementById('genreDropdownMenu');
    if (!genreDropdownMenu) {
        console.error('Không tìm thấy dropdown menu thể loại!');
        return;
    }

    // Thêm tùy chọn "Thể loại" để hiển thị toàn bộ truyện
    const defaultItem = document.createElement('li');
    defaultItem.innerHTML = '<a class="dropdown-item" href="#" data-genre-id="all">Tất cả</a>';
    genreDropdownMenu.appendChild(defaultItem);

    // Thêm các thể loại từ API
    genres.forEach(genre => {
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#" data-genre-id="${genre.genre_id}">${genre.genre_name}</a>`;
        genreDropdownMenu.appendChild(li);
    });

    // Thêm sự kiện cho các mục trong dropdown
    genreDropdownMenu.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.classList.contains('dropdown-item')) {
            const genreId = target.getAttribute('data-genre-id');
            filterCardsByGenre(genreId);
        }
    });
}

// Hàm lọc truyện theo thể loại
function filterCardsByGenre(genreId) {
    if (genreId === 'all') {
        cardData = [...originalCardData]; // Hiển thị tất cả truyện
    } else {
        cardData = originalCardData.filter(card => {
            const genreNames = card.genre_names ? card.genre_names.split(',') : [];
            const genre = genres.find(g => g.genre_id == genreId);
            return genre && genreNames.includes(genre.genre_name);
        });
    }
    
    // Trộn ngẫu nhiên kết quả sau khi lọc
    cardData = shuffleArray([...cardData]);

    // Cập nhật giao diện
    const itemsPerPage = 12;
    const totalPages = Math.ceil(cardData.length / itemsPerPage);
    setupCardPagination();
    displayCardsForPage(1);
}

// Hàm hiển thị card cho trang cụ thể
function displayCardsForPage(pageNumber) {
    // Giữ nhất quán số lượng mục trên mỗi trang
    const itemsPerPage = 12;
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = cardData.slice(startIndex, endIndex);

    const cardContainer = document.querySelector('.row.row-cols-1.row-cols-md-6.g-4');
    if (!cardContainer) {
        console.error('Không tìm thấy container cho cards!');
        return;
    }

    // Xóa nội dung cũ
    cardContainer.innerHTML = '';
    
    // Kiểm tra nếu không có dữ liệu để hiển thị
    if (currentPageData.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'col-12 text-center my-5';
        noDataDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Không có truyện nào phù hợp với tiêu chí tìm kiếm.
            </div>
        `;
        cardContainer.appendChild(noDataDiv);
        return;
    }

    // Hiển thị dữ liệu
    currentPageData.forEach(data => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.src = data.image || 'https://via.placeholder.com/150?text=No+Image';
        img.alt = data.title;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = data.title;

        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.textContent = data.content || 'Chưa có nội dung.';
        // Giới hạn độ dài nội dung
        if (cardText.textContent.length > 60) {
            cardText.textContent = cardText.textContent.substring(0, 60) + '...';
        }

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);

        cardDiv.appendChild(img);
        cardDiv.appendChild(cardBody);

        cardDiv.setAttribute('data-comic-id', data.id);
        cardDiv.addEventListener('click', function() {
            openCardModal(data);
        });

        colDiv.appendChild(cardDiv);
        cardContainer.appendChild(colDiv);
    });
    
    // Cuộn lên đầu trang nếu không phải trang đầu tiên
    if (pageNumber > 1) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    console.log(`Đã hiển thị ${currentPageData.length} truyện từ trang ${pageNumber}`);
}

// Hàm hiển thị tất cả card
function displayAllCards() {
    const cardContainer = document.querySelector('.row.row-cols-1.row-cols-md-6.g-4');
    if (!cardContainer) {
        console.error('Không tìm thấy container cho cards!');
        return;
    }

    cardContainer.innerHTML = '';

    cardData.forEach(data => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.src = data.image || 'https://via.placeholder.com/150?text=No+Image';
        img.alt = data.title;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = data.title;

        const cardText = document.createElement('p');
        cardText.className = 'card-text';
        cardText.textContent = data.content || 'Chưa có nội dung.';

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);

        cardDiv.appendChild(img);
        cardDiv.appendChild(cardBody);

        cardDiv.style.cursor = 'pointer';
        cardDiv.setAttribute('data-comic-id', data.id);
        cardDiv.addEventListener('click', function() {
            openCardModal(data);
        });

        colDiv.appendChild(cardDiv);
        cardContainer.appendChild(colDiv);
    });
}

// Hàm mở modal và hiển thị thông tin card
function openCardModal(data) {
    currentCardData = data;

    const newUrl = `${window.location.origin}/?comicId=${data.id}`;
    window.history.pushState({ comicId: data.id }, '', newUrl);

    console.log('Data passed to modal:', data);

    const modal = document.getElementById('card');
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');

    modalTitle.textContent = data.title;

    const cardImg = modalBody.querySelector('#comicImage');
    if (cardImg) {
        cardImg.src = data.image || 'https://via.placeholder.com/150?text=No+Image';
        cardImg.alt = data.title;
    }

    const cardTitle = modalBody.querySelector('#comicTitle');
    if (cardTitle) {
        cardTitle.textContent = data.title;
    }

    const cardAuthor = modalBody.querySelector('#comicAuthor');
    if (cardAuthor) {
        cardAuthor.textContent = `Tác giả: ${data.author || data.content || 'Isayama Hajime'}`;
    }

    const cardGenre = modalBody.querySelector('#comicGenre');
    if (cardGenre) {
        const genreNames = data.genre_names && data.genre_names.trim() !== '' ? data.genre_names : 'Chưa có thể loại';
        cardGenre.textContent = `Thể loại: ${genreNames}`;
    } else {
        console.error('Không tìm thấy phần tử #comicGenre trong modal!');
    }

    const cardHashtags = modalBody.querySelector('#comicHashtagsContent');
    if (cardHashtags) {
        cardHashtags.textContent = data.hashtags || 'Chưa có hashtag';
    }

    const cardContent = modalBody.querySelector('#comicContent');
    if (cardContent) {
        cardContent.textContent = `Nội dung truyện: ${data.content || 'Chưa có nội dung.'}`;
    }

    // Lấy và hiển thị điểm đánh giá trung bình của truyện
    fetchComicRating(data.id);
    
    // Lấy và hiển thị số lượt xem truyện
    fetchComicViews(data.id);

    modal.setAttribute('data-comic-id', data.id);

    const shareButton = modalBody.querySelector('#shareComicBtn');
    if (shareButton) {
        shareButton.onclick = function() {
            const shareUrl = `${window.location.origin}/?comicId=${data.id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link chia sẻ đã được sao chép: ' + shareUrl);
            }).catch(err => {
                console.error('Lỗi khi sao chép link:', err);
                alert('Không thể sao chép link. Vui lòng thử lại!');
            });
        };
    }

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Hàm để lấy và hiển thị số lượt xem của truyện
async function fetchComicViews(cardId) {
    try {
        const response = await fetch(`/api/cards/views/${cardId}`);
        if (!response.ok) {
            throw new Error('Không thể lấy thông tin lượt xem');
        }
        
        const viewData = await response.json();
        
        // Tìm vị trí để thêm lượt xem (sau phần tử rating)
        const cardBody = document.querySelector('#card .card-body');
        const comicRating = document.getElementById('comicRating');
        
        // Xóa phần tử lượt xem cũ nếu có
        const existingViews = document.getElementById('comicViews');
        if (existingViews) {
            existingViews.remove();
        }
        
        // Tạo phần tử hiển thị lượt xem
        const viewsElement = document.createElement('p');
        viewsElement.className = 'card-text';
        viewsElement.id = 'comicViews';
        viewsElement.innerHTML = `<i class="bi bi-eye"></i> Lượt xem: <span class="fw-bold">${viewData.views}</span>`;
        
        // Đảm bảo lượt xem hiển thị bên dưới đánh giá
        if (comicRating) {
            // Chèn phần tử lượt xem sau phần tử đánh giá
            if (comicRating.nextSibling) {
                cardBody.insertBefore(viewsElement, comicRating.nextSibling);
            } else {
                cardBody.appendChild(viewsElement);
            }
        } else {
            // Nếu không có đánh giá, thêm vào cuối body
            cardBody.appendChild(viewsElement);
        }
    } catch (error) {
        console.error('Lỗi khi lấy số lượt xem truyện:', error);
    }
}

// Hàm để cập nhật số lượt xem của truyện khi người dùng đọc
async function incrementComicViews(cardId) {
    try {
        const response = await fetch(`/api/cards/views/increment/${cardId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể cập nhật lượt xem');
        }
        
        console.log('Đã cập nhật lượt xem cho truyện ID:', cardId);
    } catch (error) {
        console.error('Lỗi khi cập nhật lượt xem truyện:', error);
    }
}

// Hàm để lấy và hiển thị điểm đánh giá trung bình của truyện
async function fetchComicRating(cardId) {
    try {
        const response = await fetch(`/api/ratings/average/comic/${cardId}`);
        if (!response.ok) {
            throw new Error('Không thể lấy thông tin đánh giá');
        }
        
        const ratingData = await response.json();
        
        // Tìm vị trí để thêm đánh giá (sau thẻ p của comicHashtags)
        const cardBody = document.querySelector('#card .card-body');
        const comicHashtags = document.querySelector('#comicHashtags');
        
        // Xóa đánh giá cũ nếu có
        const existingRating = document.getElementById('comicRating');
        if (existingRating) {
            existingRating.remove();
        }
        
        // Tạo phần tử hiển thị đánh giá
        const ratingElement = document.createElement('p');
        ratingElement.className = 'card-text';
        ratingElement.id = 'comicRating';
        
        // Tạo HTML cho hiển thị sao
        const averageRating = parseFloat(ratingData.average_rating) || 0;
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating - fullStars >= 0.5;
        
        let starsHTML = '';
        
        // Thêm sao đầy đủ
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="bi bi-star-fill text-warning"></i>';
        }
        
        // Thêm nửa sao nếu cần
        if (hasHalfStar) {
            starsHTML += '<i class="bi bi-star-half text-warning"></i>';
        }
        
        // Thêm sao trống cho đủ 5 sao
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="bi bi-star text-warning"></i>';
        }
        
        ratingElement.innerHTML = `Đánh giá: ${starsHTML} <span class="rating-value">(${averageRating}/5 từ ${ratingData.rating_count} lượt đánh giá)</span>`;
        
        // Thêm phần tử đánh giá vào sau comicHashtags
        if (comicHashtags && comicHashtags.nextSibling) {
            cardBody.insertBefore(ratingElement, comicHashtags.nextSibling);
        } else {
            cardBody.appendChild(ratingElement);
        }
    } catch (error) {
        console.error('Lỗi khi lấy điểm đánh giá trung bình:', error);
    }
}

// Hàm thiết lập phân trang
function setupCardPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        console.error('Không tìm thấy phần tử paginationContainer!');
        return;
    }

    // Xóa phân trang cũ
    paginationContainer.innerHTML = '';
    
    // Đảm bảo số lượng mục trên mỗi trang nhất quán
    const itemsPerPage = 12;
    const totalPages = Math.ceil(cardData.length / itemsPerPage);
    
    console.log('Phân trang: Tổng số truyện =', cardData.length, 'Số trang =', totalPages);
    
    // Nếu không có dữ liệu hoặc chỉ có 1 trang, không hiển thị phân trang
    if (cardData.length === 0 || totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    } else {
        paginationContainer.style.display = 'flex';
    }

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = 'page-item disabled'; // Bắt đầu với Previous bị vô hiệu hóa
    prevLi.innerHTML = '<a class="page-link" href="#">Previous</a>';
    ul.appendChild(prevLi);

    // Các trang số
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === 1 ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        ul.appendChild(li);
    }

    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = 'page-item';
    if (totalPages <= 1) {
        nextLi.className = 'page-item disabled';
    }
    nextLi.innerHTML = '<a class="page-link" href="#">Next</a>';
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);

    // Thêm sự kiện cho các nút phân trang
    const pageLinks = Array.from(paginationContainer.querySelectorAll('.page-item:not(:first-child):not(:last-child)'));
    const prevButton = paginationContainer.querySelector('.page-item:first-child');
    const nextButton = paginationContainer.querySelector('.page-item:last-child');

    // Đảm bảo có các phần tử trước khi thêm sự kiện
    if (pageLinks.length > 0) {
        pageLinks.forEach((item, index) => {
            const pageLink = item.querySelector('.page-link');
            pageLink.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('Chuyển đến trang', index + 1);
                pageLinks.forEach(pageItem => pageItem.classList.remove('active'));
                item.classList.add('active');
                displayCardsForPage(index + 1);
                updateCardPrevNextState();
            });
        });
    }

    prevButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!this.classList.contains('disabled')) {
            const activeIndex = pageLinks.findIndex(item => item.classList.contains('active'));
            if (activeIndex > 0) {
                console.log('Chuyển đến trang trước', activeIndex);
                pageLinks[activeIndex].classList.remove('active');
                pageLinks[activeIndex - 1].classList.add('active');
                displayCardsForPage(activeIndex);
                updateCardPrevNextState();
            }
        }
    });

    nextButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!this.classList.contains('disabled')) {
            const activeIndex = pageLinks.findIndex(item => item.classList.contains('active'));
            if (activeIndex < pageLinks.length - 1) {
                console.log('Chuyển đến trang tiếp', activeIndex + 2);
                pageLinks[activeIndex].classList.remove('active');
                pageLinks[activeIndex + 1].classList.add('active');
                displayCardsForPage(activeIndex + 2);
                updateCardPrevNextState();
            }
        }
    });

    updateCardPrevNextState();

    function updateCardPrevNextState() {
        const activeIndex = pageLinks.findIndex(item => item.classList.contains('active'));
        prevButton.classList.toggle('disabled', activeIndex <= 0);
        nextButton.classList.toggle('disabled', activeIndex >= pageLinks.length - 1);
    }
}

// Hàm thiết lập hành vi modal
function setupCardModalBehavior() {
    const docTruyenModal = document.getElementById('doctruyen');
    const cardModal = document.getElementById('card');

    if (docTruyenModal && !docTruyenModal.hasCardModalListener) {
        docTruyenModal.hasCardModalListener = true;
        docTruyenModal.addEventListener('hidden.bs.modal', function() {
            if (currentCardData) {
                const cardBsModal = new bootstrap.Modal(cardModal);
                cardBsModal.show();
            }
        });
        
        // Thêm sự kiện khi modal đọc truyện được mở để tăng lượt xem
        docTruyenModal.addEventListener('shown.bs.modal', function() {
            if (currentCardData) {
                // Tăng số lượt xem khi người dùng mở modal đọc truyện
                incrementComicViews(currentCardData.id);
            }
        });
    }

    if (cardModal && !cardModal.hasCardCloseListener) {
        cardModal.hasCardCloseListener = true;
        cardModal.addEventListener('hidden.bs.modal', function() {
            const homeUrl = `${window.location.origin}/`;
            window.history.pushState({}, '', homeUrl);

            document.body.classList.remove('modal-open');
            const modalBackdrops = document.querySelectorAll('.modal-backdrop');
            modalBackdrops.forEach(backdrop => backdrop.remove());
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }
}

// Thêm điều hướng bàn phím cho phân trang
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(event) {
        // Nếu đang focus vào input, textarea hoặc có modal đang mở thì bỏ qua
        if (document.querySelector('.modal.show') || 
            document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer || paginationContainer.style.display === 'none') return;
        
        const prevButton = paginationContainer.querySelector('.page-item:first-child');
        const nextButton = paginationContainer.querySelector('.page-item:last-child');
        
        // Phím mũi tên trái (← ArrowLeft)
        if (event.key === 'ArrowLeft' && !prevButton.classList.contains('disabled')) {
            event.preventDefault();
            prevButton.querySelector('.page-link').click();
            // Hiệu ứng khi bấm
            prevButton.classList.add('active-key');
            setTimeout(() => prevButton.classList.remove('active-key'), 200);
        }
        
        // Phím mũi tên phải (→ ArrowRight)
        if (event.key === 'ArrowRight' && !nextButton.classList.contains('disabled')) {
            event.preventDefault();
            nextButton.querySelector('.page-link').click();
            // Hiệu ứng khi bấm
            nextButton.classList.add('active-key');
            setTimeout(() => nextButton.classList.remove('active-key'), 200);
        }
    });
}

// Hàm xử lý URL chia sẻ
function handleShareLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const comicId = urlParams.get('comicId');
    const chapterId = urlParams.get('chapterId');

    if (comicId) {
        const comic = cardData.find(data => data.id == comicId);
        if (comic) {
            openCardModal(comic);

            if (chapterId && window.chapterData && chapterData[comicId]) {
                const chapter = chapterData[comicId].find(ch => ch.chapterNumber == chapterId);
                if (chapter) {
                    currentCardData = comic;
                    openReadModal(chapter);
                } else {
                    console.error('Không tìm thấy chương với chapterId:', chapterId);
                    alert('Không tìm thấy chương với ID này!');
                }
            }
        } else {
            console.error('Không tìm thấy truyện với ID:', comicId);
            window.location.href = '/404';
        }
    }
}

// Thêm hiệu ứng chỉ dẫn cho người dùng
function showKeyboardNavTip() {
    // Không hiển thị thông báo riêng mà tập trung vào phần tử phân trang
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer || paginationContainer.style.display === 'none') return;
    
    // Thêm lớp để nhấn mạnh cho phân trang
    paginationContainer.classList.add('pagination-highlight');
    setTimeout(() => {
        paginationContainer.classList.remove('pagination-highlight');
    }, 2000);
    
    // Thêm hiệu ứng chỉ dẫn phím tắt
    const keyboardHint = document.querySelector('.keyboard-hint');
    if (keyboardHint) {
        keyboardHint.classList.add('keyboard-hint-active');
        setTimeout(() => {
            keyboardHint.classList.remove('keyboard-hint-active');
        }, 2000);
    }
}

// Thêm nút trộn ngẫu nhiên thứ tự truyện
function addRandomizeButton() {
    // Tìm container phù hợp để thêm nút vào
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;
    
    // Tạo nút trộn ngẫu nhiên
    const randomizeButton = document.createElement('button');
    randomizeButton.className = 'btn btn-outline-primary ms-3';
    randomizeButton.innerHTML = '<i class="bi bi-shuffle"></i> Ngẫu nhiên';
    randomizeButton.title = 'Trộn ngẫu nhiên thứ tự hiển thị';
    
    // Thêm sự kiện cho nút
    randomizeButton.addEventListener('click', function() {
        // Trộn ngẫu nhiên các card
        cardData = shuffleArray([...cardData]);
        
        // Hiển thị lại trang đầu tiên
        setupCardPagination();
        displayCardsForPage(1);
        
        // Hiệu ứng thông báo
        this.classList.add('btn-primary');
        this.classList.remove('btn-outline-primary');
        this.innerHTML = '<i class="bi bi-check-circle"></i> Đã trộn';
        
        setTimeout(() => {
            this.classList.add('btn-outline-primary');
            this.classList.remove('btn-primary');
            this.innerHTML = '<i class="bi bi-shuffle"></i> Ngẫu nhiên';
        }, 1000);
    });
    
    // Thêm nút vào container
    paginationContainer.parentNode.appendChild(randomizeButton);
}