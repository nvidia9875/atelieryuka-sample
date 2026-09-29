/**
 * 開発用ストアに、本番と同じハンドルのカテゴリ用コレクション（商品の種類で自動で集める）を作る。
 * 本番にはもうあるので、本番には流さない。
 *
 *   使い方: node tools/shopify-dev-collections.mjs atelieryuka-dev.myshopify.com
 *   公開まで行うには store auth の scopes に read_publications,write_publications を足しておく
 */
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";

const STORE = process.argv[2];
if (!STORE || !STORE.startsWith("atelieryuka-dev.")) {
  console.error("開発用ストア専用です: node tools/shopify-dev-collections.mjs atelieryuka-dev.myshopify.com");
  process.exit(1);
}

// ハンドルは本番（atelieryuka.com/collections/…）と同じにする
const COLLECTIONS = [
  { handle: "ウエディングドレス", title: "ウエディングドレス", productType: "ウエディングドレス" },
  { handle: "colordress", title: "カラードレス", productType: "カラードレス" },
  { handle: "タキシード", title: "タキシード", productType: "タキシード" },
  { handle: "モーニング", title: "モーニング", productType: "モーニング" },
];

const existing = new Map(
  gql(STORE, `{ collections(first: 250) { nodes { id handle } } }`).collections.nodes.map((c) => [c.handle, c.id]),
);
// 公開には read_publications / write_publications の権限が要る。無ければ作成だけして、公開は管理画面で行う
function findOnlineStorePublication() {
  try {
    return gql(STORE, `{ publications(first: 20) { nodes { id name } } }`).publications.nodes.find(
      (p) => p.name === "Online Store" || p.name === "オンラインストア",
    );
  } catch (err) {
    if (!/read_publications/.test(err.message)) throw err;
    console.log("※ read_publications の権限が無いので、コレクションの公開はしません");
    return null;
  }
}
const publication = findOnlineStorePublication();

function createCollection(c) {
  const data = gql(
    STORE,
    `mutation($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle }
        userErrors { field message }
      }
    }`,
    {
      input: {
        handle: c.handle,
        title: c.title,
        sortOrder: "MANUAL", // 一覧の既定の並び＝おすすめ順（管理画面で並べた順）
        ruleSet: { appliedDisjunctively: false, rules: [{ column: "TYPE", relation: "EQUALS", condition: c.productType }] },
      },
    },
    { mutation: true },
  );
  const { collection } = assertNoUserErrors(`collectionCreate(${c.handle})`, data.collectionCreate);
  console.log(`＋${collection.handle} を作成`);
  return collection.id;
}

// 公開済みでももう一度呼んで問題ない（冪等）
function publish(id, handle) {
  const pub = gql(
    STORE,
    `mutation($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`,
    { id, input: [{ publicationId: publication.id }] },
    { mutation: true },
  );
  assertNoUserErrors(`publishablePublish(${handle})`, pub.publishablePublish);
  console.log(`  ${handle} をオンラインストアに公開`);
}

function setManualSort(id, handle) {
  const data = gql(
    STORE,
    `mutation($input: CollectionInput!) {
      collectionUpdate(input: $input) { collection { sortOrder } userErrors { field message } }
    }`,
    { input: { id, sortOrder: "MANUAL" } },
    { mutation: true },
  );
  assertNoUserErrors(`collectionUpdate(${handle})`, data.collectionUpdate);
}

for (const c of COLLECTIONS) {
  const id = existing.get(c.handle) ?? createCollection(c);
  if (existing.has(c.handle)) {
    console.log(`・${c.handle} は作成済み`);
    setManualSort(id, c.handle);
  }
  if (publication) publish(id, c.handle);
}
if (!publication) console.log("公開は、権限を足して流し直すか、管理画面の各コレクションで「オンラインストア」にチェックを入れる");
