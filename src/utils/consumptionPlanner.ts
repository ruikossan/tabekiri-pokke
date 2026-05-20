import { StockItem } from "../types";
import { getDaysUntilExpiry, sortByExpiry } from "./expiryUtils";

export type ConsumptionPlan = {
  id: string;
  title: string;
  description: string;
  stockItems: StockItem[];
  missingItems: string[];
  restockItems: StockItem[];
  priority: "today" | "week" | "month";
};

type RecipeRule = {
  id: string;
  title: string;
  description: string;
  missingItems: string[];
  match: (items: StockItem[]) => StockItem[];
};

const recipeRules: RecipeRule[] = [
  {
    id: "curry-rice",
    title: "カレーライス消費セット",
    description: "レトルトとご飯をまとめて消費します。期限が近い主食を日常の食事に回せます。",
    missingItems: ["サラダ", "野菜ジュース"],
    match: (items) => pickByKeywords(items, ["カレー", "レトルト"], ["ご飯", "米", "パックご飯", "主食"])
  },
  {
    id: "pasta-can",
    title: "缶詰パスタ",
    description: "缶詰をソース代わりにして、主食と一緒に消費します。",
    missingItems: ["パスタ", "オリーブオイル"],
    match: (items) => pickByCategoryOrKeywords(items, ["缶詰"], ["パスタ", "主食", "麺"])
  },
  {
    id: "tuna-rice",
    title: "ツナご飯・混ぜご飯",
    description: "ツナ缶や魚缶を、ご飯と合わせて軽い食事にします。",
    missingItems: ["海苔", "味噌汁"],
    match: (items) => pickByKeywords(items, ["ツナ", "魚", "さば", "鯖"], ["ご飯", "米", "パックご飯", "主食"])
  },
  {
    id: "noodle-lunch",
    title: "簡単昼食セット",
    description: "カップ麺や主食系の食品ストックを、飲料や補助食品と合わせて消費します。",
    missingItems: ["野菜ジュース", "果物"],
    match: (items) => pickByKeywords(items, ["カップ", "麺", "ラーメン", "うどん"], ["飲料", "水", "お茶", "ジュース"])
  },
  {
    id: "dry-vegetable-soup",
    title: "乾物スープ消費",
    description: "乾燥野菜やわかめをスープにして、少量ずつ無理なく使います。",
    missingItems: ["インスタント味噌汁", "卵"],
    match: (items) => pickAnyTwo(items, ["乾燥野菜", "乾燥わかめ", "切り干し大根", "ひじき", "高野豆腐", "麩", "春雨"], ["スープ", "味噌汁", "カップ", "麺", "うどん"])
  },
  {
    id: "bean-salad",
    title: "豆缶サラダ・副菜",
    description: "豆缶やコーン缶を副菜にして、主食に偏りがちな食品ストックを整えます。",
    missingItems: ["ドレッシング", "ツナ缶"],
    match: (items) => pickAnyTwo(items, ["大豆缶", "ひよこ豆缶", "ミックスビーンズ缶", "コーン缶"], ["ツナ", "サバ", "鮭", "ドレッシング"])
  },
  {
    id: "bread-breakfast",
    title: "パン・クラッカー朝食",
    description: "パン、乾パン、クラッカーを朝食や軽食に回します。",
    missingItems: ["ジャム", "スープ"],
    match: (items) => pickAnyTwo(items, ["食パン", "缶詰パン", "乾パン", "クラッカー"], ["フルーツ缶", "ジャム", "はちみつ", "スープ"])
  },
  {
    id: "oatmeal-breakfast",
    title: "オートミール朝食",
    description: "オートミールやシリアルを朝食にして、期限前に消費します。",
    missingItems: ["牛乳", "ヨーグルト"],
    match: (items) => pickAnyTwo(items, ["オートミール", "コーンフレーク", "シリアル"], ["フルーツ缶", "ドライフルーツ", "ナッツ", "豆乳"])
  },
  {
    id: "powder-pan",
    title: "粉もの軽食",
    description: "ホットケーキミックスや小麦粉を、休日の軽食やおやつに回します。",
    missingItems: ["卵", "牛乳"],
    match: (items) => pickAnyTwo(items, ["ホットケーキミックス", "小麦粉", "パン粉"], ["フルーツ缶", "ツナ", "コーン", "粉チーズ"])
  },
  {
    id: "snack-energy",
    title: "補食・おやつ消費",
    description: "チョコ、飴、ビスケットなどを、外出時や子どものおやつに回します。",
    missingItems: ["お茶", "水"],
    match: (items) => pickAnyTwo(items, ["チョコ", "飴", "キャンディ", "ビスケット", "クッキー", "ようかん", "ナッツ"], ["水", "お茶", "ジュース", "飲料"])
  },
  {
    id: "sick-day",
    title: "体調不良時のやさしい食事",
    description: "おかゆ、ゼリー飲料、経口補水系を体調不良時の備えとして回します。",
    missingItems: ["常備薬", "使い捨てスプーン"],
    match: (items) => pickAnyTwo(items, ["おかゆ", "雑炊", "ゼリー", "経口補水", "スポーツドリンク"], ["水", "お茶", "ビスケット"])
  },
  {
    id: "baby-care",
    title: "乳幼児向け備蓄の見直し",
    description: "離乳食やミルクは月齢に合わなくなる前に消費・入れ替えします。",
    missingItems: ["おしりふき", "紙おむつ"],
    match: (items) => pickAnyTwo(items, ["離乳食", "粉ミルク", "液体ミルク", "ベビーフード"], ["水", "麦茶", "おやつ"])
  }
];

const stapleKeywords = [
  "米",
  "無洗米",
  "アルファ米",
  "パックご飯",
  "餅米",
  "もち",
  "小麦粉",
  "食パン",
  "乾パン",
  "クラッカー",
  "スパゲッティ",
  "マカロニ",
  "そうめん",
  "そば",
  "乾麺うどん",
  "カップ麺",
  "インスタントラーメン",
  "オートミール",
  "コーンフレーク",
  "ホットケーキミックス"
];

const pairingKeywords = [
  "ツナ缶",
  "サバ缶",
  "鮭缶",
  "イワシ缶",
  "焼き鳥缶",
  "コンビーフ缶",
  "スパム缶",
  "カレー缶",
  "大豆缶",
  "コーン缶",
  "トマト缶",
  "フルーツ缶",
  "ひよこ豆缶",
  "ミックスビーンズ缶",
  "レトルトカレー",
  "レトルト牛丼",
  "レトルト親子丼",
  "レトルト中華丼",
  "親子丼の素",
  "麻婆豆腐の素",
  "炊き込みご飯の素",
  "パスタソース",
  "ミートソース",
  "乾燥野菜",
  "乾燥わかめ",
  "乾燥ねぎ",
  "切り干し大根",
  "ひじき",
  "高野豆腐",
  "春雨",
  "干し椎茸",
  "干しエビ",
  "桜えび",
  "きくらげ",
  "麩",
  "海苔",
  "塩昆布",
  "昆布",
  "かつお節",
  "ごま",
  "青のり",
  "粉チーズ",
  "パン粉"
];

const standalonePlanDefinitions = [
  {
    title: "飲料・ゼリーを日常補給に回す",
    description: "スポーツドリンク、ゼリー飲料、野菜ジュースなどを外出時や体調管理の補助に使います。",
    keywords: ["スポーツドリンク", "経口補水", "ゼリー", "野菜ジュース", "ジュース", "豆乳", "飲料"],
    missingItems: ["水", "軽食"]
  },
  {
    title: "乾物を味噌汁・副菜に足す",
    description: "乾物は少量ずつ普段の汁物や副菜に足すと、期限前に消費しやすくなります。",
    keywords: ["乾燥野菜", "乾燥わかめ", "切り干し大根", "ひじき", "高野豆腐", "麩", "昆布"],
    missingItems: ["味噌汁", "卵"]
  },
  {
    title: "お菓子・嗜好品を入れ替える",
    description: "甘いものや嗜好品は、非常時の安心感にもつながるため、食べ慣れたものを回します。",
    keywords: ["チョコ", "飴", "キャンディ", "ビスケット", "クッキー", "ようかん", "ナッツ", "ドライフルーツ"],
    missingItems: ["お茶", "水"]
  },
  {
    title: "調味料・ふりかけを普段使いする",
    description: "塩昆布、海苔、ふりかけ、粉チーズなどは、主食に足して消費します。",
    keywords: ["塩昆布", "海苔", "ふりかけ", "粉チーズ", "ごま", "青のり", "かつお節"],
    missingItems: ["ご飯", "麺"]
  },
  {
    title: "乳幼児・介護食を期限前に入れ替える",
    description: "月齢や体調に合わなくなる前に、離乳食・介護食・ミルクを確認します。",
    keywords: ["離乳食", "ベビーフード", "粉ミルク", "液体ミルク", "介護食", "やわらか食"],
    missingItems: ["水", "使い捨てスプーン"]
  }
];

export function generateConsumptionPlans(stockItems: StockItem[]): ConsumptionPlan[] {
  const expiringItems = sortByExpiry(stockItems.filter((item) => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days !== undefined && days >= 0 && days <= 90;
  }));
  const candidateItems = sortByExpiry([...expiringItems, ...stockItems.filter((item) => !expiringItems.some((expiring) => expiring.id === item.id))]);

  const plans: ConsumptionPlan[] = [];
  const usedIds = new Set<string>();

  recipeRules.forEach((rule) => {
    const matched = prioritizeExpiringItems(rule.match(candidateItems), expiringItems).filter((item) => !usedIds.has(item.id));
    if (matched.length < 2 || !hasExpiringItem(matched, expiringItems)) return;

    matched.forEach((item) => usedIds.add(item.id));
    plans.push(createPlan(rule.id, rule.title, rule.description, matched, rule.missingItems));
  });

  createFlexibleStaplePlans(expiringItems, candidateItems, usedIds).forEach((plan) => {
    plan.stockItems.forEach((item) => usedIds.add(item.id));
    plans.push(plan);
  });

  createStandaloneThemePlans(expiringItems, candidateItems, usedIds).forEach((plan) => {
    plan.stockItems.forEach((item) => usedIds.add(item.id));
    plans.push(plan);
  });

  expiringItems
    .filter((item) => !usedIds.has(item.id))
    .slice(0, 3)
    .forEach((item) => {
      plans.push(createPlan(
        `single-${item.id}`,
        `${item.name}を今週使う`,
        "単品で消費しやすい期限間近の備蓄です。普段の食事やおやつに組み込んで、消費後に同じ数だけ補充します。",
        [item],
        suggestMissingItems(item)
      ));
    });

  return plans.slice(0, 8);
}

function createPlan(
  id: string,
  title: string,
  description: string,
  stockItems: StockItem[],
  missingItems: string[]
): ConsumptionPlan {
  return {
    id,
    title,
    description,
    stockItems,
    missingItems,
    restockItems: stockItems.filter((item) => item.shouldRestock),
    priority: getPriority(stockItems)
  };
}

function getPriority(items: StockItem[]): ConsumptionPlan["priority"] {
  const nearest = Math.min(...items.map((item) => getDaysUntilExpiry(item.expiryDate) ?? 999));
  if (nearest <= 7) return "today";
  if (nearest <= 30) return "week";
  return "month";
}

function pickByKeywords(items: StockItem[], firstKeywords: string[], secondKeywords: string[]): StockItem[] {
  const first = items.find((item) => includesAny(item, firstKeywords));
  const second = items.find((item) => first?.id !== item.id && includesAny(item, secondKeywords));
  return [first, second].filter((item): item is StockItem => Boolean(item));
}

function pickByCategoryOrKeywords(items: StockItem[], categoryKeywords: string[], secondKeywords: string[]): StockItem[] {
  const first = items.find((item) => categoryKeywords.some((keyword) => item.category.includes(keyword)) || includesAny(item, categoryKeywords));
  const second = items.find((item) => first?.id !== item.id && includesAny(item, secondKeywords));
  return [first, second].filter((item): item is StockItem => Boolean(item));
}

function pickAnyTwo(items: StockItem[], firstKeywords: string[], secondKeywords: string[]): StockItem[] {
  const first = items.find((item) => includesAny(item, firstKeywords));
  const second = items.find((item) => first?.id !== item.id && includesAny(item, secondKeywords));
  if (first && second) return [first, second];

  return items
    .filter((item) => includesAny(item, [...firstKeywords, ...secondKeywords]))
    .slice(0, 2);
}

function createFlexibleStaplePlans(expiringItems: StockItem[], candidateItems: StockItem[], usedIds: Set<string>): ConsumptionPlan[] {
  const staples = candidateItems.filter((item) => !usedIds.has(item.id) && includesAny(item, stapleKeywords));
  const pairings = candidateItems.filter((item) => !usedIds.has(item.id) && includesAny(item, pairingKeywords));
  const plans: ConsumptionPlan[] = [];
  const localUsed = new Set<string>();

  staples.forEach((staple) => {
    if (localUsed.has(staple.id)) return;
    const pairing = pairings.find((item) => item.id !== staple.id && !localUsed.has(item.id));
    if (!pairing || !hasExpiringItem([staple, pairing], expiringItems)) return;

    localUsed.add(staple.id);
    localUsed.add(pairing.id);
    plans.push(createPlan(
      `flex-${staple.id}-${pairing.id}`,
      `${staple.name}アレンジ消費`,
      `${staple.name}と${pairing.name}を組み合わせて、期限が近い主食を今週の食事に回します。`,
      [staple, pairing],
      suggestPairingMissingItems(staple, pairing)
    ));
  });

  return plans;
}

function createStandaloneThemePlans(expiringItems: StockItem[], candidateItems: StockItem[], usedIds: Set<string>): ConsumptionPlan[] {
  const plans: ConsumptionPlan[] = [];

  standalonePlanDefinitions.forEach((definition, index) => {
    const matched = prioritizeExpiringItems(candidateItems, expiringItems)
      .filter((item) => !usedIds.has(item.id) && includesAny(item, definition.keywords))
      .slice(0, 2);
    if (matched.length === 0 || !hasExpiringItem(matched, expiringItems)) return;

    plans.push(createPlan(
      `theme-${index}-${matched.map((item) => item.id).join("-")}`,
      definition.title,
      definition.description,
      matched,
      definition.missingItems
    ));
  });

  return plans;
}

function includesAny(item: StockItem, keywords: string[]): boolean {
  const text = `${item.name} ${item.category}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function hasExpiringItem(items: StockItem[], expiringItems: StockItem[]): boolean {
  return items.some((item) => expiringItems.some((expiring) => expiring.id === item.id));
}

function prioritizeExpiringItems(items: StockItem[], expiringItems: StockItem[]): StockItem[] {
  return [...items].sort((a, b) => {
    const aExpiring = expiringItems.some((item) => item.id === a.id) ? 0 : 1;
    const bExpiring = expiringItems.some((item) => item.id === b.id) ? 0 : 1;
    if (aExpiring !== bExpiring) return aExpiring - bExpiring;

    const aDays = getDaysUntilExpiry(a.expiryDate) ?? 999;
    const bDays = getDaysUntilExpiry(b.expiryDate) ?? 999;
    return aDays - bDays;
  });
}

function suggestMissingItems(item: StockItem): string[] {
  if (includesAny(item, ["カレー", "レトルト", "缶詰"])) return ["ご飯", "サラダ"];
  if (includesAny(item, ["主食", "ご飯", "米", "麺"])) return ["缶詰", "野菜ジュース"];
  if (includesAny(item, ["お菓子"])) return ["飲み物"];
  return ["日常の食事に合わせるもの"];
}

function suggestPairingMissingItems(staple: StockItem, pairing: StockItem): string[] {
  if (includesAny(staple, ["米", "ご飯", "アルファ米"]) || includesAny(pairing, ["丼", "カレー"])) {
    return ["味噌汁", "野菜ジュース"];
  }
  if (includesAny(staple, ["スパゲッティ", "マカロニ", "麺", "うどん", "そば"])) {
    return ["乾燥野菜", "スープ"];
  }
  if (includesAny(staple, ["クラッカー", "乾パン", "食パン"])) {
    return ["スープ", "飲み物"];
  }
  if (includesAny(staple, ["オートミール", "コーンフレーク", "ホットケーキ"])) {
    return ["牛乳", "フルーツ"];
  }
  return ["野菜ジュース", "汁物"];
}
