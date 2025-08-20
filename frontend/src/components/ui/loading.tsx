import React from 'react';
import { cn } from '@/lib/utils';

// 加载组件变体类型
export type LoadingVariant = 'spinner' | 'pulse' | 'dots' | 'skeleton';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  className?: string;
  text?: string;
  fullscreen?: boolean;
  overlay?: boolean;
}

// 旋转器组件
const Spinner = ({ size, className }: { size: LoadingSize; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
    />
  );
};

// 脉冲组件
const Pulse = ({ size, className }: { size: LoadingSize; className?: string }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded-full bg-blue-600',
        sizeClasses[size],
        className
      )}
    />
  );
};

// 点点组件
const Dots = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

// 骨架屏组件
const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex space-x-4">
        <div className="rounded-full bg-gray-300 h-10 w-10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};

// 主加载组件
export const Loading = ({
  variant = 'spinner',
  size = 'md',
  className,
  text,
  fullscreen = false,
  overlay = false
}: LoadingProps) => {
  const renderLoadingComponent = () => {
    switch (variant) {
      case 'spinner':
        return <Spinner size={size} className={className} />;
      case 'pulse':
        return <Pulse size={size} className={className} />;
      case 'dots':
        return <Dots className={className} />;
      case 'skeleton':
        return <Skeleton className={className} />;
      default:
        return <Spinner size={size} className={className} />;
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      fullscreen && 'h-screen w-screen',
      className
    )}>
      {renderLoadingComponent()}
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen || overlay) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        overlay && 'bg-black bg-opacity-50',
        fullscreen && 'bg-white'
      )}>
        {content}
      </div>
    );
  }

  return content;
};

// 特定场景的加载组件
export const LoadingPage = ({ text = '页面加载中...' }: { text?: string }) => (
  <Loading variant="spinner" size="lg" text={text} fullscreen />
);

export const LoadingOverlay = ({ text = '处理中...' }: { text?: string }) => (
  <Loading variant="spinner" size="lg" text={text} overlay />
);

export const LoadingButton = ({ size = 'sm' }: { size?: LoadingSize }) => (
  <Loading variant="spinner" size={size} className="mr-2" />
);

export const LoadingTable = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="h-4 bg-gray-300 rounded w-1/4" />
          <div className="h-4 bg-gray-300 rounded w-1/3" />
          <div className="h-4 bg-gray-300 rounded w-1/5" />
          <div className="h-4 bg-gray-300 rounded w-1/6" />
        </div>
      </div>
    ))}
  </div>
);

export const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <div className="rounded-full bg-gray-300 h-12 w-12" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-300 rounded" />
        <div className="h-4 bg-gray-300 rounded w-5/6" />
      </div>
    </div>
  </div>
);

export default Loading;