document.addEventListener('DOMContentLoaded', function () {
    // Lưu trữ nội dung ban đầu của trang
    const originalContent = document.body.innerHTML;

    // Chặn các phím tắt phổ biến để mở DevTools
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
    });

    // Phát hiện khi DevTools được mở và khôi phục khi đóng
    function checkDevTools() {
        const threshold = 160; // Ngưỡng chênh lệch kích thước
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            // DevTools đang mở
            if (document.body.innerHTML !== '<h1 style="color: red; text-align: center;">Vui lòng đóng DevTools để tiếp tục sử dụng trang web!</h1>') {
                document.body.innerHTML = '<h1 style="color: red; text-align: center;">Vui lòng đóng DevTools để tiếp tục sử dụng trang web!</h1>';
            }
        } else {
            // DevTools đã đóng, khôi phục nội dung ban đầu
            if (document.body.innerHTML === '<h1 style="color: red; text-align: center;">Vui lòng đóng DevTools để tiếp tục sử dụng trang web!</h1>') {
                document.body.innerHTML = originalContent;
                // Gắn lại các sự kiện nếu cần (vì nội dung được khôi phục)
                reattachEventListeners();
            }
        }
    }

    // Hàm gắn lại các sự kiện (nếu cần)
    function reattachEventListeners() {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || (e.ctrlKey && e.key === 'u')) {
                e.preventDefault();
            }
        });
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
    }

    // Kiểm tra liên tục xem DevTools có mở không
    setInterval(checkDevTools, 1000);

    // Ngăn nhấp chuột phải
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
});

// Vô hiệu hóa phím tắt bằng cách ghi đè
document.onkeydown = function (e) {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || (e.ctrlKey && e.key === 'u')) {
        return false;
    }
};