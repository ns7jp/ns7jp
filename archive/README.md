# archive — 学習・案件・ポートフォリオ運営のための仕組み

ここには、**自分の学習とポートフォリオ運営を管理するために作った仕組み**をまとめています。
サーバー構築そのものの成果物ではないため、リポジトリの入口から外し、この配下へ移しました。

移動しただけで、**削除も停止もしていません**。文書は読めますし、CLI も CI も動きます。

## なぜ分けたか

2026-09-17 に、採用担当者の視点でポートフォリオを見直したところ、次の状態でした。

| 区分 | 分量 |
| --- | --- |
| プロフィールリポジトリの Markdown 全体 | 約 35,600 行 |
| うち、この archive/ に入っている文書 | 約 12,900 行（36%） |
| この archive/ に入っている JavaScript | 約 8,300 行 |

プロフィールリポジトリで**最も量のある独自コードが、インフラと無関係な自己管理ツール**という
構成になっていました。サーバー構築の求人に応募する資料としては、主作品
[`ns7jp/server`](https://github.com/ns7jp/server) と実測記録に目が届かなくなる分量です。

そこで、

- リポジトリ直下には **インフラの証跡・経歴・学習教材** だけを置く
- 運営のための仕組みは archive/ へ移し、必要なときだけ開く

という形に整理しました。`.gitattributes` で archive/ を GitHub の言語判定から除外しているため、
リポジトリの言語表示も JavaScript ではなくなります。

## 中身

### 文書（archive/docs/）

| ディレクトリ | 内容 |
| --- | --- |
| [server-engineer](./docs/server-engineer/README.md) | 段階別の育成システム（課題・提出物・評価基準） |
| [server-projects](./docs/server-projects/README.md) | サーバー案件を受付から終結まで進める運用システム |
| [engineer-career](./docs/engineer-career/README.md) | 就職・定着・継続成長の計画 |
| [autonomous-growth](./docs/autonomous-growth/README.md) | 自律型成長（復習間隔・再説明の選択） |
| [autonomous-prosperity](./docs/autonomous-prosperity/README.md) ／ [prosperity-review](./docs/prosperity-review/README.md) | 成果・負荷・期限の振り返り |
| [portfolio-automation](./docs/portfolio-automation/design.md) ／ [portfolio-loop](./docs/portfolio-loop/README.md) | 週次のポートフォリオ監査と改善ループ |
| [server-innovation](./docs/server-innovation/README.md) | 改善仮説の比較実験と探索 |

### CLI（archive/tools/、archive/scripts/）

`archive/` をルートとして動きます。移動後も次がすべて通ります（397 テスト）。

```bash
node archive/scripts/server-engineer.mjs check
node archive/scripts/server-projects.mjs check
node archive/scripts/check-engineer-links.mjs
node --test archive/tests/*.test.mjs
node --test archive/tools/*/tests/*.test.mjs
```

CI（`docs-check` / `server-engineer-check` / `server-projects-check`）も、このパスを見ています。

## 読む必要があるか

**採用の判断には必要ありません。** 主作品と実測記録は次にあります。

- [サーバー構築・監視ラボ `server`](https://github.com/ns7jp/server)（主作品）
- [採用ご担当者さま向けページ](../docs/overview-for-recruiters.md)
- [職務経歴書・スキルシート](../docs/resume.md)
- [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)

ここにある仕組みは、**学習を続けるための道具**であり、技能の証明ではありません。
自動テストが通っていることを、本人の習得や案件の実施完了には読み替えません。
