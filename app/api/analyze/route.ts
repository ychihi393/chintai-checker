import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const estimateFile = data.get("estimateFile") as File;
    const drawingFile = data.get("drawingFile") as File;

    if (!estimateFile) {
      return NextResponse.json({ success: false, msg: "No file" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts = [];
    
    // 見積書の処理
    const estimateBuffer = await estimateFile.arrayBuffer();
    parts.push({
      inlineData: {
        data: Buffer.from(estimateBuffer).toString("base64"),
        mimeType: estimateFile.type,
      },
    });
    parts.push({ text: "これは賃貸の初期費用見積もりです。" });

    // 図面の処理（あれば）
    if (drawingFile) {
      const drawingBuffer = await drawingFile.arrayBuffer();
      parts.push({
        inlineData: {
          data: Buffer.from(drawingBuffer).toString("base64"),
          mimeType: drawingFile.type,
        },
      });
      parts.push({ text: "これは物件の募集図面です。礼金やフリーレントの条件を確認してください。" });
    }

    const prompt = `
    あなたは「賃貸契約のプロ」です。アップロードされた画像から、交渉可能な項目を見つけ出し、以下のJSON形式のみで出力してください。
    余計なMarkdown記号（\`\`\`jsonなど）は一切不要です。純粋なJSONテキストのみを返してください。

    【出力フォーマット】
    {
      "items": [
        {
          "name": "項目名（例：鍵交換代、害虫駆除費、仲介手数料）",
          "current": 現在の価格（数値のみ）,
          "target": 適正価格または交渉後の目標価格（数値のみ）,
          "reason": "なぜ安くできるかの具体的な理由（不動産業界の知識に基づいて、消費者有利な論理で）"
        }
      ]
    }
    `;
    parts.push({ text: prompt });

    const result = await model.generateContent(parts);
    const response = await result.response;
    let text = response.text();

    // JSON整形
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(text);

    return NextResponse.json({ success: true, data: json });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, msg: "Error" });
  }
}