
export interface Sentence {
  text: string;
  posInSentence: string;
}

export interface WordData {
  word: string;
  definition: string;
  sentences: Sentence[];
  pos: string[];
  etymology?: string;
  radical?: string;
}

export interface CharacterInfo {
  char: string;
  pinyin: string;
  radical: string;
  strokes: string[];
}

export enum GameMode {
  NORMAL = 'NORMAL',
  OVERVIEW = 'OVERVIEW',
  ASSESSMENT = 'ASSESSMENT'
}

export type AssessmentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AssessmentQuestion {
  id: string;
  targetWord: string;
  sentenceParts: string[]; // [prefix, suffix]
  fullSentence: string;
}
