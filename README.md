# 🐍 Snake Platform

> Trò chơi Rắn Săn Mồi hiện đại được xây dựng bằng **React + Vite**, với giao diện Neon Cyberpunk cùng nhiều chế độ chơi độc đáo.

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng](#-tính-năng)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Hướng Dẫn Chơi](#-hướng-dẫn-chơi)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)

---

## 🎮 Giới Thiệu

**Snake Platform** là một trò chơi Rắn Săn Mồi được tái hiện với phong cách **Cyberpunk / Neon** hiện đại. Người chơi điều khiển con rắn ăn thức ăn để tăng điểm số, đồng thời tránh va chạm vào tường và thân rắn.

Điểm nổi bật:
- Hệ thống **đăng nhập / đăng ký** tài khoản người chơi
- **3 chế độ chơi** với độ khó khác nhau
- **Bảng xếp hạng** lưu điểm cao nhất theo từng chế độ
- Hiệu ứng hình ảnh **neon glow**, rung màn hình và âm thanh sống động

---

## ✨ Tính Năng

| Tính năng | Mô tả |
|---|---|
| 🔐 Xác thực người dùng | Đăng ký và đăng nhập tài khoản, lưu cục bộ |
| 🎯 3 Chế độ chơi | Classic, Speed, Survival |
| 🏆 Bảng xếp hạng | Top 10 người chơi tốt nhất theo từng chế độ |
| 💥 Hiệu ứng rung màn hình | Screen shake khi ăn mồi hoặc thua cuộc |
| 🎵 Âm thanh | Âm thanh ăn mồi và game over |
| 📱 Điều khiển cảm ứng | Nút bấm hướng cho thiết bị di động |
| 💾 Lưu điểm cao | Tự động lưu điểm cao nhất vào `localStorage` |

---

## 💻 Yêu Cầu Hệ Thống

Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã có:

| Công cụ | Phiên bản tối thiểu | Kiểm tra |
|---|---|---|
| **Node.js** | `>= 18.0.0` | `node --version` |
| **npm** | `>= 9.0.0` | `npm --version` |
| Trình duyệt web | Chrome / Firefox / Edge (mới nhất) | — |

> **Tải Node.js tại:** https://nodejs.org/en/download

---

## 🚀 Hướng Dẫn Cài Đặt

### Bước 1 — Clone hoặc tải dự án về máy

Nếu dự án nằm trong thư mục local, hãy mở Terminal / PowerShell và di chuyển vào thư mục dự án:

```bash
cd đường/dẫn/tới/snake-game
```

Hoặc nếu dùng Git:

```bash
git clone <đường-dẫn-repository>
cd snake-game
```

---

### Bước 2 — Cài đặt các thư viện phụ thuộc

Chạy lệnh sau để cài đặt toàn bộ package cần thiết:

```bash
npm install
```

> Quá trình này sẽ tải xuống các thư viện như React, Vite, Tailwind CSS, Framer Motion,... vào thư mục `node_modules/`.

---

### Bước 3 — Khởi chạy ứng dụng (môi trường Development)

```bash
npm run dev
```

Sau khi chạy thành công, terminal sẽ hiển thị địa chỉ truy cập, thường là:

```
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Mở trình duyệt và truy cập vào địa chỉ **`http://localhost:5173`** để bắt đầu chơi.

---

### Bước 4 — (Tùy chọn) Build cho Production

Nếu muốn đóng gói ứng dụng để triển khai lên web server:

```bash
npm run build
```

File đầu ra sẽ nằm trong thư mục `dist/`. Để xem trước bản build:

```bash
npm run preview
```

---

### ❗ Xử Lý Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| `node: command not found` | Chưa cài Node.js | Tải và cài Node.js từ nodejs.org |
| `npm install` thất bại | Lỗi mạng hoặc quyền truy cập | Chạy lại với `npm install --legacy-peer-deps` |
| Cổng 5173 bị chiếm | Ứng dụng khác đang dùng cổng này | Thêm `--port 3000` vào lệnh dev |
| Màn hình trắng khi mở | Cache trình duyệt | Xóa cache hoặc thử Ctrl+Shift+R |

---

## 🕹️ Hướng Dẫn Chơi

### 1. Đăng Nhập / Đăng Ký

Khi khởi động, màn hình đăng nhập sẽ xuất hiện:

- **Đăng ký:** Nhập tên người dùng và mật khẩu muốn tạo → nhấn **REGISTER**
- **Đăng nhập:** Nhập tên và mật khẩu đã đăng ký → nhấn **LOGIN**

> 💡 Tài khoản được lưu trong `localStorage` của trình duyệt, không cần server backend.

---

### 2. Menu Chính

Sau khi đăng nhập, bạn sẽ thấy màn hình **SNAKE PLATFORM** với 3 nút:

| Nút | Chức năng |
|---|---|
| 🟢 **START GAME** | Chọn chế độ chơi và bắt đầu |
| 🔵 **LEADERBOARD** | Xem bảng xếp hạng điểm cao |
| 🟣 **SETTINGS** | Cài đặt (sắp ra mắt) |

---

### 3. Chọn Chế Độ Chơi

Nhấn **START GAME** để đến màn hình chọn chế độ:

#### 🟢 CLASSIC — Chế Độ Cổ Điển
- Tốc độ cố định, không thay đổi
- **Va chạm tường = thua cuộc**
- Phù hợp cho người mới bắt đầu

#### 🔴 SPEED — Chế Độ Tốc Độ
- Bắt đầu với tốc độ thường, **mỗi lần ăn mồi tốc độ tăng thêm**
- Va chạm tường = thua cuộc
- Thử thách dành cho người chơi có kinh nghiệm

#### 🔵 SURVIVAL — Chế Độ Sinh Tồn
- **Không có tường!** Rắn xuyên qua biên màn hình và xuất hiện bên đối diện
- Va chạm thân rắn vẫn = thua cuộc
- Tốc độ cố định, không gian di chuyển rộng hơn

---

### 4. Điều Khiển Trong Game

| Hành động | Bàn phím | Di động |
|---|---|---|
| Di chuyển lên | `↑` hoặc `W` | Nút ↑ trên màn hình |
| Di chuyển xuống | `↓` hoặc `S` | Nút ↓ trên màn hình |
| Di chuyển trái | `←` hoặc `A` | Nút ← trên màn hình |
| Di chuyển phải | `→` hoặc `D` | Nút → trên màn hình |
| Chơi lại (khi thua) | `Space` | Nút **TRY AGAIN** |

> ⚠️ **Lưu ý:** Rắn không thể quay đầu 180° trực tiếp (ví dụ: đang đi phải không thể rẽ ngay sang trái).

---

### 5. Hệ Thống Điểm

- Mỗi lần ăn một mồi → **+10 điểm**
- Điểm được hiển thị ở góc trên của màn hình chơi
- Khi thua, điểm cao nhất sẽ tự động được lưu vào tài khoản

---

### 6. Màn Hình Game Over

Khi rắn va chạm (tường hoặc thân), màn hình **GAME OVER** xuất hiện:

- Điểm số của ván vừa chơi được hiển thị
- Nhấn **TRY AGAIN** hoặc phím `Space` để chơi lại
- Nhấn nút **←** góc trái trên để quay về Menu

---

### 7. Bảng Xếp Hạng

Tại **LEADERBOARD**, bạn có thể:
- Xem **Top 10** người chơi có điểm cao nhất
- Lọc theo từng chế độ: Classic / Speed / Survival
- Điểm được cập nhật tự động sau mỗi ván chơi

---

## 📁 Cấu Trúc Dự Án

```
snake-game/
├── public/                  # Tài nguyên tĩnh
├── src/
│   ├── components/
│   │   ├── Auth.jsx         # Màn hình đăng nhập / đăng ký
│   │   ├── Game.jsx         # Engine game chính (Canvas)
│   │   └── Leaderboard.jsx  # Bảng xếp hạng
│   ├── utils/
│   │   ├── audio.js         # Xử lý âm thanh (ăn mồi, game over)
│   │   └── storage.js       # Lưu/đọc dữ liệu localStorage
│   ├── App.jsx              # Component gốc, điều hướng màn hình
│   ├── index.css            # Global styles, design system
│   └── main.jsx             # Entry point
├── index.html               # HTML gốc
├── package.json             # Danh sách thư viện
├── tailwind.config.js       # Cấu hình Tailwind CSS
├── vite.config.js           # Cấu hình Vite bundler
└── README.md                # Tài liệu này
```

---

## 🛠️ Công Nghệ Sử Dụng

| Công nghệ | Mô tả |
|---|---|
| **React 19** | Thư viện UI, quản lý state và vòng đời |
| **Vite 8** | Build tool siêu nhanh, HMR (Hot Module Replacement) |
| **Tailwind CSS 4** | Utility-first CSS framework |
| **Framer Motion** | Thư viện animation mượt mà |
| **Lucide React** | Bộ icon SVG hiện đại |
| **HTML5 Canvas** | Vẽ và render game engine |
| **localStorage** | Lưu trữ tài khoản và điểm số cục bộ |

---

## 🎨 Giao Diện

Ứng dụng sử dụng phong cách **Cyberpunk / Neon Dark**:
- Nền tối (`#0b0c10`)
- Màu chủ đạo: **Neon Green** `#39ff14`, **Neon Cyan** `#00f3ff`, **Neon Pink** `#ff00ff`
- Font chữ: **Press Start 2P** (tiêu đề), **Fira Code** (nội dung)
- Hiệu ứng glow, blur, glassmorphism

---

<div align="center">

**Chúc bạn chơi vui vẻ! 🐍✨**

</div>
