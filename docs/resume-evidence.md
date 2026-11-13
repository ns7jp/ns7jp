# 実習と技術経験の詳細

[職務経歴書](./resume.md) ／ [スキルシート](./skill-sheet.md) ／ [AI 支援の内訳](./ai-usage.md)

研修事例、日付付きの実習一覧、技術ごとの確認範囲をまとめた補足資料です。本人が AI の案内を受けて操作した記録と、CI・AI が実行した記録を区別しています。独力再現・説明を確認したものではありません。

## 取り組み事例: AD ドメイン参加時の名前解決障害（2026-08）

> この事例の記述は AI が代筆したものです（[AI 支援の内訳](./ai-usage.md)参照）。私の記憶に基づく書き直しは、まだ終えていません。

Hyper-V で Windows Server 評価版の AD DS を構築した際、クライアント VM からドメインに参加できない事象に遭遇しました。

- **環境**: 社内 PC、Hyper-V、Windows Server 2022、クライアント側は AlmaLinux 9.7
- **症状**: AD DS のセットアップ自体は完了したが、クライアント VM からドメインへ参加しようとすると、ドメインが見つからないという趣旨のエラーで失敗した（参加に使ったコマンドと正確なエラー文は、本人が LEARNINGS.md を書き直す際に追記します）
- **原因**: クライアント VM のネットワークアダプタが Hyper-V の NAT 設定のままで、DNS サーバーとして外部（ルーター）を向いていた。AD のドメインコントローラを DNS として参照する設定になっていなかった
- **対処**: Hyper-V の仮想スイッチを、NAT 接続のものから DC と同じ内部スイッチ（Hyper-V の種類は外部・内部・プライベート）へ付け替え、クライアント側の DNS 設定をドメインコントローラの IP へ手動で向けた。あわせて、ドメイン参加手順を再現できるよう、ネットワーク設定 → DNS 設定 → ドメイン参加の順序をチェックリスト化した
- **学び**: AD ドメイン参加は「ドメインコントローラが動いていること」だけでなく「クライアントがその DC を DNS として見ていること」が前提条件だと分かった。Linux での `dig` による DNS 切り分けと同じ考え方が Windows 側でも通用した

（詳細な記録は [LEARNINGS.md](../LEARNINGS.md) 参照）

## Windows Server / AD の構築・試験（2026-09-01〜08、手元の Hyper-V）

ホスト PC（Windows 11）の Hyper-V 上に Windows Server 2022 評価版の VM を立て、AD と WSUS を構築・試験しました。AI の支援（手順の案内など）を受けながら私が操作し、結果を画面で確認しています。

| 記録 | 確認したこと |
| --- | --- |
| [9/1〜2：AD の構築・試験](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md) | `ad-dc01` に AD DS（ドメインの認証基盤）を構築し、試験仕様書のフェーズ 1 必須 31 項目（[ネットワーク検証 9 項目](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-network-host-validation-ad.md)を含む）がすべて PASS。手順書・設計書の欠陥 6 件を実機で見つけて修正 |
| [9/2：System State 復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md) | 非権威復元で、バックアップ後に作った目印の OU が消えることを確認（PASS）。復元処理 15 分 29 秒、復旧全体は約 40 分（うち約 18 分は `safeboot` 解除漏れによるやり直し）。SYSVOL の欠損を当日は見落とし、翌日に訂正。修正手順の実機検証は未完了 |
| [9/3：2 台目の DC と複製](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-second-dc-replication.md) | `ad-dc02` を追加し、複製の失敗 0/5、複製の遅延 17.8 秒を実測。GPO（グループポリシー）の適用失敗に対し、欠けた `gpt.ini` を手書きで再作成して適用を再開（応急処置）。`GptTmpl.inf` は欠損したまま。前日の復元との因果関係は未確認 |
| [9/3〜4：DC の停止と FSMO 役割の奪取](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ad-fsmo-seize.md) | [dc01 の計画停止中](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-dc-outage-drill.md)も dc02 単独で DNS・LDAP・Kerberos が続き、復帰後は強制再同期を含めて 18 分 31 秒で完全に収束。次に dc01 を失った想定で、dc02 で FSMO 役割 3 つを奪取し、`ntdsutil` で dc01 の情報を削除 |
| [9/7〜8：WSUS の構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-wsus-build-validation.md) | `wsus-01` をドメインに参加させて WSUS（更新プログラムの配信サーバー）を構築。必須 28 項目中 26 PASS・1 FAIL・1 期待結果未達で、総合判定は FAIL。翌日、[残った 2 件の原因調査](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)を行い、手順書を修正。分類・製品が 0 件になった操作は未特定で、通し再試験は未実施 |

障害・課題 15 件の対処は[作業結果・引き渡し報告](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-work-result-SM-AD-001.md)に、設計書・手順書・試験仕様書は [AD 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-ad)と [WSUS 構築案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package-wsus)にあります。組織の DNS、実クライアント PC を含むドメイン環境、中央 Prometheus からの収集（BLOCKED）、24 / 72 時間の連続稼働、サイト間複製、電源断からの復旧、WSUS の通し再試験は、まだ確認していません。

## Linux の VM で確認したこと（2026-09-04〜10-31）

手元の Hyper-V 上の VM での記録です。いずれも AI が手順・コードを案内し、私が操作して結果を画面で確認しました（9/7〜15 の記録は画像も収録しています。9/30・10/1 の記録の画像はリポジトリに収録していません）。独力での設計・再構築・説明能力を確かめた記録とは区別しています。

| 対象 | 確認したこと |
| --- | --- |
| 9/4 基礎設定 | [Ubuntu](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-build.md) / [再利用 AlmaLinux](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md) に `foundation.yml`（OS の共通設定と Docker）を適用し、再実行で変更 0 件 |
| 9/7〜8 初期構築 | [Ubuntu Server 24.04.4 LTS を手作業で構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)：固定 IP、SSH 鍵認証（パスワード方式は拒否）、sudo、UFW、時刻同期、自動更新。わざと起こした設定不備を、拒否表示とログの照合で復旧。教材 21 項目は PASS 14 / 環境に合わせて変更し PASS 4 / 一部確認 2 / 未実施 1 |
| 9/8 数値監視 | [5 サービスの部分構成で、手動の停止・再開に合わせて収集状態が 1→0→1](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md) |
| 9/8 Loki 復元 | [同一 VM 内の別ボリュームに復元し、過去の目印付きログ 2 件を再取得](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md) |
| 9/8 アプリ自動再起動（D-1） | [app / nginx 構成で自動再起動と HTTP 復帰 2 秒（1 回の計測）、その後 healthy を確認](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md) |
| 9/30 新しい VM と SSH 鍵認証 | [新しい Ubuntu VM（`ubuntu-practice01`）を用意](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-30-ubuntu-practice01-ssh-key-auth.md)し、公開鍵認証が失敗したときに、登録した鍵の各行の先頭に余分な文字（BOM）と行末の CR があることを確認。修正後の接続成功は私の報告だけで、成功画面は未採録 |
| 10/1 Docker 最小構成 | [同じ VM に Docker を入れ](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-10-01-ubuntu-practice01-nginx-manual-recovery.md)、app と nginx で healthz 200・未認証 401・認証あり 200、nginx を止めている間の接続失敗と手動再開後の 200 を確認 |

10/31 は AI の案内を受け、本人の2サービス構成で再接続後の Docker active・app healthy・nginx 稼働・HTTP 200・curl終了0を確認しました。[再起動後の確認結果](https://github.com/ns7jp/server/blob/44d672ac2c160dbcd5907c21d935cc74e449d8e6/docs/evidence/2026-10-31-ubuntu-practice01-reboot-check.md)。原ログの独立照合・監視全体の復帰・長期稼働は未確認です。

9/9〜15 の Ansible と Git の小さな練習は、[検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md)に並べています。

監視・復元・D-1 は、構成を切り替えた別々の演習です。監視全体の同時稼働とアラートの外部通知、AlmaLinux の新規構築と最小公開、監視全体を載せたホストの再起動後の確認、24 / 72 時間の稼働、別の新規 VM への復元、自力での再構築、第三者による手順確認は、**本人による実測は NOT RUN** で、次の課題として残しています。Codex による新ラボ実行は[AI 支援の内訳](./ai-usage.md#作業の流れ)に分けて記載します。結果の正本は [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) です。

## 過去の CI・WSL2・AI 支援環境の記録

2026-08-22 には、主作品の監視ラボ一式（`site.yml`、対象 commit [`7622a9d`](https://github.com/ns7jp/server/commit/7622a9da974f694ae75e0173135923701be9e5a5)）を、GitHub Actions の使い捨て Ubuntu 24.04（Docker 導入済み）へ一括で適用しました。2 回目の実行で変更 0 件、11 コンテナ（監視ラボの 10 サービスと CI 用の通知受け口）の起動、ローカル通知、network / UFW、アプリ自動復旧（D-1）の RTO 1 秒、3 つのボリュームのバックアップと復元を含む [23 項目がすべて PASS](https://github.com/ns7jp/server/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)しました。

2026-08-23 の [PR #77 CI](https://github.com/ns7jp/server/actions/runs/32611251044)では、候補 SHA `84e1492` の配備後、旧版 `59aa88e` へ戻し、稼働中の版番号と実行ファイルのハッシュ、app コンテナの再生成、不要ファイル除去、ローカル限定公開、Loki 取り込みまで再確認して PASS しました。これは PR ブランチ上の使い捨て Ubuntu runner での実演で、main への反映や永続ホストでの変更ではありません。Slack への実際の通知、AWS の `apply / destroy`、D-2、独立した管理端末・引き渡し先ホスト、組織 DNS、本人操作による監視全体を載せたホストの再起動後の確認、24 / 72 時間の稼働、Windows / AD・winget の公開再現ラボ（9 月に手元の Hyper-V で行った AD 構築とは別）は、まだ `NOT RUN` です。

## 技術ごとの経験範囲

> レベルの目安: ◎ 自作物で反復利用・検証している / ○ 構築・設定経験あり / △ 学習中・基礎 / — 自分の環境での実行記録なし（学習のみ）。長期運用や本番環境での実務経験を示す記号ではありません。

### プログラミング / スクリプト

| 分類 | 項目 | レベル |
| --- | --- | --- |
| 言語 | Python | ◎（認定基礎・実践 取得） |
| 言語 | PHP | ○（認定初級 取得） |
| スクリプト | PowerShell | △（AD / WSUS の構築・確認で使用、AI の案内あり） |
| Web | HTML / CSS / JavaScript | ○ |
| データベース | SQL（SQLite / MySQL） | ○ |
| データベース | PostgreSQL（3 層構成での接続、`pg_dump` / `pg_restore`） | —（学習のみ。[3 層ラボ](https://github.com/ns7jp/server/tree/main/labs/three-tier)のコードは AI が生成したもので、復元演習の [8/24 の B-3](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-3.md) は AI 支援環境での実行のため、私の実績には数えません。自分の VM での実行は未実施） |

### インフラ / 運用

| 分類 | 項目 | レベル |
| --- | --- | --- |
| OS | Linux サーバー構築・基本運用（Ubuntu） | ○（[9/7〜8 に Ubuntu Server を手作業で初期構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-initial-build.md)。ほかに個人ラボと研修での構築・確認） |
| OS | Windows Server 2022（AD DS / DNS / WSUS / Windows Server バックアップ） | ○（9/1〜8 に手元の Hyper-V VM で [AD の構築・試験](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md)（必須 31 項目 PASS）、System State 復元、2 台目 DC と FSMO 奪取、[WSUS の構築](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-wsus-build-validation.md)（判定 FAIL、原因調査・手順修正後の通し再試験は未実施）。AI の手順案内あり、実クライアントを含むドメイン環境・長期運用は未経験） |
| OS | RHEL 系（AlmaLinux / Rocky 9） | ○（コンテナでの Molecule に加え、[9/4 に手元の再利用 AlmaLinux VM へ基礎設定を適用し、変更 0 件・SELinux enforcing 等を確認](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ansible-foundation-el9-build.md)。専用の新規 VM・最小公開・全監視構成は未実施） |
| ストレージ | LVM（VG / LV / ファイルシステム / online 拡張） | ○（9/8 に手元の VM で、VG の未割り当て領域を使い `lvextend -l +100%FREE -r` で `/` をオンライン拡張（[記録](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-compose-practice.md)）。PV の追加・fstab の編集・縮小は未実施。VG / LV の作成と PV 追加を含む [8/24 の B-1](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-1.md) は AI 支援環境での実行で、私の実績には数えません） |
| コンテナ | Docker / Docker Compose | ○（WSL2・使い捨て runner と手元の Hyper-V VM の部分構成で起動・停止・再作成等を確認。長期稼働は未実測） |
| Web / Proxy | Nginx（リバースプロキシ。TLS は設定例・自己署名証明書での確認まで） | ○ |
| 監視 | Prometheus / Grafana / Alertmanager | ○（[9/8 に手元の VM で数値表示と停止・復帰表示を確認](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md)。Alertmanager は起動確認まで。アラート発火・外部通知は同演習で未実施） |
| ログ | Loki / Grafana Alloy | ○（手元の VM でログ検索と[同一 VM 内の別ボリュームへの Loki 復元](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md)を確認。別 VM への復元は未実施） |
| 構成管理 | Ansible | ○（手元の VM への基礎設定適用と、ホーム内のファイル生成・変更予測・入力検証を確認。全監視構成の `site.yml` 一括適用・再実行の記録は使い捨て runner。上記の環境別記録を参照） |
| 版管理 | Git | △（手元の VM 内でブランチ・履歴・競合解消・中止を実行。AI の案内あり。VM からの push と独力での説明は未実施） |
| IaC | Terraform（AWS） | △（`validate` / `fmt` まで。`apply` は未実施） |
| ネットワーク | 静的ルーティング / `ip_forward` / 802.1Q VLAN | △（[L2 / L3 ラボ](https://github.com/ns7jp/server/tree/main/labs/routing)として実装。[8/24 の B-4](https://github.com/ns7jp/server/blob/main/docs/drills/logs/2026-08-24-B-4.md) は AI 支援環境での実行で、私の実績には数えません。VLAN の 3 項目は、その環境の kernel が VLAN に対応しておらず未検証です。物理スイッチ・ケーブル・ポート VLAN は未着手） |
| CI / セキュリティ | GitHub Actions / Trivy / pip-audit | ○（[PR #75 の 5 workflow が success](https://github.com/ns7jp/server/pull/75)。[PR #77 で Git SHA 指定の変更・ロールバック CI が success](https://github.com/ns7jp/server/actions/runs/32611251044)。Docker は runner に事前導入済み） |

実装範囲と検証境界は [アーキテクチャ図](./architecture-diagram.md) を参照してください。
