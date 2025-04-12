// Hàm lấy token từ localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Hàm cập nhật số liệu thống kê
async function updateDashboardStats() {
    try {
        const token = getToken();
        if (!token) {
            console.error('Không tìm thấy token');
            return;
        }

        // Lấy tổng số truyện
        const comicsResponse = await fetch('/api/cards/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const comicsData = await comicsResponse.json();
        document.getElementById('totalComics').textContent = comicsData.count || 0;

        // Lấy tổng số người dùng
        const usersResponse = await fetch('/api/users/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const usersData = await usersResponse.json();
        document.getElementById('totalUsers').textContent = usersData.count || 0;

        // Lấy tổng số thể loại
        const genresResponse = await fetch('/api/genres/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const genresData = await genresResponse.json();
        document.getElementById('totalGenres').textContent = genresData.count || 0;

        // Lấy tổng số chương
        const chaptersResponse = await fetch('/api/chapters/count', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const chaptersData = await chaptersResponse.json();
        document.getElementById('totalChapters').textContent = chaptersData.count || 0;

    } catch (error) {
        console.error('Lỗi khi cập nhật thống kê:', error);
    }
}

// Cập nhật thống kê khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    
    // Cập nhật thống kê mỗi 5 phút
    setInterval(updateDashboardStats, 5 * 60 * 1000);
}); 