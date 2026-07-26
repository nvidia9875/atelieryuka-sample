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
    lines: [
      {
        name: "Atelier Yuka",
        desc: "「洗練されたクラシック」を普遍美に進化させたメゾンライン。インポート素材×国内最高峰アトリエの仕立て。",
        img: "brand-01.webp",
      },
      {
        name: "VICTRIA FRANCEZKA",
        desc: "ウェディングシーンに欠かせないクラシカルで上質な正統派スタイル。華やかな王道の美を意識した、誰からも愛される究極のコレクション。",
        img: "brand-02.webp",
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
      desc: "翌日正午までに同梱の着払い伝票で返送。クリーニングは不要、そのままお戻しください。",
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
      note: "ウエディングドレス ¥220,000〜／カラードレス ¥198,800〜／タキシード ¥110,000〜",
    },
    ginza: {
      name: "銀座サロンご試着予約",
      price: 5500,
      note: "銀座アトリエでスタイリストと一緒に試着",
    },
  },

  collections: {
    wedding: {
      label: "ウエディングドレス",
      labelEn: "Wedding Dress",
      items: [
        { name: "Lumière", code: "HLD-00085-01", price: 330000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-01.webp", img2: "wd-01-b.webp" },
        { name: "Clair de Lune", code: "HLD-00084-01", price: 330000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-02.webp", img2: "wd-02-b.webp" },
        { name: "Étoile", code: "HLD-00066", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-03.webp", img2: "wd-03-b.webp" },
        { name: "Aurore", code: "HLD-00059-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-04.webp", img2: "wd-04-b.webp" },
        { name: "Blanche", code: "HLD-00043-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-05.webp", img2: "wd-05-b.webp" },
        { name: "Camélia", code: "HLD-00051-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-06.webp", img2: "wd-06-b.webp" },
        { name: "Séraphine", code: "HLD-00053-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-07.webp", img2: "wd-07-b.webp" },
        { name: "Gardenia", code: "HLD-00069-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-08.webp", img2: "wd-08-b.webp" },
        { name: "Mirabelle", code: "HLD-00070-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-09.webp", img2: "wd-09-b.webp" },
        { name: "Perle", code: "HLD-00071-01", price: 290000, line: "VICTRIA FRANCEZKA", silhouette: "Aライン", img: "wd-10.webp", img2: "wd-10-b.webp" },
      ],
    },
    color: {
      label: "カラードレス",
      labelEn: "Color Dress",
      items: [
        { name: "Azur", code: "AY6001", price: 385000, line: "Atelier Yuka", silhouette: "プリンセス", img: "cd-01.webp", img2: "cd-01-b.webp" },
        { name: "Noisette", code: "AY5601", price: 340000, line: "Atelier Yuka", silhouette: "Aライン", img: "cd-02.webp", img2: "cd-02-b.webp" },
        { name: "Mimosa", code: "MVD-00392-05", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "Aライン", img: "cd-03.webp", img2: "cd-03-b.webp" },
        { name: "Paon", code: "MVD-00392-13", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "Aライン", img: "cd-04.webp", img2: "cd-04-b.webp" },
        { name: "Framboise", code: "MVD-00392-06", price: 250000, line: "L'ATELIER MARIAGE", silhouette: "Aライン", img: "cd-05.webp", img2: "cd-05-b.webp" },
        { name: "Ballerine", code: "BLD-00055-09", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", img: "cd-06.webp", img2: "cd-06-b.webp" },
        { name: "Cygne", code: "BLD-00055-32", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", img: "cd-07.webp", img2: "cd-07-b.webp" },
        { name: "Pivoine", code: "BLD-00055-11", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", img: "cd-08.webp", img2: "cd-08-b.webp" },
        { name: "Colombe", code: "BLD-00055-14", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", img: "cd-09.webp", img2: "cd-09-b.webp" },
        { name: "Jardin", code: "BLD-00051-05", price: 220000, line: "Ballerina for Brides", silhouette: "プリンセス", img: "cd-10.webp", img2: "cd-10-b.webp" },
      ],
    },
    tuxedo: {
      label: "タキシード",
      labelEn: "Tuxedo",
      items: [
        { name: "Noir Classique", code: "20345S", price: 121000, line: "Atelier Yuka", img: "tx-01.webp", img2: "tx-01-b.webp" },
        { name: "Gris Perle", code: "20362S", price: 121000, line: "Atelier Yuka", img: "tx-02.webp", img2: "tx-02-b.webp" },
        { name: "Minuit", code: "20366S", price: 121000, line: "Atelier Yuka", img: "tx-03.webp", img2: "tx-03-b.webp" },
        { name: "Encre", code: "20313S", price: 110000, line: "Atelier Yuka", img: "tx-04.webp", img2: "tx-04-b.webp" },
        { name: "Fumée", code: "20321S", price: 110000, line: "Atelier Yuka", img: "tx-05.webp", img2: "tx-05-b.webp" },
        { name: "Océan", code: "20333S", price: 110000, line: "Atelier Yuka", img: "tx-06.webp", img2: "tx-06-b.webp" },
        { name: "Sable", code: "20336S", price: 110000, line: "Atelier Yuka", img: "tx-07.webp", img2: "tx-07-b.webp" },
        { name: "Argent", code: "20354S", price: 110000, line: "Atelier Yuka", img: "tx-08.webp", img2: "tx-08-b.webp" },
      ],
    },
    morning: {
      label: "モーニング",
      labelEn: "Morning Coat",
      items: [
        { name: "Cérémonie I", code: "715S", price: 110000, line: "Atelier Yuka", img: "mo-01.webp", img2: "mo-01-b.webp" },
        { name: "Cérémonie II", code: "778S", price: 110000, line: "Atelier Yuka", img: "mo-02.webp", img2: "mo-02-b.webp" },
        { name: "Cérémonie III", code: "779S", price: 110000, line: "Atelier Yuka", img: "mo-03.webp", img2: "mo-03-b.webp" },
        { name: "Cérémonie IV", code: "773S", price: 110000, line: "Atelier Yuka", img: "mo-04.webp", img2: "mo-04-b.webp" },
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
      q: "クリーニングは必要ですか?",
      a: "不要です。ご利用後はそのまま同梱の着払い伝票でご返送ください。クリーニングはアトリエユカで行います。",
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

if (typeof module !== "undefined") module.exports = AY;
