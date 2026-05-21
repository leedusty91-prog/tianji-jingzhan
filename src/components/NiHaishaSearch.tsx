import React, { useState } from 'react';
import { getTianjiHexData } from '../engine/niHaishaData';
import { getHexagramData, getKingWenNumber } from './../engine/ichingData';
import { BambooDivination } from './BambooDivination';
import DivinationHistory from './DivinationHistory';
import { createRecord } from '../api/records';
import type { DivinationMeta, DivinationRecord } from '../types';

export const NiHaishaSearch: React.FC = () => {
  const [selectedHexCode, setSelectedHexCode] = useState('111111'); // 默认乾为天
  const [scrollTab, setScrollTab] = useState<'tianji' | 'classical' | 'traditional'>('tianji');
  const [viewState, setViewState] = useState<'history' | 'divine' | 'result'>('divine');

  // 根据当前选择的六位编码获取完整数据
  const hexBase = getHexagramData(selectedHexCode);
  const tianjiBase = getTianjiHexData(selectedHexCode, hexBase.name);
  const kingWenNum = getKingWenNumber(selectedHexCode);

  const handleHexagramGenerated = async (code: string, meta: DivinationMeta) => {
    setSelectedHexCode(code);
    const hexData = getHexagramData(code);

    // 持久化到后端
    try {
      await createRecord({
        date: meta.date,
        question: meta.question,
        notes: meta.notes,
        gender: meta.gender,
        hexCode: code,
        hexName: hexData.name,
        hexNature: hexData.nature,
      });
    } catch (err) {
      console.error('Failed to save divination record:', err);
    }

    // 延迟切换，让用户看清最后一枚硬币落定结算
    setTimeout(() => {
      setViewState('result');
    }, 1200);
  };

  const handleViewRecord = (record: DivinationRecord) => {
    setSelectedHexCode(record.hexCode);
    setViewState('result');
  };

  return (
    <div className="tianji-search-container single-page">
      {viewState === 'history' ? (
        /* 历史记录页面 */
        <div className="divination-fullscreen-panel fade-in-quick">
          <DivinationHistory
            onNewDivination={() => setViewState('divine')}
            onViewRecord={handleViewRecord}
          />
        </div>
      ) : viewState === 'divine' ? (
        /* 第一页：占卦页面 */
        <div className="divination-fullscreen-panel fade-in-quick">
          <button className="history-entry-btn" onClick={() => setViewState('history')}>
            <span className="history-entry-icon">☰</span>
            <span>占卦历史</span>
          </button>
          <div className="divination-panel-header">
            <h1 className="main-title">天纪经占 · 竹筒摇卦</h1>
            <p className="main-subtitle">调出六枚硬币，从下往上排竖着排开生成一个卦象</p>
          </div>
          <div className="divination-content-wrapper glassmorphic">
            <BambooDivination key={viewState} onHexagramGenerated={handleHexagramGenerated} />
          </div>
        </div>
      ) : (
        /* 第二页：解卦页面 */
        <div className="result-fullscreen-panel fade-in-quick">
          {/* 顶部按钮栏 */}
          <div className="result-top-bar">
            <button className="back-to-divine-btn" onClick={() => setViewState('divine')}>
              <span className="btn-icon">←</span> 返回占卦
            </button>
            <button className="history-entry-btn" onClick={() => setViewState('history')}>
              <span className="history-entry-icon">☰</span>
              <span>占卦历史</span>
            </button>
          </div>

          {/* 右侧水墨画卷卡片 (Canvas Viewport) - 居中全屏排版 */}
          <div className="scroll-canvas-viewport full-width">
            <div className="water-ink-scroll-card glassmorphic">
              <div className="scroll-inner-border">
                {/* 画轴卷首装饰 */}
                <div className="scroll-cap-top">
                  <span className="cap-orb">☯</span>
                  <span className="cap-title">古籍易理天纪人间道卷</span>
                  <span className="cap-orb">☯</span>
                </div>

                {/* 卦象基础抬头 */}
                <div className="scroll-hex-header">
                  <div className="hex-name-box">
                    <span className="nature-badge">{hexBase.nature}</span>
                    <h2 className="hex-title-main">{hexBase.name}</h2>
                    <span className="palace-badge">
                      宫位：{hexBase.palace} | 第 {kingWenNum} 卦
                    </span>
                  </div>

                  {/* 图像与爻画并列区 */}
                  <div className="hex-graphic-container">
                    {/* 简易爻画显示 */}
                    <div className="scroll-hex-visual">
                      {selectedHexCode.split('').reverse().map((char, index) => {
                        const yaoIndex = 5 - index; // 初爻在底，上爻在顶
                        const isYang = char === '1';
                        return (
                          <div
                            key={`yao-${yaoIndex}`}
                            className={`mini-yao-bar ${isYang ? 'yang' : 'yin'}`}
                          >
                            {isYang ? (
                              <div className="mini-solid" />
                            ) : (
                              <>
                                <div className="mini-split" />
                                <div className="mini-gap" />
                                <div className="mini-split" />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 64卦手绘图 */}
                    <div className="hexagram-image-box gold-glow">
                      <img
                        className="hexagram-svg-image"
                        src={`/hexagrams/Iching-hexagram-${kingWenNum}.svg`}
                        alt={hexBase.name}
                      />
                    </div>
                  </div>
                </div>

                {/* 画卷内容与选项卡 */}
                <div className="scroll-content-body">
                  <div className="scroll-tab-nav">
                    <button
                      className={`scroll-tab-btn ${scrollTab === 'tianji' ? 'active' : ''}`}
                      onClick={() => setScrollTab('tianji')}
                    >
                      天纪图说
                    </button>
                    <button
                      className={`scroll-tab-btn ${scrollTab === 'classical' ? 'active' : ''}`}
                      onClick={() => setScrollTab('classical')}
                    >
                      易经原文
                    </button>
                    <button
                      className={`scroll-tab-btn ${scrollTab === 'traditional' ? 'active' : ''}`}
                      onClick={() => setScrollTab('traditional')}
                    >
                      古籍经传
                    </button>
                  </div>

                  {scrollTab === 'tianji' && (
                    <div className="tianji-pane-ink fade-in-quick">
                      {/* 天纪手绘挂图意象 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【天纪挂图意象】</h4>
                        <div className="tianji-diagram-image-container">
                          <img 
                            src={`/hexagrams/tianji/tianji-${kingWenNum}.webp`}
                            alt={`${hexBase.name}天纪挂图`}
                            className="tianji-diagram-image"
                            onError={(e) => {
                              // Fallback to png if webp is not found
                              const target = e.target as HTMLImageElement;
                              if (target.src.endsWith('.webp')) {
                                target.src = `/hexagrams/tianji/tianji-${kingWenNum}.png`;
                              }
                            }}
                          />
                        </div>
                        <p className="ink-description-text">{tianjiBase.diagramDesc}</p>
                      </div>

                      {/* 诸般意象细解金签 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【诸般意象细解】</h4>
                        <div className="tianji-symbols-pane-grid">
                          {tianjiBase.symbols.map((sym, idx) => (
                            <div key={idx} className="tianji-pane-symbol-card glassmorphic-sub">
                              <span className="symbol-pane-badge">{sym.symbol}</span>
                              <p className="symbol-pane-meaning">{sym.meaning}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 倪师阐释人间道哲理 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【人间道阐释】</h4>
                        <p className="tianji-philo-text">{tianjiBase.humanPath}</p>
                      </div>

                      {/* 天纪风水地理方位建议 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【地理风水建议】</h4>
                        <p className="tianji-geo-text">{tianjiBase.geography}</p>
                      </div>
                    </div>
                  )}

                  {scrollTab === 'classical' && (
                    <div className="tianji-pane-ink fade-in-quick">
                      {/* 易经原著卦辞与象传 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【易经原著卦辞与象传】</h4>
                        <div className="classical-judgement-box glassmorphic-sub">
                          <p className="classical-text-bold">{hexBase.judgment}</p>
                          <p className="classical-text-muted">{hexBase.imageText}</p>
                        </div>
                      </div>

                      {/* 六爻爻辞与象传 */}
                      {hexBase.yaoScriptures && hexBase.yaoScriptures.length > 0 && (
                        <div className="tianji-panel-section">
                          <h4 className="content-sec-title">【易经六爻爻辞与象传】</h4>
                          <div className="classical-yaos-list">
                            {hexBase.yaoScriptures.map((yaoItem, idx) => (
                              <div key={idx} className="classical-yao-row glassmorphic-sub">
                                <div className="yao-row-main">
                                  <span className="yao-row-label">{yaoItem.name}：</span>
                                  <span className="yao-row-text">{yaoItem.scripture}</span>
                                </div>
                                {yaoItem.xiang && (
                                  <p className="yao-row-xiang">{yaoItem.xiang}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {scrollTab === 'traditional' && (
                    <div className="tianji-pane-ink fade-in-quick">
                      {/* 《断易天机》古籍诗解 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【天纪经占古籍诗解】</h4>
                        <div className="ink-poem-box">
                          {hexBase.duanYiTianJi.poem.split('\n').map((line, idx) => (
                            <p key={idx} className="ink-poem-line">{line}</p>
                          ))}
                        </div>
                        <p className="traditional-judgement-text">
                          {hexBase.duanYiTianJi.judgment}
                        </p>
                      </div>

                      {/* 经典人生运势占断 */}
                      <div className="tianji-panel-section">
                        <h4 className="content-sec-title">【人生运势占断】</h4>
                        <div className="traditional-life-grid">
                          <div className="life-card glassmorphic-sub">
                            <span className="life-badge gold">婚姻感情</span>
                            <p className="life-txt">{hexBase.duanYiTianJi.marriage}</p>
                          </div>
                          <div className="life-card glassmorphic-sub">
                            <span className="life-badge gold">事业求财</span>
                            <p className="life-txt">{hexBase.duanYiTianJi.wealth}</p>
                          </div>
                          <div className="life-card glassmorphic-sub">
                            <span className="life-badge gold">身体健康</span>
                            <p className="life-txt">{hexBase.duanYiTianJi.health}</p>
                          </div>
                          <div className="life-card glassmorphic-sub">
                            <span className="life-badge gold">出行谋望</span>
                            <p className="life-txt">{hexBase.duanYiTianJi.travel}</p>
                          </div>
                          <div className="life-card glassmorphic-sub">
                            <span className="life-badge gold">失物寻人</span>
                            <p className="life-txt">{hexBase.duanYiTianJi.lostFound}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
