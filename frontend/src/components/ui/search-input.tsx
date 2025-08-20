import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, History, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'suggestion' | 'history' | 'trending';
  category?: string;
  count?: number;
}

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  className?: string;
  autoFocus?: boolean;
  clearable?: boolean;
  disabled?: boolean;
}

export const SearchInput = ({
  value = '',
  placeholder = '搜索...',
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  isLoading = false,
  showSuggestions = true,
  maxSuggestions = 8,
  className,
  autoFocus = false,
  clearable = true,
  disabled = false
}: SearchInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 同步外部value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
      setIsFocused(false);
      setSelectedIndex(-1);
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.text);
    setIsFocused(false);
    setSelectedIndex(-1);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(suggestion.text);
    }
  };

  // 清空输入
  const handleClear = () => {
    setInputValue('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // 获取建议图标
  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'history':
        return <History className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  // 显示的建议列表
  const displaySuggestions = suggestions.slice(0, maxSuggestions);
  const shouldShowSuggestions = showSuggestions && isFocused && displaySuggestions.length > 0;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          placeholder={placeholder}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // 延迟隐藏建议以允许点击
            setTimeout(() => setIsFocused(false), 200);
          }}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
          disabled={disabled}
        />
        
        {clearable && inputValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 建议下拉列表 */}
      {shouldShowSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto"
        >
          {displaySuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={cn(
                'flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50',
                index === selectedIndex && 'bg-blue-50 border-l-2 border-blue-500'
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="mr-3">
                {getSuggestionIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 truncate">
                    {suggestion.text}
                  </span>
                  
                  {suggestion.count && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {suggestion.count}
                    </Badge>
                  )}
                </div>
                
                {suggestion.category && (
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 高级搜索输入组件
export const AdvancedSearchInput = ({
  filters = [],
  onFiltersChange,
  ...props
}: SearchInputProps & {
  filters?: Array<{ key: string; label: string; value: string }>;
  onFiltersChange?: (filters: Array<{ key: string; label: string; value: string }>) => void;
}) => {
  const removeFilter = (key: string) => {
    if (onFiltersChange) {
      onFiltersChange(filters.filter(f => f.key !== key));
    }
  };

  return (
    <div className="space-y-2">
      <SearchInput {...props} />
      
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1"
            >
              <span className="text-xs text-gray-600">{filter.label}:</span>
              <span className="text-xs">{filter.value}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 text-gray-400 hover:text-gray-600"
                onClick={() => removeFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInput;