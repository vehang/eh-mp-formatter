'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiChevronRight,
  FiChevronLeft,
  FiFilePlus,
  FiTrash2,
  FiX,
  FiEdit2,
  FiClock,
} from 'react-icons/fi';

/* ================================================================
   Types
   ================================================================ */

export interface Article {
  id: string;
  shortId: string;
  title: string;
  content: string;
  createdAt: number; // unix ms
  updatedAt: number; // unix ms
}

export interface ArticleDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  articles: Article[];
  currentArticleId: string | null;
  onSelectArticle: (id: string) => void;
  onCreateArticle: () => void;
  onRenameArticle: (id: string, title: string) => void;
  onDeleteArticle: (id: string) => void;
  sortOrder: 'updatedAt' | 'createdAt';
  onSortOrderChange: (order: 'updatedAt' | 'createdAt') => void;
}

/* ================================================================
   Helper: relative time
   ================================================================ */

function relativeTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  return `${Math.floor(months / 12)}年前`;
}

function formatFullTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ================================================================
   Component
   ================================================================ */

export default function ArticleDrawer({
  isOpen,
  onToggle,
  articles,
  currentArticleId,
  onSelectArticle,
  onCreateArticle,
  onRenameArticle,
  onDeleteArticle,
  sortOrder,
  onSortOrderChange,
}: ArticleDrawerProps) {
  /* ---------- editing state ---------- */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  /* ---------- auto-focus edit input ---------- */
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  /* ---------- sorted articles ---------- */
  const sortedArticles = React.useMemo(() => {
    const sorted = [...articles].sort((a, b) => {
      if (sortOrder === 'updatedAt') return b.updatedAt - a.updatedAt;
      return b.createdAt - a.createdAt;
    });
    return sorted;
  }, [articles, sortOrder]);

  /* ---------- delete confirm state ---------- */
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  /* ---------- hover item state ---------- */
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /* ---------- auto-close on outside click ---------- */
  const drawerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Scroll to current article after opening
    const scrollTimer = setTimeout(() => {
      if (listRef.current && currentArticleId) {
        const activeItem = listRef.current.querySelector(`[data-article-id="${currentArticleId}"]`);
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 350); // wait for slide animation

    // Auto-close on outside click
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('button[title="收起文章列表"]') || target.closest('button[title="展开文章列表"]')) return;
        if (deleteTarget) return;
        onToggle();
      }
    };
    const clickTimer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clickTimer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle, deleteTarget, currentArticleId]);

  /* ---------- start editing ---------- */
  const handleDoubleClick = useCallback((article: Article) => {
    setEditingId(article.id);
    setEditTitle(article.title);
  }, []);

  /* ---------- save title ---------- */
  const handleSaveTitle = useCallback(() => {
    if (editingId && editTitle.trim()) {
      onRenameArticle(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  }, [editingId, editTitle, onRenameArticle]);

  /* ---------- delete ---------- */
  const handleDelete = useCallback(
    (article: Article) => {
      setDeleteTarget(article);
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDeleteArticle(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteArticle]);

  /* ---------- sort toggle ---------- */
  const handleSortToggle = useCallback(() => {
    onSortOrderChange(sortOrder === 'updatedAt' ? 'createdAt' : 'updatedAt');
  }, [sortOrder, onSortOrderChange]);

  /* ================================================================
     Render
     ================================================================ */

  return (
    <>
      {/* ---- Drawer Handle (always visible, follows drawer) ---- */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 48,
          top: 'calc(52px + (100vh - 52px - 32px) / 2)',
          transform: 'translateY(-50%)',
          left: isOpen ? 300 : 0,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          background: 'var(--bg-surface, #fff)',
          border: '1px solid var(--border-subtle, #e5e7eb)',
          borderLeft: 'none',
          transition: 'left 300ms ease-in-out',
          cursor: 'pointer',
          color: 'var(--text-secondary, inherit)',
          boxShadow: isOpen ? '2px 0 6px rgba(0,0,0,0.1)' : '2px 0 6px rgba(0,0,0,0.1)',
        }}
        title={isOpen ? '收起文章列表' : '展开文章列表'}
      >
        {isOpen ? (
          <FiChevronLeft style={{ width: 16, height: 16 }} />
        ) : (
          <FiChevronRight style={{ width: 16, height: 16 }} />
        )}
      </button>

      {/* ---- Drawer Panel (aligned to editor area, with shadow) ---- */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 52,
          left: 0,
          height: 'calc(100vh - 52px)',
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
          background: 'var(--bg-surface, #fff)',
          borderRight: '1px solid var(--border-subtle, #e5e7eb)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms ease-in-out',
          boxShadow: isOpen ? '6px 0 24px rgba(0, 0, 0, 0.15)' : 'none',
        }}
      >
        {/* ---- Header ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle, #e5e7eb)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}>
              文章列表
            </span>
            <span style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '1px 8px',
              borderRadius: 10,
            }}>
              {articles.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Sort toggle */}
            <button
              onClick={handleSortToggle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                fontSize: 11,
                borderRadius: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'background 0.15s',
              }}
              title={sortOrder === 'updatedAt' ? '按修改时间排序' : '按创建时间排序'}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <FiClock style={{ width: 12, height: 12 }} />
              <span>{sortOrder === 'updatedAt' ? '修改时间' : '创建时间'}</span>
            </button>
            {/* New article */}
            <button
              onClick={onCreateArticle}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                background: 'var(--orange-500)',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                transition: 'background 0.15s',
              }}
              title="新建文章"
            >
              <FiFilePlus style={{ width: 13, height: 13 }} />
              <span>新建</span>
            </button>
          </div>
        </div>

        {/* ---- Article List (scrollable) ---- */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px' }}>
          {sortedArticles.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              gap: 8,
            }}>
              <p style={{ fontSize: 13 }}>暂无文章</p>
              <button
                onClick={onCreateArticle}
                style={{
                  fontSize: 12,
                  color: 'var(--orange-500)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                点击新建
              </button>
            </div>
          ) : (
            sortedArticles.map((article) => {
              const isActive = article.id === currentArticleId;
              const isEditing = article.id === editingId;

              return (
                <div
                  key={article.id}
                  data-article-id={article.id}
                  style={{
                    position: 'relative',
                    padding: '10px 12px',
                    marginBottom: 4,
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isActive
                      ? 'var(--color-primary-muted, rgba(249, 115, 22, 0.08))'
                      : hoveredId === article.id
                        ? 'var(--bg-elevated, rgba(0,0,0,0.03))'
                        : 'transparent',
                    borderLeft: isActive
                      ? '3px solid var(--orange-500, #f97316)'
                      : '3px solid transparent',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onClick={() => {
                    if (!isEditing) onSelectArticle(article.id);
                  }}
                  onDoubleClick={() => handleDoubleClick(article)}
                  onMouseEnter={() => setHoveredId(article.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Hover action buttons */}
                  {!isEditing && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 2,
                      opacity: hoveredId === article.id ? 1 : 0,
                      transition: 'opacity 0.15s',
                    }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDoubleClick(article);
                        }}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        title="修改标题"
                        onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = 'var(--orange-500)'; el.style.background = 'var(--color-primary-muted)'; }}
                        onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = 'var(--text-muted)'; el.style.background = 'transparent'; }}
                      >
                        <FiEdit2 style={{ width: 12, height: 12 }} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(article);
                        }}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          transition: 'color 0.15s, background 0.15s',
                        }}
                        title="删除文章"
                        onMouseEnter={(e) => { const el = e.currentTarget; el.style.color = 'var(--red-500)'; el.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={(e) => { const el = e.currentTarget; el.style.color = 'var(--text-muted)'; el.style.background = 'transparent'; }}
                      >
                        <FiTrash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  )}

                  {/* Title */}
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditTitle('');
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '2px 4px',
                        fontSize: 13,
                        fontWeight: 500,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid var(--orange-500, #f97316)',
                        outline: 'none',
                        color: 'var(--text-primary)',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      paddingRight: 52,
                      margin: 0,
                    }}>
                      {article.title || '无标题'}
                    </p>
                  )}

                  {/* Times */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}>
                    <span
                      style={{ fontSize: 11, color: 'var(--text-muted)' }}
                      title={formatFullTime(article.updatedAt)}
                    >
                      {relativeTime(article.updatedAt)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>
                      {formatFullTime(article.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ---- Footer ---- */}
        <div
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle, #e5e7eb)',
          }}
        >
          <span>共 {articles.length} 篇</span>
        </div>
      </div>

      {/* ---- Delete Confirm Modal ---- */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: 'var(--bg-surface, #fff)',
              border: '1px solid var(--border-default, #e5e7eb)',
              borderRadius: 12,
              padding: '24px',
              minWidth: 320,
              maxWidth: 400,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--red-500, #ef4444)',
                }}>
                  <FiTrash2 style={{ width: 16, height: 16 }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  删除文章
                </span>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <FiX style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Body */}
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              确定删除文章「<span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{deleteTarget.title || '无标题'}</span>」吗？此操作不可恢复。
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: '8px 16px', borderRadius: 6,
                  background: 'transparent', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px', borderRadius: 6,
                  background: 'var(--red-500, #ef4444)', border: 'none',
                  color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
