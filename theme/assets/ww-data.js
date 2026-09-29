/**
 * with a WISH コンテンツデータ（サンプル withawish/assets/data.js から移植）
 * 出典: www.withawish.jp (検索CGI・各ページ) 2026-07-18取得
 * 商品125型はストアのメタオブジェクト（ww_tuxedo）に移した。ここに残るのは色・ライン・サイズ表・納期計算など
 * 品番・色・ライン・サイズ・素材・説明文・サイズ表は実データ。
 * 空き状況・予約・FAQ の一部文言は提案用デモ(コメントで明示)。
 * 画像パスは WW.assetBase（このファイルの位置）基準で組み立てる。
 */

var WW = {
  brand: {
    name: "with a WISH",
    company: "松尾株式会社／MATSUO",
    ceo: "松尾 祐佳",
    founded: 1962,
    tagline: "世界一幸せな花婿になっていただきたくて。",
    statement:
      "with a WISH は、花嫁がドレスを選ぶように、花婿にも「運命の一着」を心から選んでほしい——その想いから生まれた新郎タキシードの専門ブランドです。100型を超えるデザインと63のサイズを、日本の自社アトリエで一着ずつ仕立て、全国約3,000の衣裳店へお届けしています。",
    sister: {
      name: "Atelier Yuka",
      nameJa: "アトリエユカ",
      desc: "同じ松尾株式会社が展開するウェディングドレスメゾン。花嫁の一着はアトリエユカ、花婿の一着は with a WISH。",
      url: "https://atelieryuka.com/",
    },
  },

  // 数字で語る信頼(実データ)
  numbers: [
    { value: "1962", unit: "年創業", desc: "婚礼衣裳ひと筋、60年を超える歴史" },
    { value: "No.1", unit: "国内シェア", desc: "新郎タキシード取寄せレンタル" },
    { value: "100", unit: "型以上", desc: "デザインバリエーション" },
    { value: "63", unit: "サイズ", desc: "Y〜K体 × 3〜10号の圧倒的サイズ展開" },
    { value: "10,000", unit: "着", desc: "自社保有在庫" },
    { value: "3,000", unit: "店", desc: "全国の取扱い衣裳店ネットワーク" },
  ],

  colorNames: {
    1: "ブラック系", 2: "ホワイト系", 3: "ベージュ／ゴールド系",
    4: "ピンク／パープル系", 5: "ブルー／ネイビー系", 6: "グレー／シルバー系",
    7: "グリーン／カーキ系", 8: "ブラウン／レッド系", 9: "イエロー／オレンジ系",
  },
  colorChips: {
    1: "#1a1a1e", 2: "#f2efe8", 3: "#c9b17a", 4: "#b284a8", 5: "#2b3a5e",
    6: "#9aa0a6", 7: "#5c6b4e", 8: "#7a4a3a", 9: "#d8a13c",
  },
  lineNames: {
    1: "BASIC ルーズフィット", 2: "NEW REGULAR レギュラーフィット",
    3: "NATURAL スリムフィット", 4: "MASA タイトフィット",
    5: "J-LINE スーパータイトフィット",
  },
  bodyTypes: ["Y", "A", "AB", "B", "O", "E", "K"],

  // 新郎向け 取寄せレンタルの流れ(実サイト /rent/ 準拠)
  groomFlow: [
    { no: "01", title: "サイズを知る", desc: "身長・胸まわり・ウエストの3つの計測で、63サイズからあなたのサイズがわかります。" },
    { no: "02", title: "デザインを選ぶ", desc: "100型以上のコレクションから、サイズに合うタキシードを検索。" },
    { no: "03", title: "衣裳店で試着予約", desc: "お近くの取扱い衣裳店・式場提携の衣裳室で試着をご予約ください。全国約3,000店。" },
    { no: "04", title: "試着する", desc: "取寄せた実物をご試着。襟のないお洋服でご来店いただくとスムーズです。" },
    { no: "05", title: "レンタル決定", desc: "料金・レンタル期間は衣裳店にてご相談のうえ、ご成約ください。" },
  ],

  // 衣裳店向け 業務フロー(実サイト /shop/ 準拠)
  vendorFlow: [
    { no: "01", title: "空き状況を確認", desc: "WEB予約システムで24時間、商品の空き状況をチェック。お電話でも承ります。" },
    { no: "02", title: "予約を登録", desc: "出荷前日24時まで予約可能(翌日が平日の場合)。WEB・電話・FAXで受付。" },
    { no: "03", title: "発注確認", desc: "ご予約内容をメールとFAXでお知らせ。内容をご確認ください。" },
    { no: "04", title: "受取・ご試着", desc: "ご指定の店舗へ配送。お客様のご試着・ご成約にお役立てください。" },
    { no: "05", title: "ご返送", desc: "ご利用後は同梱の伝票でご返送ください。クリーニング不要です。" },
  ],

  // 衣裳店デスク(統合ハブの提案。リンク先は現行実システム)
  desk: {
    login: { label: "取扱い衣裳店さま専用ログイン", url: "https://www.mbs-netservice.com/Web/", note: "予約・カタログ・販促素材をひとつのIDで(統合提案)" },
    services: [
      { key: "stock", title: "空き状況チェック", desc: "ご希望の商品・お日にちの空き状況を24時間確認できます。", demo: true },
      { key: "order", title: "WEB予約登録", desc: "出荷前日24時まで、その場で予約完了。確認書はメールでお届け。", demo: true },
      { key: "catalog", title: "デジタルカタログ", desc: "全125型の最新カタログ。店頭のタブレットでもご覧いただけます。", demo: true },
      { key: "assets", title: "販促素材ダウンロード", desc: "商品写真・ロゴ・POPデータを自店のサイトやSNSでご利用いただけます。", demo: true },
    ],
    contact: {
      tel: "072-729-1642",
      telHours: "月〜金 9:45〜16:00",
      fax: "0120-127-823",
      note: "お電話・FAXでのご注文も従来どおり承ります。",
    },
    deadline: "出荷前日24:00まで予約受付(翌日が平日の場合)",
  },

  // 新規取扱店向けメリット(数字は実データ、文言は提案用)
  merits: [
    { title: "在庫リスクゼロ", desc: "自社で在庫を持たずに100型・63サイズの品揃えをお店のラインナップに。1着からの取寄せでご利用いただけます。" },
    { title: "国内シェアNo.1の安心", desc: "創業1962年・婚礼衣裳ひと筋。全国約3,000店の衣裳店さまとお取引しています。" },
    { title: "接客がそのまま売上に", desc: "新郎さまはWEBで下見済み。サイズ×デザインの提案ツールで、試着から成約までを短縮します。" },
  ],

  // 業者向けFAQ(※提案用デモ文言。実条件は要確認)
  vendorFaq: [
    { q: "取扱いを始めるには何が必要ですか？", a: "下記フォームよりお申込みください。審査ののち、専用IDを発行いたします。初期費用・年会費は不要です。(デモ文言)" },
    { q: "予約はいつまでできますか？", a: "出荷前日の24時まで承ります(翌日が平日の場合)。お急ぎの場合はお電話でご相談ください。" },
    { q: "汚損・破損があった場合は？", a: "通常のご利用範囲の汚れはクリーニング不要でそのままご返送ください。著しい汚損・破損は個別にご相談させていただきます。(デモ文言)" },
    { q: "試着用の在庫を店舗に置けますか？", a: "サンプルの取扱いについては担当までご相談ください。デジタルカタログとサイズ表で、店頭在庫なしでもご提案いただけます。(デモ文言)" },
    { q: "新作の情報はどこで確認できますか？", a: "会員向けメールとデジタルカタログでいち早くお知らせします。" },
  ],

  // 衣裳タイアップ(実サイト /media/ 準拠)
  tieup: {
    target: "TV・雑誌・Web媒体のスタイリスト、メディアご担当者さま",
    conditions: ["クレジット掲載(Web媒体はリンク付き)", "事前審査あり・媒体企画書のご提出", "OA・発売後2週間以内のご報告"],
    flow: ["登録", "注文", "確認", "配送", "報告", "返却"],
    contact: { tel: "072-729-1642", hours: "月〜金 9:45〜16:00", mail: "mbs-web@mbs-netservice.com" },
  },

  company: {
    name: "松尾株式会社",
    founded: "1962年1月16日 創業",
    incorporated: "2015年2月9日 法人設立",
    capital: "900万円",
    ceo: "代表取締役社長 松尾 祐佳",
    offices: [
      "マツオブライダルサービス(大阪府箕面市)",
      "Tuxedo-Studio × AtelierYuka(大阪府箕面市)",
      "大阪商品センター(大阪府箕面市)",
      "AtelierYuka 銀座(東京都中央区銀座)",
    ],
  },

  // コラム(実記事タイトル)
  columns: [
    { cat: "タキシードの基本", title: "こんなにもある！タキシードの色バリエーション" },
    { cat: "タキシードの選び方", title: "結婚式の新郎衣装【時間帯別】代表4タイプ" },
    { cat: "新作情報", title: "新作レンタルタキシード全9型を一挙ご紹介" },
    { cat: "ウエディングのアレコレ", title: "ドレスと合わせる、カラーコーディネートの考え方" },
  ],

  // カラードレス×タキシード ペアリング(C案用。ドレス写真はAtelier Yuka実写真)
  pairings: [
    { dress: "cd-01.jpg", dressName: "ルージュレッド", codes: ["20432", "20409"], note: "深いレッドには、艶のあるオリーヴやブラックで重心を。" },
    { dress: "cd-02.jpg", dressName: "ロイヤルブルー", codes: ["20423", "20414"], note: "鮮やかなブルーには、グレー系で品よく寄り添う。" },
    { dress: "cd-03.jpg", dressName: "シャンパンベージュ", codes: ["20425", "20417"], note: "やわらかなベージュには、同系のウォームトーンで統一感を。" },
    { dress: "cd-05.jpg", dressName: "フレッシュグリーン", codes: ["20416", "20422"], note: "グリーンのドレスには、ネイビーやカーキで奥行きを。" },
  ],

  // サイズ表(実データ: /rent/ 詳細サイズ一覧より) [号数, ハーフサイズ, 身長, 周囲, ウエスト, 股下]
  sizeChart: {"Y": [[3, "YS", 160, 86, 72, 73], [4, "YS", 165, 88, 74, 75], [5, "YM", 170, 90, 76, 77], [6, "YL", 175, 92, 78, 79], [7, "YL", 180, 94, 80, 81], [8, "YLL", 185, 96, 82, 83], [9, "Y3L", 190, 98, 84, 85], [10, "Y3L", 195, 100, 86, 87]], "A": [[3, "AS", 160, 88, 76, 73], [4, "AS", 165, 90, 78, 75], [5, "AM", 170, 92, 80, 77], [6, "AL", 175, 94, 82, 79], [7, "AL", 180, 96, 84, 81], [8, "ALL", 185, 98, 86, 83], [9, "A3L", 190, 100, 88, 85], [10, "A3L", 195, 102, 90, 87]], "AB": [[3, "ABS", 160, 90, 82, 72], [4, "ABS", 165, 92, 84, 74], [5, "ABM", 170, 94, 86, 76], [6, "ABL", 175, 96, 88, 78], [7, "ABL", 180, 98, 90, 80], [8, "ABLL", 185, 100, 92, 82], [9, "AB3L", 190, 102, 94, 84], [10, "AB3L", 195, 104, 96, 86]], "B": [[3, "BS", 160, 96, 92, 70], [4, "BS", 165, 98, 94, 72], [5, "BM", 170, 100, 96, 74], [6, "BL", 175, 102, 98, 76], [7, "BL", 180, 104, 100, 78], [8, "BLL", 185, 106, 102, 80], [9, "B3L", 190, 108, 104, 82], [10, "B3L", 195, 110, 106, 84]], "O": [[3, "OS", 160, 96, 92, 70], [4, "OS", 165, 98, 94, 72], [5, "OM", 170, 100, 96, 74], [6, "OL", 175, 102, 98, 76], [7, "OL", 180, 104, 100, 78], [8, "OLL", 185, 106, 102, 80], [9, "O3L", 190, 108, 104, 82], [10, "O3L", 195, 110, 106, 84]], "E": [[3, "ES", 160, 101, 101, 69], [4, "ES", 165, 104, 104, 71], [5, "EM", 170, 107, 107, 73], [6, "EL", 175, 110, 110, 75], [7, "EL", 180, 113, 113, 77], [8, "ELL", 185, 116, 116, 79], [9, "E3L", 190, 119, 119, 81], [10, "E3L", 195, 122, 122, 83]], "K": [[3, "KS", 160, 110, 110, 69], [4, "KS", 165, 114, 114, 71], [5, "KM", 170, 118, 118, 73], [6, "KL", 175, 122, 122, 75], [7, "KL", 180, 126, 126, 77], [8, "KLL", 185, 130, 130, 79], [9, "K3L", 190, 134, 134, 81], [10, "K3L", 195, 138, 138, 83]]},

  // 商品は /pages/withawish のセクションがメタオブジェクト ww_tuxedo から JSON で渡す（下で読む）
  products: [],
};

/* ---- 共通ヘルパー ---- */

/** サイズ診断: 身長(cm)・胸囲(cm)・ウエスト(cm) → 最も近いサイズ */
WW.suggestSize = function (height, chest, waist) {
  if (!height || !chest || !waist) return { ok: false, reason: "3つの数値をすべてご入力ください。" };
  if (height < 150 || height > 205 || chest < 70 || chest > 150 || waist < 55 || waist > 150) {
    return { ok: false, reason: "規格外のサイズの可能性があります。お近くの取扱店または担当までご相談ください。" };
  }
  let best = null;
  for (const body of Object.keys(WW.sizeChart)) {
    for (const row of WW.sizeChart[body]) {
      const [go, half, h, c, w] = row;
      const d = Math.abs(h - height) * 1.2 + Math.abs(c - chest) + Math.abs(w - waist);
      if (!best || d < best.d) best = { d, body, go, half, h, c, w };
    }
  }
  return {
    ok: true, body: best.body, go: best.go, half: best.half,
    label: best.body + best.go + "号(" + best.half + ")",
    spec: { height: best.h, chest: best.c, waist: best.w },
  };
};

/** 納期チェッカー(デモ想定): ご使用日 → お届け・予約締切など */
WW.schedule = function (useDateStr, today) {
  const use = new Date(useDateStr + "T12:00:00");
  const now = today ? new Date(today + "T12:00:00") : new Date();
  if (isNaN(use.getTime())) return { ok: false, reason: "ご使用日を入力してください。" };
  const dayMs = 86400000;
  if (use.getTime() < now.getTime() + dayMs) {
    return { ok: false, reason: "ご使用日が近すぎます。お電話(072-729-1642)でご相談ください。" };
  }
  // お届け=使用日の2日前 / 出荷=お届けの前日(平日のみ、休日なら前倒し)
  const arrive = new Date(use.getTime() - 2 * dayMs);
  let ship = new Date(arrive.getTime() - 1 * dayMs);
  while (ship.getDay() === 0 || ship.getDay() === 6) ship = new Date(ship.getTime() - dayMs);
  const deadline = new Date(ship.getTime() - 1 * dayMs); // 出荷前日24時
  const ret = new Date(use.getTime() + 1 * dayMs);
  if (deadline.getTime() < now.getTime()) {
    return { ok: false, reason: "WEB予約の締切を過ぎています。お電話でお問い合わせください。" };
  }
  const fmt = (d) => (d.getMonth() + 1) + "/" + d.getDate() + "(" + "日月火水木金土"[d.getDay()] + ")";
  return {
    ok: true,
    deadline: fmt(deadline) + " 24:00", ship: fmt(ship), arrive: fmt(arrive),
    use: fmt(use), ret: fmt(ret),
    note: "※提案用のデモ計算です。実際の納期は在庫状況・地域により異なります。",
  };
};

/** 商品（メタオブジェクト ww_tuxedo）。セクションの <script type="application/json" id="ww-products"> から読む */
(function () {
  var el = document.getElementById("ww-products");
  WW.products = el ? JSON.parse(el.textContent) : [];
  /* 管理画面の「並び順」の小さい順（同じなら品番順） */
  WW.products.sort(function (a, b) { return (a.position - b.position) || String(a.code).localeCompare(String(b.code)); });
})();

/** 商品画像: 1枚目は p.img、追加カットは p.extras に URL がそのまま入っている */
WW.img = function (p, extra) {
  return extra || p.img;
};
