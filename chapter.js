// Hàm mở modal đọc truyện
function openReadModal(chapter) {
    currentChapterData = chapter;
    currentCardId = currentCardData ? currentCardData.id : currentCardId;

    const modal = document.getElementById('doctruyen');
    if (!modal) {
        console.error('Không tìm thấy modal #doctruyen trong DOM!');
        return;
    }

    // Cập nhật URL với comicId và chapterId
    const newUrl = `${window.location.origin}/?comicId=${currentCardId}&chapterId=${chapter.chapterNumber}`;
    window.history.pushState({ comicId: currentCardId, chapterId: chapter.chapterNumber }, '', newUrl);

    console.log("Modal #doctruyen tồn tại và đang chuẩn bị mở");
    
    // Xóa nút yêu thích cũ trước khi mở modal đọc truyện
    const favoriteButton = document.getElementById('favoriteComicBtn');
    if (favoriteButton) {
        console.log("Xóa nút yêu thích trước khi mở modal đọc truyện");
        favoriteButton.remove();
    }
    
    // Lưu lịch sử đọc truyện
    saveReadingHistory(currentCardId, chapter.chapterNumber);

    console.log("Modal #doctruyen tồn tại trong DOM");
} 