# Quy Tắc Phát Triển Dự Án VocabMaster (Agent Guidelines)

## 📌 QUY TẮC BẮT BUỘC TRƯỚC KHI SỬA CODE
> **Yêu cầu quan trọng từ người dùng:**
> "Từ nay về sau nếu có chỉnh sửa gì về code hãy đưa code cũ lên github trước khi thay đổi code"

Mỗi khi nhận yêu cầu sửa đổi, bổ sung tính năng hoặc sửa lỗi trong tương lai:
1. **Kiểm tra trạng thái git hiện tại:**
   ```bash
   git status
   ```
2. **Nếu có thay đổi chưa commit hoặc chưa push lên remote GitHub:**
   - Commit toàn bộ code phiên bản hiện tại trước:
     ```bash
     git add -A
     git commit -m "<mô tả trạng thái code trước khi thay đổi>"
     ```
   - Push lên nhánh `main` trên GitHub:
     ```bash
     git push origin main
     ```
3. **Chỉ sau khi code cũ đã an toàn trên GitHub, mới được bắt đầu áp dụng thay đổi mới vào các file code (`index.html`, `script.js`, `style.css`, ...).**
4. Sau khi hoàn thành tính năng/sửa lỗi mới, commit và push phiên bản mới (hoặc tag phiên bản mới nếu là milestone lớn).
