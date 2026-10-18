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
  ChevronDown,
  Trash2,
  CheckCircle2,
  Terminal,
  FileCode,
  Check,
  AlertTriangle,
  Info
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
  fileHandle?: any; // FileSystemFileHandle nếu dùng File System Access API
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
  const [rootDirectoryHandle, setRootDirectoryHandle] = useState<any>(null);
  const [rootFolderName, setRootFolderName] = useState<string>('');

  // Bộ lọc & Cấu hình rà soát
  const [matchMode, setMatchMode] = useState<'name_only' | 'name_and_size'>('name_only');
  const [ignoreExtension, setIgnoreExtension] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document' | 'audio' | 'video' | 'other'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Chỉ định file được giữ lại (key: groupKey, value: fileId được giữ lại, mặc định là file đầu tiên)
  const [keptFileMap, setKeptFileMap] = useState<Record<string, string>>({});

  // Modal / Trạng thái dọn dẹp
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [isDeletingDirectly, setIsDeletingDirectly] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);
  const [deletedFileIds, setDeletedFileIds] = useState<Set<string>>(new Set());

  const directoryInputRef = useRef<HTMLInputElement>(null);

  // Hỗ trợ File System Access API (showDirectoryPicker)
  const supportsFSA = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // 1. Quét bằng File System Access API (cho phép xóa trực tiếp trên ổ cứng sau khi rà soát)
  const handleScanWithFSA = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!dirHandle) return;

      setRootDirectoryHandle(dirHandle);
      setRootFolderName(dirHandle.name);

      const items: ScannedFileItem[] = [];
      const folderSet = new Set<string>();
      let fileIdx = 0;

      // Hàm đệ quy quét thư mục
      async function scanDir(handle: any, currentPath: string) {
        folderSet.add(currentPath || 'Thư mục gốc');
        // @ts-ignore
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const relPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            items.push({
              id: `fsa-${fileIdx++}-${Date.now()}`,
              name: file.name,
              relativePath: relPath,
              size: file.size,
              lastModified: file.lastModified,
              type: file.type,
              fileObj: file,
              fileHandle: entry
            });
          } else if (entry.kind === 'directory') {
            const nextPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            await scanDir(entry, nextPath);
          }
        }
      }

      await scanDir(dirHandle, '');

      setScanFolderCount(folderSet.size);
      setScannedFiles(items);
      setDeletedFileIds(new Set());
      showToast(`Đã quét xong ${items.length} tệp trong ${folderSet.size} thư mục với quyền đọc/ghi!`, 'success');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Lỗi quét FSA:', err);
        showToast('Không thể quét thư mục: ' + (err.message || 'Lỗi không xác định'), 'error');
      }
    }
  };

  // 2. Quét thông thường (HTML webkitdirectory) nếu trình duyệt không hỗ trợ hoặc người dùng chọn
  const handleDirectorySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setRootDirectoryHandle(null);
    setRootFolderName('');
    setDeletedFileIds(new Set());

    const items: ScannedFileItem[] = [];
    const folderSet = new Set<string>();

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
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

  // Gom nhóm các file trùng nhau (chỉ lấy những file chưa bị xóa)
  const duplicateGroups = useMemo(() => {
    const activeFiles = scannedFiles.filter(f => !deletedFileIds.has(f.id));
    if (activeFiles.length === 0) return [];

    const map = new Map<string, ScannedFileItem[]>();

    activeFiles.forEach(file => {
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
      if (files.length > 1) {
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

    let filtered = groups;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = groups.filter(g => 
        g.fileName.toLowerCase().includes(q) || 
        g.files.some(f => f.relativePath.toLowerCase().includes(q))
      );
    }

    return filtered.sort((a, b) => b.count - a.count || b.totalSize - a.totalSize);
  }, [scannedFiles, deletedFileIds, matchMode, ignoreExtension, filterType, searchQuery]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const totalDuplicatesCount = duplicateGroups.reduce((acc, g) => acc + g.count, 0);
    const totalWastedSize = duplicateGroups.reduce((acc, g) => {
      const keptId = keptFileMap[g.groupKey] || g.files[0]?.id;
      const keptFile = g.files.find(f => f.id === keptId) || g.files[0];
      return acc + (g.totalSize - (keptFile?.size || 0));
    }, 0);

    // Tổng số file sẽ bị xóa nếu kích hoạt chức năng dọn dẹp chừa lại 1 bản
    const filesToDeleteCount = duplicateGroups.reduce((acc, g) => acc + (g.files.length - 1), 0);

    return {
      groupCount: duplicateGroups.length,
      totalDuplicatesCount,
      totalWastedSize,
      filesToDeleteCount
    };
  }, [duplicateGroups, keptFileMap]);

  // Chọn file được giữ lại trong một nhóm
  const handleSelectKeptFile = (groupKey: string, fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setKeptFileMap(prev => ({
      ...prev,
      [groupKey]: fileId
    }));
  };

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Lấy danh sách các file sẽ bị xóa (tất cả các bản sao ngoại trừ bản được giữ lại)
  const filesToDelete = useMemo(() => {
    const list: { groupKey: string; fileName: string; file: ScannedFileItem }[] = [];
    duplicateGroups.forEach(g => {
      const keptId = keptFileMap[g.groupKey] || g.files[0]?.id;
      g.files.forEach(f => {
        if (f.id !== keptId) {
          list.push({
            groupKey: g.groupKey,
            fileName: g.fileName,
            file: f
          });
        }
      });
    });
    return list;
  }, [duplicateGroups, keptFileMap]);

  // Xuất báo cáo danh sách file trùng ra file CSV
  const handleExportCsv = () => {
    if (duplicateGroups.length === 0) return;

    let csvContent = '\uFEFF';
    csvContent += 'Tên Tệp,Trạng Thái Giữ Lại,Số Bản Trùng,Đường Dẫn Tương Đối,Kích Thước (Bytes),Kích Thước Đọc Được,Ngày Sửa Đổi Cuối\n';

    duplicateGroups.forEach(g => {
      const keptId = keptFileMap[g.groupKey] || g.files[0]?.id;
      g.files.forEach(f => {
        const isKept = f.id === keptId;
        const status = isKept ? 'GIỮ LẠI (BẢN GỐC)' : 'FILE TRÙNG CẦN XÓA';
        const escapedName = `"${f.name.replace(/"/g, '""')}"`;
        const escapedPath = `"${f.relativePath.replace(/"/g, '""')}"`;
        csvContent += `${escapedName},${status},${g.count},${escapedPath},${f.size},"${formatBytes(f.size)}","${formatDate(f.lastModified)}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao-Cao-File-Trung-Lap-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo CSV thành công!', 'success');
  };

  // TẠO FILE KỊCH BẢN XÓA TỰ ĐỘNG (BAT / SH)
  // Tạo file script .bat (Windows) để xóa tự động
  const handleDownloadBatchScript = () => {
    if (filesToDelete.length === 0) return;

    let script = `@echo off\r\n`;
    script += `chcp 65001 >nul\r\n`;
    script += `echo ========================================================\r\n`;
    script += `echo   KICH BAN DON DEP FILE TRUNG LAP - RCHG STUDIO\r\n`;
    script += `echo   Tong so ban sao se xoa: ${filesToDelete.length} tep\r\n`;
    script += `echo   Dung luong giai phong du kien: ${formatBytes(stats.totalWastedSize)}\r\n`;
    script += `echo ========================================================\r\n`;
    script += `echo Vui long dat file script nay trong thu muc cha ban da chon quet.\r\n`;
    script += `pause\r\n\r\n`;

    filesToDelete.forEach(item => {
      // Đường dẫn Windows dùng dấu \
      const winPath = item.file.relativePath.replace(/\//g, '\\');
      script += `if exist "${winPath}" ( del /f /q "${winPath}" && echo [DA XOA] "${winPath}" )\r\n`;
    });

    script += `\r\necho.\r\necho ========================================================\r\necho   HOAN TAT! Da xoa thanh cong cac file trung lap.\r\necho ========================================================\r\npause\r\n`;

    const blob = new Blob([script], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xoa-file-trung-windows-${Date.now()}.bat`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file kịch bản xóa cho Windows (.bat)!', 'success');
  };

  // Tạo file script .sh (macOS / Linux) để xóa tự động
  const handleDownloadShellScript = () => {
    if (filesToDelete.length === 0) return;

    let script = `#!/bin/bash\n`;
    script += `# KỊCH BẢN DỌN DẸP FILE TRÙNG LẶP - RCHG STUDIO\n`;
    script += `# Tổng số bản sao sẽ xóa: ${filesToDelete.length} tệp\n`;
    script += `# Dung lượng giải phóng: ${formatBytes(stats.totalWastedSize)}\n`;
    script += `echo "========================================================"\n`;
    script += `echo "  KỊCH BẢN DỌN DẸP FILE TRÙNG LẶP"\n`;
    script += `echo "  Số tệp sẽ xóa: ${filesToDelete.length}"\n`;
    script += `echo "========================================================"\n`;
    script += `read -p "Bạn có chắc chắn muốn xóa không? (y/N): " confirm\n`;
    script += `if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then\n`;
    script += `  echo "Đã hủy thao tác."\n`;
    script += `  exit 0\n`;
    script += `fi\n\n`;

    filesToDelete.forEach(item => {
      script += `if [ -f "${item.file.relativePath}" ]; then\n`;
      script += `  rm -f "${item.file.relativePath}"\n`;
      script += `  echo "[ĐÃ XÓA] ${item.file.relativePath}"\n`;
      script += `fi\n`;
    });

    script += `\necho "========================================================"\n`;
    script += `echo "HOÀN TẤT! Đã xóa xong các file trùng lặp."\n`;
    script += `echo "========================================================"\n`;

    const blob = new Blob([script], { type: 'text/x-sh;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xoa-file-trung-macos-${Date.now()}.sh`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file kịch bản xóa cho macOS/Linux (.sh)!', 'success');
  };

  // 3. THỰC HIỆN XÓA TRỰC TIẾP QUA FILE SYSTEM ACCESS API
  const handleDirectDeleteFromDisk = async () => {
    if (!rootDirectoryHandle) {
      showToast('Thư mục này được quét qua chế độ tải thông thường, hãy dùng tính năng tải file Script Xóa Tự Động hoặc quét lại bằng nút "Quét Với Quyền Ghi".', 'warning');
      return;
    }

    if (!confirm(`XÁC NHẬN XÓA VĨNH VIỄN:\nBạn sắp xóa ${filesToDelete.length} bản sao trùng lặp trực tiếp trên ổ cứng và chỉ chừa lại 1 bản duy nhất cho mỗi nhóm file.\n\nThao tác này KHÔNG THỂ HOÀN TÁC. Bạn có chắc chắn muốn tiếp tục không?`)) {
      return;
    }

    setIsDeletingDirectly(true);
    setDeleteProgress({ current: 0, total: filesToDelete.length, currentFileName: '' });

    const newDeletedIds = new Set(deletedFileIds);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filesToDelete.length; i++) {
      const item = filesToDelete[i];
      setDeleteProgress({
        current: i + 1,
        total: filesToDelete.length,
        currentFileName: item.file.name
      });

      try {
        // Tách đường dẫn tương đối để đi vào từng thư mục con
        const parts = item.file.relativePath.split('/');
        const fileName = parts.pop()!;
        
        let targetDirHandle = rootDirectoryHandle;
        for (const dirName of parts) {
          targetDirHandle = await targetDirHandle.getDirectoryHandle(dirName);
        }

        // Xóa file trực tiếp khỏi ổ đĩa
        await targetDirHandle.removeEntry(fileName);
        newDeletedIds.add(item.file.id);
        successCount++;
      } catch (err: any) {
        console.error(`Không thể xóa file ${item.file.relativePath}:`, err);
        failCount++;
      }
    }

    setDeletedFileIds(newDeletedIds);
    setIsDeletingDirectly(false);
    setDeleteProgress(null);
    setShowCleanupModal(false);

    if (failCount === 0) {
      showToast(`Đã xóa vĩnh viễn thành công ${successCount} tệp trùng lặp! Chỉ còn lại 1 bản gốc duy nhất.`, 'success');
    } else {
      showToast(`Đã xóa ${successCount} tệp, ${failCount} tệp không thể xóa (do quyền truy cập hoặc file đang mở).`, 'warning');
    }
  };

  const resetAll = () => {
    setScannedFiles([]);
    setSearchQuery('');
    setExpandedGroups({});
    setKeptFileMap({});
    setRootDirectoryHandle(null);
    setRootFolderName('');
    setDeletedFileIds(new Set());
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
              Quét toàn bộ thư mục trên máy tính, phát hiện các tệp trùng tên hoặc trùng dung lượng và hỗ trợ <strong>xóa dọn dẹp các bản sao, chỉ giữ lại 1 tệp duy nhất</strong>.
            </p>
          </div>
        </div>

        {scannedFiles.length > 0 && (
          <div className="df-header-actions">
            <button className="df-btn df-btn-outline" onClick={resetAll} disabled={isDeletingDirectly}>
              <RotateCcw size={16} />
              <span>Quét Thư Mục Khác</span>
            </button>
            <button className="df-btn df-btn-outline" onClick={handleExportCsv} disabled={duplicateGroups.length === 0 || isDeletingDirectly}>
              <Download size={16} />
              <span>Xuất CSV</span>
            </button>
            <button 
              className="df-btn df-btn-danger" 
              onClick={() => setShowCleanupModal(true)} 
              disabled={duplicateGroups.length === 0 || isDeletingDirectly}
            >
              <Trash2 size={16} />
              <span>Xóa Bản Trùng (Chừa Lại 1 Bản)</span>
            </button>
          </div>
        )}
      </header>

      {/* Input ẩn để chọn thư mục qua HTML truyền thống */}
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
        <div className="df-upload-container">
          <div className="df-upload-card" onClick={supportsFSA ? handleScanWithFSA : () => directoryInputRef.current?.click()}>
            <div className="df-upload-inner">
              <div className="folder-pulse-icon">
                <FolderUp size={54} />
              </div>
              <h2>Bấm Để Chọn Thư Mục Cần Rà Soát File Trùng</h2>
              <p className="upload-guide">
                {supportsFSA 
                  ? 'Trình duyệt của bạn hỗ trợ chế độ đọc/ghi trực tiếp: Cho phép quét nhanh và Xóa trực tiếp các bản sao thừa ngay trên ổ cứng chỉ với 1 cú click.'
                  : 'Trình duyệt sẽ quét toàn diện tất cả các tệp và cây thư mục con bên trong ổ đĩa của bạn.'}
              </p>

              <div className="upload-cta-buttons">
                {supportsFSA && (
                  <button className="df-btn df-btn-primary" onClick={(e) => { e.stopPropagation(); handleScanWithFSA(); }}>
                    <FolderOpen size={18} />
                    <span>Chọn Thư Mục (Cho Phép Xóa Trực Tiếp)</span>
                  </button>
                )}
                <button className="df-btn df-btn-outline" onClick={(e) => { e.stopPropagation(); directoryInputRef.current?.click(); }}>
                  <FolderSearch size={18} />
                  <span>Chỉ Quét Đọc (Không Cần Cấp Quyền)</span>
                </button>
              </div>

              <div className="privacy-badge">
                <ShieldCheck size={16} className="text-success" />
                <span>100% Bảo Mật: Xử lý hoàn toàn cục bộ trên máy tính của bạn, không tải tệp lên server.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="df-workspace animate-fade-in">
          {/* Thông báo chế độ quét */}
          {rootDirectoryHandle ? (
            <div className="fsa-active-banner">
              <CheckCircle2 size={18} className="text-success" />
              <span>Đang kết nối thư mục <strong>"{rootFolderName}"</strong> ở chế độ <strong>Trực Tiếp</strong>: Bạn có thể chọn file muốn giữ lại và bấm nút xóa trực tiếp trên ổ cứng.</span>
            </div>
          ) : (
            <div className="fsa-info-banner">
              <Info size={18} />
              <span>Bạn đang ở chế độ quét an toàn. Sau khi rà soát, bạn có thể xuất <strong>Kịch bản xóa tự động 1-click (.bat cho Windows hoặc .sh cho Mac)</strong> để hệ thống tự xóa các bản sao và chừa lại đúng 1 tệp duy nhất!</span>
            </div>
          )}

          {/* Thanh Thống Kê Tổng Quan */}
          <div className="df-stats-strip">
            <div className="stat-box">
              <span className="stat-label">Tổng tệp còn lại</span>
              <span className="stat-value">{(scannedFiles.length - deletedFileIds.size).toLocaleString('vi-VN')}</span>
              <span className="stat-sub">{scanFolderCount} Thư mục con</span>
            </div>

            <div className="stat-box highlight-warning">
              <span className="stat-label">Nhóm file trùng</span>
              <span className="stat-value">{stats.groupCount}</span>
              <span className="stat-sub">{stats.totalDuplicatesCount} Bản sao chép</span>
            </div>

            <div className="stat-box highlight-danger">
              <span className="stat-label">Dung lượng dọn dẹp</span>
              <span className="stat-value">{formatBytes(stats.totalWastedSize)}</span>
              <span className="stat-sub">Sẽ giải phóng nếu xóa bản trùng</span>
            </div>

            <div className="stat-box highlight-action">
              <span className="stat-label">Bản sao thừa cần xóa</span>
              <span className="stat-value">{stats.filesToDeleteCount}</span>
              <button 
                className="stat-action-btn" 
                onClick={() => setShowCleanupModal(true)}
                disabled={stats.filesToDeleteCount === 0}
              >
                <Trash2 size={14} />
                <span>Dọn dẹp ngay</span>
              </button>
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
                <h3>Tuyệt Vời! Không Còn File Trùng Nào</h3>
                <p>Tất cả các tệp trong thư mục đã quét đều có tên duy nhất hoặc đã được dọn dẹp sạch sẽ chỉ chừa lại 1 bản duy nhất.</p>
              </div>
            ) : (
              duplicateGroups.map(group => {
                const isExpanded = !!expandedGroups[group.groupKey];
                const keptId = keptFileMap[group.groupKey] || group.files[0]?.id;

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
                        <span className="keep-notice">
                          (Đang chừa lại: 1 bản, sẽ xóa {group.files.length - 1} bản)
                        </span>
                      </div>
                    </div>

                    {/* Danh Sách Các Vị Trí Trùng Bên Trong */}
                    {isExpanded && (
                      <div className="group-files-table animate-fade-in">
                        <div className="table-header-row">
                          <span style={{ width: '130px' }}>Hành Động</span>
                          <span>Đường Dẫn Chi Tiết Trong Thư Mục</span>
                          <span>Dung Lượng</span>
                          <span>Ngày Sửa Đổi</span>
                        </div>
                        {group.files.map((file, idx) => {
                          const isKept = file.id === keptId;

                          return (
                            <div key={file.id} className={`table-file-row ${isKept ? 'row-kept' : 'row-to-delete'}`}>
                              <div className="action-cell">
                                <button 
                                  className={`keep-badge-btn ${isKept ? 'is-kept' : 'is-delete'}`}
                                  onClick={(e) => handleSelectKeptFile(group.groupKey, file.id, e)}
                                  title={isKept ? 'Tệp này đang được chọn để GIỮ LẠI' : 'Bấm vào đây để chọn tệp này giữ lại'}
                                >
                                  {isKept ? (
                                    <>
                                      <Check size={14} />
                                      <span>GIỮ LẠI BẢN NÀY</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={13} />
                                      <span>SẼ XÓA</span>
                                    </>
                                  )}
                                </button>
                              </div>

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
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN & CHỌN CÁCH XÓA DỌN DẸP */}
      {showCleanupModal && (
        <div className="df-modal-overlay animate-fade-in" onClick={() => !isDeletingDirectly && setShowCleanupModal(false)}>
          <div className="df-modal-card" onClick={e => e.stopPropagation()}>
            <div className="df-modal-header">
              <div className="modal-title-with-icon">
                <Trash2 size={24} className="text-danger" />
                <h3>Dọn Dẹp File Trùng - Chừa Lại 1 Bản Duy Nhất</h3>
              </div>
              {!isDeletingDirectly && (
                <button className="modal-close-btn" onClick={() => setShowCleanupModal(false)}>×</button>
              )}
            </div>

            <div className="df-modal-body">
              {/* Thống kê sẽ dọn dẹp */}
              <div className="cleanup-summary-box">
                <div className="cs-item">
                  <span className="cs-label">Số nhóm file trùng:</span>
                  <span className="cs-val">{duplicateGroups.length}</span>
                </div>
                <div className="cs-item">
                  <span className="cs-label">Số bản sao thừa sẽ bị xóa:</span>
                  <span className="cs-val text-danger">{filesToDelete.length} tệp</span>
                </div>
                <div className="cs-item">
                  <span className="cs-label">Số tệp gốc được giữ lại:</span>
                  <span className="cs-val text-success">{duplicateGroups.length} tệp (1 tệp / mỗi nhóm)</span>
                </div>
                <div className="cs-item">
                  <span className="cs-label">Dung lượng giải phóng ước tính:</span>
                  <span className="cs-val text-primary">{formatBytes(stats.totalWastedSize)}</span>
                </div>
              </div>

              {/* Tiến trình xóa trực tiếp nếu đang chạy */}
              {isDeletingDirectly && deleteProgress && (
                <div className="delete-progress-container animate-fade-in">
                  <div className="progress-bar-wrap">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="progress-text-row">
                    <span>Đang xóa: {deleteProgress.current} / {deleteProgress.total}</span>
                    <span className="current-deleting-file">{deleteProgress.currentFileName}</span>
                  </div>
                </div>
              )}

              {/* Các phương thức xóa */}
              <div className="cleanup-methods">
                <h4>Chọn phương thức dọn dẹp:</h4>

                {/* Phương thức 1: Xóa trực tiếp trên đĩa (nếu có rootDirectoryHandle) */}
                {rootDirectoryHandle ? (
                  <div className="method-card direct-method">
                    <div className="method-info">
                      <div className="method-badge-rec">Khuyên Dùng</div>
                      <h5>⚡ Xóa Trực Tiếp Vĩnh Viễn Trên Ổ Đĩa</h5>
                      <p>
                        Trình duyệt sẽ tự động xóa ngay lập tức {filesToDelete.length} bản sao thừa và giữ lại đúng 1 bản duy nhất cho bạn.
                      </p>
                    </div>
                    <button 
                      className="df-btn df-btn-danger" 
                      onClick={handleDirectDeleteFromDisk}
                      disabled={isDeletingDirectly || filesToDelete.length === 0}
                    >
                      <Trash2 size={16} />
                      <span>{isDeletingDirectly ? 'Đang Xóa...' : 'Xóa Trực Tiếp Ngay'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="method-card-fsa-promo">
                    <AlertTriangle size={20} className="text-warning" />
                    <div>
                      <strong>Bạn muốn xóa tự động 100% bằng 1-Click ngay trên web?</strong>
                      <p>Hãy bấm vào nút <strong>"Quét Với Quyền Ghi"</strong> ở đầu trang để cấp quyền xóa trực tiếp trên ổ cứng mà không cần chạy file script.</p>
                    </div>
                  </div>
                )}

                {/* Phương thức 2: Tải Script Xóa 1-Click cho Windows */}
                <div className="method-card">
                  <div className="method-info">
                    <div className="method-icon-title">
                      <Terminal size={18} className="text-primary" />
                      <h5>Tải Kịch Bản Xóa Tự Động Cho Windows (.bat)</h5>
                    </div>
                    <p>
                      Tải file <code>.bat</code> về và chạy tại thư mục cha. Script sẽ tự động xóa chính xác {filesToDelete.length} bản sao trùng và giữ lại 1 bản theo đúng thiết lập của bạn.
                    </p>
                  </div>
                  <button className="df-btn df-btn-outline" onClick={handleDownloadBatchScript}>
                    <Download size={15} />
                    <span>Tải File .BAT</span>
                  </button>
                </div>

                {/* Phương thức 3: Tải Script Xóa cho macOS / Linux */}
                <div className="method-card">
                  <div className="method-info">
                    <div className="method-icon-title">
                      <FileCode size={18} className="text-secondary" />
                      <h5>Tải Kịch Bản Xóa Cho macOS / Linux (.sh)</h5>
                    </div>
                    <p>
                      Tải file shell script <code>.sh</code> an toàn, có thông báo xác nhận trước khi thực hiện xóa các tệp trùng.
                    </p>
                  </div>
                  <button className="df-btn df-btn-outline" onClick={handleDownloadShellScript}>
                    <Download size={15} />
                    <span>Tải File .SH</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="df-modal-footer">
              <button 
                className="df-btn df-btn-outline" 
                onClick={() => setShowCleanupModal(false)}
                disabled={isDeletingDirectly}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
