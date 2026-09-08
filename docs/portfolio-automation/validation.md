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

## 週次運用への拡張（2026-09-08）

環境：Windows / Node.js v24.19.0。対象ブランチは `codex/weekly-portfolio-improvement-20260908`。
基点は `1f51b578aff308ec513f27709f9499311d75137b`。以下は未コミット差分を含むローカル検証です。

| 検証 | 結果 | 対象 |
| --- | --- | --- |
| Node.jsテスト | 54 passed / 0 failed / 0 skipped | 既存24件＋収集、整合性、異常系、状態、限定修正等30件 |
| 構文確認 | PASS | audit.mjs、cycle.mjs、github.mjs、cycle.cases.mjs |
| 過去baselineのCLI | PASS | 過去の観測日時と結果を保持、authorization=NONE |
| 公開GitHubへの収集実行 | PASS | 2026-09-08 10:27 JST、3リポジトリ、指定11原本、6改善候補 |
| 限定修正案の実生成 | PASS | target-roles.mdの2行、正本・ハッシュ・既存PRを照合 |
| 生成patchの適用 | PASS | git apply --check後にローカル適用 |

追加テストにはページング上限、HTTP再試行上限、取得中のHEAD/PR変更、truncated tree、symlink、
ハッシュ不一致、古い・未来の観測、別SHAのCI、NOT_RUNからの誤昇格、曖昧な表、ディレクトリ競合、
修正範囲の逸脱、同じ修正案・通知の重複、state/pending破損、連続失敗、排他ロック、リプレイの分離を含みます。
公開前の独立レビューで、対象資料欠落時の例外、根拠訂正後の修正案生成、不正なリプレイ入力のライブ切替を修正しました。
資料欠落、レビュー済み原本ハッシュの不一致、台帳行の矛盾・重複、null等の不正リプレイの回帰テストを追加しています。

初回の読み取りで取得したHEADは次のとおりです。

| リポジトリ | 取得SHA |
| --- | --- |
| ns7jp/server | f31d4bdc75b37b63cf388474657b50d4bfcbffd2 |
| ns7jp/ns7jp | 1f51b578aff308ec513f27709f9499311d75137b |
| ns7jp/ns7jp.github.io | 5b5d46a2136e3fddd2355dd775bcdeabe2ae0ad2 |

GitHub側の既存runを読んだことは、今回変更した監査コードがGitHub Actionsで実行された証明ではありません。
初回収集時のopen PRは0件で、作業開始時のPR #173は別途マージ済みと確認しています。
限定修正案の適用で、AlmaLinuxの基盤構築の過去実績を正しく案内します。新しい実機実績は作っていません。

今回のNOT RUN：変更後コードのGitHub Actions実行、VM／Ansible／Docker／AWS／Slack／障害復旧の実測、
ホスト再起動・24h/72hの確認、将来の週次スケジュールによる初回起動。
公開・push・PR作成・マージもこのローカル検証には含めません。
