import { StockItem } from "../types";
import { getDaysUntilExpiry, sortByExpiry } from "./expiryUtils";

export type ConsumptionPlan = {
  id: string;
  title: string;
  description: string;
  recipeSteps: string[];
  visualType: RecipeVisualType;
  imageKey: RecipeImageKey;
  stockItems: StockItem[];
  missingItems: string[];
  restockItems: StockItem[];
  priority: "today" | "week" | "month";
};

export type RecipeVisualType = "rice" | "noodle" | "soup" | "salad" | "bread" | "pancake" | "snack" | "drink" | "care";
export type RecipeImageKey =
  | "baby-care-meal"
  | "bean-salad"
  | "bread-breakfast"
  | "canned-pasta"
  | "canned-rice-salad"
  | "care-food-rotation"
  | "curry-doria"
  | "curry-rice"
  | "drink-jelly-refresh"
  | "dry-food-miso-soup"
  | "dry-vegetable-soup"
  | "egg-soup-rice"
  | "egg-udon"
  | "fish-miso-rice"
  | "furikake-rice"
  | "generic-use-up-meal"
  | "loaded-noodles"
  | "meat-vegetable-stir-fry"
  | "milk-soup-pancake"
  | "noodle-lunch"
  | "oatmeal-breakfast"
  | "powder-pan"
  | "sick-day-meal"
  | "snack-rotation"
  | "snack-yogurt"
  | "tofu-egg-rice"
  | "tuna-rice"
  | "vegetable-soup";

type RecipeRule = {
  id: string;
  title: string;
  description: string;
  recipeSteps: string[];
  visualType: RecipeVisualType;
  imageKey: RecipeImageKey;
  missingItems: string[];
  match: (items: StockItem[]) => StockItem[];
};

type SingleItemRecipeSuggestion = {
  title: string;
  description: string;
  recipeSteps: string[];
  visualType: RecipeVisualType;
  imageKey: RecipeImageKey;
  missingItems: string[];
};

type StandalonePlanDefinition = {
  title: string;
  description: string;
  recipeSteps: string[];
  visualType: RecipeVisualType;
  imageKey: RecipeImageKey;
  keywords: string[];
  missingItems: string[];
};

const recipeRules: RecipeRule[] = [
  {
    id: "curry-rice",
    title: "カレーライス消費セット",
    description: "レトルトとご飯をまとめて消費します。期限が近い主食を日常の食事に回せます。",
    visualType: "rice",
    imageKey: "curry-rice",
    recipeSteps: [
      "ご飯を温め、レトルトカレーは表示時間どおりに温めます。",
      "器にご飯を盛り、カレーをかけます。",
      "野菜ジュースやサラダを添えると、栄養の偏りを抑えられます。"
    ],
    missingItems: ["サラダ", "野菜ジュース"],
    match: (items) => pickByKeywords(items, ["カレー", "レトルト"], ["ご飯", "米", "パックご飯", "主食"])
  },
  {
    id: "pasta-can",
    title: "缶詰パスタ",
    description: "缶詰をソース代わりにして、主食と一緒に消費します。",
    visualType: "noodle",
    imageKey: "canned-pasta",
    recipeSteps: [
      "パスタをゆで、缶詰は汁ごと軽く温めます。",
      "ゆでたパスタに缶詰を和え、必要ならオリーブオイルを足します。",
      "味が薄いときは塩こしょうや粉チーズで整えます。"
    ],
    missingItems: ["パスタ", "オリーブオイル"],
    match: (items) => pickByCategoryOrKeywords(items, ["缶詰"], ["パスタ", "主食", "麺"])
  },
  {
    id: "tuna-rice",
    title: "ツナご飯・混ぜご飯",
    description: "ツナ缶や魚缶を、ご飯と合わせて軽い食事にします。",
    visualType: "rice",
    imageKey: "tuna-rice",
    recipeSteps: [
      "ご飯を温め、ツナ缶や魚缶は軽く油や汁を切ります。",
      "ご飯に缶詰をのせ、しょうゆや塩昆布があれば少量足します。",
      "海苔や味噌汁を添えると、食べやすい一食になります。"
    ],
    missingItems: ["海苔", "味噌汁"],
    match: (items) => pickByKeywords(items, ["ツナ", "魚", "さば", "鯖"], ["ご飯", "米", "パックご飯", "主食"])
  },
  {
    id: "noodle-lunch",
    title: "簡単昼食セット",
    description: "カップ麺や主食系の食品ストックを、飲料や補助食品と合わせて消費します。",
    visualType: "noodle",
    imageKey: "noodle-lunch",
    recipeSteps: [
      "カップ麺や麺類を表示どおりに作ります。",
      "乾燥野菜やわかめがあれば一緒に入れて温めます。",
      "飲料や果物を添えて、軽い昼食として食べきります。"
    ],
    missingItems: ["野菜ジュース", "果物"],
    match: (items) => pickByKeywords(items, ["カップ", "麺", "ラーメン", "うどん"], ["飲料", "水", "お茶", "ジュース"])
  },
  {
    id: "dry-vegetable-soup",
    title: "乾物スープ消費",
    description: "乾燥野菜やわかめをスープにして、少量ずつ無理なく使います。",
    visualType: "soup",
    imageKey: "dry-vegetable-soup",
    recipeSteps: [
      "スープや味噌汁を作り、乾物を少量入れます。",
      "乾物が戻るまで数分置き、必要なら弱火で温めます。",
      "卵や春雨を足すと、満足感のある汁物になります。"
    ],
    missingItems: ["インスタント味噌汁", "卵"],
    match: (items) => pickAnyTwo(items, ["乾燥野菜", "乾燥わかめ", "切り干し大根", "ひじき", "高野豆腐", "麩", "春雨"], ["スープ", "味噌汁", "カップ", "麺", "うどん"])
  },
  {
    id: "bean-salad",
    title: "豆缶サラダ・副菜",
    description: "豆缶やコーン缶を副菜にして、主食に偏りがちな食品ストックを整えます。",
    visualType: "salad",
    imageKey: "bean-salad",
    recipeSteps: [
      "豆缶やコーン缶は汁を切り、軽く水気を取ります。",
      "ツナやサバ缶があれば一緒に混ぜます。",
      "ドレッシングやマヨネーズで和えて副菜にします。"
    ],
    missingItems: ["ドレッシング", "ツナ缶"],
    match: (items) => pickAnyTwo(items, ["大豆缶", "ひよこ豆缶", "ミックスビーンズ缶", "コーン缶"], ["ツナ", "サバ", "鮭", "ドレッシング"])
  },
  {
    id: "bread-breakfast",
    title: "パン・クラッカー朝食",
    description: "パン、乾パン、クラッカーを朝食や軽食に回します。",
    visualType: "bread",
    imageKey: "bread-breakfast",
    recipeSteps: [
      "パンやクラッカーを食べやすい量に分けます。",
      "ジャム、はちみつ、フルーツ缶などを添えます。",
      "スープや飲み物と合わせて、朝食や軽食にします。"
    ],
    missingItems: ["ジャム", "スープ"],
    match: (items) => pickAnyTwo(items, ["食パン", "缶詰パン", "乾パン", "クラッカー"], ["フルーツ缶", "ジャム", "はちみつ", "スープ"])
  },
  {
    id: "oatmeal-breakfast",
    title: "オートミール朝食",
    description: "オートミールやシリアルを朝食にして、期限前に消費します。",
    visualType: "bread",
    imageKey: "oatmeal-breakfast",
    recipeSteps: [
      "オートミールやシリアルを器に入れます。",
      "牛乳、豆乳、ヨーグルトなどをかけます。",
      "フルーツ缶やナッツを足して朝食にします。"
    ],
    missingItems: ["牛乳", "ヨーグルト"],
    match: (items) => pickAnyTwo(items, ["オートミール", "コーンフレーク", "シリアル"], ["フルーツ缶", "ドライフルーツ", "ナッツ", "豆乳"])
  },
  {
    id: "powder-pan",
    title: "粉もの軽食",
    description: "ホットケーキミックスや小麦粉を、休日の軽食やおやつに回します。",
    visualType: "pancake",
    imageKey: "powder-pan",
    recipeSteps: [
      "粉ものに卵や牛乳、水を加えて生地を作ります。",
      "フライパンで両面を焼きます。",
      "フルーツ缶、ツナ、コーンなどをのせて食べきります。"
    ],
    missingItems: ["卵", "牛乳"],
    match: (items) => pickAnyTwo(items, ["ホットケーキミックス", "小麦粉", "パン粉"], ["フルーツ缶", "ツナ", "コーン", "粉チーズ"])
  },
  {
    id: "snack-energy",
    title: "補食・おやつ消費",
    description: "チョコ、飴、ビスケットなどを、外出時や子どものおやつに回します。",
    visualType: "snack",
    imageKey: "snack-rotation",
    recipeSteps: [
      "期限が近いおやつを食べきりやすい量に分けます。",
      "外出時、仕事中、子どものおやつ用に回します。",
      "水やお茶と一緒に消費し、同じ数だけ補充候補にします。"
    ],
    missingItems: ["お茶", "水"],
    match: (items) => pickAnyTwo(items, ["チョコ", "飴", "キャンディ", "ビスケット", "クッキー", "ようかん", "ナッツ"], ["水", "お茶", "ジュース", "飲料"])
  },
  {
    id: "sick-day",
    title: "体調不良時のやさしい食事",
    description: "おかゆ、ゼリー飲料、経口補水系を体調不良時の備えとして回します。",
    visualType: "soup",
    imageKey: "sick-day-meal",
    recipeSteps: [
      "おかゆや雑炊は表示どおりに温めます。",
      "ゼリー飲料や経口補水系はすぐ飲める場所に移します。",
      "体調不良時のセットとしてまとめ、期限が近いものから使います。"
    ],
    missingItems: ["常備薬", "使い捨てスプーン"],
    match: (items) => pickAnyTwo(items, ["おかゆ", "雑炊", "ゼリー", "経口補水", "スポーツドリンク"], ["水", "お茶", "ビスケット"])
  },
  {
    id: "baby-care",
    title: "乳幼児向け食品の見直し",
    description: "離乳食やミルクは月齢に合わなくなる前に消費・入れ替えします。",
    visualType: "care",
    imageKey: "baby-care-meal",
    recipeSteps: [
      "月齢や現在の食事内容に合うものか確認します。",
      "使えるものは普段の食事や外出時に回します。",
      "合わなくなりそうなものは、早めに入れ替え候補にします。"
    ],
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

const standalonePlanDefinitions: StandalonePlanDefinition[] = [
  {
    title: "飲料・ゼリーを日常補給に回す",
    description: "スポーツドリンク、ゼリー飲料、野菜ジュースなどを外出時や体調管理の補助に使います。",
    visualType: "drink",
    imageKey: "drink-jelly-refresh",
    recipeSteps: ["期限が近い飲料やゼリーを取り出し、すぐ使う場所へ移します。", "外出時、入浴後、体調管理用などに分けて消費します。", "使った分は必要に応じて買い物リストへ補充します。"],
    keywords: ["スポーツドリンク", "経口補水", "ゼリー", "野菜ジュース", "ジュース", "豆乳", "飲料"],
    missingItems: ["水", "軽食"]
  },
  {
    title: "乾物を味噌汁・副菜に足す",
    description: "乾物は少量ずつ普段の汁物や副菜に足すと、期限前に消費しやすくなります。",
    visualType: "soup",
    imageKey: "dry-food-miso-soup",
    recipeSteps: ["味噌汁やスープを作るときに乾物を少量入れます。", "戻るまで数分置き、必要なら温め直します。", "残った乾物は次の汁物用に分けておきます。"],
    keywords: ["乾燥野菜", "乾燥わかめ", "切り干し大根", "ひじき", "高野豆腐", "麩", "昆布"],
    missingItems: ["味噌汁", "卵"]
  },
  {
    title: "お菓子・嗜好品を入れ替える",
    description: "甘いものや嗜好品は、非常時の安心感にもつながるため、食べ慣れたものを回します。",
    visualType: "snack",
    imageKey: "snack-rotation",
    recipeSteps: ["期限が近いお菓子を普段のおやつ用に分けます。", "外出用、仕事用、子ども用など使う場面を決めます。", "食べきったら好みに合うものを補充します。"],
    keywords: ["チョコ", "飴", "キャンディ", "ビスケット", "クッキー", "ようかん", "ナッツ", "ドライフルーツ"],
    missingItems: ["お茶", "水"]
  },
  {
    title: "調味料・ふりかけを普段使いする",
    description: "塩昆布、海苔、ふりかけ、粉チーズなどは、主食に足して消費します。",
    visualType: "rice",
    imageKey: "furikake-rice",
    recipeSteps: ["ご飯や麺などの主食を用意します。", "塩昆布、海苔、ふりかけ、粉チーズなどを少量足します。", "味を見ながら普段の食事で使い切ります。"],
    keywords: ["塩昆布", "海苔", "ふりかけ", "粉チーズ", "ごま", "青のり", "かつお節"],
    missingItems: ["ご飯", "麺"]
  },
  {
    title: "乳幼児・介護食を期限前に入れ替える",
    description: "月齢や体調に合わなくなる前に、離乳食・介護食・ミルクを確認します。",
    visualType: "care",
    imageKey: "care-food-rotation",
    recipeSteps: ["対象者の月齢、体調、食べられる形状に合うか確認します。", "使えるものは普段の食事や外出時に回します。", "合わないものは入れ替え候補として買い物リストに追加します。"],
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
    plans.push(createPlan(rule.id, rule.title, rule.description, rule.recipeSteps, rule.visualType, rule.imageKey, matched, rule.missingItems));
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
      const suggestion = createSingleItemRecipeSuggestion(item);
      plans.push(createPlan(
        `single-${item.id}`,
        suggestion.title,
        suggestion.description,
        suggestion.recipeSteps,
        suggestion.visualType,
        suggestion.imageKey,
        [item],
        suggestion.missingItems
      ));
    });

  return plans.slice(0, 8);
}

function createPlan(
  id: string,
  title: string,
  description: string,
  recipeSteps: string[],
  visualType: RecipeVisualType,
  imageKey: RecipeImageKey,
  stockItems: StockItem[],
  missingItems: string[]
): ConsumptionPlan {
  return {
    id,
    title,
    description,
    recipeSteps,
    visualType,
    imageKey,
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
      createFlexibleRecipeSteps(staple, pairing),
      getFlexibleVisualType(staple),
      getFlexibleImageKey(staple),
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
      definition.recipeSteps,
      definition.visualType,
      definition.imageKey,
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

function createFlexibleRecipeSteps(staple: StockItem, pairing: StockItem): string[] {
  if (includesAny(staple, ["米", "ご飯", "アルファ米", "パックご飯"])) {
    return [
      `${staple.name}を温めて、器に入れます。熱いので、取り出すときは気をつけます。`,
      `${pairing.name}を食べやすい大きさにします。缶詰やレトルトなら、汁やソースも少し使うと味がつきます。`,
      `${staple.name}の上に${pairing.name}をのせます。海苔、ごま、ねぎ、卵があれば少し足すと、丼や混ぜご飯になります。`
    ];
  }
  if (includesAny(staple, ["麺", "うどん", "そば", "パスタ", "ラーメン"])) {
    return [
      `${staple.name}を袋や箱に書いてある時間どおりに作ります。お湯を使うときは大人と一緒に作ります。`,
      `${pairing.name}を具にします。缶詰なら汁を少し切り、乾物なら先に水やお湯で戻します。`,
      `できた${staple.name}に${pairing.name}をのせます。味が薄いときは、めんつゆ、塩こしょう、ごま油を少しだけ足します。`
    ];
  }
  if (includesAny(staple, ["パン", "クラッカー", "乾パン"])) {
    return [
      `${staple.name}をお皿に出します。かたい場合はスープや飲み物と一緒に食べます。`,
      `${pairing.name}をのせやすい大きさにします。ツナやコーンなら、マヨネーズを少し混ぜても食べやすいです。`,
      `${staple.name}に${pairing.name}をのせて、のせパンやクラッカーサンドにします。こぼれやすいので一口ずつ食べます。`
    ];
  }
  return [
    `${staple.name}を袋や箱に書いてある方法で用意します。温めるものは、やけどに気をつけます。`,
    `${pairing.name}を食べやすい大きさにして、${staple.name}にのせるか、横にそえます。`,
    "味が足りないときは、しょうゆ、めんつゆ、塩こしょうのどれかを少しだけ足します。"
  ];
}

function getFlexibleVisualType(staple: StockItem): RecipeVisualType {
  if (includesAny(staple, ["麺", "うどん", "そば", "パスタ", "ラーメン"])) return "noodle";
  if (includesAny(staple, ["パン", "クラッカー", "乾パン", "オートミール", "シリアル"])) return "bread";
  if (includesAny(staple, ["ホットケーキ", "小麦粉"])) return "pancake";
  return "rice";
}

function getFlexibleImageKey(staple: StockItem): RecipeImageKey {
  if (includesAny(staple, ["麺", "うどん", "そば", "パスタ", "ラーメン"])) return "loaded-noodles";
  if (includesAny(staple, ["パン", "クラッカー", "乾パン"])) return "bread-breakfast";
  if (includesAny(staple, ["オートミール", "シリアル"])) return "oatmeal-breakfast";
  if (includesAny(staple, ["ホットケーキ", "小麦粉"])) return "powder-pan";
  return "canned-rice-salad";
}

function createSingleItemRecipeSuggestion(item: StockItem): SingleItemRecipeSuggestion {
  if (includesAny(item, ["卵", "たまご", "玉子"])) {
    return {
      title: "卵スープ・卵雑炊",
      description: "卵を汁物や雑炊にして、短時間で食べきれる一品にします。",
      visualType: "soup",
      imageKey: "egg-soup-rice",
      recipeSteps: [
        "小さな鍋に水を入れます。コップ1杯くらいから始めると作りやすいです。鶏がらスープの素、またはめんつゆを少し入れて温めます。",
        "卵を別の器に割り、はしでよく混ぜます。鍋がふつふつしてきたら、卵を細く回し入れます。",
        "卵がふわっと固まったら火を止めます。ご飯を入れると卵雑炊、わかめやねぎを入れると卵スープになります。熱いので少し冷ましてから食べます。"
      ],
      missingItems: ["ご飯", "ねぎ", "わかめ"]
    };
  }
  if (includesAny(item, ["牛乳", "豆乳"])) {
    return {
      title: "ミルクスープ・ホットケーキ",
      description: "牛乳や豆乳を、朝食にも夕食にも使いやすい温かい一品にします。",
      visualType: "pancake",
      imageKey: "milk-soup-pancake",
      recipeSteps: [
        "鍋に牛乳を入れます。強火にするとふきこぼれやすいので、弱火でゆっくり温めます。",
        "コンソメを少し入れ、冷凍野菜やコーンがあれば入れます。ときどき混ぜながら、野菜が温まるまで待ちます。",
        "最後に塩こしょうで味を見ます。チーズを少し入れると、こくのあるミルクスープになります。ホットケーキミックスがあるときは、牛乳を生地に使って朝食にもできます。"
      ],
      missingItems: ["冷凍野菜", "コーン", "ホットケーキミックス"]
    };
  }
  if (includesAny(item, ["冷凍うどん", "うどん"])) {
    return {
      title: "卵とじうどん",
      description: "うどんを卵や乾物と合わせて、すぐ作れる温かい一食にします。",
      visualType: "noodle",
      imageKey: "egg-udon",
      recipeSteps: [
        "鍋に水とめんつゆを入れて温めます。味が濃すぎないように、最初は少し薄めにします。",
        "うどんを入れて、ほぐれるまで温めます。乾燥わかめ、ねぎ、きのこがあれば一緒に入れます。",
        "卵を別の器で混ぜ、最後に鍋へ回し入れます。卵がふわっと固まったら、卵とじうどんの完成です。"
      ],
      missingItems: ["卵", "ねぎ", "乾燥わかめ"]
    };
  }
  if (includesAny(item, ["キャベツ", "白菜", "レタス", "小松菜", "ほうれん草", "野菜"])) {
    return {
      title: "野菜たっぷりスープ",
      description: "傷みやすい野菜を、汁物にしてかさを減らしながら使います。",
      visualType: "soup",
      imageKey: "vegetable-soup",
      recipeSteps: [
        "野菜を水で洗い、食べやすい大きさに切ります。包丁を使うときは大人と一緒にします。",
        "鍋に水を入れ、コンソメか味噌汁の素を入れます。野菜を入れて、やわらかくなるまで煮ます。",
        "卵、ツナ缶、春雨のどれかを足すと、おかずに近いスープになります。味を見て、薄ければ調味料を少し足します。"
      ],
      missingItems: ["卵", "ツナ缶", "春雨"]
    };
  }
  if (includesAny(item, ["豆腐", "厚揚げ", "油揚げ"])) {
    return {
      title: "豆腐の卵とじ",
      description: "豆腐をめんつゆと卵でとじて、ご飯に合うおかずにします。",
      visualType: "rice",
      imageKey: "tofu-egg-rice",
      recipeSteps: [
        "豆腐を食べやすく切り、めんつゆと水で軽く煮ます。",
        "ねぎやきのこがあれば加えます。",
        "溶き卵でとじ、ご飯にのせても食べられます。"
      ],
      missingItems: ["卵", "ねぎ", "ご飯"]
    };
  }
  if (includesAny(item, ["鶏", "豚", "牛", "肉", "ひき肉"])) {
    return {
      title: "肉野菜炒め",
      description: "肉を野菜や調味料と合わせて、主菜として使い切ります。",
      visualType: "salad",
      imageKey: "meat-vegetable-stir-fry",
      recipeSteps: [
        "肉を食べやすい大きさに切り、塩こしょうをします。",
        "フライパンで肉を焼き、野菜があれば一緒に炒めます。",
        "焼肉のたれ、しょうゆ、味噌だれなどで味付けします。"
      ],
      missingItems: ["カット野菜", "焼肉のたれ", "ご飯"]
    };
  }
  if (includesAny(item, ["魚", "鮭", "さば", "鯖", "たら", "ぶり"])) {
    return {
      title: "魚の味噌汁・ほぐしご飯",
      description: "魚を汁物やご飯ものにして、少量でも使いやすくします。",
      visualType: "rice",
      imageKey: "fish-miso-rice",
      recipeSteps: [
        "魚を焼く、またはレンジで火を通して骨を取り除きます。",
        "味噌汁に入れる場合は、豆腐や乾燥わかめと一緒に温めます。",
        "ご飯に混ぜる場合は、ほぐしてごまや海苔を足します。"
      ],
      missingItems: ["味噌汁", "ご飯", "海苔"]
    };
  }
  if (includesAny(item, ["カレー", "レトルト", "丼"])) {
    return {
      title: "カレードリア・丼アレンジ",
      description: "レトルト食品をそのまま食べるだけでなく、主食にのせて一食にします。",
      visualType: "rice",
      imageKey: "curry-doria",
      recipeSteps: [
        "レトルト食品を表示どおりに温めます。",
        "ご飯にかけ、チーズや卵があればのせます。",
        "トースターで焼けばドリア風、温めるだけなら丼として食べられます。"
      ],
      missingItems: ["ご飯", "チーズ", "卵"]
    };
  }
  if (includesAny(item, ["缶詰", "ツナ", "サバ", "コーン", "豆"])) {
    return {
      title: "缶詰の混ぜご飯・サラダ",
      description: "缶詰を主食や副菜にして、開けた分を使い切りやすくします。",
      visualType: "salad",
      imageKey: "canned-rice-salad",
      recipeSteps: [
        "缶詰の汁気を軽く切ります。味付き缶は汁を少し残します。",
        "ご飯に混ぜる場合は、海苔、ごま、しょうゆを足します。",
        "サラダにする場合は、豆やコーンにツナを合わせてドレッシングで和えます。"
      ],
      missingItems: ["ご飯", "海苔", "ドレッシング"]
    };
  }
  if (includesAny(item, ["麺", "パスタ", "うどん", "そば", "ラーメン"])) {
    return {
      title: "具だくさん麺",
      description: "麺に卵や乾物、缶詰を足して、一食として満足しやすくします。",
      visualType: "noodle",
      imageKey: "loaded-noodles",
      recipeSteps: [
        "麺を表示どおりにゆでる、またはお湯を入れて作ります。",
        "卵、乾燥わかめ、ツナ缶、コーンなどを足します。",
        "味が薄い場合はめんつゆ、塩こしょう、ごま油で整えます。"
      ],
      missingItems: ["卵", "乾燥わかめ", "ツナ缶"]
    };
  }
  if (includesAny(item, ["お菓子", "チョコ", "飴", "ビスケット", "クッキー"])) {
    return {
      title: "砕きビスケットヨーグルト",
      description: "お菓子をそのまま消費するだけでなく、朝食やデザートに回します。",
      visualType: "snack",
      imageKey: "snack-yogurt",
      recipeSteps: [
        "ビスケットやクッキーは軽く砕きます。",
        "ヨーグルト、アイス、フルーツ缶などにのせます。",
        "チョコやナッツは細かくしてトッピングにします。"
      ],
      missingItems: ["ヨーグルト", "フルーツ缶", "アイス"]
    };
  }
  return {
    title: `${item.name}の使い切り案`,
    description: `${item.name}を使って、食べきりやすい簡単な一品にします。`,
    visualType: "rice",
    imageKey: "generic-use-up-meal",
    recipeSteps: [`${item.name}を食べやすい大きさ、または使いやすい量に分けます。`, "ご飯、麺、スープ、サラダのどれに合わせるか決めます。", "足りない具材を1つだけ足して、今日の一品として使い切ります。"],
    missingItems: suggestMissingItems(item)
  };
}
