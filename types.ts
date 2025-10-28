// FIX: Removed self-import of 'Summary' which conflicts with its local declaration.

export interface SentimentPoint {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Insight {
  cause: string;
  suggestion: string;
}

export interface StrategicStep {
  step: string;
  rationale: string;
}

export interface StrategicAnalysis {
  overview: string;
  keyFocusArea: string;
  steps: StrategicStep[];
}

export interface Keyword {
  keyword: string;
  frequency: number;
}

export interface Summary {
  pros: string[];
  cons: string[];
  themes: string[];
  sentiment: SentimentPoint;
  insights: Insight[];
  keywords: Keyword[];
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
}

export interface ReviewData {
  label: string;
  content: string;
  reportDate?: string;
}

export interface TrendAnalysis {
    summary: string;
    newIssues: string[];
    resolvedIssues: string[];
    persistentThemes: string[];
}

export interface DeepDiveAnalysis {
  summary: string;
  snippets: string[];
  sentiment: SentimentPoint;
}

export interface SegmentComparison {
    segment: string;
    keyDifferentiators: string[];
}

export interface PersonaComparison {
    overview: string;
    segmentComparisons: SegmentComparison[];
}