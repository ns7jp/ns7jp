# server-monitor Git モード変更・ロールバック CI

## 判定

**PASS** — 2026-08-23 の GitHub Actions で、候補 SHA の配備から指定した旧 SHA への
ロールバックと、復帰後の稼働確認まで完了した。

- 対象: [`ns7jp/server-monitor` PR #77](https://github.com/ns7jp/server-monitor/pull/77)
- Actions: [Full-stack Ansible E2E run 32611251044](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)
- job: `ephemeral-ubuntu` — success（6 分 36 秒）
- job 実行: 2026-08-23 01:50:06〜01:56:42 UTC
- ロールバック要約生成: 2026-08-23 01:56:36 UTC
- candidate SHA: `84e149254d463a8a27a4cabcd09efa4504d1b47e`
- rollback SHA: `59aa88ed1c8ccb7ba188909f0e079b834e9126c7`
- 対象ディレクトリ: `/opt/server-monitor`
- source mode: immutable `git` SHA

## 確認したこと

CI が `PASS` を記録したのは、次をすべて確認した後である。

1. candidate SHA を配備し、サービスを検証した。
2. rollback 前のチェック、rollback SHA の配備、復帰後のサービス検証を完了した。
3. revision marker が指定した各 SHA と一致した。
4. running container 内の runtime manifest が対象 SHA の期待値と一致した。
5. candidate 配備時と rollback 時に app container が強制的に再生成された。
6. 旧配備物にない不要ファイルが残っていないことを確認した。
7. 管理ポートの loopback bind を確認した。
8. rollback 後のログが Loki に取り込まれることを確認した。

## 一次証跡

GitHub Actions artifact `full-stack-e2e-32611251044-1` に、次を含む実行結果が保存された。

- artifact ID: `9485671697`
- digest: `sha256:9b0846bbef8242a8c9db5b542d181f4c23b10c14c08f15f3c2758555732f515a`
- GitHub 上の期限: 2026-09-22 01:56:40 UTC
- 主なファイル: `change-rollback-summary.md`、`change-context.txt`、
  `candidate-revision.txt`、`rollback-revision.txt`、candidate / rollback の runtime manifest、
  deploy / verify log、listener・Loki 確認結果

このファイルはプロフィール側の索引であり、一次証跡の正本は GitHub Actions run と
`server-monitor` 側で管理する。

## 読み替えない範囲

この `PASS` は、PR #77 のブランチを対象とした使い捨て Ubuntu runner 上の再現試験である。
次の完了を示さない。

- PR #77 の main へのマージ
- 独立した管理端末・永続ホスト・本番環境での変更またはロールバック
- ホスト再起動後の永続性、24 時間・72 時間の継続稼働
- Alertmanager から Slack への実配信
- AWS の `terraform apply / destroy` または AWS Backup からの復旧
- D-2 ホスト障害復旧演習
- Windows / AD 公開再現ラボ、Windows / winget セットアップ

これらは `NOT RUN` のままであり、対応する実環境の一次出力を採録した時だけ更新する。
