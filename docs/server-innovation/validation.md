# 改善実験システムの検証記録

確認日：2026-09-09。Windows / Node.js v24.20.0のローカル実行。

## 対象の版

| リポジトリ | 読み取った完全SHA |
| --- | --- |
| ns7jp/ns7jp | c40808e16cc01c701e05b9649b823cff90150dd4 |
| ns7jp/server（発火点探索時） | 7b87dcac1afec3a4177cf0ec3535628ad5231ee7 |
| ns7jp/ns7jp.github.io | 2ac4f01b0f617d393bbfa1928c2b98e7593a3956 |

上記は公開資料と実装を読むための基点です。今回の新CLIの検査対象はprofileの基点に今回のローカル差分を加えたものです。
サーバー実測の試験対象SHAとは別です。3repoの収集時HEADとCIは初回観測レポートに保存しました。

## 実行済み

| 確認 | 結果 |
| --- | --- |
| 新CLI群の自動テスト | 93 passed / 0 failed / 0 skipped（判定36、探索33、能動プローブ15、コネクタ再生9） |
| 既存監査・career・growth・SE・PJの回帰テスト | 166 passed / 0 failed / 0 skipped |
| GitHubの実収集 | 対象3リポジトリ17ファイル、接続済みGitHubの応答を既存collectで再検証し完了 |
| 実収集データの発火点探索 | 40 signals（設定上限）、初回4つの新仮説、独自提案取り込み後は計8つの動的候補 |
| 能動的なローカルモデル比較 | 3種類22ケースを実行し、提案する厳密な期待条件との差10件を採録 |
| 比較判定のデモ | 合成ログ6試行を作成し、DEMO_ONLYを確認 |
| Markdown lint | 159 files / 0 issues |
| Mermaid構文 | 43 diagrams / 0 failed |
| 新しい実行コードの構文検査 | innovation.mjs、discovery.mjs、probes.mjs、connector-replay.mjs、demo.mjsを実行・構文確認 |
| 変更文書の相対リンクと見出し | 9文書、52参照、うち1つの見出し参照を確認、エラー0 |

単体テストには、収集の鮮度・改変、PRパス競合、未成功CI、作業枠占有、出典の変化、重複抑止、状態破損、ロックを含めています。
比較判定では未実施、失敗、悪化、指標の向き、旧値0、条件変更、別環境、重複試行、証拠改変、パス逸脱、時刻、未知項目を確認しています。
合成試験データを使ったPROMISINGの単体テストは判定関数の検査であり、サーバー改善の実測ではありません。

追加のテストでは、固定8候補がすべて終了した場合の補充、複数の発想法、同じ入力の冪等性、上限、独自提案、
実測結果を受けた追試と重み更新、重複学習拒否、本人記録の保護、帰属のすり替え拒否、原本改変、ロック、latest消失時の停止を検査しています。
直接APIで一部403となった収集はNEEDS_REFRESHのまま保存し、別途接続済みGitHubのGETで最新の完全な応答列を取得しました。
取得前後のHEAD/PR集合、blob SHAとサイズ、対象版のCIを同じcollect処理で検証しています。
初期版の2297fbbの観測と11ファイルの監査結果は、以前の実行履歴として保持しています。

## 実装の限界

- 新仮説は固定カタログに加えて文章の手がかりと能動モデルから生成します。意味の完全な理解、後続の完了記録、独自提案の根拠はCodexが読む必要があります。
- 能動プローブの実装範囲は、採録したD-1ソースに対応するローカルモデルです。任意のサーバーや別のコード版で実験する汎用実行器ではありません。
- 発想法・探索対象を拡張するコード変更や、収集範囲外の新しい資料の調査は週次Codexの共通枠で行います。根拠枯渇時は新案を捏造せずRESEARCH_REQUIREDを返します。
- contextのoccupiedとclosedは既存運用を読んで作る申告値です。CLI単体で別タスクの作業枠や採否を認証しません。
- 証拠のハッシュと宣言された来歴は確認しますが、測定値の意味の抽出、本人の実施の認証、統計的・因果的な証明は行いません。
- 採用・公開後の評価・本人の技能・実機操作の承認は別の記録と判断です。
- 週次登録があることと、将来の予定日時に実行されたことは異なります。

## NOT RUN

今回の8つの実機実験、Linux runtime、Ansible適用、Docker操作、VM停止・再起動・障害注入、AWS、Slack、24h/72h稼働はNOT RUNです。
この差分のGitHub上のCI、PR作成、push、mergeは未実施です。
今回の実装が構築時間や復旧時間を何%改善したかという実測値はまだありません。

## 再実行

```text
node --test tools/server-innovation/tests/*.test.mjs
node --test tools/portfolio-audit/tests/audit.test.mjs tests/server-engineer.test.mjs tests/server-projects.test.mjs
node tools/server-innovation/demo.mjs .local/innovation-demo-new
git diff --check
```

デモ保存先には未使用のディレクトリを指定します。原本・過去結果を削除して試験を通しません。
