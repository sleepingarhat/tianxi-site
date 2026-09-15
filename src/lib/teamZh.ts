/**
 * 足球隊名中文對照（盡量跟香港賽馬會官方譯名）
 * 純展示層對照表：唔碰凍結預測、唔入模、唔改對帳。
 * 鍵用 football-data.co.uk 短名；對唔上嘅原樣顯示英文名，唔會亂譯。
 */

const E0: Record<string, string> = {
  Arsenal: "阿仙奴",
  "Man City": "曼城",
  Leeds: "列斯聯",
  Hull: "侯城",
  Brighton: "白禮頓",
  Chelsea: "車路士",
  Brentford: "賓福特",
  Liverpool: "利物浦",
  Everton: "愛華頓",
  Ipswich: "葉士域治",
  "Nott'm Forest": "諾定咸森林",
  Newcastle: "紐卡素",
  "Man United": "曼聯",
  Sunderland: "新特蘭",
  Bournemouth: "般尼茅夫",
  "Crystal Palace": "水晶宮",
  Tottenham: "熱刺",
  Fulham: "富咸",
  "Aston Villa": "阿士東維拉",
  Coventry: "高雲地利",
};

const D1: Record<string, string> = {
  Freiburg: "弗賴堡",
  Dortmund: "多蒙特",
  Augsburg: "奧格斯堡",
  "Bayern Munich": "拜仁慕尼黑",
  "RB Leipzig": "RB萊比錫",
  Elversberg: "艾華斯堡",
  Leverkusen: "利華古遜",
  Mainz: "緬恩斯",
  "Ein Frankfurt": "法蘭克福",
  "Werder Bremen": "雲達不萊梅",
  "Schalke 04": "史浩克零四",
  "FC Koln": "科隆",
  Hoffenheim: "賀芬咸",
  Stuttgart: "史特加",
  Paderborn: "柏德博恩",
  "Union Berlin": "柏林聯",
  "M'gladbach": "慕遜加柏",
  Hamburg: "漢堡",
};

const SP1: Record<string, string> = {
  Barcelona: "巴塞隆拿",
  "Real Madrid": "皇家馬德里",
  Betis: "貝迪斯",
  Alaves: "艾拉維斯",
  "Ath Madrid": "馬德里體育會",
  Sevilla: "西維爾",
  "La Coruna": "拉科魯尼亞",
  Espanol: "愛斯賓奴",
  "Ath Bilbao": "畢爾包",
  Santander: "桑坦德",
  Osasuna: "奧沙辛拿",
  Sociedad: "皇家蘇斯達",
  Levante: "利雲特",
  Getafe: "基達菲",
  Celta: "切爾達",
  Vallecano: "華歷簡奴",
  Malaga: "馬拉加",
  Villarreal: "維拉利爾",
  Elche: "艾爾切",
  Valencia: "華倫西亞",
};

const I1: Record<string, string> = {
  Roma: "羅馬",
  Inter: "國際米蘭",
  Como: "科木",
  Lazio: "拉素",
  Cagliari: "卡利亞里",
  Milan: "AC米蘭",
  Frosinone: "費辛隆尼",
  Juventus: "祖雲達斯",
  Sassuolo: "莎索羅",
  Napoli: "拿玻里",
  Atalanta: "阿特蘭大",
  Lecce: "萊切",
  Udinese: "烏甸尼斯",
  Torino: "拖連奴",
  Fiorentina: "費倫天拿",
  Bologna: "博洛尼亞",
  Parma: "帕爾馬",
  Monza: "蒙沙",
  Genoa: "熱拿亞",
  Venezia: "威尼斯",
};

const F1: Record<string, string> = {
  Lille: "里爾",
  Monaco: "摩納哥",
  Rennes: "雷恩",
  Lyon: "里昂",
  "Paris FC": "巴黎FC",
  Strasbourg: "斯特拉斯堡",
  Brest: "比斯特",
  "Paris SG": "巴黎聖日耳門",
  Lorient: "羅連安特",
  Lens: "朗斯",
  Angers: "昂熱",
  Troyes: "特魯瓦",
  Marseille: "馬賽",
  "Le Mans": "利文斯",
  Auxerre: "歐塞爾",
  "Le Havre": "勒哈弗爾",
  Toulouse: "圖盧茲",
  Nice: "尼斯",
};

const BY_DIV: Record<string, Record<string, string>> = { E0, D1, SP1, I1, F1 };

/** 跨聯賽後備：短名全站唯一先用得，撞名就唔亂譯 */
const GLOBAL = (() => {
  const seen = new Map<string, string | null>();
  for (const table of Object.values(BY_DIV)) {
    for (const [en, zh] of Object.entries(table)) {
      seen.set(en, seen.has(en) && seen.get(en) !== zh ? null : zh);
    }
  }
  return seen;
})();

/** 展示用中文隊名；對唔上即回傳原英文名（唔會亂譯） */
export function teamZh(div: string, name: string): string {
  return BY_DIV[div]?.[name] ?? GLOBAL.get(name) ?? name;
}
