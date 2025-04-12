document.addEventListener('DOMContentLoaded', function () {
    // === Hàm tiện ích để làm việc với Cookie ===
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    }

    function eraseCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999;';
    }

    // === Modal thông báo Cookie ===
    // Tạo modal thông báo cookie
    const cookieModal = document.createElement('div');
    cookieModal.id = 'cookieModal';
    cookieModal.style.cssText = `
        position: fixed;
        bottom: 70px; /* Nhích lên 50px so với footer */
        right: 20px;
        width: 350px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
        padding: 20px;
        z-index: 1000;
        display: none;
    `;
    cookieModal.innerHTML = `
        <h5>Thông báo về Cookie</h5>
        <p>Chúng tôi sử dụng cookie để nâng cao trải nghiệm của bạn. Bạn có đồng ý với việc sử dụng cookie không?</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="acceptCookie" class="btn btn-success">Chấp nhận</button>
            <button id="declineCookie" class="btn btn-danger">Từ chối</button>
        </div>
    `;
    document.body.appendChild(cookieModal);

    // Kiểm tra xem người dùng đã đồng ý cookie chưa
    const cookieConsent = getCookie('cookieConsent');
    if (!cookieConsent) {
        cookieModal.style.display = 'block'; // Hiển thị modal nếu chưa có lựa chọn
    }

    // Xử lý nút "Chấp nhận"
    document.getElementById('acceptCookie').addEventListener('click', function () {
        setCookie('cookieConsent', 'accepted', 365); // Lưu lựa chọn trong 1 năm
        cookieModal.style.display = 'none';
        enableCookies(); // Kích hoạt các chức năng sử dụng cookie
    });

    // Xử lý nút "Từ chối"
    document.getElementById('declineCookie').addEventListener('click', function () {
        setCookie('cookieConsent', 'declined', 365); // Lưu lựa chọn trong 1 năm
        cookieModal.style.display = 'none';
        disableCookies(); // Vô hiệu hóa các chức năng sử dụng cookie
    });

    // Biến để theo dõi trạng thái cookie
    let cookiesEnabled = cookieConsent === 'accepted';

    // Hàm kích hoạt các chức năng sử dụng cookie
    function enableCookies() {
        cookiesEnabled = true;
        initializeFeatures(); // Khởi tạo các tính năng khi đồng ý cookie
    }

    // Hàm vô hiệu hóa các chức năng sử dụng cookie
    function disableCookies() {
        cookiesEnabled = false;
        // Chỉ xóa cookie theme và searchHistory, giữ username nếu đã đăng nhập
        eraseCookie('theme');
        eraseCookie('searchHistory');
        // Reset giao diện dark mode
        document.body.classList.remove('dark-mode');
        document.getElementById('flexSwitchCheckDefault').checked = false;
    }

    // === Các tính năng tối ưu bằng Cookie ===
    function initializeFeatures() {
        if (!cookiesEnabled) return; // Không chạy nếu cookie bị từ chối

        // 1. Tối ưu chế độ tối/sáng (Dark/Light Mode)
        const themeSwitch = document.getElementById('flexSwitchCheckDefault');
        const body = document.body;

        const savedTheme = getCookie('theme');
        if (savedTheme) {
            body.classList.toggle('dark-mode', savedTheme === 'dark');
            themeSwitch.checked = savedTheme === 'dark';
        }

        themeSwitch.addEventListener('change', function () {
            if (!cookiesEnabled) return;
            if (this.checked) {
                body.classList.add('dark-mode');
                setCookie('theme', 'dark', 30);
            } else {
                body.classList.remove('dark-mode');
                setCookie('theme', 'light', 30);
            }
        });

        // 2. Lưu lịch sử tìm kiếm
        const searchInput = document.querySelector('form[role="search"] input');
        const searchButton = document.querySelector('form[role="search"] button');
        const historyModal = document.getElementById('history');
        const historyBody = historyModal.querySelector('.modal-body');

        let searchHistory = getCookie('searchHistory') ? JSON.parse(getCookie('searchHistory')) : [];

        function displaySearchHistory() {
            if (!cookiesEnabled) return;
            const loggedIn = getCookie('username');
            if (!loggedIn) return;

            const historyList = document.createElement('ul');
            historyList.className = 'list-group';
            searchHistory.forEach((term, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.innerText = term;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger btn-sm';
                deleteBtn.innerText = 'Xóa';
                deleteBtn.addEventListener('click', () => {
                    searchHistory.splice(index, 1);
                    setCookie('searchHistory', JSON.stringify(searchHistory), 30);
                    displaySearchHistory();
                });
                listItem.appendChild(deleteBtn);
                historyList.appendChild(listItem);
            });
            historyBody.innerHTML = '';
            historyBody.appendChild(historyModal.querySelector('form'));
            historyBody.appendChild(historyList);
        }

        searchButton.addEventListener('click', function (e) {
            e.preventDefault();
            if (!cookiesEnabled) return;
            const searchTerm = searchInput.value.trim();
            if (searchTerm && searchHistory.indexOf(searchTerm) === -1) {
                searchHistory.unshift(searchTerm);
                if (searchHistory.length > 10) searchHistory.pop();
                setCookie('searchHistory', JSON.stringify(searchHistory), 30);
            }
            displaySearchHistory();
        });

        historyModal.addEventListener('show.bs.modal', function () {
            const loggedIn = getCookie('username');
            if (!loggedIn) {
                historyBody.innerHTML = '<h1>Vui lòng đăng nhập để xem lại lịch sử xem!!!</h1><button type="button" class="btn btn-success ms-5" data-bs-toggle="modal" data-bs-target="#login">Đăng nhập tại đây</button>';
            } else {
                displaySearchHistory();
            }
        });

        // 3. Theo dõi trạng thái đăng nhập
        const loginForm = document.querySelector('#login form');
        const userDropdown = document.querySelector('.nav-item.dropdown .nav-link.dropdown-toggle');

        const loggedInUser = getCookie('username');
        if (loggedInUser) {
            userDropdown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
            </svg> ${loggedInUser}`;
        }

        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!cookiesEnabled) return;
            const email = document.getElementById('exampleInputEmail1').value;
            const password = document.getElementById('exampleInputPassword1').value;
            if (email && password) {
                const username = email.split('@')[0];
                setCookie('username', username, 7);
                userDropdown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                </svg> ${username}`;
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('login'));
                loginModal.hide();
            }
        });

        if (loggedInUser) {
            const dropdownMenu = document.querySelector('.nav-item.dropdown .dropdown-menu');
            const logoutItem = document.createElement('li');
            logoutItem.innerHTML = '<button type="button" class="btn btn-danger ms-5">Đăng xuất</button>';
            logoutItem.querySelector('button').addEventListener('click', function () {
                eraseCookie('username');
                userDropdown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                </svg> Đăng nhập/Đăng ký`;
                dropdownMenu.innerHTML = `
                    <button type="button" class="btn btn-success ms-5" data-bs-toggle="modal" data-bs-target="#login">Đăng nhập</button>
                    <li><hr class="dropdown-divider"></li>
                    <button type="button" class="btn btn-outline-success ms-5" data-bs-toggle="modal" data-bs-target="#logup" style="width: 105px;">Đăng ký</button>
                `;
            });
            dropdownMenu.innerHTML = '';
            dropdownMenu.appendChild(logoutItem);
        }
    }

    // Khởi tạo các tính năng nếu đã đồng ý cookie
    if (cookieConsent === 'accepted') {
        enableCookies();
    }
});

// CSS cho dark mode và modal cookie (thêm vào thẻ <style> trong HTML)
const styleSheet = document.createElement('style');
styleSheet.innerText = `
    .dark-mode {
        background-color: #333;
        color: #fff;
    }
    .dark-mode .navbar {
        background-color: #222 !important;
    }
    .dark-mode .card {
        background-color: #444;
        color: #fff;
    }
    .dark-mode .modal-content {
        background-color: #444;
        color: #fff;
    }
    #cookieModal {
        position: fixed;
        bottom: 70px; /* Nhích lên 50px so với footer */
        right: 20px;
        width: 350px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
        padding: 20px;
        z-index: 1000;
        display: none;
    }
    #cookieModal h5 {
        margin-bottom: 10px;
        font-size: 1.2em;
    }
    #cookieModal p {
        margin-bottom: 15px;
        font-size: 0.9em;
        color: #333;
    }
    #cookieModal .btn {
        font-size: 0.9em;
    }
`;
document.head.appendChild(styleSheet);