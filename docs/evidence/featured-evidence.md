# 代表実績と、その根拠

[採用担当者向け要約](../overview-for-recruiters.md) / [プロフィール](../../README.md) / [全件の検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)

Linux の構築・運用を志望しているため、まず **Ubuntu の設定不備を検出し、修正後に再確認した例**を示します。
以下は本人が手元の Hyper-V VM を操作した学習記録です。AI は手順案内・結果の整理を支援しました。
本人の独力再現や、本番運用の実績を示すものではありません。

## 1. Ubuntu：SSH の誤設定を検出し、復旧を確認

**2026-09-07〜08、Ubuntu Server 24.04.4 LTS、`lab-base01`。** 固定 IP、SSH 鍵認証、UFW、時刻同期などを手作業で設定しました。
そのうち T-15 は、意図的な SSH 設定不備からの復旧を確認した例です。

| 確認の順序 | 記録された事実 | 原画像 |
| --- | --- | --- |
| 不備の検出 | `sshd -t` が `LabInvalidOption` を検出、終了コード 255 | [E21：構文エラー][ssh-invalid] |
| 修正後の再試験 | 設定を復元し、構文検査が終了コード 0 | [E23：構文正常][ssh-valid] |
| 接続と周辺設定の確認 | 固定 IP・経路・UFW と鍵接続を確認 | [E24：サーバー状態][ssh-state]・[E25：接続][ssh-connect] |

[結果票と21項目の判定][linux-record] / [全42枚・由来][linux-images] / [SHA-256一覧][linux-hashes]

構文検査の成功と、利用者側からの接続成功を別々に確認しています。途中の SSH タイムアウトの原因は未確定です。
全21項目の内訳は PASS 14、条件を変更して PASS 4、一部確認 2、未実施 1。監視込みのホスト再起動や全構成の合格とは扱いません。

## 2. Ubuntu：停止を監視画面で確認し、再開後に見直す

**2026-09-08、同 VM の5サービス構成。** Prometheus / Grafana で、アプリの手動停止・再開に伴う収集状態の変化を確認しました。

| 確認の順序 | 画面で確認できる値 | 原画像 |
| --- | --- | --- |
| 正常時 | Application Scrape Status が 1 | [E07：正常時][monitor-normal] |
| 手動停止後 | 同じ指標が 0 | [E08：収集失敗][monitor-down] |
| 手動再開後 | 同じ指標が 1 に復帰 | [E09：収集復帰][monitor-recovered] |

[結果票と構成・確認範囲][monitor-record] / [全10枚・由来][monitor-images] / [SHA-256一覧][monitor-hashes]

この値はメトリクス収集の成否です。外部通知、利用者からの全機能の正常性、自動復旧、長期稼働はこの演習の対象外です。

## 3. Ubuntu：アプリの自動再起動を複数の観点で確認

**2026-09-08、同 VM の app / nginx 構成。** 再起動回数 0→1、PID の変化、HTTP 復帰 2 秒を記録し、後続確認で healthy と HTTP 200 を確認しました。

[結果票][recovery-record] / [E02：再起動とHTTP復帰][recovery-summary] / [E03：後続の正常確認][recovery-healthy] / [全4枚・由来][recovery-images] / [SHA-256一覧][recovery-hashes]

2 秒は1回の秒単位の計測です。監視・通知を含む復旧時間や本番 RTO の保証ではありません。
上の監視演習と構成を切り替えて実施しており、一つの構成での一連の運用試験として合算しません。

## Windows と新しい実習の資料状況

| 記録 | 現在読める資料 | 残っている確認 |
| --- | --- | --- |
| [AD 構築・31項目 PASS][ad-record]、[System State 復元][ad-restore] | 結果票と当時の画面から転記した出力。原画像・生ログは未収録 | 元ファイルの所在確認、または新しい日付での再実施 |
| [WSUS 構築・総合 FAIL][wsus-build]、[原因調査と修正][wsus-fix] | 結果票と転記。絞り込みが空になった操作は未特定 | 修正済み手順で必須28項目を通し再試験。過去の FAIL は保持 |
| [10/1 の Nginx 停止・再開][nginx-record] | AI が案内し本人が操作した結果票。原画像・生ログは未収録 | [ライブデモ](../demo-script.md#面接でのライブ操作5-分ai-なし)を本人が実施し、操作・判断・終了コードを保存 |

原資料が見つからない箇所を、今回作った画面や推測の出力で埋めません。再実施は別の日付・環境の記録として追加します。

## 資料の確認と、次の実行

上のリンクは `server` の文書版 `1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77` に固定しています。これは閲覧する資料の版であり、各演習の実行コード版ではありません。
2026-10-31 に Codex が、リンク先24ファイルの存在と、上記3演習の画像計56枚の SHA-256 が保存済み一覧に一致することを確認しました。これは資料の整合確認です。
原画像のハッシュはファイルの同一性を確かめるもので、操作主体・撮影日時・本人の理解を認証するものではありません。

本人の次の実行は、既存の[採録計画](../evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)にまとめています。
[初期構築の記入用結果票](https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-10-25-independent-rerun-ubuntu-initial-build.md)は準備済みですが、**下書き・NOT RUN** です。
[ライブデモの記録用紙](./templates/linux-live-demo.md)も、実施後に本人が記入します。

[linux-record]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-08-lab-base01-initial-build.md
[linux-images]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/README.md
[linux-hashes]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/SHA256SUMS.txt
[ssh-invalid]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/E21-sshd-invalid.png
[ssh-valid]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/E23-sshd-valid.png
[ssh-state]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/E24-restore-server-state.png
[ssh-connect]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-07-08-lab-base01/E25-restore-connectivity.png
[monitor-record]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md
[monitor-images]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-monitoring/README.md
[monitor-hashes]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-monitoring/SHA256SUMS.txt
[monitor-normal]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-monitoring/E07-dashboard-normal.png
[monitor-down]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-monitoring/E08-dashboard-down.png
[monitor-recovered]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-monitoring/E09-dashboard-recovered.png
[recovery-record]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-08-lab-base01-d1-practice.md
[recovery-summary]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-d1/E02-summary.png
[recovery-healthy]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-d1/E03-healthy.png
[recovery-images]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-d1/README.md
[recovery-hashes]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/screenshots/2026-09-08-lab-base01-d1/SHA256SUMS.txt
[ad-record]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-01-ad-build-validation.md
[ad-restore]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-02-ad-restore-drill.md
[wsus-build]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-07-wsus-build-validation.md
[wsus-fix]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md
[nginx-record]: https://github.com/ns7jp/server/blob/1f6d4cc1e16e8180c2f562b3aa2c4591af64ce77/docs/evidence/2026-10-01-ubuntu-practice01-nginx-manual-recovery.md
