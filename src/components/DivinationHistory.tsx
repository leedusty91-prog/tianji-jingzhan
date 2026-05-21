import React, { useState, useEffect } from 'react';
import { fetchRecords, deleteRecord } from '../api/records';
import { getKingWenNumber } from '../engine/ichingData';
import type { DivinationRecord } from '../types';

interface DivinationHistoryProps {
  onNewDivination: () => void;
  onViewRecord: (record: DivinationRecord) => void;
}

const GENDER_LABEL: Record<DivinationRecord['gender'], string> = {
  male: '男',
  female: '女',
  other: '其他',
};

export default function DivinationHistory({
  onNewDivination,
  onViewRecord,
}: DivinationHistoryProps) {
  const [records, setRecords] = useState<DivinationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchRecords();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
  ) => {
    e.stopPropagation();
    await deleteRecord(id);
    await loadRecords();
  };

  const truncate = (text: string, max = 28): string =>
    text.length > max ? `${text.slice(0, max)}…` : text;

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="history-container">
      <header className="history-header">
        <div className="history-header-orb">☯</div>
        <h1>天纪经占</h1>
        <p className="history-header-sub">占卦历史卷轴</p>
      </header>

      {loading ? (
        <div className="history-empty-state">
          <div className="history-loading-spinner" />
          <p>卷轴展开中…</p>
        </div>
      ) : records.length === 0 ? (
        <div className="history-empty-state">
          <div className="empty-state-icon">卦</div>
          <p>暂无占卦记录</p>
          <p className="empty-state-hint">点击下方按钮，开启您的第一次占卦</p>
        </div>
      ) : (
        <div className="history-cards-list">
          {records.map((record, idx) => {
            const kwn = getKingWenNumber(record.hexCode);
            return (
              <div
                key={record.id}
                className="history-card glassmorphic-sub"
                onClick={() => onViewRecord(record)}
                role="button"
                tabIndex={0}
                style={{ animationDelay: `${idx * 0.06}s` }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewRecord(record);
                  }
                }}
              >
                {/* 卦象缩略图 */}
                <div className="history-card-hex-visual">
                  <img
                    className="history-hex-thumb"
                    src={`/hexagrams/Iching-hexagram-${kwn}.svg`}
                    alt={record.hexName}
                  />
                </div>

                {/* 卦名信息 */}
                <div className="history-card-hex-info">
                  <span className="hex-name">{record.hexName}</span>
                  <span className="hex-nature">{record.hexNature}</span>
                </div>

                {/* 元数据 */}
                <div className="history-card-meta">
                  <span className="meta-question">
                    {record.question ? truncate(record.question) : '未记录事项'}
                  </span>
                  <div className="meta-tags">
                    <span className="meta-date">{formatDate(record.date)}</span>
                    <span className="meta-gender-badge">{GENDER_LABEL[record.gender]}</span>
                  </div>
                </div>

                {/* 查看箭头 */}
                <div className="history-card-arrow">→</div>

                {/* 删除按钮 */}
                <button
                  type="button"
                  className="history-card-delete"
                  aria-label="删除记录"
                  onClick={(e) => handleDelete(e, record.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="history-bottom-actions">
        <button
          type="button"
          className="history-new-btn gold-glow"
          onClick={onNewDivination}
        >
          <span className="new-btn-icon">☯</span>
          <span>开始占卦</span>
        </button>
        {records.length > 0 && (
          <p className="history-record-count">共 {records.length} 条占卦记录</p>
        )}
      </div>
    </div>
  );
}
