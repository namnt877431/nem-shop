# NEM shop — website cho thuê máy ảnh

Trang giới thiệu dịch vụ cho thuê Canon EOS R50 và R8. Trang tĩnh, không cần build,
không phụ thuộc thư viện ngoài ngoài Google Fonts.

## Nội dung

| File | Mô tả |
|---|---|
| `index.html` | Bản chính. Hero dựng như khung ngắm máy ảnh: lưới chia ba, điểm bắt nét bám con trỏ, dải thông số đáy khung. Có mục tính thử tiền thuê bằng vòng xoay. |
| `index2.html` | Bản thay thế, hướng "sổ tay hướng dẫn": nền be, sơ đồ kỹ thuật tự vẽ, bảng thông số và bảng giá. |
| `admin.html` · `admin/` | Trang quản trị: đơn thuê, lịch máy, khách, kho máy, và bộ sửa nội dung trang. Xem [admin/README.md](admin/README.md). |
| `nem-r50.webp` · `nem-r50.png` | Ảnh máy đã tách nền, cắt sát và tối ưu cho web. |

## Chạy thử

Mở thẳng `index.html` bằng trình duyệt là đủ. Nếu muốn chạy qua máy chủ cục bộ:

```bash
python -m http.server 8000
```

Rồi mở http://localhost:8000

## Còn phải điền

Các chỗ cần thay đã đánh dấu `TODO` trong mã nguồn:

- Số điện thoại liên hệ (hiện là `+84000000000`)
- Đơn giá thật ở `data-rate` của nút chọn máy và ở bảng giá
- Khu vực giao nhận và giờ làm việc
- Liên kết Facebook / Instagram

Sửa tay trong `index.html` cũng được, mà mở <http://localhost:8000/admin.html>
▸ **Nội dung trang** rồi bấm **Xuất index.html** cũng được — trang quản trị
liệt kê sẵn đúng bốn chỗ này và tự dọn các ghi chú `TODO` sau khi điền.

## Ghi chú

Mức giá đang dùng lấy theo mặt bằng thị trường Hà Nội tháng 8/2026 để tham chiếu,
chưa phải giá chính thức của shop.
