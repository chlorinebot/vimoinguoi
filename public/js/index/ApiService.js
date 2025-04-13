// ApiService.js - Cung cấp các hàm để lấy dữ liệu từ backend hoặc giả lập
class ApiService {
    // Lấy danh sách truyện
    static async getCards() {
        try {
            // Trong thực tế, sẽ gọi API để lấy dữ liệu
            // const response = await fetch('/api/cards');
            // return await response.json();
            
            // Giả lập dữ liệu từ bảng đã hiển thị
            return [
                {
                    id: 1,
                    title: "Attack on Titan – Mùa 1",
                    author: "Isayama Hajime",
                    genre_names: "Hậu tận thế, Hành động viễn tưởng",
                    content: "Tác giả: Isayama Hajime",
                    image: "https://via.placeholder.com/300x400?text=Attack+on+Titan",
                    hashtags: "Chưa có hashtag"
                },
                {
                    id: 2,
                    title: "Naruto",
                    author: "Masashi Kishimoto",
                    genre_names: "Hành động viễn tưởng, Võ thuật",
                    content: "Tác giả: Masashi Kishimoto",
                    image: "https://via.placeholder.com/300x400?text=Naruto",
                    hashtags: "Chưa có hashtag"
                }
            ];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách truyện', error);
            return [];
        }
    }
    
    // Lấy danh sách chương của các truyện
    static async getChapters() {
        try {
            // Trong thực tế, sẽ gọi API để lấy dữ liệu
            // const response = await fetch('/api/chapters');
            // return await response.json();
            
            // Giả lập dữ liệu từ bảng đã hiển thị
            const data = {
                1: [ // card_id = 1 (Attack on Titan)
                    {
                        chapterNumber: 1,
                        chapterTitle: "Nay đã 2000 năm",
                        content: "dfsd",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/1",
                        image_count: 55,
                        commentCount: 9
                    },
                    {
                        chapterNumber: 2,
                        chapterTitle: "Ngày hôm đó",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/2", 
                        image_count: 45,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 3,
                        chapterTitle: "Đêm trước ngày giải tán",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/3",
                        image_count: 43,
                        commentCount: 1
                    },
                    {
                        chapterNumber: 4,
                        chapterTitle: "Cuộc chiến đầu tiên",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/4",
                        image_count: 50,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 5,
                        chapterTitle: "Ánh sáng lóe lên trong cơn tuyệt vọng",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/5",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 6,
                        chapterTitle: "Thế giới qua lăng kính của một cô gái nhỏ",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/6",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 7,
                        chapterTitle: "Lưỡi gươm ngăn",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/7",
                        image_count: 35,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 8,
                        chapterTitle: "Gặm thịt",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/8",
                        image_count: 36,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 9,
                        chapterTitle: "fasfbbbbcxv",
                        content: "dfasf",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/1/9",
                        image_count: 44,
                        commentCount: 0
                    }
                ],
                2: [ // card_id = 2 (Naruto)
                    {
                        chapterNumber: 1,
                        chapterTitle: "Thằm tử teo nhỏ",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/1",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 2,
                        chapterTitle: "33324",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/2",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 3,
                        chapterTitle: "3",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/3",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 4,
                        chapterTitle: "fd",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/4",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 5,
                        chapterTitle: "433",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/5",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 6,
                        chapterTitle: "dfds",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/6",
                        image_count: 40,
                        commentCount: 0
                    },
                    {
                        chapterNumber: 7,
                        chapterTitle: "334",
                        content: "nnnnn",
                        image_folder: "https://github.com/chlorinebot/image-comic/tree/main/2/7",
                        image_count: 40,
                        commentCount: 0
                    }
                ]
            };
            
            return data;
        } catch (error) {
            console.error('Lỗi khi lấy danh sách chương', error);
            return {};
        }
    }
    
    // Lấy thông tin 1 chương cụ thể
    static async getChapter(cardId, chapterNumber) {
        try {
            // Trong thực tế, sẽ gọi API để lấy dữ liệu
            // const response = await fetch(`/api/chapters/${cardId}/${chapterNumber}`);
            // return await response.json();
            
            // Lấy từ danh sách chương
            const chapters = await this.getChapters();
            if (chapters[cardId]) {
                const chapter = chapters[cardId].find(ch => ch.chapterNumber == chapterNumber);
                if (chapter) {
                    return chapter;
                }
            }
            
            throw new Error('Không tìm thấy chương');
        } catch (error) {
            console.error('Lỗi khi lấy thông tin chương', error);
            return null;
        }
    }
    
    // Lấy danh sách bình luận của một chương
    static async getComments(chapterId) {
        try {
            // Trong thực tế, sẽ gọi API để lấy dữ liệu
            // const response = await fetch(`/api/comments/${chapterId}`);
            // return await response.json();
            
            // Giả lập dữ liệu bình luận
            return [
                {
                    id: 1,
                    username: "user123",
                    content: "Chương này hay quá!",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                    likes: 5,
                    user_avatar: "https://via.placeholder.com/40?text=U1"
                },
                {
                    id: 2,
                    username: "manga_fan",
                    content: "Không thể đợi đến chương tiếp theo!",
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                    likes: 3,
                    user_avatar: "https://via.placeholder.com/40?text=U2"
                }
            ];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách bình luận', error);
            return [];
        }
    }
    
    // Lấy thông tin thể loại
    static async getGenres() {
        try {
            // Trong thực tế, sẽ gọi API để lấy dữ liệu
            // const response = await fetch('/api/genres');
            // return await response.json();
            
            // Giả lập dữ liệu thể loại
            return [
                { genre_id: 1, genre_name: "Hậu tận thế" },
                { genre_id: 2, genre_name: "Trinh thám" },
                { genre_id: 3, genre_name: "Hành động viễn tưởng" },
                { genre_id: 4, genre_name: "Đam mỹ" },
                { genre_id: 5, genre_name: "Ẩm thực" },
                { genre_id: 6, genre_name: "Khám phá" },
                { genre_id: 7, genre_name: "Võ thuật" }
            ];
        } catch (error) {
            console.error('Lỗi khi lấy danh sách thể loại', error);
            return [];
        }
    }
} 