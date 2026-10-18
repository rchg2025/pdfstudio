export interface ComplianceIssue {
  id: string;
  type: 'spelling' | 'grammar' | 'style' | 'citation';
  original: string;
  suggestion: string;
  reason: string;
  context?: string;
}

export interface SuspiciousPassage {
  text: string;
  reason: string;
  recommendation: string;
}

export interface PlagiarismAnalysis {
  riskLevel: 'An toàn' | 'Cần bổ sung nguồn' | 'Rủi ro vi phạm' | string;
  assessment: string;
  suspiciousPassages: SuspiciousPassage[];
  citationAdvice?: string;
}

export interface DocumentComplianceSummary {
  totalWords: number;
  qualityScore: number;
  plagiarismRisk: 'THẤP' | 'TRUNG BÌNH' | 'CAO' | string;
  plagiarismScore: number;
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
}
