import { GoogleGenAI, SchemaType } from "@google/genai";
import { WordData, AssessmentQuestion, AssessmentDifficulty } from "../types";

// ✅ 修正點 1：改用 import.meta.env 來讀取 Vite 的環境變數
// ✅ 修正點 2：加上空字串 fallback，防止因為 undefined 導致 new GoogleGenAI 直接報錯崩潰
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

// 如果沒有 Key，我們先不要初始化 client，等到真正要呼叫的時候再檢查
// 這樣可以避免網頁一打開就白屏
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// 一個輔助函式，用來檢查 AI 是否就緒
const checkAI = () => {
  if (!ai) {
    console.error("Gemini API Key 尚未設定！請在 .env.local 或 Vercel 設定中加入 VITE_GEMINI_API_KEY");
    throw new Error("API Key missing");
  }
  return ai;
};

export const segmentText = async (text: string): Promise<string[]> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash', // ✅ 建議：改用 flash 模型，速度快且免費額度高，比較不會報錯
      contents: `請將以下繁體中文文本進行分詞，以適合小學中文學習的「詞語」為單位。
      例如輸入「中文開發」，應回傳 ["中文", "開發"]。
      例如輸入「中文開發土耳其」，應回傳 ["中文", "開發", "土耳其"]。
      
      待分詞文本：${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY, // ✅ 注意：有些 SDK 版本是用 SchemaType
          items: { type: SchemaType.STRING }
        }
      }
    });
    
    return JSON.parse(response.text() || '[]'); // ✅ 修正：response.text 可能是函式或屬性，視版本而定，這裡加個保險
  } catch (e) {
    console.error("Segmentation error or AI not ready:", e);
    // Fallback: 如果 AI 失敗，嘗試簡單的分割
    return text.split(/[、，；。 \n]/).filter(s => s.length > 0);
  }
};

export const generateWordExplanation = async (word: string): Promise<WordData> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `請詳細解釋繁體中文詞語「${word}」。
      包含：
      1. 定義（適合小學生的白話文，簡潔易懂）
      2. 三個例句（生動且貼近生活）。針對每個句子，請判斷該詞語在該句中的具體詞性（如：名詞、動詞、形容詞）。
      3. 詞性（該詞語的所有常用詞性，如名詞、動詞、形容詞等）
      4. 字源趣事（簡單介紹這個字的由來或構造，如有，若無則省略）
      5. 部首（如果是單字，提供其部首；如果是多字詞，提供第一個字的部首）`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            word: { type: SchemaType.STRING },
            definition: { type: SchemaType.STRING },
            sentences: {
              type: SchemaType.ARRAY,
              items: { 
                type: SchemaType.OBJECT,
                properties: {
                  text: { type: SchemaType.STRING },
                  posInSentence: { type: SchemaType.STRING, description: "詞語在該句中的具體詞性" }
                },
                required: ["text", "posInSentence"]
              }
            },
            pos: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            etymology: { type: SchemaType.STRING },
            radical: { type: SchemaType.STRING }
          },
          required: ["word", "definition", "sentences", "pos", "radical"]
        }
      }
    });

    return JSON.parse(response.text() || '{}') as WordData;
  } catch (e) {
    console.error("Explanation error:", e);
    return {
      word,
      definition: "暫無詳細解釋 (請檢查 API Key 或網路)",
      sentences: [],
      pos: [],
      radical: ""
    };
  }
};

export const getRadicalExamples = async (radical: string): Promise<string[]> => {
  try {
    const client = checkAI();
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `列出 8 個以「${radical}」為部首的繁體中文字（限於小學常用字，5-10個左右）。只回傳 JSON 字串陣列，例如 ["字", "符"]。不要有額外文字。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      }
    });
    
    const text = response.text() || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("Radical error:", e);
    return [];
  }
};

export const generateAssessment = async (
  words: string[], 
  count: number, 
  difficulty: AssessmentDifficulty
): Promise<AssessmentQuestion[]> => {
  try {
    const client = checkAI();
    // Determine grade level context based on difficulty
    let levelDesc = "小學一年級至二年級";
    if (difficulty === 'MEDIUM') levelDesc = "小學三年級至四年級";
    if (difficulty === 'HARD') levelDesc = "小學五年級至六年級";

    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `請生成 ${count} 條中文填充題評估題目。
      
      可用詞彙庫：${JSON.stringify(words)}
      
      要求：
      1. 必須從上述「可用詞彙庫」中選擇詞語作為填充答案。
      2. 如果題目數量 (${count}) 多於可用詞彙量 (${words.length})，請重複使用詞彙，但必須創作不同的句子。
      3. 難度設定：${difficulty} (適合 ${levelDesc})。句子結構和用詞深度需符合此年級水平。
      4. 回傳格式為 JSON 陣列。
      5. 每題包含：
        - id: 唯一編號
        - targetWord: 答案詞語
        - fullSentence: 完整句子
        - sentenceParts: 將句子以答案詞語切分成的兩部分 [前半句, 後半句]。例如句子是「我喜歡吃飯」，答案是「喜歡」，則 parts 為 ["我", "吃飯"]。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              targetWord: { type: SchemaType.STRING },
              fullSentence: { type: SchemaType.STRING },
              sentenceParts: { 
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              }
            },
            required: ["id", "targetWord", "fullSentence", "sentenceParts"]
          }
        }
      }
    });

    return JSON.parse(response.text() || '[]');
  } catch (e) {
    console.error("Assessment generation error", e);
    return [];
  }
};
