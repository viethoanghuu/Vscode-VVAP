# VVAP – Gaming Laptop Review Aggregator

Ứng dụng full‑stack demo để gom đánh giá (reviews) từ nhiều nguồn cho laptop gaming và hiển thị biểu đồ/tổng hợp. Stack: React + Vite (frontend), Express + MySQL (backend), kèm một mock scraper nhỏ.

## Mục lục
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Chạy nhanh với Docker](#chạy-nhanh-với-docker)
- [Chạy thủ công khi dev](#chạy-thủ-công-khi-dev)
- [API backend](#api-backend)
- [Model dữ liệu](#model-dữ-liệu)
- [Cách dùng frontend](#cách-dùng-frontend)
- [Tuỳ chỉnh/ghi chú](#tuỳ-chỉnhghi-chú)

## Cấu trúc thư mục
```
backend/   # Express API + MySQL access
frontend/  # React + Vite SPA
scraper/   # Mock scraper (server trả JSON reviews giả)
docker-compose.yml  # Khởi chạy db + api + frontend bằng Docker
```

## Chạy nhanh với Docker
Yêu cầu: Docker + Docker Compose.

```bash
docker-compose up --build
```

- API: http://localhost:4000
- Frontend: http://localhost:5173
- MySQL: host localhost:3306, user `root`, password `example`, db `reviews_db`
- Lần đầu MySQL sẽ seed schema từ `backend/db/init.sql`.

## Chạy thủ công khi dev
### 1) MySQL local
- Tạo DB theo script: `mysql -uroot -p < backend/db/init.sql`
- Hoặc tự tạo rồi cập nhật biến môi trường cho backend.

### 2) Backend (Express)
```bash
cd backend
npm install
# tạo file .env nếu cần (xem biến bên dưới)
npm run dev            # hoặc npm start cho production mode
```

Biến môi trường chính:
- `PORT` (default 4000)
- `DB_HOST` (default 127.0.0.1)
- `DB_PORT` (default 3306)
- `DB_USER` / `DB_PASSWORD`
- `DB_NAME` (default reviews_db)
- `FRONTEND_ORIGIN` cho CORS, ví dụ `http://localhost:5173`

### 3) Frontend (React + Vite)
```bash
cd frontend
npm install
# cấu hình endpoint backend
echo "VITE_API_URL=http://localhost:4000" > .env.local
npm run dev   # mở http://localhost:5173
```

### 4) Mock scraper (tuỳ chọn)
Server giả lập dữ liệu review (không bắt buộc, backend hiện trả mock cứng).
```bash
cd scraper
npm install
npm start   # chạy ở :5050, endpoint GET /scrape/all/:productId
```

## API backend
Base URL: `http://localhost:4000`

- `GET /health`  
  Kiểm tra sống.

- `POST /api/products/:id/fetch`  
  Gọi hàm mock để lấy reviews mới, lưu vào DB. Trả `{ added, skipped, total }`.

- `GET /api/products/:id/reviews`  
  Lấy tối đa 500 reviews đã lưu của sản phẩm.

- `GET /api/products/:id/aggregate`  
  Trả thống kê tổng hợp:
  ```json
  {
    "overall": { "average_rating": 4.3, "total_reviews": 12, "min_rating": 3, "max_rating": 5 },
    "by_source": [ { "source": "Amazon", "average_rating": 4.5, "review_count": 6 }, ... ],
    "rating_histogram": { "5": 4, "4": 5, "3": 2, "2": 1, "1": 0 }
  }
  ```

## Model dữ liệu
Bảng `reviews` (xem `backend/db/init.sql`):
- PK tổng hợp: `(product_id, source, review_id)`
- Trường chính: `product_id`, `source`, `review_id`, `author`, `rating` (TINYINT), `title`, `body`, `created_at`, `fetched_at`

## Cách dùng frontend
- Chọn laptop trong dropdown, bấm **Fetch Reviews**.  
- Dashboard hiển thị:
  - Cards: tổng số review, điểm trung bình, số nguồn.
  - Biểu đồ cột histogram điểm 1–5.
  - Pie chart tỉ trọng theo nguồn + danh sách kèm số lượng/điểm trung bình.
  - Bảng review, có filter theo nguồn (All/None/từng nguồn).
- Toast báo lỗi/thành công, overlay spinner khi đang fetch.

## Tuỳ chỉnh/Ghi chú
- Danh sách sản phẩm mẫu nằm trong `frontend/src/App.jsx` (`PRODUCTS`).
- Mock fetch hiện ở `backend/src/services/mockScraper.js`. Để tích hợp scraper thật, thay `fetchReviewsFromSources` bằng logic gọi service ngoài (ví dụ `scraper/index.js`).
- CORS: chỉnh `FRONTEND_ORIGIN` (backend) và `VITE_API_URL` (frontend) khi deploy.
