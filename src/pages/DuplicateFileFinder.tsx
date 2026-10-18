import React, { useState, useRef, useMemo } from 'react';
import { 
  FolderSearch, 
  FolderUp, 
  FileText, 
  Download, 
  Search, 
  RotateCcw, 
  ShieldCheck, 
  FolderOpen,
  Layers,
  FileCheck,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './DuplicateFileFinder.css';

export interface ScannedFileItem {
  id: string;
  name: string;
  relativePath: string;
  size: number;
  lastModified: number;
  type: string;
  fileObj?: File;
}

export interface DuplicateGroup {
  groupKey: string; // Tên file hoặc name+size
  fileName: string;
  count: number;
  totalSize: number;
  files: ScannedFileItem[];
}

export default function DuplicateFileFinder() {
  const { showToast } = useNotification();
  const [scannedFiles, setScannedFiles] = useState<ScannedFileItem[]>([]);
  const [scanFolderCount, setScanFolderCount] = useState(0);

  // Bộ lọc & Cấu hình rà soát
  const [matchMode, setMatchMode] = useState<'name_only' | 'name_and_size'>('name_only');
  const [ignoreExtension, setIgnoreExtension] = useState(false); // Bỏ qua đuôi file (.png vs .jpg)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'audio' | 'video' | 'other'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const directoryInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn cả thư mục
  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setScannedFiles([]);

    const items: ScannedFileItem[] = [];
    const folderSet = new Set<string>();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // relativePath từ webkitRelativePath
      const relPath = file.webkitRelativePath || file.name;
      const folderPath = relPath.substring(0, relPath.lastIndexOf('/')) || 'Thư mục gốc';
      folderSet.add(folderPath);

      items.push({
        id: `f-${i}-${Date.now()}`,
        name: file.name,
        relativePath: relPath,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type,
        fileObj: file
      });
    }

    setScanFolderCount(folderSet.size);
    setScannedFiles(items);
    showToast(`Đã quét xong ${items.length} tệp trong ${folderSet.size} thư mục!`, 'success');

    // Reset input
    if (directoryInputRef.current) {
      directoryInputRef.current.value = '';
    }
  };

  // Chuẩn hóa tên file để so sánh
  const getNormalizedKey = (name: string, size: number) => {
    let target = name.trim().toLowerCase();
    if (ignoreExtension) {
      const lastDot = target.lastIndexOf('.');
      if (lastDot > 0) {
        target = target.substring(0, lastDot);
      }
    }
    if (matchMode === 'name_and_size') {
      return `${target}__size_${size}`;
    }
    return target;
  };

  // Gom nhóm các file trùng nhau
  const duplicateGroups = useMemo(() => {
    if (scannedFiles.length === 0) return [];

    const map = new Map<string, ScannedFileItem[]>();

    scannedFiles.forEach(file => {
      // Phân loại bộ lọc loại tệp
      if (filterType !== 'all') {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (filterType === 'image' && !['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return;
        if (filterType === 'document' && !['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'txt'].includes(ext)) return;
        if (filterType === 'audio' && !['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return;
        if (filterType === 'video' && !['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return;
      }

      const key = getNormalizedKey(file.name, file.size);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(file);
    });

    const groups: DuplicateGroup[] = [];
    map.forEach((files, key) => {
      if (files.length > 1) { // Chỉ lấy nhóm có từ 2 file trở lên
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        groups.push({
          groupKey: key,
          fileName: files[0].name,
          count: files.length,
          totalSize,
          files
        });
      }
    });

    // Lọc theo tìm kiếm từ khóa
    let filtered = groups;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = groups.filter(g => 
        g.fileName.toLowerCase().includes(q) || 
        g.files.some(f => f.relativePath.toLowerCase().includes(q))
      );
    }

    // Sắp xếp theo số lượng file trùng giảm dần
    return filtered.sort((a, b) => b.count - a.count || b.totalSize - a.totalSize);
  }, [scannedFiles, matchMode, ignoreExtension, filterType, searchQuery]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const totalDuplicatesCount = duplicateGroups.reduce((acc, g) => acc + g.count, 0);
    const totalWastedSize = duplicateGroups.reduce((acc, g) => {
      // Dung lượng lãng phí = tổng dung lượng nhóm - dung lượng 1 file gốc
      return acc + (g.totalSize - (g.files[0]?.size || 0));
    }, 0);

    return {
      groupCount: duplicateGroups.length,
      totalDuplicatesCount,
      totalWastedSize
    };
  }, [duplicateGroups]);

  // Đổi trạng thái mở rộng nhóm
  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = duplicateGroups.every(g => expandedGroups[g.groupKey]);
    const newState: Record<string, boolean> = {};
    duplicateGroups.forEach(g => {
      newState[g.groupKey] = !allExpanded;
    });
    setExpandedGroups(newState);
  };

  // Định dạng kích thước dung lượng
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Định dạng ngày sửa đổi
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Xuất báo cáo danh sách file trùng ra file CSV
  const handleExportCsv = () => {
    if (duplicateGroups.length === 0) return;

    let csvContent = '\uFEFF'; // BOM cho tiếng Việt Excel
    csvContent += 'Tên Tệp,Số Bản Trùng,Đường Dẫn Tương Đối,Kích Thước (Bytes),Kích Thước Đọc Được,Ngày Sửa Đổi Cuối\n';

    duplicateGroups.forEach(g => {
      g.files.forEach(f => {
        const escapedName = `"${f.name.replace(/"/g, '""')}"`;
        const escapedPath = `"${f.relativePath.replace(/"/g, '""')}"`;
        csvContent += `${escapedName},${g.count},${escapedPath},${f.size},"${formatBytes(f.size)}","${formatDate(f.lastModified)}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh-Sach-File-Trung-Lap-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo CSV thành công!', 'success');
  };

  const resetAll = () => {
    setScannedFiles([]);
    setSearchQuery('');
    setExpandedGroups({});
  };

  return (
    <div className="dup-finder-page animate-fade-in">
      {/* Header */}
      <header className="df-header">
        <div className="df-title-group">
          <div className="df-icon">
            <FolderSearch size={28} />
          </div>
          <div>
            <h1 className="df-title">Rà Soát & Tìm Kiếm File Trùng Tên Trong Thư Mục (Duplicate File Finder)</h1>
            <p className="df-subtitle">
              Quét toàn bộ thư mục và các thư mục con trong máy tính, phát hiện các tệp trùng tên, trùng dung lượng, hiển thị đường dẫn chi tiết và xuất báo cáo CSV giải phóng bộ nhớ.
            </p>
          </div>
        </div>

        {scannedFiles.length > 0 && (
          <div className="df-header-actions">
            <button className="df-btn df-btn-outline" onClick={resetAll}>
              <RotateCcw size={16} />
              <span>Quét Thư Mục Khác</span>
            </button>
            <button className="df-btn df-btn-primary" onClick={handleExportCsv} disabled={duplicateGroups.length === 0}>
              <Download size={16} />
              <span>Xuất Báo Cáo CSV</span>
            </button>
          </div>
        )}
      </header>

      {/* Input ẩn để chọn thư mục */}
      <input 
        type="file"
        ref={directoryInputRef}
        onChange={handleDirectorySelect}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
      />

      {/* Màn hình khởi tạo: Chọn thư mục quét */}
      {scannedFiles.length === 0 ? (
        <div className="df-upload-card" onClick={() => directoryInputRef.current?.click()}>
          <div className="df-upload-inner">
            <div className="folder-pulse-icon">
              <FolderUp size={54} />
            </div>
            <h2>Bấm Để Chọn Thư Mục Cần Rà Soát File Trùng</h2>
            <p className="upload-guide">
              Trình duyệt sẽ quét toàn diện tất cả các tệp và cây thư mục con bên trong ổ đĩa của bạn.
            </p>
            <div className="privacy-badge">
              <ShieldCheck size={16} className="text-success" />
              <span>100% Bảo Mật: Xử lý hoàn toàn cục bộ trên máy tính của bạn, không tải tệp lên server.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="df-workspace animate-fade-in">
          {/* Thanh Thống Kê Tổng Quan */}
          <div className="df-stats-strip">
            <div className="stat-box">
              <span className="stat-label">Tổng tệp đã quét</span>
              <span className="stat-value">{scannedFiles.length.toLocaleString('vi-VN')}</span>
              <span className="stat-sub">{scanFolderCount} Thư mục con</span>
            </div>

            <div className="stat-box highlight-warning">
              <span className="stat-label">Nhóm file trùng tên</span>
              <span className="stat-value">{stats.groupCount}</span>
              <span className="stat-sub">{stats.totalDuplicatesCount} Bản sao chép</span>
            </div>

            <div className="stat-box highlight-danger">
              <span className="stat-label">Dung lượng lãng phí</span>
              <span className="stat-value">{formatBytes(stats.totalWastedSize)}</span>
              <span className="stat-sub">Có thể dọn dẹp</span>
            </div>
          </div>

          {/* Bộ Lọc & Tìm Kiếm */}
          <div className="df-filter-bar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên file hoặc đường dẫn thư mục..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            <div className="filter-options">
              {/* Tiêu chí trùng */}
              <div className="filter-group">
                <span className="filter-label">Tiêu chí:</span>
                <select 
                  className="filter-select"
                  value={matchMode}
                  onChange={e => setMatchMode(e.target.value as any)}
                >
                  <option value="name_only">Trùng tên file</option>
                  <option value="name_and_size">Trùng cả tên & dung lượng (Chính xác 100%)</option>
                </select>
              </div>

              {/* Loại tệp */}
              <div className="filter-group">
                <span className="filter-label">Loại file:</span>
                <select 
                  className="filter-select"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                >
                  <option value="all">Tất cả định dạng</option>
                  <option value="document">Tài liệu (PDF, Word, Excel, PPT)</option>
                  <option value="image">Hình ảnh (JPG, PNG, GIF, WebP)</option>
                  <option value="audio">Âm thanh (MP3, WAV)</option>
                  <option value="video">Video (MP4, MKV)</option>
                </select>
              </div>

              {/* Toggle bỏ qua phần mở rộng */}
              <label className="checkbox-label" title="Ví dụ: 'bao-cao.pdf' và 'bao-cao.docx' coi như trùng">
                <input 
                  type="checkbox"
                  checked={ignoreExtension}
                  onChange={e => setIgnoreExtension(e.target.checked)}
                />
                <span>Bỏ qua đuôi file</span>
              </label>

              <button className="df-btn-sm" onClick={toggleExpandAll}>
                <Layers size={14} />
                <span>Mở / Đóng Tất Cả</span>
              </button>
            </div>
          </div>

          {/* Danh Sách Các Nhóm File Trùng */}
          <div className="df-groups-list">
            {duplicateGroups.length === 0 ? (
              <div className="no-duplicates-card">
                <FileCheck size={48} className="text-success" />
                <h3>Tuyệt Vời! Không Tìm Thấy File Trùng Nào</h3>
                <p>Tất cả các tệp trong thư mục đã quét đều có tên duy nhất hoặc không khớp với tiêu chí tìm kiếm hiện tại.</p>
              </div>
            ) : (
              duplicateGroups.map(group => {
                const isExpanded = !!expandedGroups[group.groupKey];
                return (
                  <div key={group.groupKey} className="dup-group-card">
                    {/* Header Nhóm */}
                    <div className="group-header" onClick={() => toggleGroupExpand(group.groupKey)}>
                      <div className="group-header-left">
                        <button className="expand-chevron-btn">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <FileText size={20} className="file-icon" />
                        <span className="group-filename">{group.fileName}</span>
                        <span className="duplicate-count-badge">{group.count} bản trùng</span>
                      </div>

                      <div className="group-header-right">
                        <span className="group-size-info">
                          Tổng dung lượng: <strong>{formatBytes(group.totalSize)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Danh Sách Các Vị Trí Trùng Bên Trong */}
                    {isExpanded && (
                      <div className="group-files-table animate-fade-in">
                        <div className="table-header-row">
                          <span>Đường Dẫn Chi Tiết Trong Thư Mục</span>
                          <span>Dung Lượng</span>
                          <span>Ngày Sửa Đổi</span>
                        </div>
                        {group.files.map((file, idx) => (
                          <div key={file.id} className="table-file-row">
                            <div className="path-cell">
                              <span className="index-tag">#{idx + 1}</span>
                              <FolderOpen size={16} className="folder-icon" />
                              <span className="path-text" title={file.relativePath}>
                                {file.relativePath}
                              </span>
                            </div>
                            <div className="size-cell">
                              {formatBytes(file.size)}
                            </div>
                            <div className="date-cell">
                              {formatDate(file.lastModified)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
