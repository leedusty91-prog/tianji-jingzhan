export type YaoType = 0 | 1 | 2 | 3; // 0: 少阴 (拆 --), 1: 少阳 (单 -), 2: 老阳 (重 - ◯), 3: 老阴 (交 -- ✗)

export interface Yao {
  index: number;        // 0: 初爻, 1: 二爻, ..., 5: 上爻
  type: YaoType;
  isChange: boolean;    // 是否是动爻
  stemBranch: string;   // 纳甲干支 (如 "甲子")
  fiveElement: string;  // 五行 (如 "水")
  sixRelative: string;  // 六亲 (如 "父母")
  sixSpirit: string;    // 六神 (如 "青龙")
  isShi: boolean;       // 是否为世爻
  isYing: boolean;      // 是否为应爻
  isVoid: boolean;      // 是否旬空
}
export interface YaoDetail {
  name: string;        // e.g. "初九"
  scripture: string;   // e.g. "潜龙，勿用。"
  xiang: string;       // e.g. "象曰：潜龙勿用，阳在下也。"
}

export interface HexagramData {
  code: string;         // 二进制串，由底向上，如 "111111" 代表乾卦 (1为阳爻，0为阴爻)
  name: string;         // 卦名
  palace: string;       // 卦宫 (如 "乾金")
  nature: string;       // 卦意/物象 (如 "天风姤")
  judgment: string;     // 卦辞
  imageText: string;    // 象曰
  duanYiTianJi: {
    poem: string;       // 经典天纪经占歌诀
    judgment: string;   // 经典断语原文
    marriage: string;   // 婚姻感情
    wealth: string;     // 事业求财
    health: string;     // 身体健康
    travel: string;     // 出行谋望
    lostFound: string;  // 失物寻人
  };
  tianjiData?: TianjiHexData;
  yaoScriptures?: YaoDetail[]; // 六爻爻辞与象传
}

export interface TianjiHexData {
  diagramDesc: string;   // 卦图画卷描述
  symbols: {
    symbol: string;      // 意象名称 (如 "【官人在梯上】")
    meaning: string;     // 意象释义
  }[];
  humanPath: string;     // 倪师人间道断论
  geography: string;     // 倪师天纪地理断论
}

export interface HexagramResult {
  code: string;         // 卦二进制编码
  name: string;         // 卦名
  palace: string;       // 卦宫
  nature: string;       // 卦象自然性质 (如 "天风姤")
  judgment: string;     // 卦辞
  imageText: string;    // 象曰
  yaos: Yao[];          // 六个爻的详细纳甲信息 (从底向上，0为初爻)
  duanYiTianJi: HexagramData['duanYiTianJi'];
  tianjiData?: TianjiHexData;
  yaoScriptures?: YaoDetail[]; // 六爻爻辞与象传
}

export interface DivinationMeta {
  question: string;                    // 求占事项
  notes: string;                       // 备注
  date: string;                        // 占卦日期 (ISO yyyy-mm-dd)
  gender: 'male' | 'female' | 'other'; // 性别
}

export interface DivinationRecord {
  id: string;
  createdAt: string;       // 系统创建时间 (ISO)
  date: string;            // 用户选择的占卦日期 (ISO yyyy-mm-dd)
  question: string;        // 求占事项
  notes: string;           // 备注
  gender: 'male' | 'female' | 'other';  // 性别
  hexCode: string;         // 卦二进制编码 (如 "111111")
  hexName: string;         // 卦名 (如 "乾为天")
  hexNature: string;       // 卦象 (如 "天风姤")
}
