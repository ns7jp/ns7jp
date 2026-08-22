# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-08-22（採用担当者向けの入口を、主作品の価値を示す一文と「2 分 15 秒の実測証跡リプレイ・構成図・実測証跡」の 3 リンクへ整理。リプレイと実操作の連続録画を区別し、広い技術一覧は職務経歴書、設計範囲は構築案件パック、計画は本 STATUS へ分離）

---

## 0. 更新の運用ルール（2026-07-03 制定）

「宣言と実態の乖離」を作らないため、次をルール化します。

1. **STATUS.md は月 1 回以上更新**する。進捗ゼロの月も「進まなかった事実と理由」を記録する。
2. **Issue（#5〜#8）は月 1 回更新**する（2026-08-17 に週 1 回から緩和。理由は下記「守れなかったルールの扱い」を参照）。進まなかった月は「進まず。理由: 〇〇」の 1 行を残す。
3. **受験予定日・期限が過ぎた計画は放置しない**。結果または延期理由を記録し、日付を更新する（[資格ロードマップの見直し記録](./docs/certifications/roadmap.md) と連動）。
4. 現在形で「〜しています」と書くのは、**実際に運用が回っているものだけ**。始める前のものは「〜します（予定）」と書く。
5. ~~**応募開始を証跡・資格の完成と連動させない**（2026-07-12 制定、期限 2026-07-19）~~ → **2026-08-17 に役割を終えた**。派遣社員としてのトライアル就業が始まり、「最初の応募を出す」という当初の目的は達成された。後継は下記ルール 6。
6. **証跡採録を「就業の合間の余暇」にしない**（2026-08-17 制定）。トライアル就業中は学習時間が減るため、**月あたり最低 1 件の実測証跡**を採録することを下限とする。達成できなかった月は、本ファイルに理由を記録する。

### 守れなかったルールの扱い（2026-08-17）

ルール 2 は「週 1 回更新」で制定したが、**2026-07-12 の初回コメント以降、5 週間更新されなかった**（[#8](https://github.com/ns7jp/ns7jp/issues/8) のコメントは 1 件のみ）。

本ポートフォリオの中心的な主張は「宣言と実態の乖離を作らない」である。守れなかったルールを掲げ続けることは、その主張自体への反証になる。したがって**ルールを守れなかった事実を消さずに残したうえで、守れる粒度（月 1 回）へ引き下げる**。頻度を落とすことは後退ではなく、宣言を実態に合わせる作業である。

---

## 1. 本リポジトリ（ns7jp/ns7jp）

### 2026-08-22 の更新内容（採用担当者向けの最短導線）

| 観点 | 対応 |
| --- | --- |
| README 冒頭 | 主作品の価値を「Ansible による構成管理、監視スタック 9 サービス、障害注入後 13 秒での自動復旧」という実測中心の一文に集約 |
| 最短確認先 | 「2 分 15 秒の実測証跡リプレイ」「構成図」「実測証跡」の 3 リンクに限定。設計・試験・引き渡しの詳細は構築案件パックへ誘導 |
| 動画の公開状態 | 保存済み実測画面と D-1 復旧ログを再構成した証跡リプレイを公開。**実操作の連続録画ではない**ことを映像内・ページ上・プロフィールで明記 |
| 技術範囲の見せ方 | README と採用担当者向け 1 ページ版では実測 4 件を優先。技術ごとの習熟度、資格、他作品は `docs/resume.md` へ分離 |
| 関連文書 | `docs/overview-for-recruiters.md`、`docs/demo-script.md`、`docs/showcase/README.md` の表現を同期 |

この整理では実測結果そのものを追加・変更していません。試験結果は引き続き 21 項目中 11 項目 PASS、10 項目 `NOT RUN` です。新しい実行結果は、日時・環境・commit・コマンド・終了コードを採録してから README へ反映します。

### 2026-08-19 の更新内容（追補2：説明できない深さの内容そのものを圧縮）

同日の下記2件の整理は「専門用語の言い換え」が中心でしたが、その後
**「インフラはまだ初心者で、ほとんど説明できない」という本人からの明確な指摘**を受け、
言葉遣いではなく **内容の深さそのもの** を圧縮する3回目の整理を行いました。

これまでの2回は「同じことを平易な言葉で言う」対応でしたが、今回は
**面接で深いトレードオフを問われても答えられない部分は、記述自体を削る**という、
一段踏み込んだ対応です。

| 観点 | 対応 |
| --- | --- |
| 最大の対象 | ADR 8 本。各 ADR は「代替案の比較検討」「複数理由による決定根拠」「詳細なリスク低減策」を備えた、経験者の判断記録のような体裁になっていた |
| 圧縮の型 | ADR-0005（Terraform）をまず自分で書き直し、参照実装としてから残り7本に同じパターンを適用：Alternatives比較表→3〜5行の箇条書き、Decision Rationaleの複数理由づけ→削除、Consequences→2〜3項目に圧縮 |
| 理論に踏み込みすぎていた設計書 | `04-slo-design.md`（Google SRE Book由来のマルチウィンドウ・バーンレート理論と数式的根拠を1文の平易な説明に置換）、`03-terraform-aws.md`（構成図・HCL抜粋を要点のみに整理し、ADR-0005への参照に統一） |
| 実装のない設計判断を含んでいた箇所 | `08-kubernetes-roadmap.md` のサンプル Deployment / HPA YAML を削除（触ったことのない K8s 環境に対する具体的なリソース設計・スケーリング閾値の判断を示していたため、実力との乖離が最も大きい部分と判断） |
| README | 「サーバー構築で説明できること」を「サーバー構築でやったこと」に改題し、設計判断を伴う項目を除去。冒頭に「説明できない部分も多い」旨を明記 |
| docs/adr/README.md | ADR の位置付けを「トレードオフを言語化できることを示す」から「調べた範囲で選んだ理由を簡単に記録する」に修正 |
| 保持した内容 | 実装済みの事実（設定値、コード抜粋、実際のCI構成、日付、リンク）は削除していない。各設計書・ADRに「学習記録であり実務経験に基づかない」旨の断り書きを統一して追加・強化 |

#### 対象ファイルと行数の変化

| ファイル | 変化 |
| --- | --- |
| `docs/adr/0001-monitoring-stack.md` | 69 → 49 行 |
| `docs/adr/0002-deploy-with-docker-compose.md` | 75 → 49 行 |
| `docs/adr/0003-loki-for-logs.md` | 84 → 57 行 |
| `docs/adr/0004-ansible-for-config.md` | 103 → 69 行 |
| `docs/adr/0005-terraform-for-iac.md` | 138 → 80 行（参照実装） |
| `docs/adr/0006-self-host-monitoring.md` | 95 → 47 行 |
| `docs/adr/0007-slack-notifications.md` | 126 → 84 行 |
| `docs/adr/0008-stepwise-auth.md` | 128 → 70 行 |
| `docs/server-monitor-improvements/02-ansible-automation.md` | 289 → 267 行 |
| `docs/server-monitor-improvements/03-terraform-aws.md` | 360 → 244 行 |
| `docs/server-monitor-improvements/04-slo-design.md` | 227 → 134 行 |
| `docs/server-monitor-improvements/08-kubernetes-roadmap.md` | 263 → 191 行 |

`01-loki-log-aggregation.md`、`05-backup-recovery-drill.md`、`11-change-management.md` は
確認の結果、既に平易な水準（比較検討表や複数理由づけの箇所がない）だったため変更していません。

| 項目 | 状態 |
| --- | --- |
| 見出し（アンカー）へ実質的な影響のあるリネーム | ✅ ゼロ件（セクション削除に伴う番号の繰り上がりはあるが、他ファイルからのアンカー参照が無いことを都度 grep で確認） |
| markdownlint | ✅ エラーなし（50 ファイル） |
| Mermaid 構文チェック | ✅ 全図パース成功（構成図の整理で 54→53 図に） |
| ローカルリンク・アンカーの解決チェック | ✅ 独自スクリプトで確認、リンク切れなし |
| 作業中に origin/main へ追加された D-1 演習の実測エントリ（LEARNINGS.md） | ✅ 作業終盤に `git merge` で取り込み、消失なし |

> **今回の範囲を広げて解釈しない。** 削ったのは「面接で深く問われたときに答えられない設計判断・トレードオフ比較」であり、
> 実装済みの事実・実測証跡・数値・リンクは変えていません。ADR という形式自体は残していますが、
> 「判断根拠を言語化できることを示す」という当初の位置付けから「調べて選んだ理由を簡単に記録する」へ後退させています。

### 2026-08-19 の更新内容（追補：ADR・改善設計書・採用担当者向け文書に残っていた専門用語の言い換え）

同日の下記の整理は「実装のない設計書の `docs/roadmap/` への移動」と一部文書のトリムが中心でしたが、
その後改めて「未経験としての実力に対して内容が高度すぎる」という自己評価を受け、
**実装が実在する文書に残っていた専門用語・組織規模を前提にした言い回し**を対象に、
同日 2 回目の整理を行いました。

| 観点 | 対応 |
| --- | --- |
| 調査範囲 | ADR 8 本、server-monitor-improvements の実装ありドキュメント 6 本、README・採用担当者向け導線 6 本、プロセス・可視化系文書 4 本、IT サポート・業務改善 5 本、学習プラン 5 本の計 29 ファイルを確認 |
| 平易化した内容 | 「Burn Rate」「エラーバジェット」「FinOps」「CAB 相当の変更管理」「ITIL 用語」「メモリフォレンジック」等の専門用語、「複数人チームでのレビュー・承認」「経営層への報告」「勤務シフト」等の組織規模を前提にした表現 |
| 保持した内容 | 実装事実・実測証跡・日付・リンク・見出しテキスト・使用ツール名（Ansible / Docker / Terraform 等）は一切削除・変更していない |
| スコープ外とした範囲 | `docs/roadmap/` 配下（前回の整理で既に「将来構想・未着手」として隔離済みのため、今回は優先度を下げた）。`docs/learning-plan/` は学習計画としての性質上、学習項目自体は維持し説明文のみ軽く調整 |

#### 対象と処置の内訳（21 ファイルを編集、8 ファイルは確認の上で変更不要と判断）

| ファイル | 変更内容の要旨 |
| --- | --- |
| `docs/adr/0001` / `0003` / `0004` / `0005` / `0007` / `0008` | Burn Rate、DerivedFields、CAB 的な承認プロセス、Critical Sev、企業の雇用ライフサイクル用語などを平易な言い回しに置き換え |
| `docs/server-monitor-improvements/01` / `02` / `04` / `05` | 高カーディナリティ、コードレビュー→セルフレビュー、手動承認→最終確認、複数人での Vault 共有、社内向け→個人ラボなどを修正 |
| `README.md`、`docs/career-bridge.md` | SLO・エラーバジェット・経営層折衝を前提にした表現を、個人ラボ・一人称の運用として読める表現に修正 |
| `docs/evidence-capture-checklist.md`、`docs/showcase/README.md`、`docs/architecture-diagram.md` | FinOps、分散トレーシング、SLA 議論などの専門用語をリンクラベル・注記から除去 |
| `docs/it-support/faq.md` / `account-management.md` / `service-desk-metrics.md`、`docs/business-improvement/picking-improvement.md` | メモリフォレンジック、専任セキュリティ責任者、チケット承認ゲート、分単位 SLO、自動スケールなど、企業規模の体制を前提にした記述を緩和 |
| `docs/learning-plan/02` / `04` | 未説明のまま使われていた「SLO」「キャパシティ管理」「ITIL 用語」を日本語の言い換えに |

| 項目 | 状態 |
| --- | --- |
| 見出し（アンカー）の変更 | ✅ ゼロ件。他ファイルからのリンク切れリスクなし |
| markdownlint | ✅ エラーなし（50 ファイル） |
| Mermaid 構文チェック | ✅ 54 図すべてパース成功 |
| ローカルリンク・アンカーの解決チェック | ✅ 独自スクリプトで確認、リンク切れなし |

> **今回の範囲を広げて解釈しない。** 変更したのは言葉遣い・専門用語の密度であり、実装内容・実測証跡・スキル水準の自己申告は変えていません。
> 文書の分量や設計そのものの範囲は、同日の下記の整理で対応済みです。
> 本ラウンドは ns7jp/ns7jp のみを対象としました（server-monitor 側は別リポジトリのため本セッションでは対象外。必要であれば別セッションで同様の観点の確認を行います）。

### 2026-08-19 の更新内容（ポートフォリオの難易度・スコープを引き下げる整理）

**「未経験としての実力に対してポートフォリオの内容が高度すぎる」という自己評価に基づき、
ns7jp/ns7jp と server-monitor の両リポジトリで、内容の難易度・範囲そのものを引き下げる
整理を実施しました。**

これまでの改善（実測証跡の採録、resume.md の記入）は「実態を正しく見せる」ための整理でしたが、
今回は「示している範囲そのものが、未経験からのキャリアチェンジという実態に対して広すぎる・
高度すぎる」という、一段別種の問題への対応です。

| 観点 | 対応 |
| --- | --- |
| 実装が一切ない純粋な設計書 | 既存の[中長期ロードマップ](./docs/roadmap/README.md)の方針を踏襲し、物理的に `docs/roadmap/` へ移動（非破壊。実装フェーズが近づいた時点で一次導線へ戻す） |
| 実装は実在するが説明が高度すぎる文書 | その場に残し、ガバナンス色の強い部分・専門用語の濃い部分だけをトリム |
| README/STATUS の「実装したこと」テーブル | 行は削除せず、能力の実在を保ったまま平易な表現に言い換え |
| resume.md のスキル評価 | STATUS.md 自身の「監視スタック全体の起動はまだ」という記載と矛盾していた ◎ 評価を ○ へ修正 |

### 対象と処置の内訳

**server-monitor 側**（別リポジトリ・[PR](https://github.com/ns7jp/server-monitor/pulls) 参照）

- README.md: SLO / エラーバジェット・クラウド配備セクションの専門用語を削減、文書一覧を「まず読む文書」と「発展的な設計・将来構想」に分割
- `docs/roadmap/` を新設し、実装のない 4 本（外部 probe 設計、SLO 月次レビュー、D-2 復旧演習、スナップショット復元ランブック）を移動
- slo.md、aws-architecture.md、change-management.md、incident-comms.md、drills/D-1-process-down.md の専門用語密度を低減

**ns7jp/ns7jp 側**（本 PR）

- 実装のない設計書 6 本（06 分散トレーシング、07 インシデント対応、09 セキュリティ運用、10 キャパシティプランニング、12 メタモニタリング、15 ネットワーク運用）を `docs/roadmap/` へ移動
- `server-monitor-improvements/11-change-management.md` を大幅に圧縮し、ITIL/CAB 相当の未実装部分を「設計サンプル」として明確に分離
- `04-slo-design.md`、`03-terraform-aws.md`、`architecture-diagram.md` の専門用語密度を低減
- `docs/showcase/README.md` の SLO ダッシュボード・インシデントタイムライン（IC ロール付き）・ポストモーテムのモックアップを縮小
- `resume.md` のスキル評価矛盾を修正

| 項目 | 状態 |
| --- | --- |
| 両リポジトリのリンク切れチェック | ✅ 独自スクリプトで全相対リンクの解決を確認 |
| Mermaid 構文チェック | ✅ 全図がエラーなくパース |
| markdownlint | ✅ エラーなし |

### 2026-08-17 の更新内容（追補：Molecule フル実行の完走と初の Linux 実測証跡）

**Ansible ロール 4 本の `molecule test` が全て成功し、リポジトリで初めて Linux 上の実測証跡を採録しました**
（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) ／
[実行 URL](https://github.com/ns7jp/server-monitor/actions/runs/32031882695)、0 円・2 分 42 秒）。

| Role | create | converge | idempotence | verify | 所要 |
| --- | --- | --- | --- | --- | --- |
| common | PASS | PASS | PASS | PASS | 84 秒 |
| docker | PASS | PASS | PASS | PASS | 105 秒 |
| nginx | PASS | PASS | PASS | PASS | 68 秒 |
| monitoring | PASS | PASS | PASS | PASS | 53 秒 |

#### 到達までに 6 回失敗し、原因は 4 種類に分かれた

| run | 停止段階 | 原因 | 種別 |
| --- | --- | --- | --- |
| #1 | `destroy`（初手） | `stdout_callback: yaml` が指す callback が community.general 12.0.0 で削除済み | 設定の陳腐化 |
| #2 | versions 表示 | `ansible-galaxy collection list` の引数の渡し方 | 記述ミス |
| #3 | `converge` | `tzdata` 未導入かつ timezone 設定がパッケージ導入より前 ／ docker daemon 起動不可 | **ロールの欠陥** ／ 環境制約 |
| #4 | `converge` | chrony 起動不可 | 環境制約（**後に誤診と判明**） |
| #5 | `idempotence` | 同一 port 22 に `ufw allow` と `ufw limit` を適用しており毎回互いを上書き | **ロールの欠陥** |
| #6 | `verify` | systemd が PID 1 で起動していなかった | 検証環境の設定不備 |
| #7 | — | — | **全ロール成功** |

#### 特筆すべき 2 件

**1. 静的検査では検出できない欠陥を冪等性テストが捕まえた（#5）**

UFW の `allow` と `limit` が同じ port を奪い合う問題は、`ansible-lint` も `--syntax-check` も検出できませんでした。
文法は正しく個々のタスクも妥当で、**2 回適用して初めて矛盾が現れる**種類だったためです。
かつ実ホストでも毎回 SSH のルールが `ALLOW` / `LIMIT` 間で書き換わるため、
総当たり攻撃の抑止が意図した状態で維持されない、**セキュリティ上の欠陥**でもありました。

**2. 自分の診断が誤りだったと後から判明した（#4 → #6）**

chrony の失敗を「コンテナは時計を共有するため NTP を動かせない」と判断しましたが、誤りでした。
実際は **systemd が PID 1 で起動していなかった**ことが原因で、docker daemon・chrony・`timedatectl` という
**別々に見えた 3 件すべてがこの 1 点に由来**していました。判明後、当該の無効化は取り消しています。

> **この証跡の範囲を広げて解釈しない。** 確認できたのは「ロールが適用でき、冪等で、期待した状態になる」
> ところまでです。監視スタック全体の起動、復旧演習、AWS 適用は依然として未採録です。

| 項目 | 状態 |
| --- | --- |
| チェックリスト優先 1（full `molecule test`） | ✅ **完了**。実行 URL・commit SHA 付きで採録 |
| 検証で見つかったロールの欠陥の修正 | ✅ `tzdata` 依存漏れ、UFW ルール競合の 2 件を修正 |
| Molecule scenario の設定不備の修正 | ✅ 4 scenario に `command: /lib/systemd/systemd` を追加 |
| 検証証跡台帳の更新 | ✅ 実測済みと未採録の境界を要約に明記 |
| README / overview の「証拠の境界」更新 | ✅ 実測済み範囲を追加し、未実測範囲を維持 |
| LEARNINGS.md への反映 | ⬜ **本人記入待ち**。事実関係と時系列は証跡ファイルに揃えてあるため、「学び」を自分の言葉で書く |

### 2026-08-17 の更新内容（就業状況の変化とポートフォリオの目的転換）

**派遣社員としてトライアル就業を開始しました**（詳細は [職務経歴書](./docs/resume.md) の「現況」）。これに伴い、ポートフォリオの目的が変わります。

| 観点 | 従来（〜2026-08） | 現在（2026-08-17〜） |
| --- | --- | --- |
| 主な読み手 | 未経験可求人の採用担当・人事 | 就業先の現場担当者、派遣元の営業・キャリア担当、次の案件の受け入れ先 |
| 示すべきこと | 「未経験だが学習意欲と基礎がある」 | 「**現に手を動かして動かせる**。サーバー構築業務を任せられる」 |
| 設計書の価値 | 高い（比較対象が少ないため差別化になる） | 下がる（現場では「で、実際に動かしたのか」が問われる） |
| 実測証跡の価値 | 高い | **決定的**。ここが埋まらない限り評価は上がらない |

この転換により、**実測証跡の不足は「今後の課題」から「最優先で解消すべき欠陥」へ格上げ**されます。

| 項目 | 状態 |
| --- | --- |
| 現況表記の更新（派遣・トライアル就業中） | ✅ [resume](./docs/resume.md) / [overview](./docs/overview-for-recruiters.md) / [README](./README.md) に反映（`〈 〉` の派遣元・就業先・期間は本人記入待ち） |
| 応募開始ルール（§0 ルール 5）の終了処理 | ✅ 目的達成として終了し、後継ルール 6（月 1 件の実測証跡）を制定 |
| Issue 更新頻度を週 1 → 月 1 へ緩和 | ✅ 5 週間更新が止まった事実を残したうえで、守れる粒度へ変更（§0「守れなかったルールの扱い」） |
| 実測証跡の現状を正確に記載 | ✅ §2 を実態へ更新。当初は「実測証跡は Windows 端末の pytest 1 件のみ」だったが、同日中に Molecule 完走により Linux 実測証跡を採録（上記の追補を参照） |
| Molecule を GitHub Actions で実行する導線の明示 | ✅ [証跡採録チェックリスト](./docs/evidence-capture-checklist.md)の優先度を組み替え、**Linux 環境なしで採れる証跡**を最優先へ |
| ショーケースのスクリーンショット表示の是正 | ✅ Windows 端末の画面を「実機キャプチャ」として掲示していた点を修正 |
| STATUS.md のアンカー切れ修正 | ✅ §4 の AI 開示リンクが README の見出し変更に追随していなかった（`--include-fragments` を docs CI に追加して再発防止） |

### 2026-08-11 の更新内容

未経験からサーバー構築（インフラ構築）を目指す場合の学習設計を、[学習プラン](./docs/learning-plan/README.md)として新規に追加しました。
本リポジトリの「新規設計を増やさない運用ルール」の対象は **server-monitor の改善設計 06 以降** であり、本件は学習計画のため対象外です。
成果物は新しい設計書を作らず、既存の[証跡採録チェックリスト](./docs/evidence-capture-checklist.md)の項目へ接続しています。

| 項目 | 状態 |
| --- | --- |
| 学習プラン（24 週・6 フェーズ）の追加 | ✅ [docs/learning-plan/](./docs/learning-plan/README.md) に 5 ページで作成（全体像 / 学習環境 / カリキュラム / 構築工程 / 教材・資格） |
| 構築工程のドキュメントテンプレート整備 | ✅ パラメータシート・構築手順書・試験項目書・移行と切り戻し・作業の作法を[03](./docs/learning-plan/03-build-process.md)に集約 |
| 自己評価（現在地）の明示 | ✅ 同じ 6 フェーズで自己評価。**Phase 2 ネットワークの実機調査**と **Phase 4 構築ドキュメント**を優先補強点として特定 |
| 既存導線との接続 | ✅ 成果物の置き場所を LEARNINGS.md / 証跡採録チェックリスト / 資格ロードマップへ寄せ、新規設計書は追加していない |
| 応募開始期限（2026-07-19）の経過 | ⚠ 期限を経過。**提出済みか／延期理由かの記録が未記入**（§0 ルール 3・5。本人による記録が必要） |

> ⚠ の項目は、リポジトリ整備では代替できません。§0 ルール 3 に従い、結果または延期理由を記録して新しい期限を設定してください。

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
| 採用ご担当者向け 1 枚サマリ | ✅ 完了（非技術者向け） |
| 学習ログ Issue（#5-#7）/ 実証トラッキング Issue（#8） | ✅ 作成済み（**運用はこれから**。週 1 回更新を上記ルールで開始する） |
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了（2026-07 にリンクチェックを強化） |
| デモ動画台本 | ✅ 整備済み（収録はスクショ・演習採録後） |
| 志望トラックと証跡の対応 | ✅ 完了（Linux サーバー構築・運用を第一志望として明示） |
| 変更管理の実物化 | ✅ server-monitor 側に PR テンプレート / 変更管理ミニ運用を追加 |

### 未対応 / 次のアクション（証跡採録フェーズ）

**新規設計の追加は引き続き停止**し、実物の証跡採録を最優先します（手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に集約）。

トライアル就業中で可処分時間が減るため、**所要時間の短い順**に並べ替えました。上から順に消化すれば、1 件あたりの着手コストが小さいまま証跡が増えます。

#### 完了（2026-08-17〜19）

- [x] ~~**`ansible-integration.yml` を GitHub Actions で実行**~~ → **2026-08-17 完了**。4 ロール完走し[実測証跡を採録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)（チェックリスト優先 1）
- [x] ~~**LEARNINGS.md に「学び」を追記**~~ → **完了**。UFW の冪等性欠陥・自分の診断が誤りだった件・`docker kill` が `unless-stopped` を無効化していた件・直したコードが反映されていなかった件の計 4 エントリすべて記入済み（[#22](https://github.com/ns7jp/ns7jp/pull/22)、[#31](https://github.com/ns7jp/ns7jp/pull/31)）
- [x] ~~**server-monitor の Dependabot PR を処理**~~ → **2026-08-19 完了**。滞留していた PR 18 件が処理されずに全件 close されていた実態を確認して STATUS.md を訂正し、安全な更新は [PR #59](https://github.com/ns7jp/server-monitor/pull/59)（マージ済み）として作り直し、AWS provider のメジャー更新は見送りを決定して理由を明記した
- [x] ~~**Linux + Docker で全 stack を起動し、スクショ 3 点を採録**~~（優先 3〜5） → **2026-08-18 完了**。[Grafana / Loki の実測証跡](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md)を採録
- [x] ~~**`server-monitor/docs/screenshot.png` を Linux 版に差し替え**~~ → **2026-08-19 完了**
- [x] ~~**D-1 復旧演習の実測**~~（優先 7） → **2026-08-19 完了**。[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)（PASS、RTO 13 秒）。実施に伴い nginx の起動時クラッシュループと secrets の `chmod` 不整合という実機の欠陥 2 件を発見・修正済み（[PR #61](https://github.com/ns7jp/server-monitor/pull/61)）
- [x] ~~**既存 CI の成功ログを証跡台帳へ記録**~~（優先 2） → **2026-08-19 完了**。あわせて「Backup verify 累計 400 回超」という誤った記載を、実際に数えた 102 回へ訂正した
- [x] ~~**試験仕様書の `NOT RUN` を実施できた分だけ更新**~~ → **2026-08-19 完了**。21 項目中 10 項目を `PASS` に更新し、残りは `NOT RUN` のまま明示

#### 今週（本人作業・Linux 環境不要）

- [x] ~~**resume.md / overview の `〈 〉` 箇所を記入**（派遣元・就業先・トライアル期間・在籍年月・夜勤/交代制の可否）~~ → **2026-08-17 完了**（[ac4197e](https://github.com/ns7jp/ns7jp/commit/ac4197e7c72b1e45bb9fc7d2864c6851f3245162)）。このタスク行だけ更新が追随していなかった。resume.md / overview-for-recruiters.md に `〈 〉` は現存しないことを 2026-08-21 に再確認済み
- [x] ~~**[#8](https://github.com/ns7jp/ns7jp/issues/8) に現況コメントを 1 件残す**（トライアル就業の開始と、証跡採録の再開予定。2026-07-12 以降が空白のままになっている）~~ → **2026-08-21 完了**。トライアル就業の詳細（就業先・研修内容・期間）を明記し、証跡採録の残項目（優先 2・優先 8）と本日の整合性修正 PR（[#37](https://github.com/ns7jp/ns7jp/pull/37) / [#38](https://github.com/ns7jp/ns7jp/pull/38)）を[コメント](https://github.com/ns7jp/ns7jp/issues/8#issuecomment-5365515734)に反映
- [ ] **GitHub プロフィールの Bio・ピン留めリポジトリを設定**（[github-profile-settings.md](./docs/github-profile-settings.md) の推奨設定を適用。2026-08-21 時点で Bio・ピン留めともに未反映）

#### 今月（1 晩〜半日・0 円）

- [ ] **LEARNINGS.md にトライアル就業中のつまずきを追記**（機密・顧客情報に触れない範囲で。この項目のみ、まだ着手できていない）
- [x] ~~**ネットワーク切り分けの一次メモ**（[優先 6](./docs/evidence-capture-checklist.md)）~~ → **2026-08-21 実質完了**。`ss` / `docker port` / `docker inspect` で切り分け、`frontend` ネットワークの `internal: true` がホストへのポート公開を無効化する不具合を発見・原因特定した（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)）。当初想定していたホスト公開ポート経由ではなく、`docker compose exec` 経由・コンテナ IP を直接指定する方法で、名前解決・経路（traceroute）・実際のパケット（tcpdump）のすべてを `internal: true` の制約を受けずに確認できた。なお、このタスク行の見出しは従来「二セグメント障害ラボの実行ログ」となっていたが、それは別タスク（[labs/network-troubleshooting](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)、2026-08-19 に別途採録済み）を指しており、優先6の内容と一致していなかったため見出しも訂正した
- [ ] **Alertmanager → Slack の実通知配信**（[優先 4](./docs/evidence-capture-checklist.md)、Slack Webhook が必要）

#### 継続

- [ ] **Issue #5〜#8 の月次更新**（§0 ルール 2。週 1 回から緩和済み）
- [ ] **ポートフォリオサイト（ns7jp.github.io）を本 README の構成へ同期**（志望順位・経験年数・現況表記の整合。全面同期は未完了） → **2026-08-21 一部完了**（[ns7jp.github.io#21](https://github.com/ns7jp/ns7jp.github.io/pull/21)）。現況表記（「転職活動中」→トライアル就業中）と資格の優先順位（LPIC-1優先→FE優先）を同期。`contact.html` / `skills.html` / `works.html` / `cloud-lab.html` / `infra-lab.html` / `linux-lab.html` 等、その他ページの全面点検は未実施
- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）

#### 就業内容が固まってから

- [ ] デモ動画を収録（スクショ・演習採録後の集大成として）
- [ ] 就業先が Windows / AD 環境なら **Windows / AD 最小証跡を採録**（優先 8）
- [ ] `terraform apply` → `destroy` の実費と Cost Explorer 記録（優先 9）
- [ ] IT サポート資料を **実体験ベース** に書き換え（該当業務に従事してから）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
コード実装と実行実績は区別して表示する。

> **実測証跡の現状（2026-08-22 更新）**
>
> **使い捨て Ubuntu 24.04 の GitHub-hosted runner で Full-stack E2E 23/23 PASS**
> （[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)）。
> `site.yml` の一括適用と 2 回目 `changed=0`、監視スタックの稼働、runner 内の network / UFW、
> 3 volumes の backup / restore、D-1 自動復旧（RTO 1 秒）、Alertmanager から local webhook への
> FIRING / RESOLVED 配送まで、同一 run で確認した。
>
> これは [2026-08-17 の Molecule 4 ロール完走](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)と、
> [2026-08-19 のローカル D-1（RTO 13 秒）](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)とは別の実測記録であり、いずれも履歴として保持する。
>
> **この証跡の範囲を広げて解釈しない。** local webhook は Slack 実配信ではなく、
> runner 内の network / UFW 検証は独立した管理端末や引き渡し対象ホストでの検証を代替しない。
> AWS `apply / destroy`、D-2、Slack 実配信も引き続き未実測である。

### 実装済み / 証跡待ち

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み。2026-08-22 の Full-stack E2E で core 9 services と検証用 sink の稼働を確認 | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み（Promtail EOL に伴い移行） | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。**full `molecule test` 4 ロール完走を [2026-08-17 に採録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)**。さらに [2026-08-22 の Full-stack E2E](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)で `site.yml` 一括適用・2 回目 `changed=0` を含む 23/23 PASS | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。2026-08-22 E2E で local webhook の FIRING / RESOLVED を実測。Slack 実配信は未採録 | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。**ローカル D-1 を 2026-08-19 に採録**（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)、RTO 13 秒で PASS）。[2026-08-22 E2E](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)でも D-1 RTO 1 秒と 3 volumes の backup / restore を PASS。D-2 は未収録 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 設計済み / 順次実装

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（就業後の資格計画と連動） | [08](./docs/server-monitor-improvements/08-kubernetes-roadmap.md) |
| v1.2 | 変更管理プロセス | ✅ PR / Issue テンプレートとミニ運用を server-monitor 側へ追加 | [11](./docs/server-monitor-improvements/11-change-management.md) |

### 中長期ロードマップへ縮退（2026-07-03、2026-08-19 追加）

実装着手が 1 年以上先のテーマ、または実装のない純粋な設計サンプルは、選考フェーズの一次導線から外し [docs/roadmap/](./docs/roadmap/README.md) で保管します（設計を捨てたのではなく、露出の優先順位を変更）。

| # | テーマ | 設計書 | 縮退時期 |
| --- | --- | --- | --- |
| 13 | FinOps（コスト最適化運用） | [13](./docs/roadmap/13-finops.md) | 2026-07 |
| 14 | データベース運用設計 | [14](./docs/roadmap/14-database-operations.md) | 2026-07 |
| 16 | アイデンティティ運用 | [16](./docs/roadmap/16-identity-operations.md) | 2026-07 |
| 17 | カオスエンジニアリング / Game Day | [17](./docs/roadmap/17-chaos-engineering.md) | 2026-07 |
| 06 | 分散トレーシング（Tempo + OpenTelemetry） | [06](./docs/roadmap/06-observability-traces.md) | 2026-08 |
| 07 | インシデント対応プロセス・ポストモーテム | [07](./docs/roadmap/07-incident-response.md) | 2026-08 |
| 09 | セキュリティ運用プロセス | [09](./docs/roadmap/09-security-operations.md) | 2026-08 |
| 10 | キャパシティプランニング・負荷試験 | [10](./docs/roadmap/10-capacity-planning.md) | 2026-08 |
| 12 | メタモニタリング（監視の監視） | [12](./docs/roadmap/12-meta-monitoring.md) | 2026-08 |
| 15 | ネットワーク・DNS 運用 | [15](./docs/roadmap/15-network-operations.md) | 2026-08 |

> **2026-08-19 追記**: 06 / 07 / 09 / 10 / 12 / 15 は、実装着手時期の遠さに加えて、
> 未経験からのキャリアチェンジという実際のスキル水準に対して内容が高度すぎる
> （インシデントコマンダー制のポストモーテム、ITIL 準拠の変更管理相当の統制、
> 分散トレーシングなど、組織規模や複数人チームを前提にした設計）と判断し、
> ポートフォリオ全体の難易度・スコープを引き下げる整理の一環として追加で移動した。

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

### 未処理の Dependabot PR と CI 失敗（2026-08-17 に判明、2026-08-19 に決着）

**server-monitor に Dependabot PR が 12 件滞留**しており、最古は **2026-05-28（約 3 か月）**。うち Terraform provider 更新の 2 件は **Terraform check が失敗したまま**でした。

> **2026-08-17 追記**: `dependabot.yml` の修正後、Dependabot が PR を作り直し **12 件 → 7 件** に減りました。
> 両立しない制約で永久に落ち続けていた #44 / #45 は **#47（8 ディレクトリを 1 本に統合）** に置き換わり、
> **Terraform check が約 3 か月ぶりに success** になっています。Actions 更新 5 本も **#48** の 1 本に統合されました。
> 残り 7 件（#17 / #18 / #20 / #31 / #42 / #47 / #48）の処理は本人作業です。
>
> **2026-08-19 追記（実態確認と決着）**: 上記「残り 7 件」という記述を実際に GitHub で確認したところ、**実態と一致していなかった**。
> Dependabot PR は最終的に 18 件（#29〜#48）まで積み上がり、**その全件が close 済み・マージ 0 件**だった。
> 「処理してください」という指示を書いたまま、実際には一件も処理されずに閉じられていた期間があったことになる。
>
> この記述を放置せず、次のとおり決着させた。
>
> | 対象 | 判断 | 内容 |
> | --- | --- | --- |
> | `actions/checkout`・`actions/setup-python`・`aws-actions/configure-aws-credentials`・`hashicorp/setup-terraform`（元 #48 の一部） | 採用 | [PR #59](https://github.com/ns7jp/server-monitor/pull/59) として作り直し、CI 確認中 |
> | `prometheus-client`（元 #42） | 採用 | 同上。ローカルで実インストールし既存テスト 14 件が通ることを確認済み |
> | `pytest` 8→9（元 #31、メジャー更新） | 採用 | 同上。破壊的変更の報告なし、ローカルで実インストール・テスト実行して確認済み |
> | `aquasecurity/trivy-action` 0.35.0→v0.36.0（元 #48 の一部） | 採用（SHA 固定） | `git clone` してコミット系譜を確認し、v0.36.0 が `GHSA-69fq-xp46-6x23` の安全なコミットの直系の子孫であることを検証してから取り込んだ。可変タグではなくコミット SHA で固定 |
> | `hashicorp/aws` 5.x→6.x（元 #47 ほか、Terraform provider のメジャー更新） | **見送り**（継続） | 破壊的変更の有無を[アップグレードガイド](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/guides/version-6-upgrade)で確認していないため、自動更新に任せない方針を維持。行うときは本人作業とする |
>
> **「7 件が残っている」という表現自体が、実態を追っていなかった証拠**だった。この訂正自体を、
> ポートフォリオが掲げる「宣言と実態の乖離を作らない」という主張を裏付ける記録として残す。

本ポートフォリオは変更管理・保守運用・EOL 追従を主要な訴求点にしており、[LEARNINGS.md](./LEARNINGS.md) の唯一のエントリも「採用時に保守状況・EOL 予定を確認していなかった」という反省です。**リポジトリを開いた人に最初に見えるのが 3 か月放置された依存更新 PR である状態は、その訴求と正面から矛盾します。**

#### CI 失敗の根本原因（調査済み）

```text
Error: Failed to query available provider packages
Could not retrieve the list of available versions for provider
hashicorp/aws: no available releases match the given constraints ~> 5.50, ~> 6.58
```

`hashicorp/aws` の version 制約は **8 ファイル**に分散して宣言されています。

| 場所 | ファイル数 | Dependabot の監視 |
| --- | --- | --- |
| `terraform/versions.tf` | 1 | ❌ 未監視 |
| `terraform/environments/{dev,prod}/versions.tf` | 2 | ✅ 監視中 |
| `terraform/modules/{alb,backup,compute,monitoring,network}/versions.tf` | 5 | ❌ 未監視 |

`.github/dependabot.yml` が `environments/dev` と `environments/prod` しか監視していないため、Dependabot は env 側だけを `~> 6.58` に上げます。module 側は `~> 5.50` のまま残り、制約が両立せず `terraform init` が必ず失敗します。**PR を何度作り直しても構造的に緑になりません。**

#### 対応方針

| 対応 | 状態 |
| --- | --- |
| `dependabot.yml` に全 Terraform ディレクトリを登録し、`groups` で 1 PR にまとめる | ✅ 本 PR で修正（今後の provider 更新は整合した 1 PR で届く） |
| 既存の PR #44 / #45 を close し、修正後の設定で作り直す | ✅ **完了**。Dependabot が #47（terraform-providers group、8 ディレクトリ統合）として再作成し、**Terraform check が success** |
| AWS provider 5.x → 6.x のメジャー更新を実施 | ⬜ **見送りを決定（2026-08-19）**。破壊的変更の有無をアップグレードガイドで確認するまで自動更新に任せない方針を継続 |
| Actions / pip 系を処理 | 🔶 **2026-08-19: [PR #59](https://github.com/ns7jp/server-monitor/pull/59) として作り直し、CI 確認中**。マージ確認が残作業 |

> **面接での価値**: この provider 6.x 移行は、`terraform init` の失敗ログから制約の重複宣言を特定した実例です。**LEARNINGS.md に書く題材として、現時点で最も質が高いもの**です（症状・原因・対処・学びの 4 点が既に揃っている）。

### 次に採録する実測証跡

順序・手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に一元化（2026-08-17 に「必要な環境」順へ組み替え）。

**GitHub Actions で採録済み**

1. ~~full `molecule test` の実行ログ（優先 1）~~ → ✅ **2026-08-17 採録済み**
2. ~~既存 CI の成功ログを証跡台帳へ記録（優先 2）~~ → ✅ **2026-08-19 採録済み**（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-ci-baseline.md)）
3. ~~新規構築から冪等性・network / UFW・障害復旧・backup / restoreまでの Full-stack E2E~~ → ✅ **2026-08-22 に23/23 PASS**（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)）

**次に採録するもの**

1. Alertmanager → Slack の実通知配信（local webhook の FIRING / RESOLVED は2026-08-22に採録済みだが、Slack Webhook は別途必要）
2. ~~ネットワーク切り分けの一次メモ（優先 6）~~ → ✅ **2026-08-21 実質完了**。ポート公開の不具合を発見・原因特定し、名前解決・経路（traceroute）・実際のパケット（tcpdump）のすべてをコンテナ IP 直接指定・`docker compose exec` 経由で確認できた（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)）
3. 独立した管理端末と引き渡し対象ホストを使った network / UFW / 待受・SSH tunnel の実機検証

**追加環境が必要なもの**

1. Windows / AD 最小ラボの PowerShell 実行ログ（優先 8。就業先が Windows 環境の場合のみ優先度を上げる）
2. D-2 ホスト障害復旧演習
3. 承認された AWS 検証で `plan` / `apply` / `destroy` と Cost Explorer 実費（優先 9）

---

## 3. その他の関連リポジトリ・サイト

「関連リポジトリ全体を一元管理する」宣言に合わせ、学習作品も状態を明記します。

| リポジトリ / サイト | 位置付け | 状態 |
| --- | --- | --- |
| [server-monitor](https://github.com/ns7jp/server-monitor) | 主作品（インフラ運用） | §2 のとおり |
| [post](https://github.com/ns7jp/post) | 学習作品（PHP / MySQL、CSRF / bcrypt / PDO） | 完成・公開中。DB 運用設計（[14](./docs/roadmap/14-database-operations.md)）の題材 |
| [pulse](https://github.com/ns7jp/pulse) | 学習作品（PHP / SQLite） | 完成・公開中 |
| [works](https://github.com/ns7jp/works) | 学習作品集（Python / HTML / CSS） | 公開中（学習過程の記録） |
| [ns7jp.github.io](https://ns7jp.github.io/) | ポートフォリオサイト | 🔄 同期作業中（現況表記・資格優先順位を[ns7jp.github.io#21](https://github.com/ns7jp/ns7jp.github.io/pull/21)で対応。その他ページの全面点検は未実施） |

---

## 4. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント**（FAQ / TS / Account / Service Desk Metrics）は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません（変更は[見直し記録](./docs/certifications/roadmap.md)に残します）
- **server-monitor の改善コード 01-05 は別リポジトリに実装済み**。Full-stack E2E の範囲は
  2026-08-22 に実測済みですが、AWS 稼働・費用、Slack 実配信、D-2、独立管理端末・引き渡し対象ホストの検証は、その証跡が追加されるまで実績として扱いません
- **06 以降は設計サンプル / ロードマップ** であり、実装コードや実測証跡と混同しません
- **ビジュアルショーケース** は実機キャプチャ枠とテキストモックアップを分離し、採録後に順次差し替えます
- **[学習プラン](./docs/learning-plan/README.md) は計画** であり実績ではありません。同ページの「本人の現在地」は自己申告であり、実測証跡の有無は本ファイルと[証跡採録チェックリスト](./docs/evidence-capture-checklist.md)を一次情報とします
- **ドキュメント整備には AI を活用**しています（役割分担は [README の開示セクション](./README.md#ai-の利用について) を参照）
- **実測証跡は複数件へ増加**し、2026-08-22 には Full-stack E2E 23/23 PASS まで採録済みです。一方、Slack 実配信、AWS、D-2、独立管理端末・引き渡し対象ホストは未実測のため、新規の設計追加より残る証跡の採録を優先します

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
