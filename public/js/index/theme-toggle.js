// Quản lý chế độ sáng/tối
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra theme đã lưu
    const savedTheme = localStorage.getItem('theme');
    const htmlElement = document.documentElement;
    
    // Áp dụng theme từ localStorage nếu có, mặc định là dark
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcons(savedTheme);
    } else {
        // Mặc định chọn dark theme
        htmlElement.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcons('dark');
    }

    // Xử lý sự kiện click vào nút chuyển đổi theme
    const themeToggles = document.querySelectorAll('.theme-toggle, #sidebar-theme-toggle');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            updateThemeIcons(newTheme);
            updateModalStyles(newTheme);
        });
    });

    // Áp dụng theme cho modal khi mở
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('show.bs.modal', function() {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            updateModalStyles(currentTheme, this);
        });
    });

    // Áp dụng theme ban đầu cho modals
    updateModalStyles(htmlElement.getAttribute('data-bs-theme'));
});

// Cập nhật các biểu tượng theme
function updateThemeIcons(theme) {
    const sidebarLightIcon = document.getElementById('sidebar-light-icon');
    const sidebarDarkIcon = document.getElementById('sidebar-dark-icon');
    
    if (sidebarLightIcon && sidebarDarkIcon) {
        if (theme === 'dark') {
            sidebarLightIcon.style.display = 'none';
            sidebarDarkIcon.style.display = 'inline-block';
        } else {
            sidebarLightIcon.style.display = 'inline-block';
            sidebarDarkIcon.style.display = 'none';
        }
    }
}

// Cập nhật styles cho các modal theo theme
function updateModalStyles(theme, specificModal = null) {
    // Chọn tất cả modal hoặc chỉ modal cụ thể
    const modals = specificModal ? [specificModal] : document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Xử lý cho modal card (thông tin truyện)
        if (modal.id === 'card') {
            const modalBody = modal.querySelector('.modal-body');
            const modalFooter = modal.querySelector('.modal-footer');
            const modalHeader = modal.querySelector('.modal-header');
            const closeBtn = modal.querySelector('.btn-close');
            
            if (theme === 'dark') {
                // Theme tối
                if (modalBody) {
                    modalBody.classList.remove('bg-white', 'text-dark');
                    modalBody.classList.add('bg-dark', 'text-white');
                }
                if (modalFooter) {
                    modalFooter.classList.add('bg-dark');
                }
                if (modalHeader) {
                    modalHeader.classList.add('bg-dark', 'text-white');
                }
                if (closeBtn) {
                    closeBtn.classList.add('btn-close-white');
                }
            } else {
                // Theme sáng
                if (modalBody) {
                    modalBody.classList.remove('bg-dark', 'text-white');
                    modalBody.classList.add('bg-white', 'text-dark');
                }
                if (modalFooter) {
                    modalFooter.classList.remove('bg-dark');
                }
                if (modalHeader) {
                    modalHeader.classList.remove('bg-dark', 'text-white');
                }
                if (closeBtn) {
                    closeBtn.classList.remove('btn-close-white');
                }
            }
        }
    });
} 