import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  href?: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  href,
}: StatCardProps) => {
  const variantStyles = {
    default: 'border-border/50',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const cardContent = (
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1">{title}</p>
        <p className="text-lg sm:text-2xl font-bold tracking-tight truncate">{value}</p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtitle}</p>
        )}
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 mt-1 sm:mt-2', trendColor)}>
            <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {icon && (
          <div className="p-1.5 sm:p-2.5 rounded-lg bg-primary/10 text-primary [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
            {icon}
          </div>
        )}
        {href && (
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(
          'block glass rounded-xl p-3 sm:p-5 shadow-card transition-all duration-300 hover:shadow-glow hover:scale-[1.02] animate-slide-up cursor-pointer group',
          variantStyles[variant],
          className
        )}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'glass rounded-xl p-3 sm:p-5 shadow-card transition-all duration-300 hover:shadow-glow animate-slide-up',
        variantStyles[variant],
        className
      )}
    >
      {cardContent}
    </div>
  );
};

export default StatCard;
