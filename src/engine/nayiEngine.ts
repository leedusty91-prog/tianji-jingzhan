import type { Yao, HexagramResult, YaoType } from '../types';
import { getHexagramData, TRIGRAMS } from './ichingData';
import { GANS, ZHIS } from './calendar';

// 五行生克关系

// 五行所生：金生水，水生木，木生火，火生土，土生金
const PRODUCED_BY: Record<string, string> = {
  '金': '水',
  '水': '木',
  '木': '火',
  '火': '土',
  '土': '金',
};

// 五行所克：金克木，木克土，土克水，水克火，火克金
const DESTROYED_BY: Record<string, string> = {
  '金': '木',
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
};

// 地支与五行对应
const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '亥': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
};

// 纳甲干支公式 (内卦/外卦及八卦分支)
const NAYI_FORMULAS: Record<string, { inner: string[]; outer: string[] }> = {
  '乾': {
    inner: ['甲子', '甲寅', '甲辰'],
    outer: ['壬午', '壬申', '壬戌']
  },
  '坤': {
    inner: ['乙未', '乙巳', '乙卯'],
    outer: ['癸丑', '癸亥', '癸酉']
  },
  '震': {
    inner: ['庚子', '庚寅', '庚辰'],
    outer: ['庚午', '庚申', '庚戌']
  },
  '巽': {
    inner: ['辛丑', '辛亥', '辛酉'],
    outer: ['辛未', '辛巳', '辛卯']
  },
  '坎': {
    inner: ['戊寅', '戊辰', '戊午'],
    outer: ['戊申', '戊戌', '戊子']
  },
  '离': {
    inner: ['己卯', '己丑', '己亥'],
    outer: ['己酉', '己未', '己巳']
  },
  '艮': {
    inner: ['丙辰', '丙午', '丙申'],
    outer: ['丙戌', '丙子', '丙寅']
  },
  '兑': {
    inner: ['丁巳', '丁卯', '丁丑'],
    outer: ['丁亥', '丁酉', '丁未']
  }
};

/**
 * 确定六亲关系 (生我者父母，我生者子孙，克我者官鬼，我克者妻财，比和者兄弟)
 */
function calculateRelative(palaceElement: string, lineElement: string): string {
  if (palaceElement === lineElement) return '兄弟';
  
  // 生我者父母
  if (PRODUCED_BY[lineElement] === palaceElement) return '父母';
  
  // 我生者子孙
  if (PRODUCED_BY[palaceElement] === lineElement) return '子孙';
  
  // 克我者官鬼
  if (DESTROYED_BY[lineElement] === palaceElement) return '官鬼';
  
  // 我克者妻财
  if (DESTROYED_BY[palaceElement] === lineElement) return '妻财';
  
  return '兄弟'; // 兜底
}

/**
 * 确定世应爻索引 (基于上下卦二进制比对算法)
 */
function calculateShiYingIndex(code: string): { shi: number; ying: number } {
  const L0 = code[0], L1 = code[1], L2 = code[2];
  const U0 = code[3], U1 = code[4], U2 = code[5];
  
  let shi = 5; // 默认上爻为世
  
  const d0 = L0 !== U0;
  const d1 = L1 !== U1;
  const d2 = L2 !== U2;
  
  if (!d0 && !d1 && !d2) {
    shi = 5; // 八纯卦
  } else if (d0 && !d1 && !d2) {
    shi = 0; // 一世卦
  } else if (d0 && d1 && !d2) {
    shi = 1; // 二世卦
  } else if (d0 && d1 && d2) {
    shi = 2; // 三世卦
  } else if (!d0 && d1 && d2) {
    shi = 3; // 四世卦
  } else if (!d0 && !d1 && d2) {
    shi = 4; // 五世卦
  } else if (d0 && !d1 && d2) {
    shi = 3; // 游魂卦
  } else if (!d0 && d1 && !d2) {
    shi = 2; // 归魂卦
  }
  
  const ying = (shi + 3) % 6;
  return { shi, ying };
}

/**
 * 计算占卜日的空亡支 (根据日干支推导)
 */
export function calculateVoidBranches(dayGan: string, dayZhi: string): string[] {
  const ganIdx = GANS.indexOf(dayGan);
  const zhiIdx = ZHIS.indexOf(dayZhi);
  
  if (ganIdx === -1 || zhiIdx === -1) return [];
  
  // 本旬起头地支索引
  const startZhiIdx = (zhiIdx - ganIdx + 12) % 12;
  
  // 旬尾多出的两个即为空亡
  const void1 = ZHIS[(startZhiIdx + 10) % 12];
  const void2 = ZHIS[(startZhiIdx + 11) % 12];
  
  return [void1, void2];
}

/**
 * 确定六神排布 (从初爻至上爻，由日干起算)
 */
function getSixSpiritsList(dayGan: string): string[] {
  // 六神表：青龙, 朱雀, 勾陈, 腾蛇, 白虎, 玄武
  const baseSpirits = ['青龙', '朱雀', '勾陈', '腾蛇', '白虎', '玄武'];
  
  let startIdx = 0;
  if (dayGan === '甲' || dayGan === '乙') startIdx = 0; // 甲乙起青龙
  else if (dayGan === '丙' || dayGan === '丁') startIdx = 1; // 丙丁起朱雀
  else if (dayGan === '戊') startIdx = 2; // 戊日勾陈
  else if (dayGan === '己') startIdx = 3; // 己日起腾蛇
  else if (dayGan === '庚' || dayGan === '辛') startIdx = 4; // 庚辛起白虎
  else if (dayGan === '壬' || dayGan === '癸') startIdx = 5; // 壬癸起玄武
  
  const result: string[] = [];
  for (let i = 0; i < 6; i++) {
    result.push(baseSpirits[(startIdx + i) % 6]);
  }
  return result;
}

/**
 * 核心排盘计算器：装配一整套纳甲排盘信息
 * @param code 6位二进制字串 (由下至上，如 "111111")
 * @param yaoTypes 六爻具体动静状态
 * @param dayGan 占卜日天干
 * @param dayZhi 占卜日地支
 */
export function assembleHexagram(
  code: string,
  yaoTypes: YaoType[],
  dayGan: string,
  dayZhi: string
): HexagramResult {
  const baseData = getHexagramData(code);
  const { shi, ying } = calculateShiYingIndex(code);
  const voidBranches = calculateVoidBranches(dayGan, dayZhi);
  const spirits = getSixSpiritsList(dayGan);
  
  const palaceElement = baseData.palace.slice(-1); // "金", "木", "水", "火", "土"
  
  // 内外八卦名
  const innerTrigramCode = code.substring(0, 3);
  const outerTrigramCode = code.substring(3, 6);
  
  const innerTriName = TRIGRAMS[innerTrigramCode]?.name || '坤';
  const outerTriName = TRIGRAMS[outerTrigramCode]?.name || '坤';
  
  const innerFormula = NAYI_FORMULAS[innerTriName]?.inner || ['甲子', '甲寅', '甲辰'];
  const outerFormula = NAYI_FORMULAS[outerTriName]?.outer || ['癸丑', '癸亥', '癸酉'];
  
  const yaos: Yao[] = [];
  
  for (let i = 0; i < 6; i++) {
    const isInner = i < 3;
    const formulaText = isInner ? innerFormula[i] : outerFormula[i - 3];
    
    const zhi = formulaText[1];
    const element = BRANCH_ELEMENTS[zhi] || '木';
    
    const isChange = yaoTypes[i] === 2 || yaoTypes[i] === 3;
    
    yaos.push({
      index: i,
      type: yaoTypes[i],
      isChange,
      stemBranch: formulaText,
      fiveElement: element,
      sixRelative: calculateRelative(palaceElement, element),
      sixSpirit: spirits[i],
      isShi: i === shi,
      isYing: i === ying,
      isVoid: voidBranches.includes(zhi)
    });
  }
  
  return {
    ...baseData,
    yaos
  };
}
