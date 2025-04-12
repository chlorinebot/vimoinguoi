document.addEventListener('DOMContentLoaded', function() {
  // Đảm bảo chỉ chạy một lần để tránh trùng lặp
  if (window.chapterScrollInitialized) return;
  window.chapterScrollInitialized = true;

  // Lấy phần tử accordion
  const accordion = document.getElementById('accordionExample');
  if (!accordion) {
    console.error('Không tìm thấy phần tử accordion với id "accordionExample"');
    return;
  }

  // Lấy tất cả các chương (accordion-item)
  const chapters = accordion.querySelectorAll('.accordion-item');
  const chapterCount = chapters.length;

  // Log để kiểm tra số lượng chương
  console.log(`Số lượng chương: ${chapterCount}`);

  // Nếu số chương lớn hơn 4, thêm thanh cuộn
  if (chapterCount > 4) {
    let scrollContainer = accordion.parentElement.classList.contains('chapter-scroll-container')
      ? accordion.parentElement
      : document.createElement('div');

    if (!scrollContainer.classList.contains('chapter-scroll-container')) {
      scrollContainer.className = 'chapter-scroll-container';
      accordion.parentNode.insertBefore(scrollContainer, accordion);
      scrollContainer.appendChild(accordion);
    }

    scrollContainer.style.maxHeight = '250px';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.overflowX = 'hidden';
    scrollContainer.style.width = '100%';
    scrollContainer.style.position = 'relative';

    accordion.style.maxHeight = 'none';
    accordion.style.height = 'auto';
    accordion.style.overflow = 'visible';
    accordion.style.display = 'block';

    const fullHeight = Array.from(chapters).reduce((total, chapter) => {
      return total + chapter.offsetHeight;
    }, 0);
    accordion.style.minHeight = `${fullHeight}px`;

    scrollContainer.style.display = 'none';
    void scrollContainer.offsetHeight;
    scrollContainer.style.display = 'block';
  }

  // Xử lý sự kiện cho nút "Đọc truyện"
  const readButtons = accordion.querySelectorAll('.btn[data-bs-target="#doctruyen"]');
  readButtons.forEach(button => {
    button.addEventListener('click', function() {
      const chapterTitle = this.closest('.accordion-item')
        .querySelector('.accordion-button')
        .textContent.trim();
      
      const readModal = document.getElementById('doctruyen');
      const modalTitle = readModal.querySelector('.modal-title');
      modalTitle.textContent = chapterTitle;
    });
  });
});

// Thêm CSS để tùy chỉnh thanh cuộn và đảm bảo hiển thị
const style = document.createElement('style');
style.textContent = `
  .chapter-scroll-container {
    padding-bottom: 10px;
  }
  .chapter-scroll-container::-webkit-scrollbar {
    width: 8px;
  }
  .chapter-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .chapter-scroll-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .chapter-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  .chapter-scroll-container .accordion-item {
    width: 100%;
    margin-bottom: 0;
  }
`;
document.head.appendChild(style);