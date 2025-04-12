/**
 * Xử lý bảng xếp hạng truyện
 */
document.addEventListener('DOMContentLoaded', function() {
    // Các loại bảng xếp hạng
    const RANKING_TYPES = {
        'most-read': {
            title: 'Truyện đọc nhiều nhất',
            metric: 'Lượt xem',
            endpoint: '/api/rankings/most-read'
        },
        'most-liked': {
            title: 'Truyện được yêu thích nhất',
            metric: 'Lượt thích',
            endpoint: '/api/rankings/most-liked'
        },
        'highest-rated': {
            title: 'Truyện đánh giá cao nhất',
            metric: 'Điểm đánh giá',
            endpoint: '/api/rankings/highest-rated'
        },
        'weekly-top': {
            title: 'Top xem tuần',
            metric: 'Lượt xem',
            endpoint: '/api/rankings/weekly-top'
        },
        'daily-top': {
            title: 'Top xem ngày',
            metric: 'Lượt xem',
            endpoint: '/api/rankings/daily-top'
        }
    };

    // Biến lưu trạng thái hiện tại
    let currentRankingType = 'most-read';
    let isLoading = false;
    let cachedData = {};

    // Cache DOM elements
    const rankingModal = document.getElementById('rankingModal');
    const rankingModalLabel = document.getElementById('rankingModalLabel');
    const rankingTableBody = document.getElementById('rankingTableBody');
    const rankingMetricHeader = document.getElementById('rankingMetricHeader');
    const rankingTabs = document.getElementById('rankingTabs');
    
    // Khởi tạo sự kiện khi modal mở
    rankingModal.addEventListener('show.bs.modal', function(event) {
        // Lấy loại xếp hạng từ liên kết được nhấp
        const triggerElement = event.relatedTarget;
        if (triggerElement && triggerElement.dataset.rankingType) {
            currentRankingType = triggerElement.dataset.rankingType;
            // Cập nhật tab đang active
            updateActiveTab(currentRankingType);
        }
        
        // Cập nhật tiêu đề modal và cột đo lường
        updateModalTitle();
        
        // Tải dữ liệu
        loadRankingData();
    });
    
    // Xử lý khi người dùng chuyển tab
    if (rankingTabs) {
        rankingTabs.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Kiểm tra nếu đang nhấp vào tab
            const tabLink = event.target.closest('[data-ranking-type]');
            if (!tabLink) return;
            
            // Lấy loại xếp hạng mới
            const newRankingType = tabLink.dataset.rankingType;
            if (newRankingType && newRankingType !== currentRankingType) {
                currentRankingType = newRankingType;
                
                // Cập nhật tab đang active
                updateActiveTab(currentRankingType);
                
                // Cập nhật tiêu đề modal
                updateModalTitle();
                
                // Tải dữ liệu mới
                loadRankingData();
            }
        });
    }
    
    // Cập nhật tab active
    function updateActiveTab(rankingType) {
        // Xóa active trên tất cả các tab
        const allTabs = rankingTabs.querySelectorAll('.nav-link');
        allTabs.forEach(tab => tab.classList.remove('active'));
        
        // Thêm active cho tab hiện tại
        const currentTab = rankingTabs.querySelector(`[data-ranking-type="${rankingType}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
        }
    }
    
    // Cập nhật tiêu đề modal và cột đo lường
    function updateModalTitle() {
        const rankingInfo = RANKING_TYPES[currentRankingType];
        rankingModalLabel.textContent = rankingInfo.title;
        rankingMetricHeader.textContent = rankingInfo.metric;
    }
    
    // Tải dữ liệu xếp hạng từ server
    async function loadRankingData() {
        if (isLoading) return;
        
        // Kiểm tra cache
        if (cachedData[currentRankingType]) {
            renderRankingData(cachedData[currentRankingType]);
            return;
        }
        
        isLoading = true;
        showLoadingState();
        
        try {
            const rankingInfo = RANKING_TYPES[currentRankingType];
            const endpoint = rankingInfo.endpoint;
            
            // Sử dụng ApiService để lấy dữ liệu thực
            let realData;
            
            // Gọi API thích hợp dựa trên loại bảng xếp hạng
            if (window.ApiService) {
                switch (currentRankingType) {
                    case 'most-read':
                        realData = await ApiService.getRankingMostRead();
                        break;
                    case 'most-liked':
                        realData = await ApiService.getRankingMostLiked();
                        break;
                    case 'highest-rated':
                        realData = await ApiService.getRankingHighestRated();
                        break;
                    case 'weekly-top':
                        realData = await ApiService.getRankingWeeklyTop();
                        break;
                    case 'daily-top':
                        realData = await ApiService.getRankingDailyTop();
                        break;
                    default:
                        throw new Error('Loại bảng xếp hạng không hợp lệ');
                }
            } else {
                // Nếu ApiService không có sẵn, dùng fetch API
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error('Không thể tải dữ liệu bảng xếp hạng');
                }
                realData = await response.json();
            }
            
            // Nếu không nhận được dữ liệu, sử dụng dữ liệu giả tạm thời cho demo
            if (!realData || realData.length === 0) {
                console.warn('Không nhận được dữ liệu thực, sử dụng dữ liệu giả cho demo');
                realData = generateDummyData(currentRankingType);
            }
            
            // Lưu vào cache
            cachedData[currentRankingType] = realData;
            
            // Hiển thị dữ liệu
            renderRankingData(realData);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu bảng xếp hạng:', error);
            showErrorState();
        } finally {
            isLoading = false;
        }
    }
    
    // Hiển thị dữ liệu xếp hạng
    function renderRankingData(data) {
        if (!data || data.length === 0) {
            showEmptyState();
            return;
        }
        
        // Xóa dữ liệu cũ
        rankingTableBody.innerHTML = '';
        
        // Tạo các hàng mới
        data.forEach((item, index) => {
            const rank = index + 1;
            const row = createRankingRow(item, rank);
            rankingTableBody.appendChild(row);
        });
    }
    
    // Tạo hàng cho bảng xếp hạng
    function createRankingRow(item, rank) {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => {
            window.location.href = `/comic/${item.id}`;
        });
        
        // Tạo badge cho 3 hạng đầu tiên
        let rankHTML = `${rank}`;
        if (rank <= 3) {
            let badgeClass = '';
            if (rank === 1) badgeClass = 'bg-warning text-dark';
            else if (rank === 2) badgeClass = 'bg-secondary';
            else if (rank === 3) badgeClass = 'bg-danger';
            
            rankHTML = `<span class="badge ${badgeClass}">${rank}</span>`;
        }
        
        // Tạo dấu hiệu xu hướng
        const trendIcon = getTrendIcon(item.trend);
        
        tr.innerHTML = `
            <td class="align-middle text-center">${rankHTML}</td>
            <td class="align-middle">
                <img src="${item.coverImage}" class="img-fluid rounded" style="max-height: 60px; width: auto;" alt="${item.title}">
            </td>
            <td class="align-middle">
                <div>${item.title}</div>
                <small class="text-muted">${trendIcon}</small>
            </td>
            <td class="align-middle">${item.author}</td>
            <td class="align-middle">${item.genres.join(', ')}</td>
            <td class="align-middle">${formatMetric(item.metric, currentRankingType)}</td>
        `;
        
        return tr;
    }
    
    // Lấy biểu tượng xu hướng
    function getTrendIcon(trend) {
        if (!trend) return '';
        
        let icon = '';
        let text = '';
        
        switch (trend) {
            case 'up':
                icon = '<i class="bi bi-arrow-up-circle-fill text-success"></i>';
                text = ' Tăng';
                break;
            case 'down':
                icon = '<i class="bi bi-arrow-down-circle-fill text-danger"></i>';
                text = ' Giảm';
                break;
            case 'new':
                icon = '<i class="bi bi-patch-check-fill text-primary"></i>';
                text = ' Mới';
                break;
            case 'stable':
                icon = '<i class="bi bi-dash-circle-fill text-secondary"></i>';
                text = ' Ổn định';
                break;
        }
        
        return `${icon} <span>${text}</span>`;
    }
    
    // Định dạng giá trị đo lường
    function formatMetric(value, rankingType) {
        if (rankingType === 'highest-rated') {
            // Hiển thị điểm đánh giá với 1 chữ số thập phân
            return parseFloat(value).toFixed(1);
        } else {
            // Định dạng số lượt xem/thích với dấu phân cách hàng nghìn
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
    }
    
    // Hiển thị trạng thái đang tải
    function showLoadingState() {
        rankingTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <p class="mt-2">Đang tải dữ liệu...</p>
                </td>
            </tr>
        `;
    }
    
    // Hiển thị trạng thái lỗi
    function showErrorState() {
        rankingTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                    <p>Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.</p>
                </td>
            </tr>
        `;
    }
    
    // Hiển thị trạng thái không có dữ liệu
    function showEmptyState() {
        rankingTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <i class="bi bi-info-circle-fill fs-4"></i>
                    <p>Không có dữ liệu cho bảng xếp hạng này.</p>
                </td>
            </tr>
        `;
    }
    
    // Tạo dữ liệu giả để demo
    function generateDummyData(rankingType) {
        const trendOptions = ['up', 'down', 'stable', 'new'];
        const comicTitles = [
            'One Piece', 'Naruto', 'Dragon Ball', 'Attack on Titan', 'Demon Slayer',
            'My Hero Academia', 'Jujutsu Kaisen', 'Haikyuu!!', 'Bleach', 'Death Note',
            'Hunter x Hunter', 'One Punch Man', 'Tokyo Ghoul', 'Chainsaw Man', 'Black Clover',
            'Fairy Tail', 'Fullmetal Alchemist', 'Kingdom', 'Vagabond', 'Berserk'
        ];
        
        const authors = [
            'Eiichiro Oda', 'Masashi Kishimoto', 'Akira Toriyama', 'Hajime Isayama', 'Koyoharu Gotouge',
            'Kohei Horikoshi', 'Gege Akutami', 'Haruichi Furudate', 'Tite Kubo', 'Tsugumi Ohba',
            'Yoshihiro Togashi', 'ONE', 'Sui Ishida', 'Tatsuki Fujimoto', 'Yūki Tabata',
            'Hiro Mashima', 'Hiromu Arakawa', 'Yasuhisa Hara', 'Takehiko Inoue', 'Kentaro Miura'
        ];
        
        const genresList = [
            ['Hành động', 'Phiêu lưu', 'Siêu nhiên'],
            ['Hành động', 'Võ thuật', 'Siêu nhiên'],
            ['Võ thuật', 'Siêu nhiên', 'Phiêu lưu'],
            ['Kinh dị', 'Hành động', 'Kỳ ảo'],
            ['Siêu nhiên', 'Lịch sử', 'Võ thuật'],
            ['Siêu anh hùng', 'Học đường', 'Hành động'],
            ['Siêu nhiên', 'Hành động', 'Kinh dị'],
            ['Thể thao', 'Học đường', 'Hài hước'],
            ['Siêu nhiên', 'Hành động', 'Phiêu lưu'],
            ['Trinh thám', 'Siêu nhiên', 'Tâm lý'],
            ['Phiêu lưu', 'Hành động', 'Siêu nhiên'],
            ['Hài hước', 'Hành động', 'Siêu anh hùng'],
            ['Kinh dị', 'Siêu nhiên', 'Tâm lý'],
            ['Kinh dị', 'Hành động', 'Siêu nhiên'],
            ['Hành động', 'Phép thuật', 'Siêu nhiên'],
            ['Phép thuật', 'Phiêu lưu', 'Hành động'],
            ['Phiêu lưu', 'Giả kim thuật', 'Kỳ ảo'],
            ['Lịch sử', 'Chiến tranh', 'Võ thuật'],
            ['Võ thuật', 'Lịch sử', 'Tâm lý'],
            ['Kinh dị', 'Hành động', 'Kỳ ảo']
        ];
        
        const result = [];
        
        comicTitles.forEach((title, index) => {
            let metric;
            
            // Tạo dữ liệu phù hợp với từng loại bảng xếp hạng
            switch (rankingType) {
                case 'most-read':
                    metric = Math.floor(1000000 / (index + 1)) + Math.floor(Math.random() * 100000);
                    break;
                case 'most-liked':
                    metric = Math.floor(500000 / (index + 1)) + Math.floor(Math.random() * 50000);
                    break;
                case 'highest-rated':
                    metric = (10 - (index * 0.2)) - (Math.random() * 0.5);
                    if (metric > 10) metric = 10;
                    if (metric < 7) metric = 7 + Math.random();
                    break;
                case 'weekly-top':
                    metric = Math.floor(200000 / (index + 1)) + Math.floor(Math.random() * 20000);
                    break;
                case 'daily-top':
                    metric = Math.floor(50000 / (index + 1)) + Math.floor(Math.random() * 5000);
                    break;
            }
            
            // Tạo mục dữ liệu cho bảng xếp hạng
            result.push({
                id: index + 1,
                title: title,
                author: authors[index],
                genres: genresList[index],
                coverImage: `https://picsum.photos/150/200?random=${index}`, // Ảnh bìa ngẫu nhiên
                trend: trendOptions[Math.floor(Math.random() * trendOptions.length)],
                metric: metric
            });
        });
        
        return result;
    }
}); 