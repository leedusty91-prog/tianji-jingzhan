// 天干、地支、六十甲子
export const GANS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHIS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 60甲子表
export const JIA_ZI: string[] = [];
for (let i = 0; i < 60; i++) {
  JIA_ZI.push(GANS[i % 10] + ZHIS[i % 12]);
}

/**
 * 获取日干支 (基于2000年1月1日为戊午日，索引54)
 */
export function getDayGanZhi(date: Date): string {
  // 本地时间的凌晨进行计算，避免时区及日中切换误差
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const baseDate = new Date(2000, 0, 1, 12, 0, 0);
  
  const diffTime = d.getTime() - baseDate.getTime();
  const diffDays = Math.round(diffTime / (24 * 60 * 60 * 1000));
  
  const baseIndex = 54; // 戊午
  const targetIndex = ((baseIndex + diffDays) % 60 + 60) % 60;
  
  return JIA_ZI[targetIndex];
}

/**
 * 获取时辰地支与干支 (五鼠遁元法)
 */
export function getHourGanZhi(date: Date, dayGan: string): string {
  const hour = date.getHours();
  
  // 确定时辰地支索引
  // 23:00 - 00:59: 子 (0)
  // 01:00 - 02:59: 丑 (1)
  // ...
  let zhiIndex = 0;
  if (hour >= 23 || hour < 1) zhiIndex = 0;
  else zhiIndex = Math.floor((hour + 1) / 2);
  
  const zhi = ZHIS[zhiIndex];
  
  // 五鼠遁起例：口诀决定子时天干
  // 甲己还加甲，乙庚丙作初。丙辛从戊起，丁壬庚子居。戊癸何方发，壬子是真途。
  let startGanIndex = 0; // 默认甲
  if (dayGan === '甲' || dayGan === '己') startGanIndex = 0; // 甲子
  else if (dayGan === '乙' || dayGan === '庚') startGanIndex = 2; // 丙子
  else if (dayGan === '丙' || dayGan === '辛') startGanIndex = 4; // 戊子
  else if (dayGan === '丁' || dayGan === '壬') startGanIndex = 6; // 庚子
  else if (dayGan === '戊' || dayGan === '癸') startGanIndex = 8; // 壬子
  
  const ganIndex = (startGanIndex + zhiIndex) % 10;
  const gan = GANS[ganIndex];
  
  return gan + zhi;
}

/**
 * 获取月份地支与干支 (五虎遁月法)
 * 简易对齐：以农历月份来配月建地支 (正月为寅建，二月为卯...)
 */
export function getMonthGanZhi(lunarMonth: number, yearGan: string): string {
  // 月份地支：正月为寅(2)，十二月为丑(1)
  // 地支序列中：寅为2, 卯为3... 子为0, 丑为1
  const zhiIndex = (lunarMonth + 1) % 12;
  const zhi = ZHIS[zhiIndex];
  
  // 五虎遁年起月诀：口诀决定正月(寅月)天干
  // 甲己之年丙作首，乙庚之岁戊为头。丙辛之岁寻庚上，丁壬壬位顺水流。若问戊癸何方法，甲寅之上好追求。
  let startGanIndex = 2; // 默认丙 (甲己年正月起丙寅)
  if (yearGan === '甲' || yearGan === '己') startGanIndex = 2; // 丙
  else if (yearGan === '乙' || yearGan === '庚') startGanIndex = 4; // 戊
  else if (yearGan === '丙' || yearGan === '辛') startGanIndex = 6; // 庚
  else if (yearGan === '丁' || yearGan === '壬') startGanIndex = 8; // 壬
  else if (yearGan === '戊' || yearGan === '癸') startGanIndex = 0; // 甲
  
  // 正月(index为0)对应起步干，此后逐月递增
  const monthOffset = lunarMonth - 1; 
  const ganIndex = (startGanIndex + monthOffset) % 10;
  const gan = GANS[ganIndex];
  
  return gan + zhi;
}

/**
 * 完整解析日期的公历、农历和干支属性
 */
export interface GanzhiInfo {
  solarDate: string;
  lunarDate: string;
  ganzhiDate: string;
  dayGan: string;
  dayZhi: string;
}

export function parseCalendar(date: Date): GanzhiInfo {
  // 1. 公历文本
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const solarDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  
  // 2. 使用原生 Intl 获取农历及年柱干支
  let lunarDate = '';
  let yearGanZhi = '丙午'; // 备用默认值
  let lunarMonth = 4;
  let lunarDayText = '初四';
  
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    
    // 例如输出：2026丙午年四月4
    let yearText = '';
    let monthText = '';
    let dayVal = 4;
    
    parts.forEach(p => {
      if (p.type === 'year') yearText = p.value; // e.g. "2026丙午年"
      if (p.type === 'month') monthText = p.value; // e.g. "四月"
      if (p.type === 'day') dayVal = parseInt(p.value, 10);
    });
    
    // 提取干支年
    const yearMatch = yearText.match(/[\u4e00-\u9fa5]{2}年/); // 匹配两个汉字加“年”
    if (yearMatch) {
      yearGanZhi = yearMatch[0].replace('年', '');
    } else {
      // 兜底正则
      const match = yearText.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])年/);
      if (match) yearGanZhi = match[1];
    }
    
    // 农历月份与天数格式化
    const numToChineseMonth: Record<string, number> = {
      '正月': 1, '二月': 2, '三月': 3, '四月': 4, '五月': 5, '六月': 6,
      '七月': 7, '八月': 8, '九月': 9, '十月': 10, '十一月': 11, '腊月': 12
    };
    lunarMonth = numToChineseMonth[monthText] || date.getMonth() + 1;
    
    const chineseDays = [
      '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    lunarDayText = chineseDays[dayVal] || '初一';
    lunarDate = `${yearGanZhi}年${monthText}${lunarDayText}`;
  } catch (e) {
    // 兜底农历显示
    lunarDate = `${yearGanZhi}年四月${lunarDayText}`;
  }
  
  // 3. 计算日柱与时柱
  const yearGan = yearGanZhi[0];
  const dayGanZhi = getDayGanZhi(date);
  const dayGan = dayGanZhi[0];
  const dayZhi = dayGanZhi[1];
  
  const monthGanZhi = getMonthGanZhi(lunarMonth, yearGan);
  const hourGanZhi = getHourGanZhi(date, dayGan);
  
  // 组合八字干支
  const ganzhiDate = `${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${hourGanZhi}时`;
  
  return {
    solarDate,
    lunarDate,
    ganzhiDate,
    dayGan,
    dayZhi,
  };
}
