using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorldCup2026.Domain.Entities;

namespace WorldCup2026.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.Email).IsUnique();
        builder.Property(e => e.Email).HasMaxLength(256).IsRequired();
        builder.Property(e => e.PasswordHash).HasMaxLength(500);
        builder.Property(e => e.DisplayName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.AvatarUrl).HasMaxLength(500);
        builder.Property(e => e.ExternalAuthId).HasMaxLength(256);
        builder.Property(e => e.RefreshToken).HasMaxLength(500);
    }
}

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.InviteCode).IsUnique();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.InviteCode).HasMaxLength(20).IsRequired();
        builder.Property(e => e.DefaultBalance).HasColumnType("numeric(18,2)");

        builder.HasOne(e => e.CreatedBy)
            .WithMany(u => u.CreatedGroups)
            .HasForeignKey(e => e.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.GroupId, e.UserId }).IsUnique();
        builder.Property(e => e.Balance).HasColumnType("numeric(18,2)");
        builder.Property(e => e.PenaltyAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.RowVersion).IsRowVersion();

        builder.HasOne(e => e.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany(u => u.GroupMemberships)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TeamConfiguration : IEntityTypeConfiguration<Team>
{
    public void Configure(EntityTypeBuilder<Team> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.Code).IsUnique();
        builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Code).HasMaxLength(3).IsRequired();
        builder.Property(e => e.FlagUrl).HasMaxLength(500);
        builder.Property(e => e.GroupName).HasMaxLength(5);
    }
}

public class MatchConfiguration : IEntityTypeConfiguration<Match>
{
    public void Configure(EntityTypeBuilder<Match> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.ExternalMatchId);
        builder.HasIndex(e => e.StartTime);
        builder.Property(e => e.Stage).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Group).HasColumnName("Group");

        builder.HasOne(e => e.HomeTeam)
            .WithMany()
            .HasForeignKey(e => e.HomeTeamId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.AwayTeam)
            .WithMany()
            .HasForeignKey(e => e.AwayTeamId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class MatchBettingConfigConfiguration : IEntityTypeConfiguration<MatchBettingConfig>
{
    public void Configure(EntityTypeBuilder<MatchBettingConfig> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.MatchId, e.GroupId }).IsUnique();
        builder.Property(e => e.Handicap).HasColumnType("numeric(5,2)");
        builder.Property(e => e.Odds).HasColumnType("numeric(5,2)");
        builder.Property(e => e.MinBetAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.MaxBetAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.DefaultBetAmount).HasColumnType("numeric(18,2)");

        builder.HasOne(e => e.Match)
            .WithMany(m => m.BettingConfigs)
            .HasForeignKey(e => e.MatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Group)
            .WithMany(g => g.BettingConfigs)
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.FavoredTeam)
            .WithMany()
            .HasForeignKey(e => e.FavoredTeamId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.CreatedBy)
            .WithMany()
            .HasForeignKey(e => e.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BetConfiguration : IEntityTypeConfiguration<Bet>
{
    public void Configure(EntityTypeBuilder<Bet> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.UserId, e.MatchBettingConfigId }).IsUnique();
        builder.HasIndex(e => new { e.GroupId, e.MatchId });
        builder.Property(e => e.BetAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.Profit).HasColumnType("numeric(18,2)");

        builder.HasOne(e => e.User)
            .WithMany(u => u.Bets)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.BettingConfig)
            .WithMany(c => c.Bets)
            .HasForeignKey(e => e.MatchBettingConfigId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Match)
            .WithMany(m => m.Bets)
            .HasForeignKey(e => e.MatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.SelectedTeam)
            .WithMany()
            .HasForeignKey(e => e.SelectedTeamId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.UserId, e.GroupId });
        builder.Property(e => e.Amount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.BalanceBefore).HasColumnType("numeric(18,2)");
        builder.Property(e => e.BalanceAfter).HasColumnType("numeric(18,2)");
        builder.Property(e => e.Description).HasMaxLength(500);

        builder.HasOne(e => e.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class LeaderboardSnapshotConfiguration : IEntityTypeConfiguration<LeaderboardSnapshot>
{
    public void Configure(EntityTypeBuilder<LeaderboardSnapshot> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.GroupId, e.SnapshotDate });
        builder.Property(e => e.TotalWinAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.TotalLossAmount).HasColumnType("numeric(18,2)");
        builder.Property(e => e.NetProfit).HasColumnType("numeric(18,2)");

        builder.HasOne(e => e.Group)
            .WithMany()
            .HasForeignKey(e => e.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
