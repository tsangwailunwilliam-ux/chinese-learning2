
import { GoogleGenAI, Type } from "@google/genai";
import { WordData, AssessmentQuestion, AssessmentDifficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const segmentText = async (text: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請將以下繁體中文文本進行分詞，以適合小學中文學習的「詞語」為單位。
      例如輸入「中文開發」，應回傳 ["中文", "開發"]。
      例如輸入「中文開發土耳其」，應回傳 ["中文", "開發", "土耳其"]。
      
      待分詞文本：${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Segmentation error:", e);
    // Fallback: 如果 AI 失敗，嘗試簡單的分割
    return text.split(/[、，；。 \n]/).filter(s => s.length > 0);
  }
};

export const generateWordExplanation = async (word: string): Promise<WordData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING },
          sentences: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                posInSentence: { type: Type.STRING, description: "詞語在該句中的具體詞性" }
              },
              required: ["text", "posInSentence"]
            }
          },
          pos: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          etymology: { type: Type.STRING },
          radical: { type: Type.STRING }
        },
        required: ["word", "definition", "sentences", "pos", "radical"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as WordData;
  } catch (e) {
    return {
      word,
      definition: "暫無詳細解釋",
      sentences: [],
      pos: [],
      radical: ""
    };
  }
};

export const getRadicalExamples = async (radical: string): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `列出 8 個以「${radical}」為部首的繁體中文字（限於小學常用字，5-10個左右）。只回傳 JSON 字串陣列，例如 ["字", "符"]。不要有額外文字。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch {
    return [];
  }
};

export const generateAssessment = async (
  words: string[], 
  count: number, 
  difficulty: AssessmentDifficulty
): Promise<AssessmentQuestion[]> => {
  // Determine grade level context based on difficulty
  let levelDesc = "小學一年級至二年級";
  if (difficulty === 'MEDIUM') levelDesc = "小學三年級至四年級";
  if (difficulty === 'HARD') levelDesc = "小學五年級至六年級";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            targetWord: { type: Type.STRING },
            fullSentence: { type: Type.STRING },
            sentenceParts: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["id", "targetWord", "fullSentence", "sentenceParts"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Assessment generation error", e);
    return [];
  }
};
