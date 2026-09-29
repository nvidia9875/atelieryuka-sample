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
