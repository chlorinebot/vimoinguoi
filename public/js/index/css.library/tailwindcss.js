// Hàm để thêm Shadow DOM và Tailwind
function applyScopedTailwind(elementId) {
    const element = document.getElementById(elementId);
    const shadow = element.attachShadow({ mode: 'open' }); // Tạo Shadow DOM

    // Lấy nội dung hiện tại của div
    const content = element.innerHTML;

    // Thêm script Tailwind và nội dung vào Shadow DOM
    shadow.innerHTML = `
      <script src="https://cdn.tailwindcss.com"></script>
      ${content}
    `;

    // Đợi script tải xong để đảm bảo Tailwind hoạt động
    const script = shadow.querySelector('script');
    script.onload = () => {
      // Tailwind đã sẵn sàng, có thể thêm cấu hình nếu cần
      console.log('Tailwind loaded in Shadow DOM');
    };
  }

  // Áp dụng cho div
  applyScopedTailwind('tailwindcss');