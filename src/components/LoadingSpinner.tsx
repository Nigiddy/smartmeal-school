import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const spinner = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
