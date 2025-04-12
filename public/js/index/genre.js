document.addEventListener('DOMContentLoaded', async function () {
    // Chỉ chạy nếu chưa được khởi tạo (để tránh xung đột với card_title.js)
    if (window.genreInitialized) {
        console.log('Genre.js: Đã được khởi tạo từ trước, bỏ qua');
        return;
    }
    window.genreInitialized = true;
    
    console.log('Genre.js: Đang khởi tạo dropdown thể loại...');
    
    // Lấy danh sách thể loại từ API
    try {
        const response = await fetch('http://localhost:3000/api/cards');
        if (!response.ok) throw new Error('Lỗi khi lấy dữ liệu từ API');
        const cards = await response.json();
        console.log('Genre.js: Đã nhận được dữ liệu từ API, có', cards.length, 'cards');

        // Lấy danh sách thể loại duy nhất (loại bỏ trùng lặp)
        const genres = [...new Set(cards.map(card => card.genre_name).filter(genre => genre))]; // Sử dụng genre_name
        console.log('Genre.js: Các thể loại đã tìm thấy:', genres);

        // Hiển thị thể loại trong dropdown
        const genreDropdown = document.getElementById('genreDropdownMenu');
        if (genreDropdown) {
            console.log('Genre.js: Đã tìm thấy genreDropdownMenu, bắt đầu thêm các mục');
            
            // Kiểm tra xem dropdown đã có mục nào chưa
            const existingItems = genreDropdown.querySelectorAll('.dropdown-item');
            if (existingItems.length > 0) {
                console.log('Genre.js: Dropdown đã có', existingItems.length, 'mục, bỏ qua để tránh trùng lặp');
                // Nếu đã có mục, có thể là card_title.js đã điền vào
                // Chỉ thêm sự kiện languageChanged để hỗ trợ đa ngôn ngữ
                addGenreTranslationSupport(genreDropdown);
                return;
            }
            
            // Xóa tất cả các mục cũ trước khi thêm mới (nếu đã có)
            genreDropdown.innerHTML = '';

            // Thêm mục "Tất cả" đầu tiên
            const allLi = document.createElement('li');
            const allA = document.createElement('a');
            allA.className = 'dropdown-item';
            allA.href = '#';
            
            allA.setAttribute('data-original-genre', 'all');
            allA.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('Genre.js: Đã chọn "Tất cả"');
                if (typeof displayAllCards === 'function') {
                    displayAllCards();
                } else {
                    console.error('Genre.js: Hàm displayAllCards không tồn tại');
                }
            });
            allLi.appendChild(allA);
            genreDropdown.appendChild(allLi);

            // Thêm bản dịch cho các thể loại
            const genreTranslations = {
                'en': {
                    'Tất cả': 'All',
                    'Hành động': 'Action',
                    'Tình cảm': 'Romance',
                    'Hài hước': 'Comedy',
                    'Kinh dị': 'Horror',
                    'Viễn tưởng': 'Sci-Fi',
                    'Võ thuật': 'Martial Arts',
                    'Phiêu lưu': 'Adventure',
                    'Giả tưởng': 'Fantasy',
                    'Lịch sử': 'Historical',
                    'Học đường': 'School Life',
                    'Thể thao': 'Sports',
                    'Đời thường': 'Slice of Life',
                    'Trinh thám': 'Mystery',
                    'Siêu nhiên': 'Supernatural',
                    'Drama': 'Drama'
                    // Thêm các thể loại khác nếu cần
                },
                'zh': {
                    'Tất cả': '全部',
                    'Hành động': '动作',
                    'Tình cảm': '爱情',
                    'Hài hước': '喜剧',
                    'Kinh dị': '恐怖',
                    'Viễn tưởng': '科幻',
                    'Võ thuật': '武术',
                    'Phiêu lưu': '冒险',
                    'Giả tưởng': '奇幻',
                    'Lịch sử': '历史',
                    'Học đường': '校园',
                    'Thể thao': '体育',
                    'Đời thường': '日常',
                    'Trinh thám': '侦探',
                    'Siêu nhiên': '超自然',
                    'Drama': '戏剧'
                    // Thêm các thể loại khác nếu cần
                }
            };

            // Lấy ngôn ngữ hiện tại
            const currentLang = localStorage.getItem('language') || 'vi';

            // Thêm các thể loại từ API vào dropdown
            genres.forEach(genre => {
                if (!genre) return; // Bỏ qua nếu genre là null hoặc rỗng
                
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item';
                a.href = `#`;
                
                // Lưu trữ tên thể loại gốc (tiếng Việt) để sử dụng khi lọc
                a.setAttribute('data-original-genre', genre);
                
                // Hiển thị tên thể loại theo ngôn ngữ hiện tại
                if (currentLang === 'vi') {
                    a.textContent = genre;
                } else if (genreTranslations[currentLang] && genreTranslations[currentLang][genre]) {
                    a.textContent = genreTranslations[currentLang][genre];
                } else {
                    a.textContent = genre; // Mặc định nếu không có bản dịch
                }
                
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    // Sử dụng data-original-genre để lọc thay vì text hiển thị
                    const originalGenre = this.getAttribute('data-original-genre');
                    console.log('Genre.js: Đã chọn thể loại:', originalGenre);
                    filterComicsByGenre(originalGenre);
                });
                li.appendChild(a);
                genreDropdown.appendChild(li);
                console.log('Genre.js: Đã thêm thể loại:', genre);
            });

            addGenreTranslationSupport(genreDropdown);
            console.log('Genre.js: Đã thêm xong tất cả thể loại, tổng cộng', genreDropdown.querySelectorAll('.dropdown-item').length, 'mục');
        } else {
            console.error('Genre.js: Không tìm thấy phần tử #genreDropdownMenu');
        }
    } catch (error) {
        console.error('Genre.js: Lỗi khi lấy danh sách thể loại:', error);
    }
});

// Hàm thêm hỗ trợ dịch cho dropdown thể loại
function addGenreTranslationSupport(genreDropdown) {
    // Thêm bản dịch cho các thể loại
    const genreTranslations = {
        'en': {
            'Tất cả': 'All',
            'Hành động': 'Action',
            'Tình cảm': 'Romance',
            'Hài hước': 'Comedy',
            'Kinh dị': 'Horror',
            'Viễn tưởng': 'Sci-Fi',
            'Võ thuật': 'Martial Arts',
            'Phiêu lưu': 'Adventure',
            'Giả tưởng': 'Fantasy',
            'Lịch sử': 'Historical',
            'Học đường': 'School Life',
            'Thể thao': 'Sports',
            'Đời thường': 'Slice of Life',
            'Trinh thám': 'Mystery',
            'Siêu nhiên': 'Supernatural',
            'Drama': 'Drama'
        },
        'zh': {
            'Tất cả': '全部',
            'Hành động': '动作',
            'Tình cảm': '爱情',
            'Hài hước': '喜剧',
            'Kinh dị': '恐怖',
            'Viễn tưởng': '科幻',
            'Võ thuật': '武术',
            'Phiêu lưu': '冒险',
            'Giả tưởng': '奇幻',
            'Lịch sử': '历史',
            'Học đường': '校园',
            'Thể thao': '体育',
            'Đời thường': '日常',
            'Trinh thám': '侦探',
            'Siêu nhiên': '超自然',
            'Drama': '戏剧'
        }
    };
    
    // Đảm bảo các mục đã có đều có thuộc tính data-original-genre
    const items = genreDropdown.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        if (!item.hasAttribute('data-original-genre')) {
            item.setAttribute('data-original-genre', item.textContent);
        }
    });
    
    // Thêm chức năng cập nhật ngôn ngữ cho dropdown khi chuyển đổi ngôn ngữ
    const languageChangedHandler = function(e) {
        // Lấy ngôn ngữ mới
        const newLang = e.detail.language;
        console.log('Genre.js: Ngôn ngữ đã thay đổi thành', newLang);
        
        // Cập nhật tên hiển thị của các thể loại
        const genreItems = genreDropdown.querySelectorAll('.dropdown-item');
        genreItems.forEach(item => {
            const originalGenre = item.getAttribute('data-original-genre');
            
            if (newLang === 'vi') {
                item.textContent = originalGenre;
            } else if (genreTranslations[newLang] && genreTranslations[newLang][originalGenre]) {
                item.textContent = genreTranslations[newLang][originalGenre];
            } else {
                item.textContent = originalGenre; // Mặc định nếu không có bản dịch
            }
        });
    };
    
    // Xóa hết sự kiện cũ trước khi thêm mới để tránh trùng lặp
    window.removeEventListener('languageChanged', languageChangedHandler);
    window.addEventListener('languageChanged', languageChangedHandler);
    console.log('Genre.js: Đã thêm hỗ trợ dịch cho dropdown thể loại');
}

// Hàm lọc truyện theo thể loại (sử dụng genre_name)
function filterComicsByGenre(genre) {
    console.log('Genre.js: Đang lọc truyện theo thể loại:', genre);
    
    // Kiểm tra xem biến cardData có tồn tại không
    if (typeof cardData === 'undefined') {
        console.error('Genre.js: Biến cardData không tồn tại!');
        return;
    }
    
    if (genre === 'all') {
        // Nếu là "Tất cả", hiển thị lại toàn bộ
        if (typeof displayAllCards === 'function') {
            displayAllCards();
        } else {
            console.error('Genre.js: Không tìm thấy hàm displayAllCards!');
        }
        return;
    }
    
    const filteredCards = cardData.filter(card => card.genre_name === genre);
    console.log('Genre.js: Đã lọc được', filteredCards.length, 'truyện với thể loại', genre);
    
    const cardContainer = document.querySelector('.row.row-cols-1.row-cols-md-6.g-4');
    if (!cardContainer) {
        console.error('Genre.js: Không tìm thấy container để hiển thị cards!');
        return;
    }

    cardContainer.innerHTML = ''; // Xóa nội dung cũ

    // Kiểm tra nếu không có kết quả
    if (filteredCards.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'col-12 text-center py-5';
        noResultsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Không tìm thấy truyện nào thuộc thể loại "${genre}".
            </div>
        `;
        cardContainer.appendChild(noResultsDiv);
        return;
    }

    filteredCards.forEach(data => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100';

        const img = document.createElement('img');
        img.className = 'card-img-top';
        img.src = data.image || 'https://via.placeholder.com/150?text=No+Image';
        img.alt = data.title;

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column';

        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title text-truncate';
        cardTitle.textContent = data.title;

        const cardText = document.createElement('p');
        cardText.className = 'card-text flex-grow-1';
        cardText.textContent = data.content || 'Chưa có nội dung.';
        if (cardText.textContent.length > 60) {
            cardText.textContent = cardText.textContent.substring(0, 60) + '...';
        }

        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);

        cardDiv.appendChild(img);
        cardDiv.appendChild(cardBody);

        cardDiv.style.cursor = 'pointer';
        cardDiv.setAttribute('data-comic-id', data.id);
        cardDiv.addEventListener('click', function () {
            if (typeof openCardModal === 'function') {
                openCardModal(data);
            } else {
                console.error('Genre.js: Không tìm thấy hàm openCardModal!');
            }
        });

        colDiv.appendChild(cardDiv);
        cardContainer.appendChild(colDiv);
    });
}