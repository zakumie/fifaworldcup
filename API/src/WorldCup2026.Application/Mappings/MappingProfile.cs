using AutoMapper;
using WorldCup2026.Application.DTOs.Groups;
using WorldCup2026.Application.DTOs.Matches;
using WorldCup2026.Application.DTOs.Betting;
using WorldCup2026.Application.DTOs.Users;
using WorldCup2026.Domain.Entities;

namespace WorldCup2026.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Team, TeamDto>();
        CreateMap<User, UserProfileDto>()
            .ForMember(d => d.AuthProvider, o => o.MapFrom(s => s.AuthProvider.ToString()));

        CreateMap<Match, MatchDto>();
        CreateMap<MatchBettingConfig, BettingConfigDto>()
            .ForMember(d => d.FavoredTeamName, o => o.MapFrom(s => s.FavoredTeam != null ? s.FavoredTeam.Name : null));

        CreateMap<GroupMember, GroupMemberDto>()
            .ForCtorParam(nameof(GroupMemberDto.DisplayName), o => o.MapFrom(s => s.User.DisplayName))
            .ForCtorParam(nameof(GroupMemberDto.Email), o => o.MapFrom(s => s.User.Email))
            .ForCtorParam(nameof(GroupMemberDto.AvatarUrl), o => o.MapFrom(s => s.User.AvatarUrl));
    }
}
