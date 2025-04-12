// favorites.js
// Quản lý chức năng yêu thích truyện

// Hàm kiểm tra trạng thái đăng nhập
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token; // Trả về true nếu có token, false nếu không có
}

// Hàm kiểm tra xem truyện đã được yêu thích hay chưa
async function checkFavoriteStatus(userId, cardId) {
    try {
        const response = await fetch(`http://localhost:3000/api/favorites/${userId}/${cardId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        return data.isFavorite; // Giả sử API trả về { isFavorite: true/false }
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái yêu thích:', error);
        return false;
    }
}

// Hàm thêm truyện vào danh sách yêu thích
async function addToFavorites(userId, cardId) {
    try {
        const response = await fetch(`http://localhost:3000/api/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ user_id: userId, card_id: cardId })
        });
        const data = await response.json();
        if (response.ok) {
            return true;
        } else {
            throw new Error(data.error || 'Lỗi khi thêm vào yêu thích');
        }
    } catch (error) {
        console.error('Lỗi khi thêm vào yêu thích:', error);
        return false;
    }
}

// Hàm xóa truyện khỏi danh sách yêu thích
async function removeFromFavorites(userId, cardId) {
    try {
        const response = await fetch(`http://localhost:3000/api/favorites/${userId}/${cardId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (response.ok) {
            return true;
        } else {
            throw new Error(data.error || 'Lỗi khi xóa khỏi yêu thích');
        }
    } catch (error) {
        console.error('Lỗi khi xóa khỏi yêu thích:', error);
        return false;
    }
}

// Hàm thiết lập nút yêu thích trong modal
function setupFavoriteButton(cardId) {
    // Kiểm tra và xóa nút yêu thích cũ nếu đã tồn tại
    const existingButton = document.getElementById('favoriteComicBtn');
    if (existingButton) {
        existingButton.remove();
    }
    
    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'btn btn-outline-danger mt-2 me-2';
    favoriteButton.id = 'favoriteComicBtn';
    favoriteButton.innerHTML = '<i class="bi bi-heart"></i> Yêu thích';

    // Thêm nút vào modal
    const modalBody = document.querySelector('#card .modal-body .col-md-4 .card-body');
    if (modalBody) {
        // Kiểm tra lại lần nữa trước khi thêm
        const duplicateButton = modalBody.querySelector('#favoriteComicBtn');
        if (duplicateButton) {
            duplicateButton.remove();
        }
        modalBody.appendChild(favoriteButton);
    } else {
        console.error('Không tìm thấy card-body trong modal để thêm nút yêu thích!');
        return;
    }

    // Kiểm tra trạng thái đăng nhập
    if (!isLoggedIn()) {
        favoriteButton.disabled = true;
        favoriteButton.title = 'Vui lòng đăng nhập để sử dụng chức năng này!';
        favoriteButton.classList.add('btn-secondary');
        favoriteButton.classList.remove('btn-outline-danger');
        favoriteButton.addEventListener('click', () => {
            alert('Vui lòng đăng nhập để thêm truyện vào danh sách yêu thích!');
            const loginModal = new bootstrap.Modal(document.getElementById('login'));
            loginModal.show();
        });
        return;
    }

    // Lấy userId từ token
    const token = localStorage.getItem('token');
    let userId;
    try {
        const decoded = jwt_decode(token); // Sử dụng jwt-decode để giải mã token
        userId = decoded.id;
    } catch (error) {
        console.error('Lỗi khi giải mã token:', error);
        favoriteButton.disabled = true;
        favoriteButton.classList.add('btn-secondary');
        favoriteButton.classList.remove('btn-outline-danger');
        return;
    }

    // Kiểm tra trạng thái yêu thích ban đầu
    checkFavoriteStatus(userId, cardId).then(isFavorite => {
        if (isFavorite) {
            favoriteButton.classList.remove('btn-outline-danger');
            favoriteButton.classList.add('btn-danger');
            favoriteButton.innerHTML = '<i class="bi bi-heart-fill"></i> Đã yêu thích';
        }

        // Thêm sự kiện click cho nút
        favoriteButton.addEventListener('click', async () => {
            const isCurrentlyFavorite = favoriteButton.classList.contains('btn-danger');
            
            if (isCurrentlyFavorite) {
                // Xóa khỏi danh sách yêu thích
                const success = await removeFromFavorites(userId, cardId);
                if (success) {
                    favoriteButton.classList.remove('btn-danger');
                    favoriteButton.classList.add('btn-outline-danger');
                    favoriteButton.innerHTML = '<i class="bi bi-heart"></i> Yêu thích';
                } else {
                    alert('Không thể xóa truyện khỏi danh sách yêu thích. Vui lòng thử lại!');
                }
            } else {
                // Thêm vào danh sách yêu thích
                const success = await addToFavorites(userId, cardId);
                if (success) {
                    favoriteButton.classList.remove('btn-outline-danger');
                    favoriteButton.classList.add('btn-danger');
                    favoriteButton.innerHTML = '<i class="bi bi-heart-fill"></i> Đã yêu thích';
                } else {
                    alert('Không thể thêm truyện vào danh sách yêu thích. Vui lòng thử lại!');
                }
            }
        });
    });
}

// Tích hợp vào card_title.js
document.addEventListener('DOMContentLoaded', () => {
    // Gắn sự kiện khi modal card được mở
    const cardModal = document.getElementById('card');
    if (cardModal) {
        cardModal.addEventListener('show.bs.modal', (event) => {
            const comicId = cardModal.getAttribute('data-comic-id');
            if (comicId) {
                // Đảm bảo xóa nút cũ trước khi thêm nút mới
                const existingButton = document.getElementById('favoriteComicBtn');
                if (existingButton) {
                    existingButton.remove();
                }
                setupFavoriteButton(comicId);
            }
        });

        // Xóa nút yêu thích khi modal đóng để tránh trùng lặp
        cardModal.addEventListener('hidden.bs.modal', () => {
            const favoriteButton = document.getElementById('favoriteComicBtn');
            if (favoriteButton) {
                favoriteButton.remove();
            }
        });
    }
});