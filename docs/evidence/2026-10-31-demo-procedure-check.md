# デモ手順の動作確認（2026-10-31、AI 実行）

[証跡の索引](README.md) / [本人のライブ操作手順](../demo-script.md#面接でのライブ操作5-分ai-なし)

**Codex がクラウド作業環境でデモ手順を検証し、対象の 10 観点が PASS でした。本人の操作・判断・独力再現の実績には加えません。**
入口の停止と手動復旧、外形監視の変化を確認しました。ローカル通知は別途投入した合成アラートによる試験です。

## 環境と実行範囲

| 項目 | 内容 |
| --- | --- |
| 実行・判定 | Codex（AI）。本人の口頭説明・連続録画は未実施 |
| 検証時刻 | 2026-10-31 09:03:49〜09:04:42 JST。ログは 00:03:49〜00:04:42 UTC。準備・後片付けは区間外 |
| 環境 | Debian 13 のクラウド作業コンテナ内 Docker。本人の Hyper-V / Ubuntu VM とは別 |
| ソース | `ns7jp/server` の `1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77`。追跡ファイルの変更なし |
| 構成 | 対象版の `compose.yaml` / `compose.e2e.yaml` と下記の一時上書き設定 |
| 対象サービス | app / nginx / prometheus / alertmanager / blackbox / webhook-sink の 6 サービス |
| Docker / Compose | 28.4.0 / 2.40.3 |
| アプリ | Python 3.14.10、Flask 3.1.3、Gunicorn 23.0.0、Nginx 1.27.5 |
| 接続先 | loopback 限定。入口 18080、Prometheus 19090、Alertmanager 19093、ローカル受信先 18081 |
| 分離 | 専用プロジェクト `ns7jp-demo-check-20261031`、検証用の一時秘密値を使用 |
| 終了コード | 検証プログラム 0。停止中の curl は期待どおり 7。各 subprocess の結果は採録ログに記録 |

## 確認した結果

| # | 観点 | 実測した結果 | 判定 |
| --- | --- | --- | --- |
| 1 | 正常時の `/healthz` | HTTP 200、JSON の `status=ok` | PASS |
| 2 | 認証なしの `/` | HTTP 401 | PASS |
| 3 | Basic 認証ありの `/api/stats` | HTTP 200。認証値と応答本文は出力しない | PASS |
| 4 | 正常時の監視 | app の `up=1`、入口の `probe_success=1` | PASS |
| 5 | Nginx 停止中の app | `running healthy` を維持 | PASS |
| 6 | 停止中の入口 | curl 終了 7、`http_code=000`（HTTP 応答なし。000 は HTTP ステータスコードではない） | PASS |
| 7 | 停止中の監視 | app の `up=1` のまま、入口の `probe_success=0` | PASS |
| 8 | Nginx の手動再開 | HTTP 200、`status=ok` へ復帰 | PASS |
| 9 | 復旧後の監視 | 入口の `probe_success=1` へ復帰 | PASS |
| 10 | 合成アラートのローカル通知 | `PortfolioDemo` の FIRING / RESOLVED を専用受信先で確認 | PASS |

監視のクエリは `up{job="server-monitor"}` と `probe_success{job="blackbox-probe-health"}` です。
既存の取得周期に合わせて期待値を待ちました。単発の実測であり、検知時間・復旧時間の保証値は算出しません。
未起動の node-exporter 等の対象や SLO の長時間窓は評価していません。

## 設定差分と起動失敗の修正

- 専用プロジェクト名・loopback ポート、一時ファイルの秘密値で既存環境から分離しました。
- ビルド時だけ CA を secret mount し、pip の `PIP_CERT` に指定しました。TLS 検証を有効にし、CA をイメージへ保存していません。
- 最初の起動は app が unhealthy となり終了 1。ログに `PermissionError: [Errno 13] Permission denied: '/app/app.py'` がありました。クラウド側 checkout の mode 0600 が COPY 後も保持され、非 root の app ユーザーが読めない状態でした。一時 Dockerfile に `RUN chmod -R a+rX /app` を加えて再ビルドし、上表を再試験しました。
- 設定ファイルは同じ内容を一時領域へコピーし、コンテナ内で読める mode にしました。検証用秘密値も mode 0700 の親ディレクトリ内で read-only mount から読める mode にしました。これは今回の環境への適応です。
- Alertmanager はローカル受信先と待ち時間 1 秒に変更しました。受信処理は既存の `tests/e2e/webhook_sink.py` を使用し、今回の Python イメージで実行しました。

通知試験では Alertmanager API に合成アラートを登録し、専用の `instance` に一致する受信イベントを照合しました。
**Nginx の停止から Prometheus がアラートを発火し、通知が届いたことを示す試験ではありません。**

## 公開した採録物

生ログはローカルに保管し、必要な出力だけを以下に抜粋しました。
公開物に生成した秘密値 3 件との一致がないことを、値を表示せず確認しました。
認証ヘッダー、全環境変数、CA、ホストの資源情報を含む API 本文、展開済み Compose 設定は収録していません。
公開用コピーは Codex が確認しました。本人の公開確認・第三者レビューは未実施です。

- [実コマンド・終了コード・必要出力の抜粋](assets/2026-10-31-demo-procedure-check/verification-excerpt.txt)
- [10 観点の結果 JSON](assets/2026-10-31-demo-procedure-check/checks.json)、[FIRING / RESOLVED の受信イベント](assets/2026-10-31-demo-procedure-check/local-webhook-events.json)
- [使用イメージの識別子](assets/2026-10-31-demo-procedure-check/image-identities.txt)
- [一時 Dockerfile](assets/2026-10-31-demo-procedure-check/Dockerfile)、[上書き設定](assets/2026-10-31-demo-procedure-check/compose.check.json)、[ローカル通知設定](assets/2026-10-31-demo-procedure-check/alertmanager.yml)
- [Compose 呼び出し](assets/2026-10-31-demo-procedure-check/compose.sh)、[実際に使用した検証プログラム](assets/2026-10-31-demo-procedure-check/run-check.py)
- [後片付けの確認](assets/2026-10-31-demo-procedure-check/cleanup-excerpt.txt)、[非公開元ログの SHA-256](assets/2026-10-31-demo-procedure-check/source-transcript-sha256.txt)
- [公開コピーの SHA-256 一覧](assets/2026-10-31-demo-procedure-check/SHA256SUMS)

添付の一時パスは実行時のものです。秘密値は公開せず、後片付けで削除しました。
追試には対象版のコード、専用環境に合わせたパス・ポート、新しい検証用秘密値と設定ファイルの準備が必要です。
本人の 5 分デモは冒頭の手順リンクを使います。

公開コピーの整合性は、この結果票のディレクトリから確認できます。

```bash
cd assets/2026-10-31-demo-procedure-check
sha256sum --check SHA256SUMS
```

ハッシュは公開コピーの同一性確認用です。本人の操作や AI 不使用を証明するものではありません。

## 後片付けと未実施

専用の 6 コンテナ、3 ネットワーク、Prometheus の検証ボリューム、今回ビルドしたイメージを削除しました。
削除後のプロジェクトラベル検索はコンテナ・ネットワーク・ボリュームすべて 0 件でした。取得したベースイメージのキャッシュは残しています。

本人の実演・説明・独力再現・連続録画、OS 再起動と自動復帰、24 時間稼働、外部 Slack 通知、バックアップと別 VM 復元、WSUS 通し再試験、D-1 自動復旧、全構成の受け入れ、第三者への引き渡しは **NOT RUN** です。
本人の実行結果が得られた場合は、別の日付・実行者・環境で記録します。
