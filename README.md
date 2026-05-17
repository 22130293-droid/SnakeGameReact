# 🐸 Apple Worm Snake (Rắn Săn Táo)

> Trò chơi Rắn Săn Mồi được thiết kế lại với phong cách siêu cấp đáng yêu dựa trên chú ếch **Pepe** và tựa game **Apple Worm**. Chơi một mình để leo top bảng xếp hạng hoặc đối đầu trực tiếp cùng bạn bè với chế độ **1VS1 Online** theo thời gian thực!

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Các Chế Độ Chơi](#-các-chế-độ-chơi)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Cơ Chế & Hướng Dẫn Chơi](#-cơ-chế--hướng-dẫn-chơi)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)

---

## 🎮 Giới Thiệu

Đây không phải là một trò chơi Rắn Săn Mồi bình thường. Dự án này khoác lên mình lớp áo đồ họa phẳng (Flat Design) tươi sáng, với nhân vật chú rắn có **cặp mắt lồi khổng lồ** và **chiếc miệng siêu to** vô cùng hài hước, mang đậm phong cách hoạt hình (Apple Worm / Pepe Frog).

Bạn sẽ điều khiển chú rắn đi ăn những quả táo đỏ mọng để dài ra, thu thập điểm số và tránh những chướng ngại vật tử thần!

---

## ✨ Tính Năng Nổi Bật

- **🎨 Đồ họa "Apple Worm":** Chú rắn được thiết kế riêng biệt với cặp mắt lồi, miệng rộng, chuyển động uốn lượn mượt mà cùng hình ảnh thân rắn liền mạch hoàn hảo.
- **🏆 Bảng xếp hạng thông minh (Leaderboard):** Mỗi người chơi chỉ được lưu lại **một kỷ lục cao nhất duy nhất** cho mỗi chế độ chơi, đảm bảo sự công bằng và bảng vàng không bị "spam".
- **⚔️ 1VS1 Online Realtime:** Tạo phòng và gửi mã cho bạn bè để cùng quyết đấu trực tiếp! Hệ thống áp dụng công nghệ *Client-side Prediction* (Dự đoán phía máy khách) giúp loại bỏ độ trễ (lag/rubber-banding), mang lại trải nghiệm mượt mà kể cả khi mạng không ổn định. Có bảng tên (Name tag) rõ ràng để phân biệt giữa bạn và đối thủ.
- **⚙️ Tùy chỉnh:** Hỗ trợ đa ngôn ngữ (Tiếng Việt / English) và bật/tắt âm thanh trò chơi.

---

## 🕹️ Các Chế Độ Chơi

Trò chơi cung cấp 4 chế độ chơi chính để bạn không bao giờ cảm thấy nhàm chán:

1. 🟢 **CLASSIC (CỔ ĐIỂN):** Lối chơi truyền thống. Ăn táo để tăng điểm, tốc độ của rắn sẽ tăng dần theo chiều dài. Đâm vào tường hoặc tự cắn đuôi mình sẽ thua.
2. 🔵 **BORDERLESS (XUYÊN BIÊN GIỚI):** Không có rào chắn xung quanh. Khi rắn đi vào cạnh màn hình bên này, nó sẽ chui ra từ cạnh đối diện. Tuyệt vời cho những pha bẻ lái điệu nghệ!
3. 🟠 **BRICK WALL (TƯỜNG GẠCH):** Thử thách cực đại. Những bức tường gạch ngẫu nhiên sẽ xuất hiện trên bản đồ. Bạn cần một đôi tay phản xạ nhanh nhạy để né chúng.
4. ⚔️ **1 VS 1 ONLINE:** Chế độ đối kháng nhiều người. Hai người cùng điều khiển rắn trên một bản đồ chung. **Luật chơi:**
   - Bạn sẽ THUA nếu đâm vào tường, đâm vào bản thân, hoặc **đâm vào đầu/thân của đối thủ**.
   - Cùng tranh giành quả táo trên sân để dài ra. Hãy sử dụng thân mình làm vật cản để dồn đối phương vào đường cùng!

---

## 💻 Yêu Cầu Hệ Thống

Để chạy được dự án trên máy cá nhân, bạn cần có:

- **Node.js**: Phiên bản `>= 18.x`
- **npm**: Phiên bản `>= 9.x`
- **Trình duyệt**: Chrome, Firefox, Edge, Safari (Phiên bản mới nhất)

---

## 🚀 Hướng Dẫn Cài Đặt

Thực hiện lần lượt các bước sau để khởi chạy game:

### Bước 1: Mở thư mục dự án
Mở Terminal (hoặc PowerShell, Command Prompt) và điều hướng đến thư mục chứa mã nguồn:
```bash
cd duong/dan/toi/snake-game
```

### Bước 2: Cài đặt thư viện
Cài đặt toàn bộ các packages phụ thuộc của React và Firebase bằng lệnh:
```bash
npm install
```

### Bước 3: Chạy server phát triển
Sau khi cài đặt xong, khởi động Vite dev server:
```bash
npm run dev
```

### Bước 4: Trải nghiệm
Mở trình duyệt web của bạn và truy cập vào đường dẫn:
👉 **`http://localhost:5173`**

---

## ⌨️ Cơ Chế & Hướng Dẫn Chơi

- **Đăng Nhập:** Bạn cần Đăng Nhập / Đăng Ký (thông qua Email hoặc Google) để hệ thống có thể lưu điểm số lên cơ sở dữ liệu đám mây (Firebase).
- **Phím Điều Khiển:**
  - Sử dụng phím **MŨI TÊN** (`Lên`, `Xuống`, `Trái`, `Phải`).
  - Hoặc sử dụng các phím **W, A, S, D** để điều hướng.
- **Lưu Ý Đặc Biệt Chế Độ 1VS1:** 
  - Tại Menu 1VS1, bấm **Tạo Phòng Mới**. Sau đó bấm "Sao chép mã" và gửi mã phòng đó cho bạn bè.
  - Người bạn kia dán mã phòng vào ô trống và bấm **Vào Phòng**. Trận chiến sẽ lập tức bắt đầu!

---

## 📁 Cấu Trúc Dự Án

```text
snake-game/
├── public/                  
├── src/
│   ├── components/
│   │   ├── Auth.jsx            # Giao diện Đăng nhập / Đăng ký
│   │   ├── Game.jsx            # Engine chính (vẽ rắn, táo, xử lý logic)
│   │   ├── MultiplayerGame.jsx # Engine chế độ 1vs1 (Realtime Firebase)
│   │   ├── Leaderboard.jsx     # Bảng xếp hạng toàn cầu
│   │   └── TopNav.jsx          # Thanh điều hướng phía trên
│   ├── utils/
│   │   ├── translations.js     # Chứa từ điển Tiếng Việt / Tiếng Anh
│   │   └── audio.js            # Trình quản lý âm thanh (Sound Effects)
│   ├── App.jsx                 # Bộ định tuyến và Quản lý trạng thái gốc
│   ├── firebase.js             # Cấu hình kết nối Backend Firebase
│   ├── index.css               # Chứa toàn bộ CSS Tailwind & Custom Styles
│   └── main.jsx                # Điểm vào (Entry point) của React
├── package.json             
└── vite.config.js           
```

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React.js, Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Graphics & Rendering:** HTML5 Canvas API (cho chuyển động mượt mà 60FPS)
- **Backend & Database:** Firebase Authentication, Cloud Firestore (Bảng xếp hạng), Firebase Realtime Database (Đồng bộ Multiplayer 1VS1)
- **Icons:** Lucide React

---

<div align="center">
  <b>Cầm lấy phím và giành lấy kỷ lục cao nhất ngay thôi! 🥇</b>
</div>
