export type QuestionType = 'choice' | 'multiple_choice' | 'fill_blank' | 'matching' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType; // 'choice' | 'multiple_choice' | 'fill_blank' | 'matching' | 'essay'
  difficulty: Difficulty; // 'easy' | 'medium' | 'hard'
  question: string;
  options?: string[]; // Dùng cho 'choice', 'multiple_choice'
  correctAnswer?: string; // Dùng cho 'choice', 'fill_blank', 'essay'
  correctAnswers?: string[]; // Dùng cho 'multiple_choice'
  matchingPairs?: MatchingPair[]; // Dùng cho 'matching'
  explanation?: string;
  imageUrl?: string; // Ảnh đính kèm câu hỏi (Google Drive hoặc URL ảnh)
  points: number; // Điểm của câu (mặc định 1)
}

export interface QuizSettings {
  timeLimitMinutes: number; // Thời gian làm bài (0 = không giới hạn)
  passingScorePercent: number; // Điểm qua bài (mặc định 50%)
  shuffleQuestions: boolean; // Đảo thứ tự câu hỏi
  shuffleOptions: boolean; // Đảo thứ tự đáp án
  // Chiến lược chọn câu hỏi khi bắt đầu thi:
  questionSelectionMode: 'all' | 'custom_difficulty';
  difficultyDistribution: {
    easyCount: number;
    mediumCount: number;
    hardCount: number;
  };
  totalQuestionsToTake?: number;
  // Cấu hình form thu thập thông tin sinh viên
  requireStudentInfo: boolean;
  studentFields: {
    fullName: boolean;
    studentId: boolean; // MSSV / Mã học viên
    className: boolean; // Lớp
    email: boolean;
  };
  // Cấu hình nhạc nền
  bgMusicType: 'none' | 'lofi' | 'piano' | 'ambient' | 'custom';
  bgMusicUrl?: string; // Link file nhạc tùy chỉnh (.mp3, .ogg, link Google Drive direct/proxy, v.v.)
  enableSounds: boolean;
  // Phản hồi kết quả
  showResultsImmediately: boolean;
  showCorrectAnswersAfterSubmit: boolean;
}

export interface StudentSubmission {
  id: string;
  quizId: string;
  quizTitle: string;
  studentName: string;
  studentId: string;
  className: string;
  email?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  submittedAt: string;
  answers: Record<string, any>; // questionId -> answer
  violationCount?: number; // Số lần vi phạm chuyển tab / rời màn hình thi
}

export interface QuizPackage {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  description: string;
  code: string; // Mã phòng thi 6 số
  coverImage?: string;
  isOpen: boolean; // Đang mở thi hay đóng
  questions: QuizQuestion[];
  settings: QuizSettings;
  createdAt: string;
  updatedAt: string;
}

export interface SyllabusTreeNode {
  id: string;
  title: string;
  children?: SyllabusTreeNode[];
}

export interface SavedSyllabusSubject {
  id: string;
  userId: string;
  name: string;
  schoolName?: string;
  departmentName?: string;
  sourceType?: 'file' | 'url' | 'text' | 'drive';
  sourceTitle?: string;
  rawContent?: string;
  driveFileId?: string;
  driveUrl?: string;
  tree: SyllabusTreeNode[];
  createdAt?: string;
  updatedAt?: string;
}

