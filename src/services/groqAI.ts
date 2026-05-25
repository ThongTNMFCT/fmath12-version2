import axios from 'axios';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Cập nhật lên Model mạnh nhất và ổn định nhất của Groq hiện nay
const MODEL_NAME = 'llama-3.3-70b-versatile'; 

export const askGroqAI = async (systemPrompt: string, userMessage: string, isJsonMode = false) => {
  try {
    // Tạo payload chuẩn
    const payload: any = {
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.2, // Nhiệt độ thấp để AI trả lời nhất quán, chính xác 
    };

    // QUAN TRỌNG: Chỉ đính kèm trường response_format khi cần JSON. 
    // Nếu để là { type: "text" } API sẽ báo lỗi 400 Bad Request ngay lập tức.
    if (isJsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    // In chi tiết lỗi ra Console để dễ debug nếu có vấn đề khác
    console.error("Lỗi chi tiết từ Groq AI:", error.response?.data || error.message);
    throw new Error("Hệ thống AI đang phản hồi chậm, vui lòng thử lại sau vài giây.");
  }
};