import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Search, 
  Users, 
  Building2, 
  Database, 
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';

// 空状态图标映射
const iconMap = {
  search: Search,
  data: Database,
  users: Users,
  enterprises: Building2,
  files: FileText,
  error: AlertCircle,
  default: FileText
};

export interface EmptyStateProps {
  icon?: keyof typeof iconMap;
  title: string;
  description?: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState = ({
  icon = 'default',
  title,
  description,
  actionLabel,
  secondaryActionLabel,
  onAction,
  onSecondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) => {
  const IconComponent = iconMap[icon];
  
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      container: 'py-20',
      icon: 'w-20 h-20',
      title: 'text-2xl',
      description: 'text-lg'
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size].container,
      className
    )}>
      <div className={cn(
        'mx-auto flex items-center justify-center rounded-full bg-gray-100 mb-4',
        sizeClasses[size].icon,
        'p-3'
      )}>
        <IconComponent className={cn(
          'text-gray-400',
          sizeClasses[size].icon
        )} />
      </div>
      
      <h3 className={cn(
        'font-semibold text-gray-900 mb-2',
        sizeClasses[size].title
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-gray-500 mb-6 max-w-sm',
          sizeClasses[size].description
        )}>
          {description}
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button 
            variant="outline" 
            onClick={onSecondaryAction}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

// 预定义的空状态组件
export const NoSearchResults = ({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm?: string; 
  onClear?: () => void;
}) => (
  <EmptyState
    icon="search"
    title="未找到搜索结果"
    description={searchTerm ? `没有找到与"${searchTerm}"相关的内容，请尝试其他关键词。` : '请输入关键词进行搜索。'}
    secondaryActionLabel="清除搜索"
    onSecondaryAction={onClear}
  />
);

export const NoData = ({ 
  type = '数据',
  actionLabel,
  onAction
}: { 
  type?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <EmptyState
    icon="data"
    title={`暂无${type}`}
    description={`系统中还没有${type}，您可以添加第一条记录。`}
    actionLabel={actionLabel}
    onAction={onAction}
  />
);

export const NoUsers = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="users"
    title="暂无用户"
    description="系统中还没有用户，请添加第一个用户。"
    actionLabel="添加用户"
    onAction={onAdd}
  />
);

export const NoEnterprises = ({ onAdd }: { onAdd?: () => void }) => (
  <EmptyState
    icon="enterprises"
    title="暂无企业"
    description="企业数据库为空，请添加企业信息开始分析。"
    actionLabel="添加企业"
    onAction={onAdd}
  />
);

export const NoFiles = ({ onUpload }: { onUpload?: () => void }) => (
  <EmptyState
    icon="files"
    title="暂无文件"
    description="还没有上传任何文件，请上传文件开始处理。"
    actionLabel="上传文件"
    onAction={onUpload}
  />
);

export const ErrorState = ({ 
  title = "出现错误",
  description = "系统遇到了一些问题，请稍后重试。",
  onRetry
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) => (
  <EmptyState
    icon="error"
    title={title}
    description={description}
    secondaryActionLabel="重试"
    onSecondaryAction={onRetry}
  />
);

// 带插图的空状态（可选）
export const IllustratedEmptyState = ({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className
}: {
  illustration?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center text-center py-12',
    className
  )}>
    {illustration && (
      <img 
        src={illustration} 
        alt="Empty state illustration"
        className="w-64 h-64 mb-6 object-contain"
      />
    )}
    
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      {title}
    </h3>
    
    {description && (
      <p className="text-gray-500 mb-6 max-w-md">
        {description}
      </p>
    )}
    
    {actionLabel && onAction && (
      <Button onClick={onAction} className="gap-2">
        <Plus className="w-4 h-4" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;