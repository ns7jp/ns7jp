# 納品物の検証記録

実施日：2026-09-07（JST）
実行環境：Windows、Node.js v24.19.0

| 検証 | 結果 |
| --- | --- |
| 監査判定コードの構文確認 | PASS |
| Node.jsテスト | 23 passed / 0 failed / 0 skipped |
| baseline.jsonを使ったCLI実行 | 正常終了、authorization=NONE |
| JSONファイルの構文 | 3ファイル PASS（policy、baseline、結果JSON） |
| Markdownの相対ファイルリンク | 1参照 PASS |
| Markdownのコードフェンスと置換文字確認 | 4ファイル PASS（本検証記録追加前） |

テストは同一入力での決定性、過去実績の保持、NOT_RUN／SKIP_ENVの扱い、環境・scope不一致、
現行SHAとの照合、既存PRとの競合、取得不全、古いsnapshot、安定した候補ID、入力の異常値、
外部公開を許可しない出力を確認した。

入力例では、Ubuntu／AlmaLinuxの既存結果に対する来歴確認が2件、
永続ホストの未実測が1件表示される。これは今回サーバーで再測定した結果ではない。
来歴不足は過去の成功を否定する判定でもない。
現行プロフィールの歴史的な実績表を誤りとは判定していない。

改善候補のうち、foundation合成とUbuntu 22.04のパッケージ修正は、
観測したPR #160／#161とのパス競合を検出する。新規AlmaLinux VMの実測は本人作業待ちとなる。
各候補の点数は提案値。CLIはGitHubの最新PR状態を再取得していない。

初回設計時点のNOT RUN／未実装：

- GitHub Actions上での本キット実行、自動収集、自由文解析、本文の自動修正。
- GitHubへのpush、Issue／PR作成、マージ、GitHub Pages公開。
- 定期実行登録、AI API呼び出し、外部への通知。
- VM、Ansible、Docker、Terraform、AWS、Slackの実環境操作・再試験。
- 原本URLの全件到達確認、証跡内容の真実性・ハッシュ照合、本人の理解の確認。

全体の設計は[詳細設計書](design.md)、
コードの使い方は[キットREADME](../../tools/portfolio-audit/README.md)、
サンプル判定は[結果JSON](../../tools/portfolio-audit/reports/baseline-analysis.json)を参照。

## リポジトリ配置後の確認（2026-09-07）

設計書をdocs/portfolio-automation、コードをtools/portfolio-auditへ配置し、相対リンクを更新した。
独立レビューで見つかった未知のscore_weightsキーを拒否する検証と回帰テストを追加した。
既存docs-checkに同テストを組み込み、定期実行や外部への書き込み機能は追加していない。

| 確認 | 結果 |
| --- | --- |
| Node.jsテスト | 24 passed / 0 failed / 0 skipped（Windows、Node.js v24.19.0） |
| 監査コードの構文 | PASS |
| Mermaid構文 | 33 diagrams / 0 failed（既存スクリプト、mermaid 10.9.8、jsdom 26.1.0） |

上記はローカル確認であり、GitHub Actionsの実行やサーバーの実測を示さない。
GitHub側の検証はPRのChecksで対象コミットの結果を確認する。
