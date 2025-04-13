// profile.js - Xử lý thông tin tài khoản admin
document.addEventListener('DOMContentLoaded', () => {
    initProfileEvents();
    initChangePasswordEvents();
    initAvatarUpload();
});

// Khởi tạo sự kiện cho form thông tin tài khoản
function initProfileEvents() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('profileEmail').value;
            const userId = getUserIdFromToken();
            
            if (!userId) {
                alert('Không thể xác định ID người dùng. Vui lòng đăng nhập lại.');
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi cập nhật thông tin tài khoản');
                }
                
                const result = await response.json();
                alert('Cập nhật thông tin tài khoản thành công');
                
                // Đóng modal sau khi cập nhật thành công
                const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
                modal.hide();
            } catch (error) {
                console.error('Lỗi khi cập nhật thông tin tài khoản:', error);
                alert('Lỗi khi cập nhật thông tin tài khoản: ' + error.message);
            }
        });
    }
}

// Khởi tạo sự kiện cho form đổi mật khẩu
function initChangePasswordEvents() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Kiểm tra mật khẩu mới và xác nhận mật khẩu
            if (newPassword !== confirmPassword) {
                alert('Mật khẩu mới và xác nhận mật khẩu không khớp');
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                const username = getUsernameFromToken();
                
                if (!username) {
                    alert('Không thể xác định tên người dùng. Vui lòng đăng nhập lại.');
                    return;
                }
                
                const response = await fetch('/api/users/change-password', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        currentPassword,
                        newPassword
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi đổi mật khẩu');
                }
                
                const result = await response.json();
                alert('Đổi mật khẩu thành công');
                
                // Đóng modal và reset form sau khi đổi mật khẩu thành công
                changePasswordForm.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
            } catch (error) {
                console.error('Lỗi khi đổi mật khẩu:', error);
                alert('Lỗi khi đổi mật khẩu: ' + error.message);
            }
        });
    }
}

// Khởi tạo sự kiện cho việc upload avatar
function initAvatarUpload() {
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Kiểm tra loại file
            if (!file.type.match('image.*')) {
                alert('Vui lòng chọn file hình ảnh');
                return;
            }
            
            // Hiển thị preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const avatarPreview = document.getElementById('avatarPreview');
                if (avatarPreview) {
                    avatarPreview.src = e.target.result;
                } else {
                    // Nếu chưa có img tag, tạo mới và thay thế avatar-text
                    const avatarCircle = document.querySelector('#profileModal .avatar-circle');
                    if (avatarCircle) {
                        avatarCircle.innerHTML = `<img id="avatarPreview" src="${e.target.result}" alt="Avatar Preview" />`;
                    }
                }
            };
            reader.readAsDataURL(file);
            
            // Upload avatar
            try {
                const userId = getUserIdFromToken();
                if (!userId) {
                    alert('Không thể xác định ID người dùng. Vui lòng đăng nhập lại.');
                    return;
                }
                
                const formData = new FormData();
                formData.append('avatar', file);
                
                // Thêm oldAvatarUrl nếu có
                const navbarAvatar = document.querySelector('#navbarDropdown .avatar-circle img');
                if (navbarAvatar) {
                    formData.append('oldAvatarUrl', navbarAvatar.src);
                }
                
                const token = localStorage.getItem('token');
                console.log('Uploading avatar for user ID:', userId);
                console.log('Token:', token ? 'Token exists' : 'No token');
                
                const response = await fetch(`/api/users/${userId}/avatar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                console.log('Upload response status:', response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Lỗi khi upload avatar');
                }
                
                const result = await response.json();
                
                // Cập nhật avatar trong navbar
                updateNavbarAvatar(result.avatar_url);
                
                alert('Upload avatar thành công');
            } catch (error) {
                console.error('Lỗi khi upload avatar:', error);
                alert('Lỗi khi upload avatar: ' + error.message);
            }
        });
    }
}

// Cập nhật avatar trong navbar
function updateNavbarAvatar(avatarUrl) {
    const navbarAvatarContainer = document.querySelector('#navbarDropdown .avatar-circle');
    if (navbarAvatarContainer) {
        const username = getUsernameFromToken();
        const existingImg = navbarAvatarContainer.querySelector('img');
        
        if (existingImg) {
            existingImg.src = avatarUrl;
        } else {
            navbarAvatarContainer.innerHTML = `<img src="${avatarUrl}" alt="${username || 'User'}" />`;
        }
    }
}

// Lấy user ID từ token
function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Decode JWT token (phần payload)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        console.log('Token payload:', payload);
        
        // Kiểm tra các trường hợp có thể có trong token
        if (payload.id) return payload.id;
        if (payload.userId) return payload.userId;
        if (payload.user && payload.user.id) return payload.user.id;
        
        // Nếu không tìm thấy, trả về giá trị mặc định
        return 1; // Giả sử admin có ID là 1
    } catch (error) {
        console.error('Lỗi khi decode token:', error);
        return 1; // Giá trị mặc định nếu có lỗi
    }
}

// Lấy username từ token
function getUsernameFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Decode JWT token (phần payload)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        
        // Kiểm tra các trường hợp có thể có trong token
        if (payload.username) return payload.username;
        if (payload.user && payload.user.username) return payload.user.username;
        
        // Nếu không tìm thấy, trả về giá trị mặc định
        return 'admin'; // Giả sử tên người dùng là admin
    } catch (error) {
        console.error('Lỗi khi decode token:', error);
        return 'admin'; // Giá trị mặc định nếu có lỗi
    }
}

export { initProfileEvents, initChangePasswordEvents, initAvatarUpload };
