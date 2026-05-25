import os

# Nội dung giao diện HTML/CSS trang A4 cho thí sinh Nguyễn Khánh Phương
html_content = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #ffffff;
            color: #333;
            line-height: 1.4;
        }
        .page-border {
            position: absolute;
            top: 10mm;
            left: 10mm;
            right: 10mm;
            bottom: 10mm;
            border: 2px solid #2c3e50;
            padding: 2px;
            box-sizing: border-box;
        }
        .inner-border {
            border: 1px solid #2c3e50;
            height: 100%;
            padding: 25px;
            box-sizing: border-box;
        }
        header {
            text-align: center;
            border-bottom: 2px solid #34495e;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20pt;
            font-weight: bold;
            color: #1a252f;
            text-transform: uppercase;
            margin: 0;
        }
        .subtitle {
            font-size: 14pt;
            color: #34495e;
            margin-top: 5px;
        }
        .info-grid {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .info-grid td {
            padding: 5px 0;
            font-size: 11pt;
        }
        .section-title {
            background-color: #f2f4f7;
            padding: 6px 12px;
            font-size: 12pt;
            font-weight: bold;
            color: #2c3e50;
            border-left: 5px solid #2980b9;
            margin: 15px 0 10px 0;
        }
        .score-box {
            width: 100%;
            text-align: center;
            margin-bottom: 15px;
        }
        .score-table {
            width: 100%;
            border-collapse: collapse;
        }
        .score-table th, .score-table td {
            border: 1px solid #bdc3c7;
            padding: 8px;
            text-align: center;
        }
        .score-table th {
            background-color: #ecf0f1;
            font-size: 10pt;
        }
        .score-val {
            font-size: 13pt;
            font-weight: bold;
        }
        .highlight-red { color: #c0392b; }
        .highlight-green { color: #27ae60; }
        .highlight-yellow { color: #d35400; }
        
        .flex-container {
            display: table;
            width: 100%;
        }
        .flex-item {
            display: table-cell;
            width: 50%;
            padding: 0 10px;
            vertical-align: top;
        }
        .list-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 10pt;
            text-decoration: underline;
        }
        ul {
            margin: 0;
            padding-left: 18px;
            font-size: 9.5pt;
        }
        li {
            margin-bottom: 4px;
        }
        .comment-box {
            background-color: #fdfefe;
            border: 1px solid #dcdde1;
            padding: 10px;
            font-size: 10pt;
            margin-bottom: 10px;
        }
        .eval-label {
            font-weight: bold;
            font-style: italic;
            display: block;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <div class="page-border">
        <div class="inner-border">
            <header>
                <h1 class="title">Báo Cáo Kết Quả Chấm Thi</h1>
                <div class="subtitle">Kì thi: Đánh Giá Năng Lực Cá Nhân</div>
            </header>

            <table class="info-grid">
                <tr>
                    <td width="50%"><strong>Thí sinh:</strong> Nguyễn Khánh Phương</td>
                    <td width="50%" align="right"><strong>Môn thi:</strong> Toán học</td>
                </tr>
            </table>

            <div class="section-title">1. Tổng quan điểm số</div>
            <p style="font-size: 10pt; margin: 0 0 10px 0;">Năng lực của Phương phát triển khá đồng đều, không bị lệch quá mức giữa hai phần thi.</p>
            <table class="score-table">
                <tr>
                    <th>Phần thi</th>
                    <th>Số câu đúng</th>
                    <th>Tỉ lệ %</th>
                    <th>Đánh giá chung</th>
                </tr>
                <tr>
                    <td>Kỹ năng tính toán</td>
                    <td class="score-val highlight-yellow">15 / 30</td>
                    <td>50%</td>
                    <td>Trung bình</td>
                </tr>
                <tr>
                    <td>Tư duy Logic</td>
                    <td class="score-val highlight-green">13 / 20</td>
                    <td>65%</td>
                    <td>Khá</td>
                </tr>
                <tr style="background-color: #fdf2e9;">
                    <td><strong>TỔNG CỘNG</strong></td>
                    <td class="score-val">28 / 50</td>
                    <td><strong>56%</strong></td>
                    <td>Trung bình Khá</td>
                </tr>
            </table>

            <div class="section-title">2. Phân tích chi tiết dạng bài</div>
            <div class="flex-container">
                <div class="flex-item" style="padding-left:0;">
                    <div class="list-title" style="color: #27ae60;">Dạng bài làm tốt (Điểm mạnh):</div>
                    <ul>
                        <li><b>Toán thực tế:</b> Xử lý xuất sắc các bài toán có lời văn (phần trăm, quãng đường, nồng độ dung dịch, chia kẹo).</li>
                        <li><b>Hình học & Tổ hợp:</b> Nắm chắc Hình phẳng, Khối không gian, Tổ hợp và Xác suất.</li>
                        <li><b>Logic phức tạp:</b> Đúng tuyệt đối 100% dạng khó nhất là Logic Ma trận nhiều chiều (Người - Áo - Nghề) và Lịch trình thời gian.</li>
                    </ul>
                </div>
                <div class="flex-item" style="padding-right:0;">
                    <div class="list-title" style="color: #c0392b;">Dạng bài bị hổng (Cần cải thiện):</div>
                    <ul>
                        <li><b>Đại số thuần túy:</b> Sai nhiều câu về hàm số, hệ phương trình mũ, biến đổi biểu thức.</li>
                        <li><b>Toán tăng/giảm kép:</b> Mất điểm chuỗi bài toán tăng/giảm phần trăm kép hoặc tính giá.</li>
                        <li><b>Logic xếp hạng:</b> Mất điểm hoàn toàn (0/4) Logic Xếp hạng dự án và sai một nửa dạng Sắp xếp tuyến tính.</li>
                    </ul>
                </div>
            </div>

            <div class="section-title">3. Nhận xét chuyên môn về kỹ năng</div>
            
            <div class="comment-box">
                <span class="eval-label">Khả năng tính toán: Khá tốt, tính ứng dụng thực tế cao</span>
                Phương có kỹ năng <b>mô hình hóa ngôn ngữ đời sống thành phép tính rất tốt</b> (điểm mà học sinh thường yếu nhất). Em nắm rõ công thức thể tích, diện tích và biết lập phương trình nồng độ. Tuy nhiên, kỹ năng biến đổi Đại số cơ học của em chưa nhạy bén hoặc có sự chủ quan/tính toán nhầm trong lúc làm các câu hàm số và lũy thừa.
            </div>

            <div class="comment-box">
                <span class="eval-label">Khả năng tư duy: Tốt, tư duy hệ thống và cẩn thận</span>
                Việc làm đúng trọn vẹn cụm Logic Ma trận và Lịch trình minh chứng Phương có <b>kỹ năng trình bày nháp, kẻ bảng và hệ thống hóa thông tin cực kỳ tốt</b>. Em không suy luận "nhẩm" mà biết sắp xếp trực quan để không sót điều kiện. Điểm yếu ở Logic Xếp hạng có thể do lúng túng khi thiết lập trục so sánh "cao hơn/thấp hơn" hoặc thiếu thời gian.
            </div>

            <div class="section-title" style="background-color: #e8f6f3; border-left-color: #16a085;">4. Lời khuyên & Định hướng</div>
            <p style="font-size: 10pt; margin: 5px 0;">
                Khánh Phương là một học sinh có <b>nền tảng tư duy rất cân bằng, kỹ năng làm bài cẩn thận</b>. Em hoàn toàn có tiềm năng để nâng điểm lên mức <b>7.0 - 8.0</b> rất nhanh nếu được ôn tập lại cách xử lý các bài toán Đại số hàm số, tăng/giảm phần trăm liên tiếp và luyện thêm mẹo làm các bài logic về chuỗi xếp hạng thứ tự.
            </p>
        </div>
    </div>
</body>
</html>
"""

# Đường dẫn lưu file HTML (lưu cùng thư mục chứa script python)
current_dir = os.path.dirname(os.path.abspath(__file__))
output_html = os.path.join(current_dir, "bao_cao_ket_qua_nguyen_khanh_phuong.html")

# Ghi nội dung ra file HTML
with open(output_html, "w", encoding="utf-8") as file:
    file.write(html_content)

print("-" * 50)
print(f"Đã tạo thành công file: {output_html}")
print("-" * 50)
print("HƯỚNG DẪN XUẤT RA PDF TRÊN WINDOWS:")
print("1. Hãy mở thư mục chứa file code này.")
print("2. Click đúp vào file 'bao_cao_ket_qua_nguyen_khanh_phuong.html' để mở bằng trình duyệt (Chrome, Edge...).")
print("3. Nhấn tổ hợp phím Ctrl + P để mở hộp thoại in.")
print("4. Ở mục 'Máy in' (Destination), chọn 'Lưu dưới dạng PDF' (Save as PDF).")
print("5. Mở phần 'Tùy chọn khác' (More settings):")
print("   - Khổ giấy (Paper size): Chọn A4")
print("   - Tỷ lệ (Scale): Mặc định hoặc Custom 100%")
print("   - Bỏ tích 'Đầu trang và chân trang' (Headers and footers)")
print("   - Tích chọn 'Đồ họa nền' (Background graphics)")
print("6. Bấm Lưu (Save).")
print("-" * 50)