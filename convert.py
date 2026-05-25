import os

# Nội dung giao diện HTML/CSS đã được fix cứng khung A4 mô phỏng PDF
html_content = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <style>
        /* Thiết lập mô phỏng trang giấy A4 trên màn hình trình duyệt */
        body {
            margin: 0;
            padding: 30px 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #525659; /* Màu nền xám giống phần mềm đọc PDF */
            color: #333;
            line-height: 1.4;
            display: flex;
            justify-content: center;
        }

        /* Khung giấy A4 chuẩn */
        .a4-paper {
            width: 210mm;
            min-height: 297mm;
            background-color: #ffffff;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            padding: 10mm; /* Lề ngoài của giấy */
            box-sizing: border-box;
        }

        /* Viền kép trang trí */
        .outer-border {
            border: 2px solid #2c3e50;
            padding: 2px;
            height: 100%;
            box-sizing: border-box;
        }

        .inner-border {
            border: 1px solid #2c3e50;
            /* Đảm bảo khung luôn giãn hết tờ giấy trừ đi lề */
            min-height: calc(297mm - 20mm - 8px); 
            padding: 25px 25px 40px 25px; /* Lề trong, chừa 40px ở đáy cho thoáng */
            box-sizing: border-box;
        }

        /* Phần nội dung bên trong */
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
        .score-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
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
        li { margin-bottom: 4px; }
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

        /* Khi bấm Ctrl+P (Lệnh in), ẩn màu xám đi và in đúng khổ A4 */
        @media print {
            @page { size: A4; margin: 0; }
            body { 
                background: white; 
                padding: 0; 
                display: block; 
            }
            .a4-paper { 
                width: 100%; 
                min-height: 100vh; 
                box-shadow: none; 
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="a4-paper">
        <div class="outer-border">
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
                <p style="font-size: 10pt; margin: 5px 0 0 0;">
                    Khánh Phương là một học sinh có <b>nền tảng tư duy rất cân bằng, kỹ năng làm bài cẩn thận</b>. Em hoàn toàn có tiềm năng để nâng điểm lên mức <b>7.0 - 8.0</b> rất nhanh nếu được ôn tập lại cách xử lý các bài toán Đại số hàm số, tăng/giảm phần trăm liên tiếp và luyện thêm mẹo làm các bài logic về chuỗi xếp hạng thứ tự.
                </p>
            </div>
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

print("Đã update định dạng fix cứng khung A4!")
print(f"File mới: {output_html}")