# Quy Tắc Phát Triển Dự Án VocabMaster (Agent Guidelines)

## 📌 QUY TẮC BẮT BUỘC TRƯỚC KHI SỬA CODE
> **Yêu cầu quan trọng từ người dùng:**
> "Từ nay về sau nếu có chỉnh sửa gì về code hãy đưa code cũ lên github trước khi thay đổi code"

Mỗi khi nhận bất kỳ yêu cầu sửa đổi, bổ sung tính năng hoặc sửa lỗi trong tương lai:
1. **Bắt buộc chạy đồng bộ code cũ lên GitHub TRƯỚC TIÊN:**
   ```bash
   # Chạy script tự động (tự kiểm tra dirty tree, commit checkpoint và push lên GitHub):
   cmd.exe /c sync_before_edit.cmd
   # Hoặc thủ công:
   git status
   git add -A
   git commit -m "checkpoint: lưu trạng thái trước khi thực hiện thay đổi mới"
   git push origin main
   ```
2. **Chỉ sau khi code cũ đã an toàn trên GitHub, mới được bắt đầu áp dụng thay đổi mới vào các file code (`index.html`, `script.js`, `style.css`, ...).**
3. Sau khi hoàn thành tính năng/sửa lỗi mới, commit và push phiên bản mới (hoặc tag phiên bản mới nếu là milestone lớn).
