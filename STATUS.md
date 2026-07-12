# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-07-12（学習ログ Issue の日程同期と週次更新の開始、応募開始基準の制定、資格ロードマップの追補）

---

## 0. 更新の運用ルール（2026-07-03 制定）

「宣言と実態の乖離」を作らないため、次をルール化します。

1. **STATUS.md は月 1 回以上更新**する。進捗ゼロの月も「進まなかった事実と理由」を記録する。
2. **Issue（#5〜#8）は週 1 回更新**する。進まなかった週は「今週は進まず。理由: 〇〇」の 1 行を残す。
3. **受験予定日・期限が過ぎた計画は放置しない**。結果または延期理由を記録し、日付を更新する（[資格ロードマップの見直し記録](./docs/certifications/roadmap.md) と連動）。
4. 現在形で「〜しています」と書くのは、**実際に運用が回っているものだけ**。始める前のものは「〜します（予定）」と書く。
5. **応募開始を証跡・資格の完成と連動させない**（2026-07-12 制定）。ポートフォリオは既に未経験応募の水準を満たしているため、resume / overview の `〈 〉` 記入を済ませ次第、**遅くとも 2026-07-19 までに最初の応募を提出**する。証跡採録（優先 1〜3）は応募活動と並行して進める。開始が遅れた場合は、理由を本ファイルに記録して新しい期限を設定する。

---

## 1. 本リポジトリ（ns7jp/ns7jp）

### 2026-07-12 の更新内容（追補：資格ロードマップ）

2026〜2027 年に主要試験の制度変更が集中していることが分かったため、[資格ロードマップ](./docs/certifications/roadmap.md)の見直し記録に反映しました（詳細な理由は同ページの「2026-07-12 見直し」を参照）。

| 項目 | 状態 |
| --- | --- |
| FE の受験完了目標を 2026 年 12 月までに前倒し | ✅ 2027 年 1 月頃の CBT 休止・2027 年度の新試験制度移行を回避（README / resume の日程表記も同期） |
| CCNA v2.0 切替の注記を追加 | ✅ 現行 v1.1 の最終受験日 2027-02-02 / v2.0 開始 2027-02-03。着手時に v1.1 前倒しか v2.0 教材待ちかを判断 |
| AWS SOA の名称更新 | ✅ AWS CloudOps Engineer - Associate（SOA-C03）への改称に追従 |
| AZ-802 を「就業後に検討」へ追加 | ✅ AZ-800 / 801 の 2026-09-30 廃止に伴う後継。Windows Server / AD 案件配属時の選択肢 |
| MD-102 の位置付け明確化 | ✅ クライアント端末管理の資格でありサーバースキルの証明にならない旨を明記 |

### 2026-07-12 の更新内容

「宣言と実態の乖離」の解消を目的に、GitHub Issue を含めた選考導線を同期しました（証跡採録フェーズの方針どおり、新規の設計追加はありません）。

| 項目 | 状態 |
| --- | --- |
| 学習ログ Issue の日程同期 | ✅ [#5](https://github.com/ns7jp/ns7jp/issues/5) を 2026 Q3、[#6](https://github.com/ns7jp/ns7jp/issues/6) を 2026 Q4 へ改題・本文更新（[ロードマップ 2026-07-03 見直し](./docs/certifications/roadmap.md)と同期。期限超過の放置を解消） |
| Issue #7（ITIL）の位置付け修正 | ✅ 「2026 Q3 受験予定」を削除し「受験は就業後に検討・用語学習の記録」へ改題（ロードマップの見直し判断と同期） |
| Issue #8 の採録チェックリスト同期 | ✅ 本文を[証跡採録チェックリスト](./docs/evidence-capture-checklist.md) 2026-07-03 見直し版の優先 1〜8 に同期 |
| Issue #5〜#8 の週次更新の開始 | ✅ 2026-07-12 に初回の状況コメントを記録（学習・採録の実進捗は、次回以降の週次コメントで本人が記録する） |
| 応募開始基準の制定 | ✅ §0 ルール 5 に追加。**証跡・資格の完成を応募開始の条件にしない**（最初の応募の期限: 2026-07-19） |
| 資格日程表記の整合 | ✅ [resume.md](./docs/resume.md) の LPIC-1 102 を「2026 Q4」へ統一。[roadmap.md](./docs/certifications/roadmap.md) 見直し記録の ITIL 移動先表記を実セクション名「就業後に検討」に修正 |

### 2026-07-03 の更新内容

| 項目 | 状態 |
| --- | --- |
| 職務経歴書（docs/resume.md）の復活 | ✅ 復活・更新（`〈 〉` の在籍年月・現況・勤務条件は本人記入待ち） |
| 連絡先の明記（メールアドレス） | ✅ README / overview / resume に追加（GitHub 経由のみの循環参照を解消） |
| overview への動機・年表・勤務条件の追加 | ✅ 追加（`〈 〉` 部分は本人記入待ち） |
| LEARNINGS.md の実体化 | ✅ 制作指示文を削除し、Alloy 移行エントリを完結。未実施の想定エントリは「予定リスト」へ分離 |
| 設計テーマ 13 / 14 / 16 / 17 の縮退 | ✅ [中長期ロードマップ](./docs/roadmap/README.md) へ移動（選考フェーズは実装済み 01-05 と証跡を主軸化） |
| 証跡採録チェックリストの見直し | ✅ ネットワーク切り分け（優先 4）・Windows 最小ラボ（優先 7）を正式項目へ昇格。デモ動画は「集大成」へ位置付け変更 |
| 資格ロードマップの見直し | ✅ FE を日程化、K8s 系・LPIC-2 を「就業後に検討」へ、ITIL は応募先要件次第へ、MD-102 名称修正（[見直し記録](./docs/certifications/roadmap.md)） |
| AI 活用の開示 | ✅ README に「制作プロセスと AI の活用について」を追加 |
| 設計書の技術鮮度更新 | ✅ Terraform S3 ネイティブロック追記、tfsec → Trivy 表記、認証設計を Keycloak ベースへ見直し（ADR-0005 / 0008 に見直しとして記録） |
| 設計書へ「個人ラボでの読み替え」追加 | ✅ 07 / 09 / 13 / 16 に組織前提記述の読み替え節を追加 |
| D-2 復旧演習のローカル版手順 | ✅ 05 に現環境（ローカル Docker）で実行可能な手順を追加（AWS 版は v2.0 移行後へ隔離） |
| docs CI のリンクチェック強化 | ✅ ローカルリンク切れで CI が fail する構成へ変更（外部リンクは参考チェック） |
| README のモバイル対応 | ✅ 「まず見る」をリスト化、Mermaid 図にテキスト要約を併記 |
| 作品一覧の文脈付け | ✅ works / post / pulse に制作背景と現志望との関係を追記 |
| IT サポート資料の鮮度更新 | ✅ SysMain 表記・SSD 前提の切り分けへ更新 |
| Zabbix / JP1 への転用可能性 | ✅ [橋渡し](./docs/career-bridge.md) に概念対応表を追加 |
| ショーケースの架空例ラベル強化 | ✅ タイムライン / ポストモーテムに「架空の記入例」注記を追加 |

### これまでに整備済み（2026-05-30 まで）

| 項目 | 状態 |
| --- | --- |
| プロフィール README 整備 | ✅ 完了 |
| IT サポート設計サンプル（FAQ / TS / Account / Service Desk Metrics） | ✅ 完了（設計サンプルとして明示） |
| 業務改善レポート | ✅ 完了（実数と再構成想定値を区別） |
| アーキテクチャ図（実装済み構成 / 検証境界） | ✅ 完了 |
| server-monitor 改善設計 01-05 | ✅ server-monitor 側へ実装状態を同期（証跡待ちを明示） |
| server-monitor 改善設計 06 以降 | ✅ 設計サンプルとして整備（うち 4 本は 2026-07 にロードマップへ縮退） |
| 証跡採録テンプレート | ✅ AWS / Molecule / D-1 / D-2 用を server-monitor 側へ追加 |
| ADR（アーキテクチャ決定記録）8 本 | ✅ 完了（主要技術選定の根拠。0005 / 0008 は 2026-07 に見直し追記） |
| 現場経験 ↔ インフラ運用 橋渡しページ | ✅ 完了 |
| ビジュアルショーケース | ✅ 実機キャプチャ枠とテキストモックアップを分離 |
| 採用ご担当者向け 1 枚サマリ | ✅ 完了（非技術者向け。英語要約付き） |
| 学習ログ Issue（#5-#7）/ 実証トラッキング Issue（#8） | ✅ 作成済み（**運用はこれから**。週 1 回更新を上記ルールで開始する） |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了（2026-07 にリンクチェックを強化） |
| デモ動画台本 | ✅ 整備済み（収録はスクショ・演習採録後） |
| 志望トラックと証跡の対応 | ✅ 完了（インフラ運用を第一志望として明示） |
| 変更管理の実物化 | ✅ server-monitor 側に PR テンプレート / 変更管理ミニ運用を追加 |

### 未対応 / 次のアクション（証跡採録フェーズ）

**新規設計の追加は引き続き停止**し、実物の証跡採録を最優先します（手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に集約）。

本人の記入・作業が必要なもの（リポジトリ整備では代替できません）：

- [ ] **resume.md / overview の `〈 〉` 箇所を記入**（在籍企業名・在籍年月・現況・夜勤/交代制の可否・雇用形態の希望。応募開始の唯一のブロッカー）
- [ ] **最初の応募を提出する**（期限: 2026-07-19。§0 ルール 5。証跡・資格・デモ動画の完成を待たない）
- [ ] **証跡の採録を開始**（[#8](https://github.com/ns7jp/ns7jp/issues/8) で管理。優先 1〜3 の Grafana / Slack / Loki スクショは 1 晩・0 円で可能）
- [ ] **Issue #5〜#8 の週次更新を継続**（初回の状況コメントは 2026-07-12 に記録済み。次回から LPIC-1 の学習状況・受験予約の有無を自分の言葉で記録する）
- [ ] **LEARNINGS.md の Alloy エントリの「学び」を自分の言葉で肉付け**（現在の記述は事実ベースの下書き。面接で話す言葉に直す）
- [ ] **ポートフォリオサイト（ns7jp.github.io）を本 README の構成へ同期**（同期までは README を一次情報とする注記を掲載済み）
- [ ] デモ動画を収録（スクショ・演習採録後の集大成として）
- [ ] 応募先に応じて **Windows / AD 最小証跡を採録**（チェックリスト優先 7）
- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）
- [ ] IT サポート資料を **実体験ベース** に書き換え（IT サポート業務に従事してから）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
一方、AWS の実適用・費用、Molecule 完全実行、復旧演習の実測ログはまだ
証跡として収録されていない。コード実装と実行実績を区別して表示する。

### 実装済み / 証跡待ち

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み（server-monitor 本体） | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み（Promtail EOL に伴い移行） | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。full Molecule 証跡は未収録 | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。ラボ内 SLI として扱う | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。D-1 / D-2 実測は未収録（ローカル版手順を 2026-07 追加） | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 設計済み / 順次実装

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.1 | 分散トレーシング（Tempo + OpenTelemetry） | ⬜ 設計サンプル | [06](./docs/server-monitor-improvements/06-observability-traces.md) |
| v1.3 | インシデント対応プロセス・ポストモーテム | ⬜ 設計のみ・実装未着手 | [07](./docs/server-monitor-improvements/07-incident-response.md) |
| v1.3 | セキュリティ運用プロセス | ⬜ 設計のみ・実装未着手 | [09](./docs/server-monitor-improvements/09-security-operations.md) |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（就業後の資格計画と連動） | [08](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |
| v1.1 | メタモニタリング（監視の監視） | ⬜ 設計のみ・実装未着手 | [12](./docs/server-monitor-improvements/12-meta-monitoring.md) |
| v1.2 | 変更管理プロセス | ✅ PR / Issue テンプレートとミニ運用を server-monitor 側へ追加 | [11](./docs/server-monitor-improvements/11-change-management.md) |
| v1.3 | キャパシティプランニング・負荷試験 | ⬜ 設計のみ・実装未着手 | [10](./docs/server-monitor-improvements/10-capacity-planning.md) |
| v2.0 | ネットワーク・DNS 運用 | ⬜ 設計のみ・実装未着手 | [15](./docs/server-monitor-improvements/15-network-operations.md) |

### 中長期ロードマップへ縮退（2026-07-03）

実装着手が 1 年以上先のテーマは、選考フェーズの一次導線から外し [docs/roadmap/](./docs/roadmap/README.md) で保管します（設計を捨てたのではなく、露出の優先順位を変更）。

| # | テーマ | 設計書 |
| --- | --- | --- |
| 13 | FinOps（コスト最適化運用） | [13](./docs/roadmap/13-finops.md) |
| 14 | データベース運用設計 | [14](./docs/roadmap/14-database-operations.md) |
| 16 | アイデンティティ運用 | [16](./docs/roadmap/16-identity-operations.md) |
| 17 | カオスエンジニアリング / Game Day | [17](./docs/roadmap/17-chaos-engineering.md) |

### ADR（アーキテクチャ決定記録）

| # | テーマ | 状態 |
| --- | --- | --- |
| 0001 | 監視スタックに Prometheus + Grafana | ✅ 設計完了 |
| 0002 | v1 デプロイ方式に Docker Compose | ✅ 設計完了 |
| 0003 | ログ集約に Loki | ✅ 設計完了 |
| 0004 | 構成管理に Ansible | ✅ 設計完了 |
| 0005 | IaC に Terraform | ✅ 設計完了（2026-07 見直し追記：S3 ネイティブロック / Trivy） |
| 0006 | 監視は自前運用 | ✅ 設計完了 |
| 0007 | 通知チャネルに Slack | ✅ 設計完了 |
| 0008 | 認証を Basic → OIDC SSO 段階移行 | ✅ 設計完了（2026-07 見直し追記：移行先 IdP を Keycloak / Authentik 第一候補へ） |

### 次に採録する実測証跡

順序・手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に一元化（2026-07 見直し）。

1. Grafana / Slack 通知 / Loki 検索の実画面（優先 1〜3。1 晩・0 円）
2. ネットワーク切り分けの一次メモ（優先 4）
3. D-1 プロセス停止演習の RTO / 通知結果（優先 5）
4. full `molecule test` の実行ログ（優先 6）
5. Windows / AD 最小ラボの PowerShell 実行ログ（優先 7）
6. 承認された AWS 検証で `plan` / `apply` / `destroy` と Cost Explorer 実費（優先 8。優先 1〜3 完了直後の週に実施）

---

## 3. その他の関連リポジトリ・サイト

「関連リポジトリ全体を一元管理する」宣言に合わせ、学習作品も状態を明記します。

| リポジトリ / サイト | 位置付け | 状態 |
| --- | --- | --- |
| [server-monitor](https://github.com/ns7jp/server-monitor) | 主作品（インフラ運用） | §2 のとおり |
| [post](https://github.com/ns7jp/post) | 学習作品（PHP / MySQL、CSRF / bcrypt / PDO） | 完成・公開中。DB 運用設計（[14](./docs/roadmap/14-database-operations.md)）の題材 |
| [pulse](https://github.com/ns7jp/pulse) | 学習作品（PHP / SQLite） | 完成・公開中 |
| [works](https://github.com/ns7jp/works) | 学習作品集（Python / HTML / CSS） | 公開中（学習過程の記録） |
| [ns7jp.github.io](https://ns7jp.github.io/) | ポートフォリオサイト | ⚠ README のインフラ第一志望の構成へ**未同期**。同期まで README を一次情報とする |

---

## 4. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント**（FAQ / TS / Account / Service Desk Metrics）は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません（変更は[見直し記録](./docs/certifications/roadmap.md)に残します）
- **server-monitor の改善コード 01-05 は別リポジトリに実装済み**。ただし AWS 稼働、費用、
  復元演習など実行を要する内容は、その証跡が追加されるまで実績として扱いません
- **06 以降は設計サンプル / ロードマップ** であり、実装コードや実測証跡と混同しません
- **ビジュアルショーケース** は実機キャプチャ枠とテキストモックアップを分離し、採録後に順次差し替えます
- **ドキュメント整備には AI を活用**しています（役割分担は [README の開示セクション](./README.md#制作プロセスと-ai-の活用について) を参照）

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
