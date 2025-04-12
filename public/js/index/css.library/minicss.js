// Hàm để thêm Shadow DOM và Mini.css
function applyScopedCSS(elementId) {
    const element = document.getElementById(elementId);
    const shadow = element.attachShadow({ mode: 'open' }); // Tạo Shadow DOM

    // Lấy nội dung hiện tại của div
    const content = element.innerHTML;

    // Thêm link CSS và nội dung vào Shadow DOM
    shadow.innerHTML = `
      <link rel="stylesheet" href="https://cdn.rawgit.com/Chalarangelo/mini.css/v3.0.1/dist/mini-default.min.css">
      ${content}
    `;
  }

  // Áp dụng cho từng thẻ html mong muốn bằng cách thêm id vào thẻ VD: <div id="minicss-id-1">...</div>
  applyScopedCSS('minicss');