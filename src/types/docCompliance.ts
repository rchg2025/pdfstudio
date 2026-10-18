export interface ComplianceIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'style' | 'citation';
  original: string;
  suggestion: string;
  reason: string;
  context?: string;
}

export interface PlagiarismSourceMatch {
  sourceId: number;
  sourceTitle: string;
  sourceType: 'internet' | 'publication' | 'student_paper' | 'journal';
  similarityPercent: number;
  url?: string;
  matchedText: string;
  matchedCountWords?: number;
  authorOrDomain?: string;
}

export interface SuspiciousPassage {
  text: string;
  sourceIndex: number; // 1-based index tương ứng với PlagiarismSourceMatch
  similarityPercent: number;
  sourceTitle: string;
  reason: string;
  recommendation: string;
  sourceUrl?: string;
  paraphraseSuggestion?: string;
}

export interface PlagiarismAnalysis {
  similarityScore: number; // Tỷ lệ tương đồng tổng thể chuẩn Turnitin (0 - 100%)
  riskLevel: 'An toàn (0-15%)' | 'Cảnh báo (16-35%)' | 'Nguy cơ cao (>35%)' | string;
  assessment: string;
  matchedSources: PlagiarismSourceMatch[];
  suspiciousPassages: SuspiciousPassage[];
  breakdown: {
    internetSourcesPercent: number;
    publicationsPercent: number;
    studentPapersPercent: number;
  };
  citationAdvice?: string;
}

export interface DocumentComplianceSummary {
  totalWords: number;
  totalCharacters?: number;
  qualityScore: number;
  plagiarismRisk: 'THẤP' | 'TRUNG BÌNH' | 'CAO' | string;
  plagiarismScore: number; // Trùng với similarityScore
  totalIssues: number;
  spellingIssuesCount: number;
  grammarIssuesCount: number;
  citationIssuesCount: number;
}

export interface DocumentComplianceResult {
  summary: DocumentComplianceSummary;
  plagiarismAnalysis: PlagiarismAnalysis;
  issues: ComplianceIssue[];
  improvedText: string;
  pedagogicalAdvice?: string;
  highlightedHtml?: string; // HTML đã đánh dấu màu highlight Turnitin trực quan
}
