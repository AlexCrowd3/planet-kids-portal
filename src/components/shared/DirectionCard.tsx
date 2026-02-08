interface DirectionCardProps {
  name: string;
  age: string;
  description: string;
  days: string[];
  extraDays?: number;
}

const DirectionCard = ({ name, age, description, days, extraDays }: DirectionCardProps) => {
  return (
    <div className="glass-card p-5 hover:shadow-elevated transition-all cursor-pointer active:scale-[0.98]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-primary-opacity">{name}</h3>
          <span className="text-sm font-semibold text-primary">{age}</span>
        </div>
        <div className="flex items-center gap-1">
          {days.map((day) => (
            <span
              key={day}
              className="gradient-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-md"
            >
              {day}
            </span>
          ))}
          {extraDays && extraDays > 0 && (
            <span className="bg-muted-foreground/20 text-muted-foreground text-xs font-bold px-2 py-1 rounded-md">
              +{extraDays}
            </span>
          )}
        </div>
      </div>
      <p className="text-secondary-opacity text-sm leading-relaxed line-clamp-2">
        {description}
      </p>
    </div>
  );
};

export default DirectionCard;
