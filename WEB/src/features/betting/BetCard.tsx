import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { BetDto } from "@/types";

function ProfitDisplay({ profit }: { profit: number }) {
  if (profit === 0)
    return (
      <span className="text-xs text-green-600 font-bold">
        <TrendingUpIcon sx={{ fontSize: 14 }} /> 0
      </span>
    );
  const isPositive = profit > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
    >
      {isPositive ? (
        <TrendingUpIcon sx={{ fontSize: 14 }} />
      ) : (
        <TrendingDownIcon sx={{ fontSize: 14 }} />
      )}
      {isPositive ? "+" : ""}
      {profit.toLocaleString()}
    </span>
  );
}

export function BetCard({
  bet,
  hideAmount,
  avatarUrl,
}: {
  bet: BetDto;
  hideAmount?: boolean;
  avatarUrl?: string | null;
}) {
  const isSettled = bet.status !== "Pending" && bet.status !== "Cancelled";

  return (
    <div
      className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-lg 
          ${bet.isLuckyStar ? "bg-yellow-50" : "bg-white"} border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={bet.userDisplayName}
          className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm shrink-0">
          {bet.userDisplayName?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-[13px] text-gray-800 truncate">
          {bet.userDisplayName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {!hideAmount && (
            <span className="text-[11px] sm:text-xs font-bold text-gray-600">
              {bet.betAmount.toLocaleString()}
            </span>
          )}
          {isSettled && <ProfitDisplay profit={bet.profit} />}
        </div>
      </div>
      {bet.isLuckyStar && (
        <span
          className="text-amber-400 text-[14px] font-bold"
          title="Lucky Star"
        >
          ⭐️
        </span>
      )}
    </div>
  );
}
