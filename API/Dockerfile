FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY *.sln .
COPY src/WorldCup2026.Domain/*.csproj src/WorldCup2026.Domain/
COPY src/WorldCup2026.Application/*.csproj src/WorldCup2026.Application/
COPY src/WorldCup2026.Infrastructure/*.csproj src/WorldCup2026.Infrastructure/
COPY src/WorldCup2026.WebAPI/*.csproj src/WorldCup2026.WebAPI/
RUN dotnet restore

COPY . .
RUN dotnet publish src/WorldCup2026.WebAPI/WorldCup2026.WebAPI.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "WorldCup2026.WebAPI.dll"]
