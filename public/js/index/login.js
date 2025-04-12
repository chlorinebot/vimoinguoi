// login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const changePasswordMessage = document.getElementById('changePasswordMessage');

    let isOpeningModal = false;

    // Kiểm tra trạng thái đăng nhập
    checkLoginStatus();

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                // Sử dụng ApiService thay vì gọi fetch trực tiếp
                const data = await ApiService.login({ username, password });

                loginMessage.textContent = data.message;
                loginMessage.className = 'mt-2 text-success';

                const token = data.token;
                const roleId = data.role_id;
                localStorage.setItem('token', token);
                localStorage.setItem('username', username);
                localStorage.setItem('roleId', roleId);

                // Lưu token vào cookie
                document.cookie = `token=${token}; path=/; max-age=3600`;

                const decodedToken = jwt_decode(token);
                console.log('Decoded token:', decodedToken);

                updateNavbarForLoggedInUser(username, roleId);

                if (roleId == '1') {
                    console.log('User is admin, redirecting to /admin-web');
                    setTimeout(() => {
                        window.location.href = '/admin-web';
                    }, 1000);
                } else {
                    console.log('User is not admin, closing login modal');
                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('login'));
                        if (modal) modal.hide();
                    }, 1000);
                }

                checkLoginStatus();
            } catch (error) {
                loginMessage.textContent = error.message || 'Đăng nhập thất bại!';
                loginMessage.className = 'mt-2 text-danger';
                console.error('Lỗi chi tiết:', error);
            }
        });
    }

    if (changePasswordForm) {
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
        const passwordRequirements = document.getElementById('passwordRequirements');
        const changePasswordMessage = document.getElementById('changePasswordMessage');

        // Kiểm tra yêu cầu mật khẩu mới khi người dùng nhập
        newPasswordInput.addEventListener('input', validateNewPassword);
        confirmNewPasswordInput.addEventListener('input', validatePasswordMatch);

        // Hàm kiểm tra mật khẩu mới
        function validateNewPassword() {
            const password = newPasswordInput.value;
            const requirements = [];
            
            // Kiểm tra độ dài
            if (password.length < 8 || password.length > 20) {
                requirements.push('<span class="text-danger">• Độ dài phải từ 8-20 ký tự</span>');
            } else {
                requirements.push('<span class="text-success">• Độ dài hợp lệ</span>');
            }
            
            // Kiểm tra chữ hoa
            if (!/[A-Z]/.test(password)) {
                requirements.push('<span class="text-danger">• Cần ít nhất 1 chữ hoa</span>');
            } else {
                requirements.push('<span class="text-success">• Có chữ hoa</span>');
            }
            
            // Kiểm tra chữ thường
            if (!/[a-z]/.test(password)) {
                requirements.push('<span class="text-danger">• Cần ít nhất 1 chữ thường</span>');
            } else {
                requirements.push('<span class="text-success">• Có chữ thường</span>');
            }
            
            // Kiểm tra số
            if (!/[0-9]/.test(password)) {
                requirements.push('<span class="text-danger">• Cần ít nhất 1 số</span>');
            } else {
                requirements.push('<span class="text-success">• Có số</span>');
            }
            
            // Kiểm tra ký tự đặc biệt
            if (!/[!@#$%^&*]/.test(password)) {
                requirements.push('<span class="text-danger">• Cần ít nhất 1 ký tự đặc biệt (!@#$%^&*)</span>');
            } else {
                requirements.push('<span class="text-success">• Có ký tự đặc biệt</span>');
            }
            
            // Hiển thị kết quả
            passwordRequirements.innerHTML = requirements.join('<br>');
            
            // Nếu có giá trị ở trường xác nhận mật khẩu, kiểm tra lại
            if (confirmNewPasswordInput.value) {
                validatePasswordMatch();
            }
            
            return password.length >= 8 && password.length <= 20 && 
                   /[A-Z]/.test(password) && /[a-z]/.test(password) && 
                   /[0-9]/.test(password) && /[!@#$%^&*]/.test(password);
        }

        // Hàm kiểm tra xác nhận mật khẩu
        function validatePasswordMatch() {
            const match = newPasswordInput.value === confirmNewPasswordInput.value;
            if (confirmNewPasswordInput.value) {
                if (!match) {
                    confirmNewPasswordInput.classList.add('is-invalid');
                } else {
                    confirmNewPasswordInput.classList.remove('is-invalid');
                    confirmNewPasswordInput.classList.add('is-valid');
                }
            }
            return match;
        }

        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;
            const username = localStorage.getItem('username');

            // Xóa thông báo cũ
            changePasswordMessage.textContent = '';
            changePasswordMessage.className = 'mt-2';

            // Kiểm tra các trường đầu vào
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                changePasswordMessage.textContent = 'Vui lòng điền đầy đủ thông tin';
                changePasswordMessage.className = 'mt-2 text-danger';
                return;
            }

            if (!validateNewPassword()) {
                changePasswordMessage.textContent = 'Mật khẩu mới không đáp ứng các yêu cầu';
                changePasswordMessage.className = 'mt-2 text-danger';
                return;
            }

            if (!validatePasswordMatch()) {
                changePasswordMessage.textContent = 'Mật khẩu mới và xác nhận mật khẩu không khớp!';
                changePasswordMessage.className = 'mt-2 text-danger';
                return;
            }

            try {
                // Hiển thị thông báo đang xử lý
                changePasswordMessage.textContent = 'Đang xử lý...';
                changePasswordMessage.className = 'mt-2 text-info';
                
                // Log dữ liệu trước khi gửi
                console.log('Đang gửi yêu cầu đổi mật khẩu với username:', username);
                
                // Gọi API đổi mật khẩu
                const data = await ApiService.changePassword({
                    username,
                    currentPassword,
                    newPassword,
                });

                console.log('Kết quả từ API đổi mật khẩu:', data);

                // Hiển thị thông báo thành công
                changePasswordMessage.textContent = 'Đổi mật khẩu thành công!';
                changePasswordMessage.className = 'mt-2 text-success';
                
                // Đóng modal sau 2 giây
                setTimeout(() => {
                    const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                    if (changePasswordModal) changePasswordModal.hide();
                    changePasswordForm.reset();
                    passwordRequirements.innerHTML = '';
                    changePasswordMessage.textContent = '';
                    
                    // Xóa các class validation
                    newPasswordInput.classList.remove('is-valid', 'is-invalid');
                    confirmNewPasswordInput.classList.remove('is-valid', 'is-invalid');
                }, 2000);
            } catch (error) {
                // Hiển thị thông báo lỗi
                changePasswordMessage.textContent = error.message || 'Đổi mật khẩu thất bại!';
                changePasswordMessage.className = 'mt-2 text-danger';
                console.error('Lỗi chi tiết:', error);
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'logoutButton') {
            logout();
        } else if (e.target && e.target.id === 'settingsButton') {
            isOpeningModal = true;
            resetModalState();
            const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
            settingsModal.show();
        } else if (e.target && e.target.id === 'securityButton') {
            isOpeningModal = true;
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (settingsModal) settingsModal.hide();
            setTimeout(() => {
                resetModalState();
                const securityModal = new bootstrap.Modal(document.getElementById('securityModal'));
                securityModal.show();
            }, 300);
        } else if (e.target && e.target.id === 'changePasswordButton') {
            isOpeningModal = true;
            const securityModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            if (securityModal) securityModal.hide();
            setTimeout(() => {
                resetModalState();
                const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
                changePasswordModal.show();
            }, 300);
        } else if (e.target.closest('#messagesButton')) {
            console.log('Nút Tin nhắn được nhấn');
        } else if (e.target.closest('#notificationsButton')) {
            console.log('Nút Thông báo được nhấn');
        }
    });

    const settingsModalEl = document.getElementById('settingsModal');
    const securityModalEl = document.getElementById('securityModal');
    const changePasswordModalEl = document.getElementById('changePasswordModal');

    changePasswordModalEl.addEventListener('hidden.bs.modal', () => {
        resetModalState();
        if (!isOpeningModal) {
            setTimeout(() => {
                resetModalState();
                const securityModal = new bootstrap.Modal(document.getElementById('securityModal'));
                securityModal.show();
            }, 300);
        }
        isOpeningModal = false;
    });

    securityModalEl.addEventListener('hidden.bs.modal', () => {
        resetModalState();
        if (!isOpeningModal) {
            setTimeout(() => {
                resetModalState();
                const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
                settingsModal.show();
            }, 300);
        }
        isOpeningModal = false;
    });

    settingsModalEl.addEventListener('hidden.bs.modal', () => {
        resetModalState();
        isOpeningModal = false;
    });
    
    const loginModal = document.getElementById('login');
    if (loginModal) {
        loginModal.addEventListener('hidden.bs.modal', () => {
            resetModalState();
        });
    }
    
    const logupModal = document.getElementById('logup');
    if (logupModal) {
        logupModal.addEventListener('hidden.bs.modal', () => {
            resetModalState();
        });
    }
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const roleId = localStorage.getItem('roleId');
    const userActions = document.getElementById('userActions');

    console.log('Checking login status...');
    console.log('Token:', token);
    console.log('Username:', username);
    console.log('Role ID:', roleId);

    if (token && username) {
        updateNavbarForLoggedInUser(username, roleId);
        if (roleId == '1') {
            if (window.location.pathname === '/') {
                console.log('User is admin, redirecting from index to /admin-web');
                window.location.href = '/admin-web';
            } else if (window.location.pathname === '/admin-web') {
                console.log('User is admin, already on /admin-web, no redirect needed');
                // Backend sẽ xử lý render admin-web hoặc 401
            }
        } else {
            // Nếu không phải admin, không cần điều hướng ở đây, để backend xử lý
            console.log('User is not admin, letting backend handle /admin-web');
        }
    } else {
        // Nếu không có token, không điều hướng ở đây, để backend xử lý
        console.log('No token, letting backend handle /admin-web');
        const userDropdown = document.querySelector('.nav-item.dropdown.ms-5');
        if (userDropdown) {
            userDropdown.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                        <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                    </svg>
                    Đăng nhập/Đăng ký
                </a>
                <ul class="dropdown-menu">
                    <button type="button" class="btn btn-success ms-5" data-bs-toggle="modal" data-bs-target="#login">Đăng nhập</button>
                    <li><hr class="dropdown-divider"></li>
                    <button type="button" class="btn btn-outline-success ms-5" data-bs-toggle="modal" data-bs-target="#logup" style="width: 105px;">Đăng ký</button>
                </ul>
            `;
        }
        if (userActions) {
            userActions.classList.add('d-none');
        }
    }
}

function updateNavbarForLoggedInUser(username, roleId) {
    const userDropdown = document.querySelector('.nav-item.dropdown.ms-5');
    const userActions = document.getElementById('userActions');

    if (userDropdown) {
        if (roleId == '2') {
            userDropdown.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                        <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                    </svg>
                    ${username}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" id="userProfileLink" data-bs-toggle="modal" data-bs-target="#userProfileModal"><i class="bi bi-person me-2"></i>Thông tin tài khoản</a></li>
                    <li><a class="dropdown-item" href="#" id="settingsButton"><i class="bi bi-gear me-2"></i>Cài đặt</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutButton"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                </ul>
            `;
        } else if (roleId == '1') {
            userDropdown.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                        <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                        <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                    </svg>
                    ${username} (Admin)
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/admin-web"><i class="bi bi-speedometer2 me-2"></i>Bảng điều khiển</a></li>
                    <li><a class="dropdown-item" href="#" id="settingsButton"><i class="bi bi-gear me-2"></i>Cài đặt</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logoutButton"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                </ul>
            `;
        }
        
        if (userActions) {
            userActions.classList.remove('d-none');
            // TODO: Load badge counts for messages and notifications
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('roleId');
    
    // Xóa token khỏi cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    checkLoginStatus();
    
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}

function resetModalState() {
    console.log("Reset trạng thái modal");
    // Đếm số lượng modal hiển thị
    const visibleModals = document.querySelectorAll('.modal.show').length;
    
    if (visibleModals === 0) {
        // Nếu không còn modal nào hiển thị, xóa tất cả backdrop và reset body
        document.body.classList.remove('modal-open');
        const modalBackdrops = document.querySelectorAll('.modal-backdrop');
        modalBackdrops.forEach(backdrop => backdrop.remove());
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.removeAttribute('style');
    } else if (document.querySelectorAll('.modal-backdrop').length > visibleModals) {
        // Nếu có nhiều backdrop hơn modal đang hiển thị, chỉ giữ lại số lượng backdrop cần thiết
        const extraBackdrops = document.querySelectorAll('.modal-backdrop').length - visibleModals;
        const allBackdrops = Array.from(document.querySelectorAll('.modal-backdrop'));
        allBackdrops.slice(0, extraBackdrops).forEach(backdrop => backdrop.remove());
    }
    
    // Đảm bảo z-index chính xác cho modal và backdrop còn lại
    document.querySelectorAll('.modal.show').forEach((modal, index) => {
        const zIndex = 1050 + (10 * index);
        modal.style.zIndex = zIndex;
        
        // Nếu có backdrop tương ứng, cập nhật z-index của nó
        if (document.querySelectorAll('.modal-backdrop').length > index) {
            const backdrop = document.querySelectorAll('.modal-backdrop')[index];
            backdrop.style.zIndex = zIndex - 1;
        }
    });
}

// Xử lý khi modal Thông tin tài khoản được mở
const userProfileModal = document.getElementById('userProfileModal');
if (userProfileModal) {
    userProfileModal.addEventListener('show.bs.modal', async () => {
        try {
            // Lấy token và giải mã để lấy userId
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Vui lòng đăng nhập để xem thông tin tài khoản!');
                const loginModal = new bootstrap.Modal(document.getElementById('login'));
                loginModal.show();
                return;
            }

            const decoded = jwt_decode(token);
            const userId = decoded.id;

            // Lấy thông tin người dùng
            const userData = await ApiService.getUserProfile(userId);
            const roleId = localStorage.getItem('roleId');

            // Hiển thị thông tin người dùng
            document.getElementById('profileUsername').textContent = userData.username || 'Không có dữ liệu';
            document.getElementById('profileEmail').textContent = userData.email || 'Không có dữ liệu';
            document.getElementById('profileJoinDate').textContent = userData.created_at
                ? new Date(userData.created_at).toLocaleDateString('vi-VN')
                : 'Không có dữ liệu';
            
            // Cập nhật vai trò với badge
            const profileRole = document.getElementById('profileRole');
            profileRole.textContent = roleId == '1' ? 'Admin' : 'Thành viên';
            profileRole.className = roleId == '1' ? 'badge bg-danger' : 'badge bg-success';
            
            // Tạo chữ cái đầu cho avatar
            const initials = document.getElementById('profileInitials');
            if (userData.username) {
                initials.textContent = userData.username.charAt(0).toUpperCase();
            } else {
                initials.textContent = 'U';
            }

            // Lấy danh sách truyện yêu thích
            const favorites = await ApiService.getUserFavorites(userId);
            const favoriteComicsList = document.getElementById('favoriteComicsList');
            const noFavoritesMessage = document.getElementById('noFavoritesMessage');

            // Xóa nội dung cũ
            favoriteComicsList.innerHTML = '';

            // Kiểm tra dữ liệu favorites
            if (!Array.isArray(favorites) || favorites.length === 0) {
                noFavoritesMessage.classList.remove('d-none');
                favoriteComicsList.classList.add('d-none');
                
                // Cập nhật số lượng truyện yêu thích trên tab thống kê
                document.getElementById('favoritesCount').textContent = '0';
            } else {
                noFavoritesMessage.classList.add('d-none');
                favoriteComicsList.classList.remove('d-none');
                
                // Cập nhật số lượng truyện yêu thích trên tab thống kê
                document.getElementById('favoritesCount').textContent = favorites.length;

                // Hiển thị danh sách truyện yêu thích
                favorites.forEach(comic => {
                    // Kiểm tra các thuộc tính cần thiết
                    if (!comic.id || !comic.title || !comic.image) {
                        console.warn('Dữ liệu truyện không đầy đủ:', comic);
                        return;
                    }

                    const comicCard = `
                        <div class="col">
                            <div class="card h-100 shadow-sm border-0 hover-shadow">
                                <div class="position-relative">
                                    <img src="${comic.image}" class="card-img-top" alt="${comic.title}" style="height: 160px; object-fit: cover;">
                                    <button class="btn btn-sm position-absolute top-0 end-0 m-2 btn-danger remove-favorite-btn" data-comic-id="${comic.id}">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div class="card-body">
                                    <h6 class="card-title text-truncate">${comic.title}</h6>
                                    <div class="d-grid gap-2">
                                        <a href="#" class="btn btn-sm btn-primary view-comic-btn" data-comic-id="${comic.id}">
                                            <i class="bi bi-eye me-1"></i>Xem chi tiết
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    favoriteComicsList.insertAdjacentHTML('beforeend', comicCard);
                });

                // Thêm sự kiện cho các nút "Xem chi tiết"
                document.querySelectorAll('.view-comic-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const comicId = button.getAttribute('data-comic-id');
                        const cardModalEl = document.getElementById('card');
                        cardModalEl.setAttribute('data-comic-id', comicId);
                        const cardModal = new bootstrap.Modal(cardModalEl);
                        cardModal.show();
                    });
                });
                
                // Thêm sự kiện cho các nút "Xóa khỏi yêu thích"
                document.querySelectorAll('.remove-favorite-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (confirm('Bạn có chắc muốn xóa truyện này khỏi danh sách yêu thích?')) {
                            const comicId = button.getAttribute('data-comic-id');
                            try {
                                await ApiService.removeFromFavorites(userId, comicId);
                                // Xóa card khỏi danh sách
                                button.closest('.col').remove();
                                
                                // Cập nhật số lượng
                                const newCount = favoriteComicsList.querySelectorAll('.col').length;
                                document.getElementById('favoritesCount').textContent = newCount;
                                
                                // Hiển thị thông báo nếu danh sách trống
                                if (newCount === 0) {
                                    noFavoritesMessage.classList.remove('d-none');
                                    favoriteComicsList.classList.add('d-none');
                                }
                            } catch (error) {
                                console.error('Lỗi khi xóa khỏi danh sách yêu thích:', error);
                                alert('Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại!');
                            }
                        }
                    });
                });
            }
            
            // Thiết lập tìm kiếm truyện yêu thích
            const searchFavorites = document.getElementById('searchFavorites');
            if (searchFavorites) {
                searchFavorites.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase().trim();
                    const comicCards = favoriteComicsList.querySelectorAll('.col');
                    
                    comicCards.forEach(card => {
                        const title = card.querySelector('.card-title').textContent.toLowerCase();
                        if (title.includes(searchTerm)) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            }
            
            // Giả lập dữ liệu cho tab thống kê (có thể thay bằng API thật sau này)
            // Lấy thông tin lịch sử đọc để cập nhật số lượng đã đọc
            try {
                const historyResponse = await fetch(`/api/reading-history/${userId}`);
                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    // Cập nhật số lượng truyện đã đọc (đếm số lượng truyện duy nhất)
                    const uniqueComics = new Set();
                    historyData.forEach(item => {
                        uniqueComics.add(item.card_id);
                    });
                    document.getElementById('readCount').textContent = uniqueComics.size;
                } else {
                    document.getElementById('readCount').textContent = '0';
                }
            } catch (error) {
                console.error('Lỗi khi lấy lịch sử đọc:', error);
                document.getElementById('readCount').textContent = '0';
            }
            
            document.getElementById('commentCount').textContent = Math.floor(Math.random() * 20);
            document.getElementById('shareCount').textContent = Math.floor(Math.random() * 10);
            
        } catch (error) {
            console.error('Lỗi khi lấy thông tin tài khoản:', error);
            alert(`Không thể tải thông tin tài khoản: ${error.message || 'Lỗi không xác định'}`);
        }
    });

    // Reset modal khi đóng
    userProfileModal.addEventListener('hidden.bs.modal', () => {
        // Chuyển về tab hồ sơ mặc định khi đóng modal
        const profileTab = document.getElementById('profile-tab');
        if (profileTab) {
            const tabInstance = new bootstrap.Tab(profileTab);
            tabInstance.show();
        }
    });
}