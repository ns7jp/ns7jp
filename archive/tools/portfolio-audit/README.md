# ポートフォリオ監査・週次改善キット

2026-09-08拡張。最新GitHub情報を取得する `cycle.mjs` と、過去の入力を再現する `audit.mjs` を備えます。
週次運用、対象能力、本人の実測カード、停止・再開、公開手順は[週次運用手順](../../docs/portfolio-automation/weekly-operation.md)を参照してください。

## 最新情報による監査

リポジトリのルートで実行します。Node.js 22以上、追加パッケージ不要です。

    node --test tools/portfolio-audit/tests/audit.test.mjs
    node tools/portfolio-audit/scripts/cycle.mjs tools/portfolio-audit/live.config.json .local/portfolio-operations

対象3リポジトリのGitHub APIをGETで取得します。公開リポジトリでは認証なしで実行できます。
API制限に達したら取得不明として停止します。既に環境変数 `GITHUB_TOKEN` が設定されている場合だけ利用します。
このトークンはGitHub API以外へ送らず、値を表示・保存しません。

`latest.json` にレポートの場所、変化、修正案の状態を保存します。`runs/` は観測ごとの履歴、
`state.json` は重複通知を防ぐ台帳、`pending.json` はレビュー待ちの修正案です。
原本の全文を含む実行記録は `.local/` 等でローカル管理し、公開リポジトリへ自動追加しません。

実装した自動修正は、`docs/target-roles.md` に残るAlmaLinuxの旧記載を正本に合わせる2行の修正案生成です。
原本・旧記載・進行中PRの条件が揃う場合に限り、別フォルダーへ差分・修正後ファイル・PR原稿を生成します。
限定修正の根拠本文は `live.config.json` のレビュー済みSHA-256とも照合します。
本文が変わった場合は `NEEDS_REVIEW` とし、内容の再確認なしにハッシュだけを更新しません。
任意の文章やプログラムをこのCLIが自動で書き換える機能はありません。
一般的な改善は、週次タスクのCodexが運用手順に従って判断・実装・検証します。

最新CLIの終了コードは、`0`＝対象範囲の収集・処理完了、`3`＝収集不全または期限切れ、`2`＝不正入力・状態破損・ロック等です。
課題が0件、実機試験に合格、公開可能、という意味ではありません。

保存した観測を再評価する場合は以下を使います。実行時の現在時刻で鮮度を判定し、修正案は生成しません。
リプレイ用状態を分け、週次の本番台帳は上書きしません。

    node tools/portfolio-audit/scripts/cycle.mjs tools/portfolio-audit/live.config.json .local/replay --replay SNAPSHOT.json

## 旧判定CLIと歴史的サンプル

[自律型成長のCLI](../../docs/autonomous-growth/tool-guide.md)は、検証済みSEメタデータから次の課題と再説明を選びます。
`scripts/growth.mjs` は明示した既存学習枠だけを使い、技能の正本やcareerの計画を変更しません。

キャリアを含む週次配分には[就職・定着のCLI](../../docs/engineer-career/tool-guide.md)を使います。
`scripts/career.mjs` は私用の時間・機会・行動と既存SE/PJの読み取り結果を参照し、計画を作ります。
GitHub監査の結果や教材の存在から、本人の技能合格・応募・入社を推定しません。

2026-09-07作成。Node.js標準モジュールのみを使うローカルCLIです。設計の一部を試せます。

## 実行

このフォルダーを開き、PowerShellまたはターミナルで実行します。

    node --test tests/audit.test.mjs
    node scripts/audit.mjs data/baseline.json policy.json
    node scripts/audit.mjs data/baseline.json policy.json > result.json

Node.js 22以上を想定し、今回の実行確認はWindows／Node.js v24.19.0です。
追加パッケージ、認証情報、ネットワーク接続は不要です。

baseline.jsonは2026-09-07に読んだ公開資料を手動で構造化した観測です。
改善候補の点数と作業案は設計上の提案です。サーバーの再試験を実施したデータではありません。
AlmaLinuxとUbuntuの過去の成功は保持し、短縮SHAや「相当」の記載に由来する来歴不足を表示します。
プロフィールの歴史的な実績表は、今回の入力範囲では誤りと判定しません。

## 出力

- findings：主張との不一致、未実測、来歴不足、収集不明
- candidate_queue：提案の順位と、進行中PRとの競合、本人の実測待ち
- snapshot_status：与えた評価日時に対する入力の古さ
- authorization：常にNONE。判定は公開・実機操作の許可ではありません

候補とPRのパス比較は、完全一致とディレクトリ包含（`docs/**`等）に対応します。意味上の重複はCodexによるレビュー対象です。
NO_OBSERVED_CONFLICTは入力に競合が無いという意味で、GitHubの最新状態の保証ではありません。
明示されていない必須の主張や未実測の一覧を発見するには、別途収集とclaimsの定義が必要です。

## 終了コード

- 0：入力が妥当で判定処理が完了。findingsがあっても0です。
- 2：入力ファイル、JSON、型、必須項目が不正。

終了コード0をCIや公開の合格条件にしないでください。
本番の公開ゲートは詳細設計の必須条件を別実装する必要があります。

## ファイル

| ファイル | 役割 |
| --- | --- |
| policy.json | 初期運用方針。score_weightsとsnapshot_max_age_hoursのみ本CLIが利用 |
| data/baseline.json | 読み取った資料の一部と提案候補。網羅的な収集結果ではない |
| scripts/audit.mjs | 入力検証・証跡照合・候補の並べ替え |
| tests/audit.test.mjs | 誤判定を防ぐ正常系・異常系試験 |
| templates/ai-change-request.md | 修正案を依頼するときの入力テンプレート |
| templates/pull-request.md | 内容確認用のPR原稿テンプレート |

policy.jsonの書き込み制限・保護パス・予算は設計用設定です。本CLIに編集機能はないため、ここで権限の強制は行いません。
この旧CLI自体には、GitHub自動収集、自由文解析、修正、公開、スケジュール、通知、VM／クラウド操作はありません。
URLの実在、証跡内容、出典のハッシュ、実行者の真実性もCLIでは検証しません。
入力値は未検証の申告で、POLICYやスナップショットを含めレビュー対象です。

全体像は[詳細設計書](../../docs/portfolio-automation/design.md)、実施済みの確認は[検証記録](../../docs/portfolio-automation/validation.md)を参照してください。監査サンプルは歴史的な観測の再現用なので、
data/baseline.jsonのevaluation_atも固定しています。実運用では収集処理が現在時刻を渡し、過去の値を使い回さない設計です。
