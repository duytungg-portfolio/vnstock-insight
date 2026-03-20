import type { SectorMetric, PricePoint } from "@/types/stock";
import type { MeetingAnalysis } from "@/types/meeting";

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sector-specific metric guidance
// ---------------------------------------------------------------------------

const SECTOR_METRICS: Record<string, string> = {
  banking: `Tập trung vào các chỉ số:
- Lãi suất điều hành SBV (tái cấp vốn, OMO)
- Tăng trưởng tín dụng toàn hệ thống (room tín dụng)
- Tỷ lệ nợ xấu (NPL) toàn hệ thống
- Tỷ giá USD/VND và áp lực tỷ giá
- Lợi suất trái phiếu chính phủ kỳ hạn 10 năm
- CDS spread Việt Nam
- CASA ratio ngành`,

  "bất động sản": `Tập trung vào các chỉ số:
- Room tín dụng cho bất động sản (tỷ lệ trên tổng tín dụng)
- Giá đất đấu giá gần đây (Hà Nội, TP.HCM)
- Số dự án được phê duyệt / cấp phép xây dựng
- PMI ngành xây dựng Việt Nam
- Lãi suất cho vay mua nhà trung bình
- Giá vật liệu xây dựng (thép, xi măng)
- Tồn kho bất động sản toàn thị trường`,

  "real estate": `Tập trung vào các chỉ số:
- Room tín dụng cho bất động sản (tỷ lệ trên tổng tín dụng)
- Giá đất đấu giá gần đây (Hà Nội, TP.HCM)
- Số dự án được phê duyệt / cấp phép xây dựng
- PMI ngành xây dựng Việt Nam
- Lãi suất cho vay mua nhà trung bình
- Giá vật liệu xây dựng (thép, xi măng)
- Tồn kho bất động sản toàn thị trường`,

  "dầu khí": `Tập trung vào các chỉ số:
- Giá dầu Brent và WTI hiện tại
- Sản lượng OPEC+ và quyết định cắt giảm
- Sản lượng khai thác PVN (PetroVietnam)
- Giá khí tự nhiên (Henry Hub, LNG Asia)
- Chi phí khai thác bình quân giếng Việt Nam
- Biên lợi nhuận lọc dầu (crack spread)
- Trữ lượng dầu khí đã chứng minh`,

  "oil & gas": `Tập trung vào các chỉ số:
- Giá dầu Brent và WTI hiện tại
- Sản lượng OPEC+ và quyết định cắt giảm
- Sản lượng khai thác PVN (PetroVietnam)
- Giá khí tự nhiên (Henry Hub, LNG Asia)
- Chi phí khai thác bình quân giếng Việt Nam
- Biên lợi nhuận lọc dầu (crack spread)
- Trữ lượng dầu khí đã chứng minh`,

  "thép": `Tập trung vào các chỉ số:
- Giá HRC (thép cuộn cán nóng) thế giới và nội địa
- Thuế chống bán phá giá thép nhập khẩu
- Chỉ số nhu cầu xây dựng (construction demand index)
- Giá quặng sắt (Iron Ore 62% Fe)
- Công suất sử dụng ngành thép Việt Nam
- Giá than cốc (coking coal)
- Xuất khẩu thép Việt Nam`,

  steel: `Tập trung vào các chỉ số:
- Giá HRC (thép cuộn cán nóng) thế giới và nội địa
- Thuế chống bán phá giá thép nhập khẩu
- Chỉ số nhu cầu xây dựng (construction demand index)
- Giá quặng sắt (Iron Ore 62% Fe)
- Công suất sử dụng ngành thép Việt Nam
- Giá than cốc (coking coal)
- Xuất khẩu thép Việt Nam`,

  "bán lẻ": `Tập trung vào các chỉ số:
- CPI (chỉ số giá tiêu dùng) tháng gần nhất
- Doanh thu bán lẻ hàng hóa và dịch vụ tháng gần nhất
- Tỷ lệ thất nghiệp
- Chỉ số niềm tin người tiêu dùng Việt Nam
- Tăng trưởng thu nhập bình quân đầu người
- Tỷ lệ thương mại điện tử / tổng bán lẻ
- Chỉ số PMI sản xuất Việt Nam`,

  retail: `Tập trung vào các chỉ số:
- CPI (chỉ số giá tiêu dùng) tháng gần nhất
- Doanh thu bán lẻ hàng hóa và dịch vụ tháng gần nhất
- Tỷ lệ thất nghiệp
- Chỉ số niềm tin người tiêu dùng Việt Nam
- Tăng trưởng thu nhập bình quân đầu người
- Tỷ lệ thương mại điện tử / tổng bán lẻ
- Chỉ số PMI sản xuất Việt Nam`,

  "công nghệ": `Tập trung vào các chỉ số:
- Vốn FDI đăng ký vào ngành công nghệ Việt Nam
- Tăng trưởng xuất khẩu phần mềm / IT outsourcing
- Capex Samsung, Intel, LG tại Việt Nam
- Số lượng kỹ sư CNTT tốt nghiệp hàng năm
- Chi tiêu CNTT doanh nghiệp Việt Nam
- Tỷ lệ chuyển đổi số doanh nghiệp
- Tăng trưởng doanh thu ngành viễn thông`,

  tech: `Tập trung vào các chỉ số:
- Vốn FDI đăng ký vào ngành công nghệ Việt Nam
- Tăng trưởng xuất khẩu phần mềm / IT outsourcing
- Capex Samsung, Intel, LG tại Việt Nam
- Số lượng kỹ sư CNTT tốt nghiệp hàng năm
- Chi tiêu CNTT doanh nghiệp Việt Nam
- Tỷ lệ chuyển đổi số doanh nghiệp
- Tăng trưởng doanh thu ngành viễn thông`,
};

function getSectorGuidance(sector: string): string {
  const key = sector.toLowerCase();
  return (
    SECTOR_METRICS[key] ??
    `Xác định 5-7 chỉ số vĩ mô và ngành quan trọng nhất cho ngành "${sector}" tại Việt Nam.`
  );
}

// ---------------------------------------------------------------------------
// JSON schemas embedded in prompts
// ---------------------------------------------------------------------------

const SECTOR_METRICS_SCHEMA = `{
  "metrics": [
    {
      "name": "string — tên chỉ số (tiếng Việt)",
      "currentValue": "number — giá trị hiện tại",
      "impact": "\"positive\" | \"negative\" | \"neutral\"",
      "explanation": "string — giải thích 1-2 câu bằng tiếng Việt",
      "source": "string — nguồn dữ liệu (ví dụ: SBV, GSO, Bloomberg)"
    }
  ]
}`;

const AI_INSIGHT_SCHEMA = `{
  "insight": "string — 2-3 câu phân tích đầu tư chuyên nghiệp",
  "keyRisk": "string — rủi ro chính",
  "keyOpportunity": "string — cơ hội chính",
  "actionTags": ["string — 1-2 tag hành động, ví dụ: 'Theo dõi', 'Tích lũy', 'Thận trọng'"]
}`;

const MEETING_ANALYSIS_SCHEMA = `{
  "summaryPoints": ["string — 3-5 điểm tóm tắt chính"],
  "overallSentiment": "\"bullish\" | \"bearish\" | \"neutral\"",
  "speakers": [
    {
      "name": "string",
      "role": "string",
      "sentiment": "\"optimistic\" | \"cautious\" | \"defensive\" | \"evasive\"",
      "keyQuotes": ["string — trích dẫn nguyên văn quan trọng"],
      "analysis": "string — phân tích tâm lý và thái độ"
    }
  ],
  "redFlags": [
    {
      "flag": "string — mô tả cờ đỏ",
      "severity": "\"high\" | \"medium\" | \"low\"",
      "evidence": "string — bằng chứng cụ thể",
      "timestamp": "string | null — thời điểm trong video nếu có"
    }
  ],
  "promises": [
    {
      "content": "string — nội dung cam kết",
      "timeline": "string — thời hạn thực hiện",
      "credibility": "\"high\" | \"medium\" | \"low\""
    }
  ],
  "investmentImplications": "string — đánh giá tổng thể về hàm ý đầu tư",
  "themes": ["string — các chủ đề chính, ví dụ: 'Chuyển đổi số', 'M&A'"]
}`;

const FOLLOW_UP_SCHEMA = `{
  "answer": "string — câu trả lời chi tiết",
  "relevantEvidence": ["string — bằng chứng liên quan từ phân tích gốc"],
  "confidence": "\"high\" | \"medium\" | \"low\""
}`;

// ---------------------------------------------------------------------------
// 1. getSectorMetricsPrompt
// ---------------------------------------------------------------------------

export interface PromptPair {
  system: string;
  user: string;
}

export function getSectorMetricsPrompt(
  ticker: string,
  sector: string,
  financialData: Record<string, unknown>
): PromptPair {
  const sectorGuidance = getSectorGuidance(sector);

  const system = `Bạn là chuyên gia phân tích thị trường chứng khoán Việt Nam cấp cao với hơn 15 năm kinh nghiệm. Bạn chuyên phân tích vĩ mô và ngành, đặc biệt am hiểu bối cảnh Việt Nam bao gồm chính sách SBV, xu hướng VN-Index, dữ liệu FDI, và đặc thù thị trường Việt Nam.

Ngày hôm nay: ${today()}

QUY TẮC BẮT BUỘC:
- Bạn PHẢI trả lời HOÀN TOÀN bằng JSON hợp lệ, không có markdown, không có giải thích ngoài JSON.
- Tên chỉ số bằng tiếng Việt.
- Giải thích bằng tiếng Việt, ngắn gọn 1-2 câu.
- Giá trị currentValue phải là số thực tế hoặc ước tính hợp lý dựa trên kiến thức của bạn.
- impact phải là một trong: "positive", "negative", "neutral".

JSON schema bắt buộc:
${SECTOR_METRICS_SCHEMA}`;

  const user = `Phân tích các chỉ số vĩ mô và ngành quan trọng nhất cho mã cổ phiếu ${ticker} thuộc ngành "${sector}" trên thị trường chứng khoán Việt Nam.

${sectorGuidance}

Dữ liệu tài chính hiện có của công ty:
${JSON.stringify(financialData, null, 2)}

Hãy xác định 5-7 chỉ số quan trọng nhất ảnh hưởng đến ${ticker} tại thời điểm hiện tại. Xem xét bối cảnh vĩ mô Việt Nam, chính sách SBV, xu hướng FDI, và các yếu tố đặc thù ngành.

Trả lời HOÀN TOÀN bằng JSON hợp lệ theo schema đã cho.`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 2. getAIInsightPrompt
// ---------------------------------------------------------------------------

export function getAIInsightPrompt(
  ticker: string,
  metrics: SectorMetric[],
  priceData: PricePoint[]
): PromptPair {
  const system = `Bạn là chuyên gia tư vấn đầu tư chứng khoán Việt Nam. Bạn đưa ra nhận định ngắn gọn, chuyên nghiệp, dựa trên dữ liệu. Bạn KHÔNG đưa ra lời khuyên tài chính — chỉ phân tích khách quan.

Ngày hôm nay: ${today()}

QUY TẮC BẮT BUỘC:
- Trả lời HOÀN TOÀN bằng JSON hợp lệ, không có markdown, không có giải thích ngoài JSON.
- Giọng điệu: chuyên nghiệp, khách quan, dựa trên sự kiện.
- insight bằng tiếng Việt, 2-3 câu ngắn gọn.
- Kết thúc insight bằng câu: "Đây là phân tích tham khảo, không phải lời khuyên đầu tư."
- actionTags: 1-2 tag ngắn gọn (ví dụ: "Theo dõi", "Tích lũy", "Thận trọng", "Cắt lỗ").

JSON schema bắt buộc:
${AI_INSIGHT_SCHEMA}`;

  const recentPrices = priceData.slice(-10);

  const user = `Dựa trên các chỉ số ngành và dữ liệu giá, đưa ra nhận định đầu tư ngắn gọn cho mã ${ticker}.

Chỉ số ngành hiện tại:
${JSON.stringify(metrics, null, 2)}

Dữ liệu giá gần nhất (10 phiên):
${JSON.stringify(recentPrices, null, 2)}

Yêu cầu:
- Xác định 1 rủi ro chính (keyRisk)
- Xác định 1 cơ hội chính (keyOpportunity)
- Viết insight 2-3 câu tổng hợp cả rủi ro và cơ hội
- Đề xuất 1-2 action tags phù hợp

Trả lời HOÀN TOÀN bằng JSON hợp lệ theo schema đã cho.`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 3. getMeetingAnalysisPrompt
// ---------------------------------------------------------------------------

export function getMeetingAnalysisPrompt(
  companyName: string,
  ticker: string
): PromptPair {
  const system = `Bạn là chuyên gia quản trị doanh nghiệp (corporate governance expert) chuyên về các công ty niêm yết tại Việt Nam. Bạn có kinh nghiệm phân tích hàng trăm cuộc họp đại hội cổ đông và họp nhà đầu tư.

Ngày hôm nay: ${today()}

NHIỆM VỤ:
Phân tích nội dung cuộc họp/transcript của công ty ${companyName} (${ticker}) và trả về kết quả phân tích chi tiết.

PHÂN TÍCH TÂM LÝ NGƯỜI NÓI:
Đánh giá từng người nói dựa trên:
- Lựa chọn từ ngữ: tích cực, tiêu cực, mơ hồ, cụ thể
- Mẫu do dự: ngập ngừng, lảng tránh, chuyển hướng câu hỏi
- Mức độ cụ thể: có số liệu rõ ràng hay chung chung
- Ngôn ngữ cơ thể (nếu có video): ánh mắt, tư thế, biểu cảm

CỜ ĐỎ CẦN PHÁT HIỆN:
- Câu trả lời né tránh khi cổ đông đặt câu hỏi trực tiếp
- Mâu thuẫn giữa các người nói (CEO nói khác CFO)
- Mục tiêu phi thực tế không có kế hoạch thực hiện rõ ràng
- Thay đổi chiến lược đột ngột không giải thích thỏa đáng
- Dấu hiệu giao dịch nội bộ bất thường
- Giao dịch bên liên quan (related party transactions) bị lướt qua
- Sử dụng ngôn ngữ mơ hồ khi thảo luận về tài chính
- Không đề cập đến rủi ro đã biết của ngành

ĐÁNH GIÁ CAM KẾT:
- So sánh cam kết với chuẩn ngành (industry benchmarks)
- Đánh giá tính khả thi dựa trên lịch sử thực hiện cam kết trước
- Xem xét nguồn lực và năng lực thực thi

QUY TẮC BẮT BUỘC:
- Trả lời HOÀN TOÀN bằng JSON hợp lệ, không có markdown, không có giải thích ngoài JSON.
- Phân tích bằng tiếng Việt khi phù hợp, trích dẫn giữ nguyên ngôn ngữ gốc.
- Sắp xếp redFlags theo severity từ high → medium → low.
- summaryPoints: 3-5 điểm chính.
- overallSentiment dựa trên đánh giá tổng thể tất cả yếu tố.

JSON schema bắt buộc:
${MEETING_ANALYSIS_SCHEMA}`;

  const user = `Phân tích cuộc họp / transcript sau đây của công ty ${companyName} (${ticker}).

Hãy phân tích kỹ lưỡng và trả về kết quả theo đúng JSON schema đã cho. Chú ý:
1. Xác định tất cả người nói và vai trò của họ
2. Đánh giá tâm lý từng người (optimistic/cautious/defensive/evasive)
3. Phát hiện các cờ đỏ với bằng chứng cụ thể
4. Liệt kê tất cả cam kết/lời hứa và đánh giá độ tin cậy
5. Tóm tắt hàm ý đầu tư tổng thể
6. Xác định các chủ đề chính (themes)

Trả lời HOÀN TOÀN bằng JSON hợp lệ.

[TRANSCRIPT/VIDEO CONTENT WILL BE APPENDED HERE]`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// 4. getFollowUpPrompt
// ---------------------------------------------------------------------------

export function getFollowUpPrompt(
  originalAnalysis: MeetingAnalysis,
  question: string
): PromptPair {
  const system = `Bạn là chuyên gia phân tích họp cổ đông tại Việt Nam. Bạn đã phân tích một cuộc họp và người dùng đang hỏi thêm câu hỏi về kết quả phân tích.

Ngày hôm nay: ${today()}

QUY TẮC BẮT BUỘC:
- Trả lời HOÀN TOÀN bằng JSON hợp lệ, không có markdown, không có giải thích ngoài JSON.
- Trả lời dựa trên ngữ cảnh phân tích gốc được cung cấp.
- Nếu câu hỏi nằm ngoài phạm vi phân tích, nói rõ điều đó.
- confidence: "high" nếu câu trả lời rõ ràng từ dữ liệu, "medium" nếu cần suy luận, "low" nếu mang tính suy đoán.

JSON schema bắt buộc:
${FOLLOW_UP_SCHEMA}`;

  const user = `Dưới đây là kết quả phân tích cuộc họp gốc:

${JSON.stringify(originalAnalysis, null, 2)}

Câu hỏi từ người dùng:
"${question}"

Hãy trả lời câu hỏi dựa trên ngữ cảnh phân tích ở trên. Cung cấp bằng chứng liên quan từ phân tích gốc nếu có.

Trả lời HOÀN TOÀN bằng JSON hợp lệ theo schema đã cho.`;

  return { system, user };
}
