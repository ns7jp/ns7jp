# ポートフォリオ監査判定キット（試作品）

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

候補とPRのパス比較は完全一致のみです。ディレクトリ単位・意味上の重複は未実装です。
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
GitHub自動収集、自由文解析、修正、公開、スケジュール、通知、VM／クラウド操作は未実装です。
URLの実在、証跡内容、出典のハッシュ、実行者の真実性もCLIでは検証しません。
入力値は未検証の申告で、POLICYやスナップショットを含めレビュー対象です。

全体像は[詳細設計書](../../docs/portfolio-automation/design.md)、実施済みの確認は[検証記録](../../docs/portfolio-automation/validation.md)を参照してください。監査サンプルは歴史的な観測の再現用なので、
data/baseline.jsonのevaluation_atも固定しています。実運用では収集処理が現在時刻を渡し、過去の値を使い回さない設計です。
