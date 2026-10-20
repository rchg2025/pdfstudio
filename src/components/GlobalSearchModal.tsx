import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  GraduationCap, 
  Link as LinkIcon,
  CornerDownLeft
} from 'lucide-react';
import { ALL_TOOLS } from '../data/toolsConfig';
import type { ToolItem } from '../data/toolsConfig';
import './GlobalSearchModal.css';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_META: Record<ToolItem['category'], { label: string; icon: React.ReactNode; color: string }> = {
  edtech: {
    label: 'Giảng Dạy & LMS',
    icon: <GraduationCap size={14} />,
    color: '#10b981'
  },
  pdf: {
    label: 'Công Cụ PDF',
    icon: <FileText size={14} />,
    color: '#0284c7'
  },
  image: {
    label: 'Ảnh & Đồ Họa AI',
    icon: <ImageIcon size={14} />,
    color: '#8b5cf6'
  },
  other: {
    label: 'Tiện Ích Khác',
    icon: <LinkIcon size={14} />,
    color: '#f59e0b'
  }
};

// Loại bỏ dấu tiếng Việt để tìm kiếm không dấu / có dấu đều trúng
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | ToolItem['category']>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setSelectedCategory('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Lọc danh sách công cụ
  const filteredTools = useMemo(() => {
    const rawQuery = searchTerm.trim();
    const queryNormalized = removeVietnameseTones(rawQuery);

    let tools = ALL_TOOLS;
    if (selectedCategory !== 'all') {
      tools = tools.filter(t => t.category === selectedCategory);
    }

    if (!rawQuery) {
      // Khi chưa gõ gì: ưu tiên hiển thị các công cụ hot / phổ biến
      return tools
        .slice()
        .sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          return (b.priority || 0) - (a.priority || 0);
        })
        .slice(0, 12);
    }

    return tools
      .map(tool => {
        let score = 0;
        const titleNormalized = removeVietnameseTones(tool.title);
        const descNormalized = removeVietnameseTones(tool.desc);
        const pathNormalized = removeVietnameseTones(tool.path);
        const kwNormalized = (tool.keywords || []).map(k => removeVietnameseTones(k)).join(' ');

        if (titleNormalized.includes(queryNormalized)) score += 100;
        if (titleNormalized.startsWith(queryNormalized)) score += 50;
        if (kwNormalized.includes(queryNormalized)) score += 60;
        if (descNormalized.includes(queryNormalized)) score += 20;
        if (pathNormalized.includes(queryNormalized)) score += 30;

        // Tách từ khóa tìm kiếm từng từ một
        const words = queryNormalized.split(/\s+/).filter(Boolean);
        const allWordsMatch = words.every(w => 
          titleNormalized.includes(w) || 
          descNormalized.includes(w) || 
          kwNormalized.includes(w)
        );
        if (allWordsMatch) score += 40;

        if (tool.isHot) score += 5;

        return { tool, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.tool);
  }, [searchTerm, selectedCategory]);

  // Giữ selectedIndex hợp lệ
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTools.length]);

  // Cuộn item được chọn vào view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>('.search-result-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Điều hướng khi chọn công cụ
  const handleSelectTool = (path: string) => {
    onClose();
    navigate(path);
  };

  // Keyboard navigation: Escape, Arrow Up/Down, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredTools.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredTools.length - 1));
      } else if (e.key === 'Enter') {
        if (filteredTools[selectedIndex]) {
          e.preventDefault();
          handleSelectTool(filteredTools[selectedIndex].path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="global-search-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        {/* Header: Input Bar */}
        <div className="global-search-header">
          <Search className="search-input-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            placeholder="Tìm kiếm công cụ, tính năng (PDF, ảnh thẻ, đạo văn, đề thi AI, điểm danh...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => { setSearchTerm(''); inputRef.current?.focus(); }}
              aria-label="Xóa từ khóa"
            >
              <X size={16} />
            </button>
          )}
          <button 
            type="button" 
            className="search-close-btn" 
            onClick={onClose}
            aria-label="Đóng tìm kiếm"
          >
            <span className="search-esc-badge">ESC</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="search-category-filter">
          <button
            type="button"
            className={`search-cat-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tất cả ({ALL_TOOLS.length})
          </button>
          <button
            type="button"
            className={`search-cat-chip ${selectedCategory === 'edtech' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('edtech')}
          >
            <GraduationCap size={13} /> Giảng Dạy & LMS
          </button>
          <button
            type="button"
            className={`search-cat-chip ${selectedCategory === 'pdf' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('pdf')}
          >
            <FileText size={13} /> PDF
          </button>
          <button
            type="button"
            className={`search-cat-chip ${selectedCategory === 'image' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('image')}
          >
            <ImageIcon size={13} /> Xử Lý Ảnh
          </button>
          <button
            type="button"
            className={`search-cat-chip ${selectedCategory === 'other' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('other')}
          >
            <LinkIcon size={13} /> Tiện Ích
          </button>
        </div>

        {/* Results List */}
        <div className="search-results-list" ref={listRef}>
          {filteredTools.length > 0 ? (
            <>
              <div className="search-results-label">
                {!searchTerm ? (
                  <span>🔥 Công cụ nổi bật & thường dùng ({filteredTools.length})</span>
                ) : (
                  <span>Kết quả tìm kiếm phù hợp ({filteredTools.length})</span>
                )}
              </div>
              {filteredTools.map((tool, idx) => {
                const meta = CATEGORY_META[tool.category] || CATEGORY_META.other;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={tool.path}
                    className={`search-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTool(tool.path)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="search-result-icon" style={{ background: `${meta.color}15`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <div className="search-result-body">
                      <div className="search-result-title-row">
                        <span className="search-result-title">{tool.title}</span>
                        {tool.isHot && (
                          <span className="search-hot-tag">
                            <Sparkles size={11} /> HOT
                          </span>
                        )}
                        <span 
                          className="search-cat-tag"
                          style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}30` }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="search-result-desc">{tool.desc}</p>
                    </div>
                    <div className="search-result-action">
                      {isSelected ? (
                        <span className="search-enter-hint">
                          <CornerDownLeft size={13} /> Mở
                        </span>
                      ) : (
                        <ArrowRight size={16} className="search-arrow" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="search-no-results">
              <div className="no-result-icon">🔍</div>
              <h4>Không tìm thấy công cụ nào cho "{searchTerm}"</h4>
              <p>Thử tìm kiếm với các từ khóa ngắn hơn như: <em>pdf, ảnh, điểm danh, trắc nghiệm, cắt video...</em></p>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="global-search-footer">
          <div className="search-footer-shortcuts">
            <span><kbd>↑</kbd> <kbd>↓</kbd> để di chuyển</span>
            <span><kbd>↵</kbd> để chọn</span>
            <span><kbd>ESC</kbd> để đóng</span>
          </div>
          <div className="search-footer-count">
            Tổng cộng <strong>{ALL_TOOLS.length}</strong> tiện ích trực tuyến
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;