document.addEventListener('DOMContentLoaded', function () {
    // Lưu trữ nội dung ban đầu của trang
    const originalContent = document.body.innerHTML;

    // Vô hiệu hóa bôi đen văn bản
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.MozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Thêm lớp phủ (overlay) cho thông báo
    const overlay = document.createElement('div');
    overlay.id = 'warningOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7); /* Nền mờ để làm nổi bật thông báo */
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    const warningMessage = document.createElement('h1');
    warningMessage.style.cssText = `
        color: red;
        text-align: center;
        font-size: 2em;
        padding: 20px;
        background: white;
        border-radius: 10px;
    `;
    warningMessage.innerText = 'Vui lòng đóng DevTools, chế độ in trang hoặc thao tác khác trên web để tiếp tục sử dụng trang web!';
    overlay.appendChild(warningMessage);
    document.body.appendChild(overlay);

    // Biến theo dõi trạng thái
    let isBlurActive = false;
    let isDevToolsOpen = false;

    // Hàm kiểm tra DevTools và chế độ mô phỏng
    function checkDevToolsAndState() {
        const threshold = 160; // Ngưỡng chênh lệch kích thước
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        // Kiểm tra DevTools
        if (widthThreshold || heightThreshold) {
            if (!isDevToolsOpen) {
                isDevToolsOpen = true;
                overlay.style.display = 'flex'; // Hiển thị lớp phủ
            }
        } else if (isDevToolsOpen) {
            isDevToolsOpen = false;
            if (overlay.style.display === 'flex') {
                overlay.style.display = 'none'; // Ẩn lớp phủ
            }
        }

        // Kiểm tra trạng thái blur (chuyển tab)
        if (!document.hasFocus() && !isBlurActive) {
            isBlurActive = true;
            overlay.style.display = 'flex'; // Hiển thị lớp phủ khi blur
        } else if (document.hasFocus() && isBlurActive) {
            isBlurActive = false;
            overlay.style.display = 'none'; // Ẩn lớp phủ khi focus lại
        }
    }

    // Hàm gắn lại các sự kiện
    function reattachEventListeners() {
        // Ngăn sao chép
        document.addEventListener('copy', function (e) {
            e.preventDefault();
        });

        // Ngăn nhấp chuột phải
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });

        // Ngăn phím tắt
        document.addEventListener('keydown', function (e) {
            // Chặn F12
            if (e.key === 'F12') {
                e.preventDefault();
            }
            // Chặn Ctrl+Shift+I (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
            }
            // Chặn Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
            }
            // Chặn Ctrl+U (Xem mã nguồn)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
            }
            // Ngăn Ctrl+C (sao chép)
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
            }
            // Ngăn Ctrl+X (cắt)
            if (e.ctrlKey && e.key === 'x') {
                e.preventDefault();
            }
            
            // Ngăn Ctrl+P (in trang)
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
            }
            // Ngăn PrintScreen (chụp màn hình)
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                overlay.style.display = 'flex'; // Hiển thị lớp phủ khi chụp màn hình
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 1000);
            }
        });

        // Ngăn kéo thả
        document.addEventListener('dragstart', function (e) {
            e.preventDefault();
        });
    }

    // Gắn sự kiện ban đầu
    reattachEventListeners();

    // Kiểm tra liên tục
    setInterval(checkDevToolsAndState, 500);

    // Phát hiện thay đổi focus và resize
    window.addEventListener('focus', checkDevToolsAndState);
    window.addEventListener('blur', checkDevToolsAndState);
    window.addEventListener('resize', checkDevToolsAndState);

    // Ngăn in trang
    window.onbeforeprint = function () {
        alert('In trang không được phép!');
        return false;
    };
});