# 職務経歴書・スキルシート — 島田則幸（Noriyuki Shimada）

> **本ドキュメントの位置付け**
>
> 応募時に提出する職務経歴書・スキルシートのベースです。
>
> - **確定情報**（資格・学歴・職業訓練・ポートフォリオ）はそのまま記載しています
> - 「設計サンプル」と「実績」を混同しない方針は、ポートフォリオ全体（[STATUS.md](../STATUS.md)）と同じです

最終更新: 2026-08-23（第一志望、PR #75 の Full-stack E2E 23/23 PASS、PR #77 の Git ロールバック CI、使い捨て runner の検証境界を反映）

---

## 1. 職務要約

製造・物流の現場で 15 年以上、在庫管理・ピッキング工程を担当してきました。作業時間ログの計測からボトルネックを特定し、動線改善・標準化によって **1 日あたり約 1 時間の作業短縮** を実現しています。

この「計測 → 仮説 → 実施 → 検証 → 標準化」の改善サイクルを IT の世界で再現するため、公共職業訓練と自主学習を経て、Linux サーバー監視基盤を構築・検証してきました。第一志望は **Linux サーバー設計・構築** です。入口業務としてインフラ監視・運用にも対応し、IT サポート・社内 SE 補助は応募先に応じた補助トラックと位置付けています。**現場目線の業務改善力** と **手を動かした技術検証** の両面から貢献することを目指しています。

**現況**: 人材派遣会社（アデコ株式会社）を通じ、IT 企業にてトライアル就業中です（2026/07〜、トライアル期間 2 か月。就業先の社名は面談時に開示します）。
研修では仮想マシン上の Windows Server / Linux サーバーと AWS / Azure の構築演習に取り組みました。これは研修での経験であり、顧客環境の設計・構築を担当した実績とは区別しています。
職業訓練修了（2026-01）後、サーバー構築へのキャリア移行を目標に学習とポートフォリオ制作を継続しています。**就業しながらインフラ領域の実務経験を積み、サーバー構築・運用のポジションへ移ることを希望しています。**

---

## 2. 職務経歴

### アデコ株式会社（人材派遣） — 現在

| 項目 | 内容 |
| --- | --- |
| 在籍期間 | 2026/07〜 現在（トライアル就業中） |
| 雇用形態 | 派遣社員（トライアル期間2か月） |
| 就業先 | IT 企業（社名は面談時に開示します） |
| 業務内容 | WindowsサーバーとLinuxサーバーの構築研修、AWSとAzureの構築研修 |
| 使用環境 | Windows 11、Active Directory、AWS、Azure |

#### 取り組み事例: AD ドメイン参加時の名前解決障害（2026-08）

Hyper-V で Windows Server 評価版の AD DS を構築した際、クライアント VM からドメインに参加できない事象に遭遇しました。

- **環境**: 社内 PC、Hyper-V、Windows Server 2022、クライアント側は AlmaLinux 9.7
- **症状**: AD DS のセットアップ自体は完了したが、クライアント VM からドメインへ参加しようとすると「ドメインが見つかりません」というエラーが出た
- **原因**: クライアント VM のネットワークアダプタが Hyper-V の NAT 設定のままで、DNS サーバーとして外部（ルーター）を向いていた。AD のドメインコントローラを DNS として参照する設定になっていなかった
- **対処**: Hyper-V のネットワークを NAT からホストオンリー / 内部ネットワークに変更し、クライアント側の DNS 設定をドメインコントローラの IP へ手動で向けた。あわせて、ドメイン参加手順を再現できるよう、ネットワーク設定 → DNS 設定 → ドメイン参加の順序をチェックリスト化した
- **学び**: AD ドメイン参加は「ドメインコントローラが動いていること」だけでなく「クライアントがその DC を DNS として見ていること」が前提条件だと分かった。Linux での `dig` による DNS 切り分けと同じ考え方が Windows 側でも通用した

（詳細な記録は [LEARNINGS.md](../LEARNINGS.md) 参照）

### 製造・物流（15 年以上）

| 在籍期間 | 勤務先 | 雇用形態 | 業務内容 |
| --- | --- | --- | --- |
| 15 年以上〜2025/09（在籍社数・各社の年月は応募時提出の職務経歴書で開示） | 製造・物流の複数社（社数が多いため本書では個社別に記載しない） | 派遣社員・契約社員など、社ごとに異なる | 在庫管理、ピッキング、入出庫、現場の業務改善 |

> **記入時の注意**: このリポジトリは公開資料のため、個社ごとの在籍年月・社名までは載せません。
> 日本の中途採用の一次スクリーニングは在籍年月・社数・空白期間を時系列で追うところから
> 始まるため、その詳細（各社の在籍年月・社数・雇用形態）は応募時に別途提出する
> 職務経歴書（PDF）に記載します。年月は離職票または源泉徴収票で確定させてください。

| 項目 | 内容 |
| --- | --- |
| 主な実績 | ピッキング工程で 1 日約 1 時間の作業短縮（[業務改善レポート](./business-improvement/picking-improvement.md)） |
| 役割 | 現場の課題を数値化して上長へ提案、標準化（マップ・チェックリスト）で改善を定着 |

### 職歴の空白期間

| 期間 | 状況 |
| --- | --- |
| 印刷会社を退職 - 2025/09 | 求職活動、職業訓練の入校待機 |
| 2025/10 - 2026/01 | 公共職業訓練「情報処理（Python エンジニア）コース」受講 |
| 2026/02 - 2026/06 | 求職活動および資格学習（IT パスポート取得: 2026-06） |
| 2026/07 - 現在 | 人材派遣によるトライアル就業（上記） |

> 職務経歴書と履歴書は、個人情報を含むため公開リポジトリには置かず、応募時に別途提出します。

---

## 3. 希望条件・働き方

| 項目 | 内容 |
| --- | --- |
| 志望領域 | 第一志望: Linux サーバー設計・構築。入口としてインフラ監視・運用にも対応。IT サポート、社内 SE 補助は補助トラック |
| 夜勤・交代制 | 24/365 監視業務のシフト勤務に対応可能 |
| 勤務開始時期 | トライアル期間満了の 2026/09 以降 / 相談のうえ 1 か月以内 |
| 勤務地 | 東京都内通勤可能圏 |
| 希望年収 | 応相談 |
| 現在の就業との関係 | トライアル期間満了（2026/09）に伴い、正社員としてのインフラ職を志望。経緯は[志望の経緯](./career-bridge.md#志望の経緯)を参照 |
| その他 | 年下の先輩からの指導も歓迎します。未経験領域は「手順を覚えて、手順書を改善して返す」ことから貢献します |

---

## 4. 活かせる経験・知識・スキル

- **数値で語る業務改善** — 計測 → ボトルネック特定 → 仮説 → 検証 → 標準化のサイクルを回せる
- **属人化の排除** — 手順書・チェックリスト・マップ整備、IaC によるコード化
- **現場と管理側の翻訳** — 現場の困りごとを数値に変えて上長へ橋渡しした経験
- **継続学習** — Linux / Docker / 監視基盤を個人ラボで構築し、実行結果と失敗修正を継続して記録

詳細: [現場経験 ↔ インフラ運用の橋渡し](./career-bridge.md)

主作品では、runtime 最終 commit [`7622a9d`](https://github.com/ns7jp/server-monitor/commit/7622a9da974f694ae75e0173135923701be9e5a5)を対象に、Docker 導入済みの使い捨て Ubuntu 24.04 runner へ `site.yml` を一括適用しました。2 回目 `changed=0`、core 10 services + CI webhook sink（計 11 containers）、Docker API proxy の GET 成功・POST 拒否・Loki log 到達、local webhook、network / UFW、D-1 RTO 1 秒、3 volumes の backup / restore を含む [Full-stack E2E 23/23 ID PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)を採録しました。Slack 実配信、AWS `apply / destroy`、D-2、独立した管理端末・引き渡し対象ホスト、組織 DNS、ホスト再起動後の永続性、長期稼働は未実測です。

2026-08-23 の [PR #77 CI](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)では、候補 SHA `84e1492` の配備後、旧版 `59aa88e` へ戻し、稼働中の版番号と実行ファイルのハッシュ、app コンテナの再生成、不要ファイル除去、ローカル限定公開、Loki 取り込みまで再確認して PASS しました。これは PR ブランチ上の使い捨て Ubuntu runner での実演であり、main 反映や永続ホストでの本番変更実績ではありません。Slack 実配信、AWS `apply / destroy`、D-2、再起動・24 / 72 時間監視、Windows / AD・winget 公開再現ラボも `NOT RUN` のままです。

---

## 4-b. ポートフォリオにおける AI 支援の範囲

文書の構成・整形・調査に加えて、**実装コード（Ansible role、Terraform module、
CI workflow、テスト、ラボの雛形）の生成にも AI を使っています**。
**範囲は主作品に限らず、本書を含む 3 リポジトリすべてです。** マージを除く実作業
コミットのうち、Claude を著者または共同著者に含むものは次のとおりです
（2026-08-25 時点、`git log --no-merges` で再現できます）。

| リポジトリ | Claude 関与 | 実作業コミット総数 |
| --- | --- | --- |
| ns7jp/ns7jp（プロフィール・本書） | 42 | 71 |
| ns7jp/server-monitor（主作品） | 49 | 95 |
| ns7jp/ns7jp.github.io（サイト） | 19 | 77 |

AI が生成した手順やコードを、本人が実行・理解していない状態で実績にはしません。
技術選定の最終判断と面接での説明は本人が担当します。
自分で説明できない深さのコードは、面接前に読み直すか、削って単純化する方針です。

**例外として、[LEARNINGS.md](../LEARNINGS.md)（実機で外した仮説の一次記録）は
2026-08-25 以降、本人のみが編集します。** それ以前は AI が「学び」欄を代筆した
コミットが含まれており、これは方針に反していたため、履歴を消さずに残したうえで
本人の記述へ置き換えます。

---

## 5. テクニカルスキル

> レベルの目安: ◎ 自作物で反復利用・検証している / ○ 構築・設定経験あり / △ 学習中・基礎。長期運用や本番環境での実務経験を示す記号ではありません。

### プログラミング / スクリプト

| 分類 | 項目 | レベル |
| --- | --- | --- |
| 言語 | Python | ◎（認定基礎・実践 取得） |
| 言語 | PHP | ○（認定初級 取得） |
| Web | HTML / CSS / JavaScript | ○ |
| データベース | SQL（SQLite / MySQL） | ○ |
 | データベース | PostgreSQL（3 層構成での接続、`pg_dump` / `pg_restore`） | △（[3 層ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/three-tier)として実装。`pg_dump` / `pg_restore` の復元演習を[実行し 7 PASS を採録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-3.md)（RTO 0.149 秒。Docker コンテナ上）。実 VM 上の 3 層構築は未実施） |

### インフラ / 運用

| 分類 | 項目 | レベル |
| --- | --- | --- |
| OS | Linux サーバー構築・基本運用（Ubuntu） | ○（個人ラボと研修での構築・確認。実務としての本番運用は未経験） |
 | OS | RHEL 系（AlmaLinux / Rocky 9） | ○（Ansible role を `dnf` / firewalld / SELinux / dnf-automatic 対応にし、[Molecule `el9` シナリオを実行して成功](https://github.com/ns7jp/server-monitor/actions/runs/32811100007)。**実機ホストへの適用は未実施**） |
 | ストレージ | LVM（VG / LV / ファイルシステム / fstab / online 拡張） | ○（[storage role](https://github.com/ns7jp/server-monitor/tree/main/ansible/roles/storage) を [実機（loop device）で実行](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-1.md)。VG/LV/fstab 作成、冪等性、PV 追加による online 拡張（220M→457M、mount 維持）を実測、5 PASS。安全装置の negative test は 7 ケース実装済みで、実行証跡は未採録） |
| コンテナ | Docker / Docker Compose | ○（WSL2 と使い捨て runner で構築・検証。独立した長期稼働ホストは未実測） |
| Web / Proxy | Nginx（リバースプロキシ。TLS は設定例・自己署名証明書での確認まで） | ○ |
| 監視 | Prometheus / Grafana / Alertmanager | ○（Linux(WSL2) 上で起動・実データ表示を確認済み。[証跡](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md)） |
| ログ | Loki / Grafana Alloy | ○（LogQL によるログ検索を実機で確認済み） |
| 構成管理 | Ansible | ○（4 ロールの Molecule に加え、使い捨て Ubuntu 24.04 への `site.yml` 一括適用と 2 回目 `changed=0` を確認。[証跡](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)） |
| IaC | Terraform（AWS） | △（`validate` / `fmt` まで。`apply` は未実施） |
 | ネットワーク | 静的ルーティング / `ip_forward` / 802.1Q VLAN | △（[L2 / L3 ラボ](https://github.com/ns7jp/server-monitor/tree/main/labs/routing)として実装。物理スイッチ・ケーブル・ポート VLAN は未着手） |
| CI / セキュリティ | GitHub Actions / Trivy / pip-audit | ○（[PR #75 の 5 workflow が success](https://github.com/ns7jp/server-monitor/pull/75)。[PR #77 で Git SHA 指定の変更・ロールバック CI が success](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)。Docker は runner に事前導入済み） |

実装範囲と検証境界は [アーキテクチャ図](./architecture-diagram.md) を参照してください。

---

## 6. 資格

### 取得済み

| 資格 | 取得時期 |
| --- | --- |
| Python 3 エンジニア認定基礎試験 | 2025-12（職業訓練期間中） |
| Python 3 エンジニア認定実践試験 | 2026-01（職業訓練期間中） |
| PHP 8 技術者認定初級試験 | 2026-01（職業訓練期間中） |
| ITパスポート | 2026-06 |
| 食品衛生管理者 | 2007-03 |

### 取得計画（学習ログを GitHub Issue で公開管理）

| 時期 | 資格 | 学習ログ |
| --- | --- | --- |
| 2026 Q4（12 月までに受験、現在の最優先） | 基本情報技術者試験（FE） | 着手時に作成 |
| 未定（FE 優先中、並行して学習は継続） | LPIC-1 101 | [#5](https://github.com/ns7jp/ns7jp/issues/5) |
| 未定（101 合格後） | LPIC-1 102 | [#6](https://github.com/ns7jp/ns7jp/issues/6) |
| 2027 | CCNA → AWS SAA | 着手時に作成 |

詳細（就業後に検討する資格を含む）: [資格取得ロードマップ](./certifications/roadmap.md)

---

## 7. ポートフォリオ

| 作品 | 技術・取り組み | リンク |
| --- | --- | --- |
| サーバー監視・運用ラボ（主作品） | Linux / Docker / Nginx / Prometheus / Grafana / Loki / Alloy / Ansible / Terraform | [案件概要](https://ns7jp.github.io/project-brief.html) ／ [最新の実測証跡](https://ns7jp.github.io/evidence-demo.html) ／ [server-monitor](https://github.com/ns7jp/server-monitor) |
| 掲示板アプリ | PHP / MySQL / CSRF 対策 / bcrypt / PDO | [post](https://github.com/ns7jp/post) |
| SNS アプリ「Pulse」 | PHP / SQLite | [pulse](https://github.com/ns7jp/pulse) |
| 学習作品集 | Python / HTML / CSS | [works](https://github.com/ns7jp/works) |

---

## 8. 学歴・職業訓練

| 時期 | 内容 |
| --- | --- |
| 2007/03 | 中部大学 応用生物学部 応用生物化学科 卒業 |
| 2025/10-2026/01 | 公共職業訓練「情報処理（Python エンジニア）コース」（ISP アカデミー川越校）修了 |

---

## 9. 自己 PR

物流現場での最大の学びは、「**単発の改善はリバウンドする。継続計測の仕組みを最初に設計すべき**」ということでした。この反省を、サーバー監視ラボでは品質目標の数値化や検証証跡台帳という形で最初から組み込んでいます。

派手な技術より、**「止まる前に気づく」「誰でも復旧できる」「次は仕組みで防ぐ」** という、地味で継続的な運用品質づくりに価値を感じています。未経験の領域でも、現場で 15 年培った「数値で語り、標準化で定着させる」進め方は地続きだと考えています。

---

## 10. 関連ドキュメント

- [プロフィール / ポートフォリオ README](../README.md)
- [採用ご担当者さまへ（1 枚サマリ）](./overview-for-recruiters.md)
- [志望トラックと証跡](./target-roles.md)
- [証跡採録チェックリスト](./evidence-capture-checklist.md)
- [現場経験 ↔ インフラ運用の橋渡し](./career-bridge.md)
- [ポートフォリオ進捗 STATUS](../STATUS.md)
