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

interface GroupStatisticsProps {
  stats: GroupStatsData | null;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <h3 className="text-sm font-medium text-secondary/70">{label}</h3>
      <h4 className="text-lg font-bold text-secondary">{value}</h4>
    </div>
  );
}

export function GroupStatistics({ stats }: GroupStatisticsProps) {
  if (!stats) {
    return null;
  }

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

  return (
    <section className="flex flex-col items-center w-full">
      <div className="w-full max-w-[1000px] flex items-start justify-between gap-8">
        {/* Left Stats Column */}
        <div className="flex flex-col gap-6">
          {leftStats.map((stat, index) => (
            <StatItem key={index} label={stat.label} value={stat.value} />
          ))}
        </div>

        {/* Center Title */}
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-secondary">Group Statistics</h2>
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
