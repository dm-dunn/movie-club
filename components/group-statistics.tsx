"use client";

export interface GroupStatsData {
  totalMinutesWatched: number;
  totalOscarNominations: number;
  totalOscarWins: number;
  mostNominationsMovieTitle: string | null;
  mostNominationsCount: number;
  mostWinsMovieTitle: string | null;
  mostWinsCount: number;
  mostWatchedActorName: string | null;
  mostWatchedActorCount: number;
  mostWatchedActressName: string | null;
  mostWatchedActressCount: number;
  mostWatchedDirectorName: string | null;
  mostWatchedDirectorCount: number;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="text-center">
      <h3 className="text-sm font-medium text-secondary/70">{label}</h3>
      <h4 className="text-lg font-bold text-secondary">{value}</h4>
    </div>
  );
}

interface GroupStatsSidebarProps {
  stats: GroupStatsData | null;
  side: "left" | "right";
}

function getStatsArrays(stats: GroupStatsData) {
  const totalHours = (stats.totalMinutesWatched / 60).toFixed(1);

  const leftStats = [
    { label: "Total Hours Watched", value: totalHours },
    { label: "Total Oscar Nominations", value: stats.totalOscarNominations.toString() },
    { label: "Total Oscar Wins", value: stats.totalOscarWins.toString() },
    {
      label: "Most Nominations",
      value: stats.mostNominationsMovieTitle
        ? `${stats.mostNominationsMovieTitle} (${stats.mostNominationsCount})`
        : "-",
    },
  ];

  const rightStats = [
    {
      label: "Most Watched Actor",
      value: stats.mostWatchedActorName
        ? `${stats.mostWatchedActorName} (${stats.mostWatchedActorCount})`
        : "-",
    },
    {
      label: "Most Watched Actress",
      value: stats.mostWatchedActressName
        ? `${stats.mostWatchedActressName} (${stats.mostWatchedActressCount})`
        : "-",
    },
    {
      label: "Most Watched Director",
      value: stats.mostWatchedDirectorName
        ? `${stats.mostWatchedDirectorName} (${stats.mostWatchedDirectorCount})`
        : "-",
    },
    {
      label: "Most Wins",
      value: stats.mostWinsMovieTitle
        ? `${stats.mostWinsMovieTitle} (${stats.mostWinsCount})`
        : "-",
    },
  ];

  return { leftStats, rightStats };
}

export function GroupStatsSidebar({ stats, side }: GroupStatsSidebarProps) {
  if (!stats) {
    return null;
  }

  const { leftStats, rightStats } = getStatsArrays(stats);
  const statsToShow = side === "left" ? leftStats : rightStats;

  return (
    <div className="hidden lg:flex flex-col justify-evenly py-6 min-w-[180px]">
      {statsToShow.map((stat, index) => (
        <StatItem key={index} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}

// Mobile version - shows all stats at bottom
export function GroupStatsMobile({ stats }: { stats: GroupStatsData | null }) {
  if (!stats) {
    return null;
  }

  const { leftStats, rightStats } = getStatsArrays(stats);

  return (
    <section className="lg:hidden flex flex-col items-center w-full py-8">
      <h2 className="text-2xl font-bold text-secondary mb-6">Group Statistics</h2>
      <div className="w-full max-w-[600px] flex justify-between gap-8 px-4">
        {/* Left Stats Column */}
        <div className="flex flex-col gap-6">
          {leftStats.map((stat, index) => (
            <StatItem key={index} label={stat.label} value={stat.value} />
          ))}
        </div>

        {/* Right Stats Column */}
        <div className="flex flex-col gap-6">
          {rightStats.map((stat, index) => (
            <StatItem key={index} label={stat.label} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
