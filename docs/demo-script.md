# 2 分 15 秒デモとライブデモ案内

> **現在の公開状態**
>
> 2026-08-22 時点で、[2 分 15 秒の実測証跡リプレイ](https://ns7jp.github.io/demo.html)を公開しています。これは実操作の連続録画ではなく、2026-08-18・19 に保存した実測スクリーンショットと D-1 復旧ログを時系列で再構成した映像です。

最終更新: 2026-08-22

## いま確認できるもの

| 項目 | 状態 | 確認先 |
| --- | --- | --- |
| 実測結果 | 公開済み | [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) |
| 実測証跡リプレイ | **公開済み** | [字幕・文字起こし・一次記録付きデモページ](https://ns7jp.github.io/demo.html) |
| 自動デモ | 実装済み・実行結果は E2E 証跡で確認 | [`scripts/demo/run-demo.sh`](https://github.com/ns7jp/server-monitor/blob/main/scripts/demo/run-demo.sh) |
| 一気通貫の構成検証 | 実装済み・PR #75 で 23/23 ID PASS | [`scripts/e2e/run-full-stack.sh`](https://github.com/ns7jp/server-monitor/blob/main/scripts/e2e/run-full-stack.sh) / [実測記録](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証) |
| 実操作の連続録画 | **未公開** | E2E を実行した端末 cast は GitHub Actions artifact として保存 |

証跡リプレイとライブ実行は混同しません。自動デモの実行結果は、日時・環境・commit・終了コードを含む E2E artifact が生成された場合だけ成功と扱います。

## デモで伝えること

「設計資料がある」だけでなく、同じ commit から次の流れを再現できることを 3 分以内で示します。

1. 構成コードから環境を起動する
2. 正常性と監視データを確認する
3. app プロセスを意図的に停止する
4. 異常を検知し、ログと状態を確認する
5. 自動復旧と最終的な正常性を確認する
6. コマンド、時刻、結果を証跡として残す

Slack 通知は実配信の証跡がまだないため、動画の必須条件にしません。実配信を確認できた場合だけ追加カットとして掲載します。

## 2〜3 分の収録台本

| 時間 | 画面・操作 | 伝えること |
| --- | --- | --- |
| 0:00–0:20 | [構成図](./architecture-diagram.md) | 「構成管理、監視、障害復旧を一つのラボで扱う」 |
| 0:20–0:50 | 自動デモまたは構成検証を開始し、対象 commit を表示 | 「同じ手順から再現できる」 |
| 0:50–1:15 | サービス一覧、health check、Grafana / Loki | 「正常状態をメトリクスとログで確認する」 |
| 1:15–1:40 | app プロセスを停止 | 「意図的に異常を起こす」 |
| 1:40–2:10 | プロセス状態、ログ、health check の失敗を表示 | 「状態とログから影響を確認する」 |
| 2:10–2:35 | 自動復旧、再度 health check | 「復旧後の正常性まで確認する」 |
| 2:35–3:00 | 実行結果と証跡ファイル | 「成功・失敗を commit と時刻付きで残す」 |

2026-08-19 の WSL2 演習では app プロセス停止から 13 秒、PR #75 の使い捨て runner E2E では 1 秒での自動復旧を実測済みです。環境が異なるため優劣比較には使いません。動画では、数値だけを字幕にせず、開始・復旧時刻が分かる出力も同じ画面に含めます。

## 実操作の連続録画を常設公開する前の合格条件

- [x] server-monitor の自動デモが使い捨て runner で完走する（PR #75 E2E artifact）
- [x] 2 回目の構成適用 `changed=0` と成功・失敗を終了コードで判別できる
- [x] 実行 commit、開始・終了時刻、環境情報を artifact に記録する
- [x] 障害注入前後の health check と復旧後の確認を terminal cast / raw log に残す
- [x] credential、token、webhook secret を artifact へ記録しない
- [ ] 常設公開前に公開 IP、ホスト名、個人情報が映っていないかを最終確認する
- [ ] 音声なしでも分かる一行字幕を付ける
- [ ] 公開 URL を確認してから README の「証跡リプレイ」リンクを連続録画へ差し替えるか判断する

## 連続録画を常設公開した場合の更新

実操作の連続録画を常設公開した時だけ、次を同じ commit で更新します。

1. [プロフィール README](../README.md) のリンクを公開動画へ変更
2. [採用担当者向け 1 ページ版](./overview-for-recruiters.md) の状態を「公開済み」へ変更
3. [ビジュアルショーケース](./showcase/README.md) にサムネイルと実行証跡を掲載
4. [STATUS](../STATUS.md) に公開日、対象 commit、収録環境を記録

## 関連ドキュメント

- [実測証跡](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
- [構成図](./architecture-diagram.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [ビジュアルショーケース](./showcase/README.md)
- [D-1 復旧演習（RTO 13 秒）](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)
