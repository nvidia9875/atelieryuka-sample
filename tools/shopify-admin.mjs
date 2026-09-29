/**
 * Shopify Admin API（GraphQL）を Shopify CLI 経由で呼ぶ小さなヘルパー。
 * トークンは CLI が持つ（`shopify store auth` 済みであること）。このリポジトリには保存しない。
 *
 *   import { gql } from "./shopify-admin.mjs";
 *   const data = gql(store, `{ shop { name } }`);
 *   gql(store, `mutation ...`, variables, { mutation: true });
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Shopify CLI 4.x は Node 22 以上が必要
const NODE22_BIN = "/opt/homebrew/opt/node@22/bin";

export function gql(store, query, variables = {}, { mutation = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "shopify-gql-"));
  const queryFile = join(dir, "query.graphql");
  const outFile = join(dir, "out.json");
  writeFileSync(queryFile, query);
  const args = [
    "store", "execute",
    "--store", store,
    "--query-file", queryFile,
    "--variables", JSON.stringify(variables),
    "--output-file", outFile,
    "--no-color",
  ];
  if (mutation) args.push("--allow-mutations");
  try {
    execFileSync("shopify", args, {
      env: { ...process.env, PATH: `${NODE22_BIN}:${process.env.PATH}` },
      stdio: ["ignore", "ignore", "pipe"],
    });
    return JSON.parse(readFileSync(outFile, "utf8"));
  } catch (err) {
    const detail = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`GraphQL の実行に失敗しました（${store}）\n${detail}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** mutation の戻り値にある userErrors を検査し、あれば例外にする */
export function assertNoUserErrors(label, payload) {
  const errors = payload?.userErrors ?? [];
  if (errors.length) {
    const lines = errors.map((e) => `- ${e.field?.join(".") ?? ""} ${e.message} (${e.code ?? ""})`);
    throw new Error(`${label} でエラー:\n${lines.join("\n")}`);
  }
  return payload;
}

/**
 * ローカルのファイルを Shopify の「ファイル」に上げる（一時アップロード先 → fileCreate）。
 * items: [{ path, filename, mimeType, contentType: "IMAGE" | "FILE", alt }]
 * 返り値: filename → ファイルの GID
 * 1回の呼び出しで上げる数は呼び出し側で区切る（stagedUploadsCreate は数十件ずつが無難）。
 */
export function uploadFiles(store, items) {
  const staged = gql(
    store,
    `mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      input: items.map((it) => ({
        filename: it.filename,
        mimeType: it.mimeType,
        resource: it.contentType === "IMAGE" ? "IMAGE" : "FILE",
        httpMethod: "POST",
      })),
    },
    { mutation: true },
  );
  const targets = assertNoUserErrors("stagedUploadsCreate", staged.stagedUploadsCreate).stagedTargets;

  targets.forEach((target, i) => {
    const args = ["-sS", "--fail", "-X", "POST", target.url];
    for (const p of target.parameters) args.push("-F", `${p.name}=${p.value}`);
    args.push("-F", `file=@${items[i].path}`);
    execFileSync("curl", args, { stdio: ["ignore", "ignore", "pipe"] });
  });

  const created = gql(
    store,
    `mutation($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id fileStatus }
        userErrors { field message code }
      }
    }`,
    {
      files: items.map((it, i) => ({
        originalSource: targets[i].resourceUrl,
        contentType: it.contentType,
        filename: it.filename,
        alt: it.alt ?? "",
      })),
    },
    { mutation: true },
  );
  const files = assertNoUserErrors("fileCreate", created.fileCreate).files;
  return new Map(files.map((f, i) => [items[i].filename, f.id]));
}

/** 「ファイル」にある、名前が prefix で始まるファイルの filename → GID（アップロード済みの確認用） */
export function listFiles(store, prefix) {
  const found = new Map();
  let after = null;
  do {
    const data = gql(
      store,
      `query($q: String!, $after: String) {
        files(first: 250, after: $after, query: $q) {
          nodes { id ... on MediaImage { image { url } } ... on GenericFile { url } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { q: `filename:${prefix}*`, after },
    );
    for (const f of data.files.nodes) {
      const url = f.image?.url ?? f.url ?? "";
      const name = decodeURIComponent(url.split("/").pop().split("?")[0]);
      if (name.startsWith(prefix)) found.set(name, f.id);
    }
    after = data.files.pageInfo.hasNextPage ? data.files.pageInfo.endCursor : null;
  } while (after);
  return found;
}
