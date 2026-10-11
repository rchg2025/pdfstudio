export interface PointTransaction {
  id: string;
  studentScoreId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  minPoints: number;
}

export interface StudentBadge {
  id: string;
  studentScoreId: string;
  badgeId: string;
  badge: Badge;
  awardedAt: string;
}

export interface StudentScore {
  id: string;
  groupId: string;
  studentName: string;
  studentId: string;
  className: string | null;
  avatar: string | null;
  totalPoints: number;
  level: number;
  streak: number;
  createdAt: string;
  updatedAt: string;
  transactions?: PointTransaction[];
  badges?: StudentBadge[];
}

export interface LeaderboardGroup {
  id: string;
  userId: string;
  name: string;
  className: string | null;
  description: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
  students?: StudentScore[];
  _count?: {
    students: number;
  };
}
