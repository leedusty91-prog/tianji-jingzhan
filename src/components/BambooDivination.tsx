import React, { useState, useEffect, useRef } from 'react';
import { getHexagramData } from '../engine/ichingData';
import type { DivinationMeta } from '../types';

interface BambooDivinationProps {
  onHexagramGenerated: (code: string, meta: DivinationMeta) => void;
}

// Web Audio API Sound Engine (Code-only synthesis)
class DivinationAudioEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  close() {
    if (this.ctx) {
      this.ctx.close().catch(err => console.error('Error closing AudioContext:', err));
      this.ctx = null;
    }
  }

  // Play a quick wood-metal collision click (rattle inside bamboo cylinder)
  playRattleClick() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Wood sound
    const woodOsc = this.ctx.createOscillator();
    const woodGain = this.ctx.createGain();
    woodOsc.type = 'triangle';
    woodOsc.frequency.setValueAtTime(350 + Math.random() * 150, now);
    woodGain.gain.setValueAtTime(0.2, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    woodOsc.connect(woodGain);
    woodGain.connect(this.ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.04);

    // Metal clink
    const metalOsc = this.ctx.createOscillator();
    const metalGain = this.ctx.createGain();
    metalOsc.type = 'sine';
    metalOsc.frequency.setValueAtTime(1000 + Math.random() * 600, now);
    metalGain.gain.setValueAtTime(0.08, now);
    metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    metalOsc.connect(metalGain);
    metalGain.connect(this.ctx.destination);
    metalOsc.start(now);
    metalOsc.stop(now + 0.03);
  }

  // Play a bright coin land sound (bell-like ring)
  playCoinLand() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Fundamental ring
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1300 + Math.random() * 150, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // High overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2100 + Math.random() * 200, now);
    gain2.gain.setValueAtTime(0.12, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.25);
  }

  // Play a deep temple gong/chime (磬声) on complete
  playZenGong() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Metallic bronze bell harmonics
    const harmonics = [146.83, 220.00, 293.66, 440.00, 587.33, 880.00]; // D3, A3, D4, A4, D5, A5
    const gains = [0.45, 0.25, 0.20, 0.15, 0.10, 0.05];

    harmonics.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(gains[idx], now);
      // Long resonance decay
      const duration = 3.5 - idx * 0.4;
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
}

interface CoinState {
  value: number; // 1: Heads (Yang/正面), 0: Tails (Yin/背面)
  revealed: boolean;
  flipping: boolean;
}

export const BambooDivination: React.FC<BambooDivinationProps> = ({ onHexagramGenerated }) => {
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [divDate, setDivDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [step, setStep] = useState<'idle' | 'shaking' | 'revealing' | 'completed'>('idle');
  const [coins, setCoins] = useState<CoinState[]>(
    Array.from({ length: 6 }, () => ({ value: 1, revealed: false, flipping: false }))
  );
  
  const audioEngineRef = useRef<DivinationAudioEngine | null>(null);
  const shakeIntervalRef = useRef<any>(null);
  const startRevealTimeoutRef = useRef<any>(null);
  const stopCoinTimeoutRef = useRef<any>(null);
  const completeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    audioEngineRef.current = new DivinationAudioEngine();
    return () => {
      audioEngineRef.current?.close();
      if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
      if (startRevealTimeoutRef.current) clearTimeout(startRevealTimeoutRef.current);
      if (stopCoinTimeoutRef.current) clearTimeout(stopCoinTimeoutRef.current);
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  const handleStartDivination = () => {
    if (step === 'shaking' || step === 'revealing') return;
    
    // Initialize audio context on user gesture
    if (audioEngineRef.current) {
      audioEngineRef.current.init();
    }

    setStep('shaking');
    // Start with all 6 coins visible and flipping
    setCoins(Array.from({ length: 6 }, () => ({ value: 1, revealed: true, flipping: true })));

    // Play shaking sounds repeatedly
    let shakeCount = 0;
    if (shakeIntervalRef.current) clearInterval(shakeIntervalRef.current);
    shakeIntervalRef.current = setInterval(() => {
      if (audioEngineRef.current && shakeCount < 10) {
        audioEngineRef.current.playRattleClick();
        shakeCount++;
      } else {
        clearInterval(shakeIntervalRef.current);
        shakeIntervalRef.current = null;
      }
    }, 150);

    // After 1.8s shaking, transition to revealing and stop them one by one
    if (startRevealTimeoutRef.current) clearTimeout(startRevealTimeoutRef.current);
    startRevealTimeoutRef.current = setTimeout(() => {
      setStep('revealing');
      stopCoinsSequentially();
    }, 1800);
  };

  const stopCoinsSequentially = () => {
    // Generate final random values for all 6 coins
    // index 0 -> 初爻 (bottom), index 5 -> 上爻 (top)
    const finalValues = Array.from({ length: 6 }, () => (Math.random() > 0.5 ? 1 : 0));

    let currentIndex = 0;

    const stopNextCoin = () => {
      if (currentIndex >= 6) {
        // All coins have stopped
        if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = setTimeout(() => {
          setStep('completed');
          if (audioEngineRef.current) {
            audioEngineRef.current.playZenGong();
          }
          // Form 6-character code (index 0 is code[0], index 5 is code[5])
          const code = finalValues.join('');
          const meta: DivinationMeta = {
            question,
            notes,
            date: divDate,
            gender,
          };
          onHexagramGenerated(code, meta);
        }, 600);
        return;
      }

      const index = currentIndex;
      
      // Stop the current coin and set its final value
      setCoins(prev => {
        const updated = [...prev];
        updated[index] = {
          value: finalValues[index],
          revealed: true,
          flipping: false,
        };
        return updated;
      });

      if (audioEngineRef.current) {
        audioEngineRef.current.playCoinLand();
      }

      currentIndex++;
      // Stop next coin after 400ms
      if (stopCoinTimeoutRef.current) clearTimeout(stopCoinTimeoutRef.current);
      stopCoinTimeoutRef.current = setTimeout(stopNextCoin, 400);
    };

    stopNextCoin();
  };

  // Get hexagram details if completed
  const currentCode = coins.map(c => c.value.toString()).join('');
  const hexDetails = step === 'completed' ? getHexagramData(currentCode) : null;

  const yis = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

  return (
    <div className="bamboo-divination-panel fade-in">
      <div className="divination-header">
        <h4 className="divination-section-title">竹筒摇卦起卦</h4>
        <p className="divination-section-subtitle">静心默想，摇定乾坤</p>
      </div>

      {step === 'idle' && (
        <div className="ritual-input-section">
          {/* 结构化占卦表单 */}
          <div className="divination-form">
            <div className="form-row">
              <label className="form-label" htmlFor="div-question">所问事项</label>
              <input
                id="div-question"
                type="text"
                className="ancient-input"
                placeholder="输入您所问之事 (如：今年事业运势)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label className="form-label" htmlFor="div-notes">备注说明</label>
              <textarea
                id="div-notes"
                className="ancient-input ancient-textarea"
                placeholder="可记录占卦时的心境、背景等..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-row-inline">
              <div className="form-field">
                <label className="form-label" htmlFor="div-date">占卦日期</label>
                <input
                  id="div-date"
                  type="date"
                  className="ancient-input ancient-date"
                  value={divDate}
                  onChange={(e) => setDivDate(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">性别</label>
                <div className="gender-radio-group">
                  <label className={`gender-option ${gender === 'male' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                    />
                    <span>男</span>
                  </label>
                  <label className={`gender-option ${gender === 'female' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                    />
                    <span>女</span>
                  </label>
                  <label className={`gender-option ${gender === 'other' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="other"
                      checked={gender === 'other'}
                      onChange={() => setGender('other')}
                    />
                    <span>其他</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <p className="ritual-desc">
            诚心默念所求，点击下方竹筒或按钮即可摇动铜钱，倒出六枚古币以测天机。
          </p>
        </div>
      )}

      {step === 'shaking' && (
        <div className="ritual-shaking-message">
          <p className="rattling-text">☯ 卦象孕育中 ☯</p>
          <p className="rattling-subtext">铜钱叩击，乾坤未定...</p>
        </div>
      )}

      {step === 'revealing' && (
        <div className="ritual-shaking-message">
          <p className="rattling-text text-jade">☯ 铜钱落地 ☯</p>
          <p className="rattling-subtext">由下至上，筑就六爻...</p>
        </div>
      )}

      {step === 'completed' && hexDetails && (
        <div className="divination-result-badge glassmorphic-sub">
          <span className="result-prefix">起得：</span>
          <span className="result-name">{hexDetails.name}</span>
          <span className="result-nature">({hexDetails.nature})</span>
        </div>
      )}

      {/* Visual Arena */}
      <div className="bamboo-arena">
        {/* Bamboo Cylinder */}
        <div 
          className={`bamboo-cylinder-container ${step === 'shaking' ? 'shaking' : ''} ${step === 'revealing' ? 'pouring' : ''}`}
          onClick={step === 'idle' ? handleStartDivination : undefined}
          style={{ cursor: step === 'idle' ? 'pointer' : 'default' }}
        >
          <div className="bamboo-cylinder">
            <div className="bamboo-rim-top" />
            <div className="bamboo-body">
              <div className="bamboo-node-line" />
              <div className="bamboo-calligraphy">
                <span>摇</span>
                <span>卦</span>
                <span>筒</span>
              </div>
              <div className="bamboo-node-line secondary" />
            </div>
            <div className="bamboo-rim-bottom" />
          </div>
        </div>

        {/* Coins Tossing Tray */}
        {(step === 'shaking' || step === 'revealing' || step === 'completed') && (
          <div className="coins-tray-column">
            {coins.slice().reverse().map((coin, revIdx) => {
              // Note: coins are drawn top-to-bottom in UI (with 上爻 on top, 初爻 at bottom)
              // but coins array is index 0 -> 初爻, index 5 -> 上爻.
              // So reverse the map to draw index 5 (上爻) at the top.
              const actualIdx = 5 - revIdx;
              
              if (!coin.revealed) return null;

              return (
                <div key={actualIdx} className="coin-slot-row fade-in">
                  <span className="coin-yao-label">{yis[actualIdx]}</span>
                  
                  {/* Coin 3D Viewport */}
                  <div className="coin-3d-wrapper">
                    <div className={`ancient-coin ${coin.flipping ? 'flipping' : ''} ${coin.value === 1 ? 'heads' : 'tails'}`}>
                      <div className="coin-face coin-front">
                        <span className="coin-txt t">天</span>
                        <span className="coin-txt l">纪</span>
                        <span className="coin-txt r">经</span>
                        <span className="coin-txt b">占</span>
                        <div className="square-hole" />
                      </div>
                      <div className="coin-face coin-back">
                        <span className="dragon-pattern">☯</span>
                        <div className="square-hole" />
                      </div>
                    </div>
                  </div>

                  <span className={`coin-yao-result ${coin.flipping ? 'pending' : coin.value === 1 ? 'yang' : 'yin'}`}>
                    {coin.flipping ? '摇卦中' : coin.value === 1 ? '阳 (⚊)' : '阴 (⚋)'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Button controls */}
      <div className="divination-controls">
        {step === 'idle' && (
          <button className="ritual-btn gold-glow" onClick={handleStartDivination}>
            开始起卦
          </button>
        )}

        {step === 'completed' && (
          <button className="ritual-btn gold-glow" onClick={handleStartDivination}>
            重新起卦
          </button>
        )}
      </div>
    </div>
  );
};
