/**
 * アトリエユカ 5案共通コンテンツデータ
 * 出典: atelieryuka.com (Shopify API / 各ページ) 2026-07-15取得
 * 商品の愛称(name)はリプレイス提案として付与。型番(code)・価格は実データ。
 * 画像パスは ../assets/img/ 基準。
 */
const AY = {
  brand: {
    name: "Atelier Yuka",
    nameJa: "アトリエユカ",
    company: "松尾株式会社／MATSUO",
    ceo: "松尾 祐佳",
    tagline: "人生でいちばん美しい日を、いちばん確かな一着で。",
    statement:
      "アトリエユカは「洗練されたクラシック」をウェディングドレスの普遍美に進化させるドレスメゾン。インポートの素材を惜しみなく使い、国内最高峰のアトリエで一着ずつ仕立てるコレクションを、銀座とハワイのサロン、そしてオンラインからお届けします。",
    // ブランドは Atelier Yuka に一本化（先方確認 2026-09-18。VICTRIA FRANCEZKA は統合）
    lines: [
      {
        name: "Atelier Yuka",
        desc: "「洗練されたクラシック」を普遍美に進化させたメゾンライン。インポート素材×国内最高峰アトリエの仕立て。",
        img: "brand-01.webp",
      },
    ],
  },

  // ご利用の流れ(実サイト HOW TO RENT 準拠)
  flow: [
    {
      no: "01",
      title: "商品を選ぶ",
      desc: "ご利用日の4ヶ月前〜10日前までにオンラインでご予約。おすすめは2〜3ヶ月前です。",
    },
    {
      no: "02",
      title: "注文する",
      desc: "発送時にご登録のクレジットカードで決済。店舗に行かずに準備が完了します。",
    },
    {
      no: "03",
      title: "受け取る",
      desc: "指定日・指定時間帯に、ご自宅など指定の場所へヤマト運輸でお届けします。",
    },
    {
      no: "04",
      title: "試着／本使用",
      desc: "試着は1泊2日、本使用は3泊4日。サイズとイメージをご自宅でゆっくり確認できます。",
    },
    {
      no: "05",
      title: "返送する",
      desc: "翌日正午までに同梱の着払い伝票で返送。お手入れは当店で行いますので、そのままお戻しください。",
    },
  ],

  pricing: {
    tryon: {
      name: "ご自宅試着",
      price: 5500,
      note: "1泊2日／1着あたり。シューズオプション +¥1,500",
    },
    rental: {
      name: "本使用レンタル(3泊4日)",
      range: "¥110,000〜¥394,500",
      note: "ウエディングドレス ¥220,000〜／カラードレス ¥198,800〜／タキシード ¥110,000〜。別途クリーニング・メンテナンス費",
    },
    ginza: {
      name: "銀座サロンご試着予約",
      price: 5500,
      note: "銀座アトリエでスタイリストと一緒に試着",
    },
  },

  /**
   * 色系統の定義。絞り込みのスウォッチ表示に使う。
   * hex は「そのカテゴリの代表色」であり、実際の商品の色を厳密に再現するものではない。
   * 各アイテムの color は全商品画像を目視確認して割り当てた。
   */
  colors: {
    white: { label: "ホワイト", hex: "#F7F5F1" },
    ivory: { label: "アイボリー", hex: "#EFE6D5" },
    pink: { label: "ピンク", hex: "#DE5C72" },
    red: { label: "レッド", hex: "#8E2A3C" },
    yellow: { label: "イエロー", hex: "#DFA61F" },
    green: { label: "グリーン", hex: "#4F7A6D" },
    blue: { label: "ブルー", hex: "#6C9BD2" },
    navy: { label: "ネイビー", hex: "#253453" },
    brown: { label: "ブラウン", hex: "#8A7059" },
    gray: { label: "グレー", hex: "#A9A6A4" },
    black: { label: "ブラック", hex: "#2B2724" },
  },

  collections: {
    wedding: {
      label: "ウエディングドレス",
      labelEn: "Wedding Dress",
      items: [
        { name: "Lumière", code: "HLD-00085-01", price: 330000, line: "Atelier Yuka", silhouette: "プリンセス", color: "ivory", img: "wd-01.webp", img2: "wd-01-b.webp" },
        { name: "Clair de Lune", code: "HLD-00084-01", price: 330000, line: "Atelier Yuka", silhouette: "プリンセス", color: "ivory", img: "wd-02.webp", img2: "wd-02-b.webp" },
        { name: "Étoile", code: "HLD-00066", price: 290000, line: "Atelier Yuka", silhouette: "プリンセス", color: "ivory", img: "wd-03.webp", img2: "wd-03-b.webp" },
        { name: "Aurore", code: "HLD-00059-01", price: 290000, line: "Atelier Yuka", silhouette: "プリンセス", color: "white", img: "wd-04.webp", img2: "wd-04-b.webp" },
        { name: "Blanche", code: "HLD-00043-01", price: 290000, line: "Atelier Yuka", silhouette: "Aライン", color: "ivory", img: "wd-05.webp", img2: "wd-05-b.webp" },
        { name: "Camélia", code: "HLD-00051-01", price: 290000, line: "Atelier Yuka", silhouette: "Aライン", color: "white", img: "wd-06.webp", img2: "wd-06-b.webp" },
        { name: "Séraphine", code: "HLD-00053-01", price: 290000, line: "Atelier Yuka", silhouette: "プリンセス", color: "ivory", img: "wd-07.webp", img2: "wd-07-b.webp" },
        { name: "Gardenia", code: "HLD-00069-01", price: 290000, line: "Atelier Yuka", silhouette: "プリンセス", color: "white", img: "wd-08.webp", img2: "wd-08-b.webp" },
        { name: "Mirabelle", code: "HLD-00070-01", price: 290000, line: "Atelier Yuka", silhouette: "プリンセス", color: "white", img: "wd-09.webp", img2: "wd-09-b.webp" },
        { name: "Perle", code: "HLD-00071-01", price: 290000, line: "Atelier Yuka", silhouette: "Aライン", color: "ivory", img: "wd-10.webp", img2: "wd-10-b.webp" },
      ],
    },
    color: {
      label: "カラードレス",
      labelEn: "Color Dress",
      items: [
        { name: "Azur", code: "AY6001", price: 385000, line: "Atelier Yuka", silhouette: "プリンセス", color: "blue", img: "cd-01.webp", img2: "cd-01-b.webp" },
        { name: "Noisette", code: "AY5601", price: 340000, line: "Atelier Yuka", silhouette: "プリンセス", color: "brown", img: "cd-02.webp", img2: "cd-02-b.webp" },
        { name: "Mimosa", code: "MVD-00392-05", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "プリンセス", color: "yellow", img: "cd-03.webp", img2: "cd-03-b.webp" },
        { name: "Paon", code: "MVD-00392-13", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "プリンセス", color: "green", img: "cd-04.webp", img2: "cd-04-b.webp" },
        { name: "Framboise", code: "MVD-00392-06", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "プリンセス", color: "pink", img: "cd-05.webp", img2: "cd-05-b.webp" },
        { name: "Ballerine", code: "BLD-00055-09", price: 220000, line: "Ballerina for Brides", silhouette: "Aライン", color: "red", img: "cd-06.webp", img2: "cd-06-b.webp" },
        { name: "Cygne", code: "BLD-00055-32", price: 220000, line: "Ballerina for Brides", silhouette: "Aライン", color: "blue", img: "cd-07.webp", img2: "cd-07-b.webp" },
        { name: "Pivoine", code: "BLD-00055-11", price: 220000, line: "Ballerina for Brides", silhouette: "Aライン", color: "navy", img: "cd-08.webp", img2: "cd-08-b.webp" },
        { name: "Colombe", code: "BLD-00055-14", price: 220000, line: "Ballerina for Brides", silhouette: "Aライン", color: "green", img: "cd-09.webp", img2: "cd-09-b.webp" },
        { name: "Jardin", code: "BLD-00051-05", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", color: "yellow", img: "cd-10.webp", img2: "cd-10-b.webp" },
      ],
    },
    tuxedo: {
      label: "タキシード",
      labelEn: "Tuxedo",
      items: [
        { name: "Noir Classique", code: "20345S", price: 121000, line: "Atelier Yuka", color: "pink", img: "tx-01.webp", img2: "tx-01-b.webp" },
        { name: "Gris Perle", code: "20362S", price: 121000, line: "Atelier Yuka", color: "white", img: "tx-02.webp", img2: "tx-02-b.webp" },
        { name: "Minuit", code: "20366S", price: 121000, line: "Atelier Yuka", color: "gray", img: "tx-03.webp", img2: "tx-03-b.webp" },
        { name: "Encre", code: "20313S", price: 110000, line: "Atelier Yuka", color: "ivory", img: "tx-04.webp", img2: "tx-04-b.webp" },
        { name: "Fumée", code: "20321S", price: 110000, line: "Atelier Yuka", color: "red", img: "tx-05.webp", img2: "tx-05-b.webp" },
        { name: "Océan", code: "20333S", price: 110000, line: "Atelier Yuka", color: "black", img: "tx-06.webp", img2: "tx-06-b.webp" },
        { name: "Sable", code: "20336S", price: 110000, line: "Atelier Yuka", color: "ivory", img: "tx-07.webp", img2: "tx-07-b.webp" },
        { name: "Argent", code: "20354S", price: 110000, line: "Atelier Yuka", color: "gray", img: "tx-08.webp", img2: "tx-08-b.webp" },
      ],
    },
    morning: {
      label: "モーニング・マザードレス",
      labelEn: "Morning Coat",
      items: [
        { name: "Cérémonie I", code: "715S", price: 110000, line: "Atelier Yuka", color: "ivory", img: "mo-01.webp", img2: "mo-01-b.webp" },
        { name: "Cérémonie II", code: "778S", price: 110000, line: "Atelier Yuka", color: "brown", img: "mo-02.webp", img2: "mo-02-b.webp" },
        { name: "Cérémonie III", code: "779S", price: 110000, line: "Atelier Yuka", color: "navy", img: "mo-03.webp", img2: "mo-03-b.webp" },
        { name: "Cérémonie IV", code: "773S", price: 110000, line: "Atelier Yuka", color: "blue", img: "mo-04.webp", img2: "mo-04-b.webp" },
      ],
    },
  },

  // 海外フォトウエディング実績(photo album より)
  journeys: [
    { city: "Paris", cityJa: "パリ", tags: ["エッフェル塔", "凱旋門"], img: "journey-paris.webp", plan: "パリ・ゴールドプラン ¥598,000〜" },
    { city: "Hawaii", cityJa: "ハワイ", tags: ["ロイヤルハワイアン", "ワイキキ"], img: "journey-hawaii.webp", plan: "ハワイサロンで現地サポート" },
    { city: "New York", cityJa: "ニューヨーク", tags: ["セントラルパーク", "ブルックリン"], img: "journey-newyork.webp" },
    { city: "London", cityJa: "ロンドン", tags: ["ビッグ・ベン", "タワーブリッジ"], img: "journey-london.webp" },
    { city: "Sydney", cityJa: "シドニー", tags: ["オペラハウス"], img: "journey-sydney.webp" },
    { city: "Melbourne", cityJa: "メルボルン", tags: ["オーストラリア"], img: "journey-melbourne.webp" },
    { city: "Perth", cityJa: "パース", tags: ["オーストラリア"], img: "journey-perth.webp" },
    { city: "Las Vegas", cityJa: "ラスベガス", tags: ["ネバダ"], img: "journey-lasvegas.webp" },
  ],

  salons: [
    {
      name: "銀座アトリエ",
      nameEn: "Ginza Atelier",
      address: "〒104-0061 東京都中央区銀座1丁目20番地11号 6階",
      note: "ご試着予約 ¥5,500(スタイリスト同伴)",
    },
    {
      name: "ハワイサロン",
      nameEn: "Hawaii Salon",
      address: "2270 Kalākaua Ave Suite 1220, Honolulu, HI 96815",
      note: "ハワイ挙式・フォトウエディングを現地サポート",
    },
  ],

  news: [
    { date: "2024.06.21", title: "Atelier Yuka 2024-2025新作ドレスを発表" },
    { date: "2024.03.31", title: "山田幸愛さまの披露宴ドレスをオーダーでお仕立てしました" },
    { date: "2024.01.31", title: "山田親太朗さま・幸愛さまのハワイフォトウエディングをお手伝いしました" },
    { date: "2023.12.10", title: "2023 Jリーグアウォーズにタキシード衣裳を提供" },
  ],

  faq: [
    {
      q: "試着だけでも利用できますか?",
      a: "はい。ご自宅試着は1泊2日・1着¥5,500でご利用いただけます。使用日が決まっていなくてもお申し込みいただけます。",
    },
    {
      q: "サイズが合わなかった場合は?",
      a: "試着でサイズやイメージをご確認いただいてから本使用をご予約いただけるので安心です。気になる点はチャット・お問合せでスタイリストにご相談ください。",
    },
    {
      q: "返却前にクリーニングは必要ですか?",
      a: "お客様でのクリーニングは不要です。ご利用後はそのまま同梱の着払い伝票でご返送ください。お手入れはアトリエユカで行い、クリーニング・メンテナンス費として屋内利用¥15,000／屋外利用¥20,000を頂戴しております。",
    },
    {
      q: "いつまでに予約すればいいですか?",
      a: "ご利用日の4ヶ月前〜10日前までご予約可能です。人気のドレスは埋まりやすいため、2〜3ヶ月前のご予約がおすすめです。",
    },
    {
      q: "店舗での試着はできますか?",
      a: "銀座アトリエにてスタイリスト同伴のご試着(¥5,500)を承っています。ハワイサロンでは現地挙式のサポートも行っています。",
    },
    {
      q: "海外挙式にも対応していますか?",
      a: "パリ・ハワイをはじめ海外レンタルプランをご用意しています。フォトウエディングのプロデュース実績も多数ございます。",
    },
  ],

  // デモ用: 予約フォームの選択肢
  form: {
    purposes: ["ご自宅試着(¥5,500)", "本使用レンタル(3泊4日)", "銀座サロン試着", "海外挙式・フォト相談"],
    categories: ["ウエディングドレス", "カラードレス", "タキシード", "モーニング"],
  },
};

/**
 * ドレスのサイズ表【正式版】
 * 出典: 2026-09-19 受領のサイズ表（with a WISH Ladies' SIZE LIST 2026-2027 のスキャン2枚）
 *   サイズフリー   … 該当品番 AA/AY/BL/FI/GZ/HL/MV/VV → サイトのドレス20点はすべてこちら（Shopify の 7FTTT もこの体系）
 *   ジャストサイズ … 該当品番 AA/AF/AX/MV/RD → 現行ラインナップに該当なし。AY.dressSizeChartJust に将来用として保持
 *
 * サイズ記号の読み方（先方回答 2026-09-18: F＝フリーサイズ、TTT＝丈。身長との対応は表の参考身長から）
 *   数字 = 号数相当 ／ F = サイズフリー（寸法を範囲で合わせる仕様）／ T の数 = 身長の段階（T=160cm, TT=165cm, TTT=170cm）
 *   表に載っている身長違いは 7FTT・7FTTT だけで、寸法は 7FT と同じ（背丈だけ 37 / 39）。
 *   そのため判定は 160cm の行で行い、身長の段階は AY.dressHeightTiers から付ける。
 *
 * スキャンの手書き訂正の扱い（判定に使うバスト・ウエスト・ヒップには訂正がない）
 *   - 印刷値を採用し、手書きの訂正はコメントに残す（手書きでしか無い行はそのまま採る）
 *   - 3FT バスト(レギュラー)の印刷「76-84」は他の行（幅4cm）と合わず誤植の疑いがあるが、推測で直さず印刷値のまま。
 *     レギュラー列で判定するのは長袖の HLD-00084-01 だけで、影響は 3FT/5FT の境界に限られる
 *   - 9FT 背丈は印刷 37.5 に取り消し線＋手書き 37。並び（36, 36.5, 37, 37.5, 38…）に合う印刷値を採用
 *   - 25FT は表に存在しない（23FT の次が 27FT）
 *   - スカート丈 A〜E は判定にも表示にも使わないので持たない
 *
 * bust = バスト(レギュラー)、bustier = バスト(ビスチェ)。ビスチェのドレスは bustier の列で判定する。
 */
AY.dressSizeChart = [
  { size: "3FT",  go: "3〜5号",   bust: [76, 84],   bustier: [74, 78],   waist: [56, 60],   hip: [84, 88],   back: 36 },
  { size: "5FT",  go: "5〜7号",   bust: [80, 84],   bustier: [78, 82],   waist: [60, 64],   hip: [88, 92],   back: 36.5 },
  { size: "7FT",  go: "7〜9号",   bust: [84, 88],   bustier: [82, 86],   waist: [64, 68],   hip: [92, 96],   back: 37 },
  { size: "9FT",  go: "9〜11号",  bust: [88, 92],   bustier: [86, 90],   waist: [68, 72],   hip: [96, 100],  back: 37.5 },
  { size: "11FT", go: "11〜13号", bust: [92, 96],   bustier: [90, 94],   waist: [72, 76],   hip: [100, 104], back: 38 },
  { size: "13FT", go: "13〜15号", bust: [96, 100],  bustier: [94, 98],   waist: [76, 80],   hip: [104, 108], back: 38.5 },
  { size: "15FT", go: "15〜17号", bust: [100, 104], bustier: [98, 102],  waist: [80, 84],   hip: [108, 112], back: 39 },
  { size: "17FT", go: "17〜19号", bust: [104, 108], bustier: [102, 106], waist: [84, 88],   hip: [112, 116], back: 39.5 },
  { size: "19FT", go: "19〜21号", bust: [108, 112], bustier: [106, 110], waist: [88, 92],   hip: [116, 120], back: 40 },
  { size: "21FT", go: "21〜23号", bust: [112, 116], bustier: [110, 114], waist: [92, 96],   hip: [120, 124], back: 40.5 },
  { size: "23FT", go: "23〜25号", bust: [116, 120], bustier: [114, 118], waist: [96, 100],  hip: [124, 128], back: 41 },
  { size: "27FT", go: "27〜29号", bust: [124, 128], bustier: [122, 126], waist: [104, 108], hip: [132, 136], back: 42 },
];
AY.dressSizeChartStatus = "正式（2026-09-19 受領）";

/** 身長の段階。表の 7FT / 7FTT / 7FTTT の参考身長から。suffix はサイズ記号の末尾の T の並び */
AY.dressHeightTiers = [
  { suffix: "T",   height: 160 },
  { suffix: "TT",  height: 165 },
  { suffix: "TTT", height: 170 },
];

/**
 * 表に載っている身長違いの記号。表にあるのは 7 号だけなので、他の号数では
 * 「9FTTT」のような表に無い記号を作らず、号数の記号（9FT）に身長の案内を添える。
 * 他の号数にも TT/TTT の用意があると先方から回答があれば、この配列に足すか
 * AY.dressHeightTiersForAllSizes を true にする。
 */
AY.dressHeightVariants = ["7FTT", "7FTTT"];
AY.dressHeightTiersForAllSizes = false;

/**
 * ジャストサイズの表（該当品番 AA/AF/AX/MV/RD）。現行ラインナップでは未使用。
 * 寸法は範囲ではなく1点。8TT の行はスキャンに手書きで追記されていたもの。
 * 7TT の背丈は印刷 39 に取り消し線＋手書き 37（方針どおり印刷値を採用）。
 */
AY.dressSizeChartJust = [
  { size: "5T",   height: 160, bust: 82,  bustier: 78,  waist: 60, hip: 88,  back: 36 },
  { size: "7T",   height: 160, bust: 86,  bustier: 82,  waist: 64, hip: 92,  back: 36.5 },
  { size: "9T",   height: 160, bust: 90,  bustier: 86,  waist: 68, hip: 96,  back: 37 },
  { size: "11T",  height: 160, bust: 94,  bustier: 90,  waist: 72, hip: 100, back: 37.5 },
  { size: "13T",  height: 160, bust: 98,  bustier: 94,  waist: 76, hip: 104, back: 38 },
  { size: "15T",  height: 160, bust: 102, bustier: 98,  waist: 80, hip: 108, back: 38.5 },
  { size: "17T",  height: 160, bust: 106, bustier: 102, waist: 84, hip: 112, back: 39 },
  { size: "7TT",  height: 165, bust: 86,  bustier: 82,  waist: 64, hip: 92,  back: 39 },
  { size: "8TT",  height: 165, bust: 88,  bustier: 84,  waist: 66, hip: 94,  back: 37 },
  { size: "7TTT", height: 170, bust: 86,  bustier: 82,  waist: 64, hip: 92,  back: 39 },
];

/**
 * サイズ記号を分解する。"7FTTT" → { number: 7, free: true, suffix: "TTT", height: 170 }
 * 読めない記号（"7号／9号" など）は null。
 */
AY.parseDressSize = function (symbol) {
  var m = /^(\d+)(F?)(T{1,3})$/.exec(String(symbol || "").trim());
  if (!m) return null;
  var tier = AY.dressHeightTiers.filter(function (t) { return t.suffix === m[3]; })[0];
  return { number: Number(m[1]), free: m[2] === "F", suffix: m[3], height: tier.height };
};

/** "7FTTT" → "7〜9号相当・身長170cm基準"（号数の幅は表の参考号数 go）。読めない記号は空文字 */
AY.describeDressSize = function (symbol) {
  var p = AY.parseDressSize(symbol);
  if (!p) return "";
  var row = AY.dressSizeChart.filter(function (r) { return r.size === p.number + "FT"; })[0];
  return (row ? row.go : p.number + "号") + "相当・身長" + p.height + "cm基準";
};

/** 身長(cm) → いちばん近い段階。ちょうど中間（162.5 / 167.5）は低い方。未入力なら T（160cm）を仮に置く */
AY.dressHeightTier = function (height) {
  var tiers = AY.dressHeightTiers;
  if (!height) return tiers[0];
  return tiers.reduce(function (best, t) {
    return Math.abs(t.height - height) < Math.abs(best.height - height) ? t : best;
  }, tiers[0]);
};

/**
 * ドレスのサイズ診断: バスト・ウエスト・ヒップ(cm) → 最も近いサイズ。
 * 各寸法が表の範囲に入っていれば距離0、外れていれば外れた分を距離にして、合計が最小の行を選ぶ。
 * バスト・ウエストを重く、ヒップは軽く見る（ドレスはヒップより上半身で決まるため）。ヒップは任意。
 * 身長は号数の判定には使わず、記号末尾の T の段階（丈の基準身長）を決める。
 *
 * opts.bustier … true ならバストをビスチェの列で見る（省略時 true。先方に伝えた基準）
 * opts.height  … 身長(cm)。省略時は 160cm（T）で仮置きし、heightGiven: false を返す
 *
 * 返す size は、身長の段階を付けた記号が表にあるもの（7FTT / 7FTTT）ならその記号、
 * 無ければ号数の記号（9FT）。tierConfirmed が false のとき、呼び出し側は身長向けの丈が未確認だと案内する。
 */
AY.suggestDressSize = function (bust, waist, hip, opts) {
  opts = opts || {};
  var height = opts.height || 0;
  if (!bust || !waist) return { ok: false, reason: "バストとウエストをご入力ください。" };
  if (bust < 60 || bust > 150 || waist < 45 || waist > 140 || (hip && (hip < 60 || hip > 160)) || (height && (height < 130 || height > 200))) {
    return { ok: false, reason: "数値をご確認ください。" };
  }
  var bustKey = opts.bustier === false ? "bust" : "bustier";
  var gap = function (v, range) { return v < range[0] ? range[0] - v : v > range[1] ? v - range[1] : 0; };
  var best = null;
  AY.dressSizeChart.forEach(function (row) {
    var d = gap(bust, row[bustKey]) + gap(waist, row.waist) + (hip ? gap(hip, row.hip) * 0.6 : 0);
    /* 同点（境界値）は大きい方のサイズを採る。先方の構想図の例（バスト84・ウエスト64 → 7）と同じ挙動 */
    if (!best || d <= best.d) best = { d: d, row: row };
  });
  var row = best.row;
  var tier = AY.dressHeightTier(height);
  var composed = row.size.replace(/T$/, tier.suffix);   /* "7FT" + 170cm → "7FTTT" */
  var tierConfirmed = tier.suffix === "T" || AY.dressHeightTiersForAllSizes || AY.dressHeightVariants.indexOf(composed) !== -1;
  var range = function (r) { return r[0] + "〜" + r[1]; };
  return {
    ok: true,
    size: tierConfirmed ? composed : row.size,
    base: row.size,
    go: row.go,
    height: tier.height,
    heightSuffix: tier.suffix,
    heightGiven: !!height,
    tierConfirmed: tierConfirmed,
    bustColumn: bustKey === "bustier" ? "ビスチェ" : "レギュラー",
    spec: { bust: range(row[bustKey]), waist: range(row.waist), hip: range(row.hip) },
    /* 表の端から大きく外れる場合は、規格外の可能性を添える */
    caution: best.d > 6 ? "ご入力の寸法はサイズ表の範囲から離れています。お直しやご相談が必要な場合がありますので、お問い合わせください。" : "",
  };
};

if (typeof module !== "undefined") module.exports = AY;
