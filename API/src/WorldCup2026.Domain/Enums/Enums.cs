namespace WorldCup2026.Domain.Enums;

public enum AuthProvider
{
    Local = 0,
    Google = 1,
    Facebook = 2
}

public enum GroupRole
{
    User = 0,
    Manager = 1,
    Admin = 2
}

public enum MatchStatus
{
    Scheduled = 0,
    Live = 1,
    Finished = 2,
    Postponed = 3,
    Cancelled = 4
}

public enum BetStatus
{
    Pending = 0,
    Won = 1,
    Lost = 2,
    HalfWon = 3,
    HalfLost = 4,
    Push = 5,
    Cancelled = 6
}

public enum SystemRole
{
    User = 0,
    Admin = 1
}

public enum TransactionType
{
    InitialBalance = 0,
    BetPlaced = 1,
    BetWon = 2,
    BetLost = 3,
    BetRefund = 4,
    AdminAdjustment = 5
}
