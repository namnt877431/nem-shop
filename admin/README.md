# Trang quản trị NEM shop

Mở bằng `admin.html` ở gốc repo. Vẫn là trang tĩnh, không cần build, không
nạp thư viện ngoài nào ngoài Google Fonts — Supabase được gọi thẳng bằng
`fetch` như một API HTTP bình thường.

| File | Việc |
|---|---|
| `../admin.html` | Vỏ trang và toàn bộ CSS |
| `ui.js` | Dựng phần tử, định dạng tiền và ngày, ngăn kéo, biểu mẫu, bảng |
| `db.js` | Nói chuyện với Supabase, hoặc với localStorage khi chưa nối |
| `content.js` | Nội dung trang giới thiệu và bộ dựng lại `index.html` |
| `app.js` | Bảy màn hình |
| `schema.sql` | Bảng, khoá cửa RLS, và hai chiếc máy có sẵn |

## Chạy thử ngay, chưa cần Supabase

```bash
python -m http.server 8000
```

Mở <http://localhost:8000/admin.html>. Chưa khai báo gì thì trang chạy ở
**chế độ máy này**: dữ liệu nằm trong localStorage của trình duyệt đang mở.
Đủ để xem thử và nhập liệu tạm; khi nào lập dự án Supabase thì vào
Cài đặt ▸ Xuất bản sao lưu rồi nhập lại lên.

> Cần máy chủ cục bộ, đừng nhấp đúp mở bằng `file://`. Nút **Xuất index.html**
> phải đọc được file `index.html` qua HTTP, mở kiểu `file://` sẽ bị trình
> duyệt chặn.

## Nối với Supabase

1. Lập dự án tại <https://supabase.com> (gói miễn phí là đủ).
2. **SQL Editor ▸ New query**, dán toàn bộ `admin/schema.sql`, bấm **Run**.
3. **Authentication ▸ Users ▸ Add user**: tạo một tài khoản email + mật khẩu
   cho chính bạn. Đây là tài khoản đăng nhập trang quản trị.
4. **Project Settings ▸ Data API**: chép **Project URL** và khoá
   **anon public**.
5. Mở `admin.html` ▸ Cài đặt ▸ Nối Supabase, dán hai thứ đó vào, đăng nhập.

Muốn khỏi phải dán lại trên từng máy thì tạo `admin/config.js`:

```js
window.NEM_SUPABASE = {
  url: 'https://xxxxxxxx.supabase.co',
  key: 'eyJhbGciOi…'   // khoá anon
};
```

rồi thêm `<script src="admin/config.js"></script>` vào `admin.html`, ngay
trước `admin/db.js`.

### Khoá anon nằm trên repo công khai có sao không

Không. Khoá anon vốn được thiết kế để lộ ra trình duyệt. Thứ canh cửa là
Row Level Security trong `schema.sql`: mọi thao tác ghi, và toàn bộ bảng
khách hàng lẫn đơn thuê, đều đòi tài khoản đã đăng nhập. Người lạ mở
`admin.html` chỉ thấy màn đăng nhập.

Thứ **không** được đưa lên repo là khoá `service_role`. Trang quản trị này
không dùng tới nó.

## Bảy màn hình

| Màn | Việc |
|---|---|
| Bảng điều khiển | Máy đang ở ngoài, đơn quá hạn, đơn sắp giao và sắp trả, cọc đang giữ, doanh thu sáu tháng |
| Đơn thuê | Lập và sửa đơn. Tự tính tiền theo số ngày và mốc giảm giá, chặn trùng lịch máy |
| Lịch máy | Lưới tháng: mỗi hàng một chiếc máy, ô tô màu là ngày đã có người giữ. Bấm vào ô để mở đơn |
| Khách | Danh bạ, người bảo lãnh, số lần thuê và tổng đã trả của từng người |
| Kho máy | Thêm, sửa, tắt máy. Giá và thông số ở đây chính là thứ hiện trên trang giới thiệu |
| Nội dung trang | Mọi câu chữ của `index.html`, kể cả các chỗ còn `TODO` |
| Cài đặt | Kết nối, đăng xuất, xuất/nhập bản sao lưu |

## Sửa nội dung trang giới thiệu

Trang giới thiệu vẫn là trang tĩnh thuần: người xem mở là thấy ngay, không
chờ mạng, không nhấp nháy. Nên nội dung không được bơm vào lúc chạy mà đi
đường vòng qua một lần xuất file:

```
sửa trong Nội dung trang → Lưu → Xuất index.html
   → thay file cũ ở gốc repo → git commit → GitHub Pages phục vụ như cũ
```

Bộ xuất đọc chính file `index.html` đang có rồi thay chữ trong đó, chứ
không giữ một bản sao thứ hai của khuôn trang. Sửa bố cục `index.html`
không làm trang quản trị lệch theo.

Vài quy ước khi gõ:

- **Xuống dòng** trong ô tiêu đề thành một lần ngắt hàng trên trang.
- `**bọc hai dấu sao**` làm chữ đó đổi màu: magenta ở tiêu đề lớn, hổ phách
  ở mục minh bạch.
- Tên máy trên thẻ kho máy tự xuống dòng sau từ đầu tiên: "Canon EOS R50"
  hiện thành *Canon* / *EOS R50*.

Sau khi xuất, `git diff index.html` để xem đúng những gì mình vừa đổi.

### Mốc trong mã nguồn

`index.html` có hai mốc:

```js
/* nem:calc:start */
/* nem:calc:end */
```

Các nấc số ngày trên vòng xoay và bảng mốc giảm giá nằm giữa hai mốc đó, và
bị ghi đè mỗi lần xuất file. Đừng thêm mã nào khác vào khoảng giữa.

## Trạng thái một đơn đi qua

`Giữ chỗ` → `Đang thuê` → `Đã trả`, và `Huỷ` khi khách không lấy nữa.

- Chỉ **Giữ chỗ** và **Đang thuê** mới chiếm chỗ chiếc máy. Lập đơn trùng
  ngày với một trong hai trạng thái đó sẽ bị chặn ngay lúc lưu.
- Doanh thu chỉ tính đơn đã ở trạng thái **Đã trả**, theo tháng của ngày trả.
- Ô **Cọc đang giữ** cộng tiền cọc của các đơn còn hiệu lực mà chưa tích
  "đã trả cọc lại cho khách".

## Sao lưu

Cài đặt ▸ Xuất bản sao lưu cho ra một file JSON gồm kho máy, khách, đơn
thuê và nội dung trang. Nhập ngược lại sẽ ghi đè các bản ghi trùng mã và
giữ nguyên liên kết giữa đơn với khách và máy.

Đây cũng là đường chuyển dữ liệu từ chế độ máy này lên Supabase: xuất ở chế
độ cũ, nối Supabase, rồi nhập vào.
