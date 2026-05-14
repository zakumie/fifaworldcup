export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  timeZone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role?: UserRole;
  timeZone: string;
}

export type UserRole = 'Admin' | 'Manager' | 'User';

export type SettlementMode = 'Normal' | 'WinnerKeepsLoserPays';

export interface GroupDto {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  maxMembers: number;
  defaultBalance: number;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  settlementMode: SettlementMode;
}

export interface GroupDetailDto {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  maxMembers: number;
  defaultBalance: number;
  isActive: boolean;
  createdAt: string;
  settlementMode: SettlementMode;
  members: GroupMemberDto[];
}

export interface GroupMemberDto {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  balance: number;
  joinedAt: string;
  isActive: boolean;
  penaltyAmount: number;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  maxMembers: number;
  defaultBalance: number;
  settlementMode: SettlementMode;
}

export interface UpdateGroupRequest {
  name: string;
  description: string;
  maxMembers: number;
  defaultBalance: number;
  settlementMode: SettlementMode;
  isActive: boolean;
}

export interface JoinGroupRequest {
  inviteCode: string;
}

export interface TeamDto {
  id: string;
  name: string;
  code: string;
  flagUrl: string | null;
  groupName: string | null;
}

export interface MatchDto {
  id: string;
  externalMatchId: number | null;
  homeTeam: TeamDto;
  awayTeam: TeamDto;
  matchDay: number;
  stage: string;
  group: string | null;
  startTime: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
}

export type MatchStatus = 'Upcoming' | 'Open' | 'Live' | 'Finished' | 'Postponed' | 'Cancelled';

export interface UpdateScoreRequest {
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
}

export interface BettingConfigDto {
  id: string;
  matchId: string;
  groupId: string;
  handicap: number;
  favoredTeamId: string | null;
  favoredTeamName: string | null;
  odds: number;
  minBetAmount: number;
  maxBetAmount: number;
  defaultBetAmount: number | null;
  isFixedBet: boolean;
  bettingOpenTime: string;
  bettingCloseTime: string;
  isSettled: boolean;
  createdAt: string;
}

export interface CreateBettingConfigRequest {
  matchId: string;
  groupId: string;
  handicap: number;
  favoredTeamId: string | null;
  odds: number;
  minBetAmount: number;
  maxBetAmount: number;
  defaultBetAmount: number | null;
  isFixedBet: boolean;
  bettingOpenTime: string;
  bettingCloseTime: string;
}

export interface UpdateBettingConfigRequest {
  handicap: number;
  favoredTeamId: string | null;
  odds: number;
  minBetAmount: number;
  maxBetAmount: number;
  defaultBetAmount: number | null;
  isFixedBet: boolean;
  bettingOpenTime: string;
  bettingCloseTime: string;
}

export interface PlaceBetRequest {
  matchBettingConfigId: string;
  selectedTeamId: string;
  betAmount: number;
}

export interface UpdateBetRequest {
  selectedTeamId: string;
  betAmount: number;
}

export interface BetDto {
  id: string;
  userId: string;
  userDisplayName: string;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  selectedTeamId: string | null;
  selectedTeamName: string | null;
  betAmount: number;
  status: BetStatus;
  profit: number;
  createdAt: string;
  settledAt: string | null;
  handicap: number;
  favoredTeamName: string | null;
}

export type BetStatus = 'Pending' | 'Won' | 'Lost' | 'HalfWon' | 'HalfLost' | 'Push' | 'Cancelled';

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalBets: number;
  wins: number;
  losses: number;
  draws: number;
  totalWagered: number;
  totalPayout: number;
  profit: number;
  balance: number;
  winRate: number;
  penaltyAmount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminUserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface ToggleUserActiveRequest {
  isActive: boolean;
}

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string;
  createdAt: string;
  timeZone: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  avatarUrl: string | null;
  timeZone?: string;
}
