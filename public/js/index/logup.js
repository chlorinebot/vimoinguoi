// public/js/index/logup.js
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    const showPassword = document.getElementById('showPassword');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const registerButton = document.querySelector('#registerForm button[type="submit"]');
    const termsCheck = document.getElementById('termsCheck');

    if (registerForm) {
        // Hiển thị/ẩn mật khẩu
        showPassword.addEventListener('change', () => {
            passwordInput.type = showPassword.checked ? 'text' : 'password';
            confirmPasswordInput.type = showPassword.checked ? 'text' : 'password';
        });

        // Kiểm tra điều khoản dịch vụ để kích hoạt/vô hiệu hóa nút đăng ký
        termsCheck.addEventListener('change', () => {
            if (termsCheck.checked) {
                registerButton.disabled = false;
                document.querySelectorAll('.error-message')[4].textContent = '';
            } else {
                registerButton.disabled = true;
                document.querySelectorAll('.error-message')[4].textContent = 'Vui lòng đồng ý với điều khoản dịch vụ.';
                document.querySelectorAll('.error-message')[4].classList.add('text-danger');
            }
        });

        // Thiết lập trạng thái ban đầu của nút đăng ký dựa trên checkbox
        registerButton.disabled = !termsCheck.checked;
        if (!termsCheck.checked) {
            document.querySelectorAll('.error-message')[4].textContent = 'Vui lòng đồng ý với điều khoản dịch vụ.';
            document.querySelectorAll('.error-message')[4].classList.add('text-danger');
        }

        // Kiểm tra thời gian thực cho từng trường nhập liệu
        document.getElementById('registerUsername').addEventListener('input', validateUsername);
        document.getElementById('registerEmail').addEventListener('input', validateEmail);
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);

        function validateUsername() {
            const username = document.getElementById('registerUsername').value;
            const errorElement = document.querySelectorAll('.error-message')[0];
            
            if (!/^[a-z0-9]{1,15}$/.test(username)) {
                errorElement.textContent = 'Tên người dùng chỉ chấp nhận chữ thường và số, tối đa 15 ký tự.';
                errorElement.classList.add('text-danger');
                return false;
            } else {
                errorElement.textContent = '';
                return true;
            }
        }

        function validateEmail() {
            const email = document.getElementById('registerEmail').value;
            const errorElement = document.querySelectorAll('.error-message')[3];
            
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorElement.textContent = 'Email không hợp lệ.';
                errorElement.classList.add('text-danger');
                return false;
            } else {
                errorElement.textContent = '';
                return true;
            }
        }

        function validatePassword() {
            const password = passwordInput.value;
            const errorElement = document.querySelectorAll('.error-message')[1];
            
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/.test(password)) {
                errorElement.textContent = 'Mật khẩu phải có 8-20 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
                errorElement.classList.add('text-danger');
                return false;
            } else {
                errorElement.textContent = '';
                return true;
            }
            
            // Kiểm tra lại mật khẩu xác nhận nếu đã có
            if (confirmPasswordInput.value) {
                validateConfirmPassword();
            }
        }

        function validateConfirmPassword() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const errorElement = document.querySelectorAll('.error-message')[2];
            
            if (password !== confirmPassword) {
                errorElement.textContent = 'Mật khẩu không khớp.';
                errorElement.classList.add('text-danger');
                return false;
            } else {
                errorElement.textContent = '';
                return true;
            }
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const termsCheck = document.getElementById('termsCheck').checked;

            // Xóa thông báo lỗi cũ
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

            // Kiểm tra điều kiện
            const isUsernameValid = validateUsername();
            const isEmailValid = validateEmail();
            const isPasswordValid = validatePassword();
            const isConfirmPasswordValid = validateConfirmPassword();
            
            if (!termsCheck) {
                document.querySelectorAll('.error-message')[4].textContent = 'Vui lòng đồng ý với điều khoản dịch vụ.';
                document.querySelectorAll('.error-message')[4].classList.add('text-danger');
            }

            if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !termsCheck) {
                return;
            }

            try {
                // Sử dụng ApiService thay vì gọi fetch trực tiếp
                const data = await ApiService.register({ username, email, password });
                
                registerMessage.textContent = data.message;
                registerMessage.className = 'mt-2 text-success';
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('logup'));
                    modal.hide();
                    resetModalState(); // Gọi hàm reset modal state khi đóng modal
                }, 1000);
            } catch (error) {
                registerMessage.textContent = error.message || 'Lỗi đăng ký!';
                registerMessage.className = 'mt-2 text-danger';
                console.error('Lỗi:', error);
            }
        });
    }

    // Thêm sự kiện khi modal được ẩn để reset trạng thái
    const logupModal = document.getElementById('logup');
    if (logupModal) {
        logupModal.addEventListener('hidden.bs.modal', function() {
            console.log("Modal #logup đã đóng");
            resetModalState();
        });
    }
});

// Hàm reset trạng thái modal
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