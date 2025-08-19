import React, { useState, useCallback, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react';
import { ApiService } from '@/services/api';
// import { toast } from '@/components/ui/use-toast';

interface UploadedFileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  totalRows: number;
  columns: Array<{
    name: string;
    type: string;
    sampleValues: any[];
    emptyCount: number;
    uniqueCount: number;
  }>;
  previewData: any[];
  uploadTime: string;
}

interface ImportJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorMessages: string[];
  startTime: string;
  endTime?: string;
  estimatedRemainingTime?: number;
}

const DataImportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // 导入配置
  const [importConfig, setImportConfig] = useState({
    dataType: 'enterprises',
    hasHeader: true,
    encoding: 'utf8',
    batchSize: 100,
    skipDuplicates: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 文件上传处理
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      alert('只支持 Excel (.xlsx, .xls) 和 CSV 文件');
      return;
    }

    // 检查文件大小
    if (file.size > 50 * 1024 * 1024) {
      alert('文件大小不能超过 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const result = await ApiService.Import.uploadFile(file, {
        hasHeader: importConfig.hasHeader,
        encoding: importConfig.encoding
      });

      if (result.success) {
        setUploadedFile(result.data);
        setActiveTab('preview');
        alert(`文件上传成功！已解析 ${result.data.totalRows} 行数据`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`上传失败: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  }, [importConfig]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 开始导入
  const handleStartImport = async () => {
    if (!uploadedFile) return;

    setIsImporting(true);
    try {
      const result = await ApiService.Import.startImport(
        uploadedFile.fileName,
        uploadedFile.filePath,
        importConfig.dataType,
        {
          batchSize: importConfig.batchSize,
          skipDuplicates: importConfig.skipDuplicates
        }
      );

      if (result.success) {
        alert(`导入任务已启动！任务ID: ${result.data.jobId}`);
        
        // 切换到任务监控标签
        setActiveTab('jobs');
        
        // 刷新任务列表
        await loadImportJobs();
        
        // 开始轮询任务状态
        startJobPolling(result.data.jobId);
      }
    } catch (error) {
      console.error('Import start error:', error);
      toast({
        title: "启动导入失败",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 加载导入任务列表
  const loadImportJobs = async () => {
    try {
      const result = await ApiService.Import.getAllImportJobs();
      if (result.success) {
        setImportJobs(result.data);
      }
    } catch (error) {
      console.error('Load import jobs error:', error);
    }
  };

  // 轮询任务状态
  const startJobPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await ApiService.Import.getImportStatus(jobId);
        if (result.success) {
          const job = result.data;
          
          // 更新任务列表中的对应任务
          setImportJobs(prev => 
            prev.map(j => j.id === jobId ? job : j)
          );
          
          // 如果任务完成或失败，停止轮询
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval);
            
            if (job.status === 'completed') {
              toast({
                title: "导入完成",
                description: `成功导入 ${job.successfulRows} 行数据`,
              });
            } else {
              toast({
                title: "导入失败",
                description: job.errorMessages.join(', '),
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        clearInterval(interval);
        console.error('Poll job status error:', error);
      }
    }, 2000); // 每2秒轮询一次

    // 30秒后停止轮询（防止无限轮询）
    setTimeout(() => clearInterval(interval), 30000);
  };

  // 下载模板
  const handleDownloadTemplate = (type: 'enterprises' | 'clients') => {
    const url = ApiService.Import.getTemplateUrl(type);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 获取状态badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />处理中</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />完成</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 页面加载时获取任务列表
  React.useEffect(() => {
    loadImportJobs();
  }, []);

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">数据导入</h1>
            <p className="text-muted-foreground mt-2">
              批量导入企业、客户等数据，支持Excel和CSV格式
            </p>
          </div>
          
          {/* 下载模板按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('enterprises')}
            >
              <Download className="w-4 h-4 mr-2" />
              企业模板
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadTemplate('clients')}
            >
              <Download className="w-4 h-4 mr-2" />
              客户模板
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="upload">文件上传</TabsTrigger>
            <TabsTrigger value="preview">预览配置</TabsTrigger>
            <TabsTrigger value="jobs">任务监控</TabsTrigger>
          </TabsList>

          {/* 文件上传标签页 */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>上传数据文件</CardTitle>
                <CardDescription>
                  支持Excel (.xlsx, .xls) 和 CSV 格式，最大文件大小 50MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 文件上传区域 */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {isUploading ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">正在上传...</p>
                      <Progress value={50} className="w-full max-w-xs mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">
                        {isDragActive ? '松开鼠标上传文件' : '拖拽文件到这里或点击选择文件'}
                      </p>
                      <p className="text-sm text-gray-500">
                        支持 .xlsx, .xls, .csv 格式
                      </p>
                    </div>
                  )}
                </div>

                {/* 上传配置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>数据类型</Label>
                    <Select 
                      value={importConfig.dataType} 
                      onValueChange={(value) => setImportConfig(prev => ({...prev, dataType: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enterprises">企业数据</SelectItem>
                        <SelectItem value="clients">客户数据</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>编码格式</Label>
                    <Select 
                      value={importConfig.encoding} 
                      onValueChange={(value) => setImportConfig(prev => ({...prev, encoding: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf8">UTF-8</SelectItem>
                        <SelectItem value="gbk">GBK</SelectItem>
                        <SelectItem value="gb2312">GB2312</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasHeader" 
                    checked={importConfig.hasHeader}
                    onCheckedChange={(checked) => setImportConfig(prev => ({...prev, hasHeader: !!checked}))}
                  />
                  <Label htmlFor="hasHeader">文件包含标题行</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 预览配置标签页 */}
          <TabsContent value="preview">
            {uploadedFile ? (
              <div className="space-y-6">
                {/* 文件信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      文件信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">文件名</Label>
                        <p className="text-muted-foreground">{uploadedFile.fileName}</p>
                      </div>
                      <div>
                        <Label className="font-medium">文件大小</Label>
                        <p className="text-muted-foreground">{formatFileSize(uploadedFile.fileSize)}</p>
                      </div>
                      <div>
                        <Label className="font-medium">数据行数</Label>
                        <p className="text-muted-foreground">{uploadedFile.totalRows.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="font-medium">列数</Label>
                        <p className="text-muted-foreground">{uploadedFile.columns.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 列信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle>数据列信息</CardTitle>
                    <CardDescription>系统自动识别的列类型和示例数据</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>列名</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>示例值</TableHead>
                          <TableHead>唯一值</TableHead>
                          <TableHead>空值数</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadedFile.columns.map((column, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{column.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{column.type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {column.sampleValues.slice(0, 2).join(', ')}
                              {column.sampleValues.length > 2 && '...'}
                            </TableCell>
                            <TableCell>{column.uniqueCount}</TableCell>
                            <TableCell>{column.emptyCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* 数据预览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      数据预览
                    </CardTitle>
                    <CardDescription>前10行数据预览</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {uploadedFile.columns.map((column, index) => (
                              <TableHead key={index}>{column.name}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedFile.previewData.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {uploadedFile.columns.map((column, colIndex) => (
                                <TableCell key={colIndex} className="text-sm">
                                  {row[column.name] || '-'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* 导入配置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>导入设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>批次大小</Label>
                        <Input
                          type="number"
                          value={importConfig.batchSize}
                          onChange={(e) => setImportConfig(prev => ({
                            ...prev, 
                            batchSize: parseInt(e.target.value) || 100
                          }))}
                          min={10}
                          max={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          每批处理的记录数，建议100-500
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="skipDuplicates" 
                        checked={importConfig.skipDuplicates}
                        onCheckedChange={(checked) => setImportConfig(prev => ({
                          ...prev, 
                          skipDuplicates: !!checked
                        }))}
                      />
                      <Label htmlFor="skipDuplicates">跳过重复数据</Label>
                      <p className="text-xs text-muted-foreground ml-2">
                        根据唯一标识符（如统一社会信用代码）跳过重复记录
                      </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={handleStartImport}
                        disabled={isImporting}
                        className="flex-1"
                      >
                        {isImporting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            启动中...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            开始导入
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setUploadedFile(null);
                          setActiveTab('upload');
                        }}
                      >
                        重新上传
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    请先上传文件
                  </p>
                  <Button 
                    onClick={() => setActiveTab('upload')} 
                    className="mt-4"
                    variant="outline"
                  >
                    返回上传
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 任务监控标签页 */}
          <TabsContent value="jobs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">导入任务</h2>
                <Button onClick={loadImportJobs} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>

              {importJobs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      暂无导入任务
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{job.fileName}</h3>
                            <p className="text-sm text-muted-foreground">
                              任务ID: {job.id}
                            </p>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>

                        {/* 进度条 */}
                        {job.status === 'processing' && (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>进度: {job.processedRows.toLocaleString()} / {job.totalRows.toLocaleString()}</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} />
                            {job.estimatedRemainingTime && (
                              <p className="text-xs text-muted-foreground">
                                预计剩余时间: {formatDuration(job.estimatedRemainingTime)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* 任务统计 */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <Label className="font-medium">总行数</Label>
                            <p className="text-muted-foreground">{job.totalRows.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="font-medium">成功</Label>
                            <p className="text-green-600">{job.successfulRows.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="font-medium">失败</Label>
                            <p className="text-red-600">{job.failedRows.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="font-medium">开始时间</Label>
                            <p className="text-muted-foreground">
                              {new Date(job.startTime).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* 错误信息 */}
                        {job.errorMessages.length > 0 && (
                          <Alert className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>错误信息:</strong>
                              <ul className="mt-2 space-y-1">
                                {job.errorMessages.map((error, index) => (
                                  <li key={index} className="text-sm">• {error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DataImportPage;