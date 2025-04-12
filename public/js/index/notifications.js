// Khởi tạo các biến và elements
const notificationButton = document.getElementById('notificationsButton');
const notificationBadge = document.getElementById('notificationsBadge');
const notificationList = document.querySelector('.notification-list');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const viewAllNotificationsBtn = document.getElementById('viewAllNotifications');

// Hàm để định dạng thời gian
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} năm trước`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} tháng trước`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} ngày trước`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} giờ trước`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} phút trước`;
    
    return 'Vừa xong';
}

// Hàm tạo HTML cho một thông báo
function createNotificationHTML(notification) {
    const isUnread = !notification.read ? 'unread' : '';
    let icon, content;
    
    // Xác định loại thông báo và nội dung tương ứng
    if (notification.card_id && !notification.comment_id) {
        // Thông báo về chương mới
        icon = '<i class="bi bi-book text-primary"></i>';
        content = `Truyện bạn theo dõi có chương mới: ${notification.content}`;
    } else if (notification.comment_id) {
        // Thông báo về phản hồi bình luận
        icon = '<i class="bi bi-chat-dots text-success"></i>';
        content = `Có người phản hồi bình luận của bạn: ${notification.content}`;
    }

    return `
        <div class="notification-item ${isUnread}" data-id="${notification.id}">
            <div class="d-flex align-items-center">
                <div class="me-3">
                    ${icon}
                </div>
                <div class="flex-grow-1">
                    <div class="notification-content">${content}</div>
                    <div class="notification-time">${formatTimeAgo(notification.received_at)}</div>
                </div>
                ${!notification.read ? '<div class="ms-2"><span class="badge bg-primary">Mới</span></div>' : ''}
            </div>
        </div>
    `;
}

// Hàm lấy thông báo từ server
async function fetchNotifications() {
    try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Lỗi khi lấy thông báo');
        
        const notifications = await response.json();
        
        // Cập nhật badge số lượng thông báo chưa đọc
        const unreadCount = notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('d-none');
            notificationButton.querySelector('.bi-bell').classList.add('bell-shake');
        } else {
            notificationBadge.classList.add('d-none');
        }
        
        // Render thông báo
        notificationList.innerHTML = notifications.length > 0
            ? notifications.map(createNotificationHTML).join('')
            : '<div class="p-3 text-center text-muted">Không có thông báo mới</div>';
            
    } catch (error) {
        console.error('Lỗi:', error);
        notificationList.innerHTML = '<div class="p-3 text-center text-danger">Không thể tải thông báo</div>';
    }
}

// Hàm đánh dấu thông báo đã đọc
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Lỗi khi cập nhật trạng thái thông báo');
        
        // Cập nhật UI
        const notificationElement = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('unread');
            notificationElement.querySelector('.badge')?.remove();
        }
        
        // Cập nhật lại số lượng thông báo chưa đọc
        const unreadCount = parseInt(notificationBadge.textContent) - 1;
        if (unreadCount <= 0) {
            notificationBadge.classList.add('d-none');
        } else {
            notificationBadge.textContent = unreadCount;
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Hàm đánh dấu tất cả thông báo đã đọc
async function markAllNotificationsAsRead() {
    try {
        const response = await fetch('/api/notifications/read-all', {
            method: 'PUT'
        });
        if (!response.ok) throw new Error('Lỗi khi cập nhật trạng thái thông báo');
        
        // Cập nhật UI
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.querySelector('.badge')?.remove();
        });
        
        notificationBadge.classList.add('d-none');
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Lấy thông báo khi trang được tải
    if (isLoggedIn()) { // Giả sử có hàm isLoggedIn() để kiểm tra đăng nhập
        fetchNotifications();
    }
    
    // Đánh dấu đã đọc khi click vào thông báo
    notificationList.addEventListener('click', (e) => {
        const notificationItem = e.target.closest('.notification-item');
        if (notificationItem && notificationItem.classList.contains('unread')) {
            markNotificationAsRead(notificationItem.dataset.id);
        }
    });
    
    // Đánh dấu tất cả đã đọc
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    
    // Xem tất cả thông báo
    viewAllNotificationsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Thêm code để xem tất cả thông báo (có thể mở modal hoặc chuyển trang)
    });
});

// Kiểm tra thông báo mới định kỳ (mỗi 30 giây)
if (isLoggedIn()) {
    setInterval(fetchNotifications, 30000);
}

// WebSocket cho thông báo realtime (nếu có)
function initializeWebSocket() {
    const ws = new WebSocket('ws://your-websocket-server');
    
    ws.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        if (notification.type === 'notification') {
            // Thêm thông báo mới vào đầu danh sách
            const notificationHTML = createNotificationHTML(notification.data);
            notificationList.insertAdjacentHTML('afterbegin', notificationHTML);
            
            // Cập nhật badge và hiệu ứng
            const currentCount = parseInt(notificationBadge.textContent) || 0;
            notificationBadge.textContent = currentCount + 1;
            notificationBadge.classList.remove('d-none');
            notificationButton.querySelector('.bi-bell').classList.add('bell-shake');
        }
    };
    
    ws.onclose = () => {
        // Thử kết nối lại sau 5 giây
        setTimeout(initializeWebSocket, 5000);
    };
}

// Khởi tạo WebSocket nếu người dùng đã đăng nhập
if (isLoggedIn()) {
    initializeWebSocket();
} 