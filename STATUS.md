# ポートフォリオ進捗 STATUS

本リポジトリ（プロフィール）と関連リポジトリ全体の進捗を一元管理します。

最終更新：2026-08-26（ポートフォリオの網羅範囲を「Linux サーバー構築」第一志望へ絞り直す整理を実施。
`docs/it-support/` と Windows / winget 端末セットアップのテンプレートを削除し、`docs/roadmap/` 配下の
個別設計書 10 本と `08-kubernetes-roadmap.md` を削除して[今後の興味リスト](./docs/roadmap/README.md)
へ一本化。約 20 ファイルの相互参照を修正し、markdownlint・Mermaid 構文検証・全リンク/アンカーのローカル
チェックで 0 件を確認。並行して、06 シェルスクリプト演習設計を新規作成し、Bash 側（Level 1・2・演習A・
演習B）を AI 支援セッションで実行。07 Python 運用自動化演習設計に、この作業環境での Linux 側実行記録
（付録、31/49 項目）を追加し、Windows 側・実機（lab-base01 / LAB-WINOPS1）実施用のキット（python-ops-kit、
未実行の雛形）を準備。Phase 1 演習の実施キット（Hyper-V 向け雛形）を準備し、本人が実機（Hyper-V ホスト）で
初回実行して見つけた実バグ 2 件（誤成功表示、UTF-8 BOM 無しによる Windows PowerShell 5.1 での文字化け・
構文エラー）を修正。06 シェルスクリプト演習設計の Windows/PowerShell 側（Level 1・2・演習A
`Backup-Rotate.ps1`）を、Linux コンテナへ導入した PowerShell 7 で実行し、演習B〜E は windows-ps-kit
（構文検証済みの実施キット）として準備。windows-ad-lab.md のフォレスト昇格・最小 OU 構成の先を、
OU 階層・AGDLP グループ戦略・GPO・パスワードポリシー・FSMO・システム状態バックアップ／権威復元まで
具体化した 08 AD構築演習設計を新規作成。server-monitor の滞留 Dependabot PR を検証・処理。#96/#95/#94/#18
を merge、#93 は PR #102 に置き換え、#17/#66 は保留理由を記録）

---

## 0. 更新の運用ルール（2026-07-03 制定）

「宣言と実態の乖離」を作らないため、次をルール化します。

1. **STATUS.md は月 1 回以上更新**する。進捗ゼロの月も「進まなかった事実と理由」を記録する。
2. **Issue（#5〜#8）は月 1 回更新**する（2026-08-17 に週 1 回から緩和。理由は下記「守れなかったルールの扱い」を参照）。進まなかった月は「進まず。理由: 〇〇」の 1 行を残す。
3. **受験予定日・期限が過ぎた計画は放置しない**。結果または延期理由を記録し、日付を更新する（[資格ロードマップの見直し記録](./docs/certifications/roadmap.md) と連動）。
4. 現在形で「〜しています」と書くのは、**実際に運用が回っているものだけ**。始める前のものは「〜します（予定）」と書く。
5. ~~**応募開始を証跡・資格の完成と連動させない**（2026-07-12 制定、期限 2026-07-19）~~ → **2026-08-17 に役割を終えた**。派遣社員としてのトライアル就業が始まり、「最初の応募を出す」という当初の目的は達成された。後継は下記ルール 6。
6. **証跡採録を「就業の合間の余暇」にしない**（2026-08-17 制定）。トライアル就業中は学習時間が減るため、**月あたり最低 1 件の実測証跡**を採録することを下限とする。達成できなかった月は、本ファイルに理由を記録する。
7. **`LEARNINGS.md` は本人のみが編集する**（2026-08-25 制定）。実機で外した仮説の一次記録は、このポートフォリオで唯一 AI に代替できない資産であり、AI に書かせた時点で価値がゼロになる。それ以前に AI が「学び」欄を代筆したコミットが履歴に残っているが、**消さずに残したうえで本人の記述へ置き換える**。
8. **「正本」を決め、他は同期先とする**（2026-08-25 制定）。同じ事実が 5 か所に散って毎回ズレていたため、次を正本とする。

   | 対象 | 正本 |
   | --- | --- |
   | 資格・職歴・希望条件 | [`docs/resume.md`](./docs/resume.md) |
   | 実測値（23/23・RTO・SHA・run ID・PR 番号） | [server-monitor 検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md) |
   | 実行して見つかった欠陥の件数 | [server-monitor 欠陥台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/defects-found.md) |
   | 採録の優先順位 | [`docs/evidence-capture-checklist.md`](./docs/evidence-capture-checklist.md) の「現在の残タスク」表 |
   | AI 支援の範囲 | [`README.md` の AI の利用について](./README.md#ai-の利用について) |

   ポートフォリオサイト（ns7jp.github.io）は**常に同期先**であり、正本にはしない。
9. **証跡には実行環境と実行者を必ず書く**（2026-08-25 制定）。「実機」という語は、何の上で動かしたのかを特定できる場合にのみ使う。使い捨て runner、コンテナ、network namespace、qemu ゲスト、AI 支援セッションの作業環境は、それぞれそのまま書く。**証跡を自動生成するスクリプトは `uname` と実行者を出力に含める。**

### 守れなかったルールの扱い（2026-08-17）

ルール 2 は「週 1 回更新」で制定したが、**2026-07-12 の初回コメント以降、5 週間更新されなかった**（[#8](https://github.com/ns7jp/ns7jp/issues/8) のコメントは 1 件のみ）。

本ポートフォリオの中心的な主張は「宣言と実態の乖離を作らない」である。守れなかったルールを掲げ続けることは、その主張自体への反証になる。したがって**ルールを守れなかった事実を消さずに残したうえで、守れる粒度（月 1 回）へ引き下げる**。頻度を落とすことは後退ではなく、宣言を実態に合わせる作業である。

---

## 0-b. LEARNINGS.md 記入待ちリスト（本人が書く）

[STATUS §0 ルール 7](#0-更新の運用ルール2026-07-03-制定) により、`LEARNINGS.md` は本人のみが編集します。
**題材（事実）はここに置き、書き終えたものだけを `LEARNINGS.md` へ移します。**
必要なのは「学び」を自分の言葉で 2〜3 行書くことだけで、事実部分は下に揃っています。

### 優先（2026-08-24 の B-1〜B-4 実行で見つかった欠陥。一次記録に 1 件も入っていない）

| # | 症状（事実） | どの静的検査が見逃したか | 学び |
| --- | --- | --- | --- |
| 1 | 3 層ラボの層分離チェックが `set -e` に巻き込まれ、**遮断できているときにだけ**演習が中断していた（壊れている環境の方が完走する逆転現象） | shellcheck / ansible-lint / molecule いずれも検出せず | 壊れている環境の方が完走し、正しい環境の方が中断するという逆転現象の発生を学んだ |
| 2 | `storage` role が対象 OS（Ubuntu 24.04 の既定 Ansible）で play ごと失敗していた | 同上 | 検査に使っている ansible-core のバージョンと、配布先（対象 OS の既定パッケージ）のバージョンが違うことが根本原因だと学んだ |
| 3 | `storage` role が冪等でなく、`site.yml` の 2 回目で自分が作った LV を自分の安全装置が拒否した | 同上 | 安全装置が「未知の子デバイス（＝他人のデータかもしれない）」と「自分がこの role で管理しているはずの LV（＝安全）」を区別する手段を学んだ |
| 4 | `labs/routing` が Docker の network 設計と衝突し、**一度も起動できていなかった**（router 用の `.1` が bridge の既定アドレスと衝突） | 同上 | Docker の bridge network が「サブネットの .1」をブリッジ自身の既定ゲートウェイアドレスとして予約する仕様があることを学んだ |

> **#1 は面接映えします。**「テストが、壊れている環境でだけ通る」状態は、
> 試験設計の話として一般化でき、実務でも起こります。

### 次点（題材が揃っているもの）

| # | 症状（事実） | 学び |
| --- | --- | --- |
| 5 | Terraform AWS provider の制約が複数ファイルに分散し、Dependabot PR が必ず CI を落ちた（`no available releases match the given constraints ~> 5.50, ~> 6.58`）。原因は `dependabot.yml` の `directories` の列挙漏れ | 網羅性を主張する行をどこかに書いた瞬間、そこはもう検証対象だと考えることを学んだ |
| 6 | 依存更新 PR を 3 か月放置した。ADR に「見直しトリガー」を書く運用にしたのに、運用そのものが回っていなかった | 依存関係更新のように「継続的に発生し続けるタスク」は、1回限りの個別対応では終わらないので、対応の「型」（採用可否の判断基準など）を決めても、それを回す頻度・トリガー・責任の所在を運用として仕組み化する必要があることを学んだ |
| 7 | 3 行しかない依存ファイル（`ansible/controller-requirements.txt`）を、別々の Dependabot PR 3 本がそれぞれ 1 行ずつ書き換えていた。2 本を merge した後、3 本目が `405 merge conflicts` で弾かれた。`git merge-tree` で見ると、行の前後に十分なコンテキストが無いため 3-way merge が変更点を分離できず、ファイル全体を 1 個の衝突として扱っていた（2026-08-26） | 「変更対象の見た目が独立している（別の行、別のパッケージ）」ことと、「gitが構造的に独立した変更として検出できること」は別物であり、ファイルが小さいほどこの差が顕在化しやすい、という限界を学んだ |
| 8 | Phase 1 演習キットの `00-create-internal-switch.ps1` を Hyper-V ホストで初回実行したところ、`New-VMSwitch` が権限不足で失敗した。その調査で、スクリプト自体が失敗を検知できておらず、失敗したのに「作成しました」と成功表示していたことが分かった（PowerShell の既定の非終了エラーのため）（2026-08-26） | （記入） |
| 9 | 続けて `01-create-vm.ps1` を実行したところ、日本語コメント・文字列が文字化けし、さらに構文エラー（文字列の終端記号が無い等）で実行できなかった。原因は、スクリプトが UTF-8（BOM 無し）で保存されており、Windows PowerShell 5.1 が BOM の無いファイルをシステムの ANSI コードページ（Shift-JIS）として読んでいたこと（2026-08-26） | （記入） |

### 実施待ち

- LPIC-1 学習でつまずいた箇所（[#5](https://github.com/ns7jp/ns7jp/issues/5) と連動）
- 就業先で遭遇した障害・問い合わせのうち、技術的な学びとして一般化できるもの
  （社名・システム名・IP・アカウント名は書かない。判断に迷う場合は書かない）

---

## 1. 本リポジトリ（ns7jp/ns7jp）

### 2026-08-26 の更新内容（08 AD構築演習設計：OU・グループ・GPO・パスワードポリシー・ヘルスチェック・バックアップ）

[01 学習環境 §6](./docs/learning-plan/01-environment.md#6-windows-server-の学習環境任意)が学習範囲に挙げながら、
どの資料にも詳細設計がなかった「OU 設計」「グループポリシーの基本」を埋めるため、
[docs/learning-plan/08-ad-exercise-design.md](./docs/learning-plan/08-ad-exercise-design.md) を新規作成した。
[Windows / AD 公開再現ラボ](./docs/evidence/templates/windows-ad-lab.md)のフォレスト昇格・単一 OU・単一グループという
最小構成を起点にし、そこで終わっていた設計を、実務の AD 構築案件が扱う範囲（OU 階層・AGDLP グループ戦略・
GPO の作成とリンク・パスワードポリシー（既定 + 細分化）・FSMO 確認・`dcdiag`/`repadmin` によるヘルスチェック・
システム状態バックアップと権威復元）まで拡張する。

| 内容 | 詳細 |
| --- | --- |
| 演習設計 | [03 構築工程の実務ドキュメント](./docs/learning-plan/03-build-process.md)の様式（パラメータシート・構築手順書・試験項目書）で、OU 階層 6 個・AGDLP グループ 3 個・GPO 2 個（Computer/User Configuration を分離）・細分化パスワードポリシー（PSO）1 個・システム状態バックアップと `ntdsutil` による権威復元までコマンドと想定結果を具体化した。試験項目書は単体 12 件・結合 4 件・総合 2 件・異常系 8 件の計 26 件（異常系 31%） |
| 重複の排除 | windows-ad-lab.md §4（フォレスト昇格）・§8（90 日棚卸し）・§9（DNS 障害注入・ドメイン参加）、[06 §4.4](./docs/learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト)（CSV 一括ユーザー作成）とは範囲を分け、本書はそれらが作った状態を前提条件として使うのみで再掲しない。役割分担は本書の付録 B に一覧化した |
| 基礎解説 | 「基礎から」の演習にするため、フォレスト/ドメイン/サイトの階層、FSMO 5 ロール、グループの種類とスコープ・AGDLP 戦略、GPO の処理順序（LSDOU）と Computer/User Configuration の適用範囲の違い、SYSVOL/DFSR、AD ごみ箱と tombstone を付録 A にまとめた |
| 整合性チェック | markdownlint（49 ファイル、0 件）、Mermaid 構文検証（19 図、全パース成功）、`github-slugger`（GitHub と同じ見出しアンカー生成ライブラリ）を使って自作したリポジトリ内リンク・アンカーの解決チェック（49 ファイル、0 件切れ）をローカルで実行した。このチェックで本書内の誤ったアンカー参照 3 件（`06`・windows-ad-lab.md への参照）を発見し修正した |
| 技術精査 | AD DS / PowerShell / GPO / FSMO / DSRM 権威復元のコマンドと挙動を Microsoft Learn 等の一次情報と突き合わせる独立レビューを実施。致命的な誤りは無かったが、`wbadmin` の `-backupTarget:E:\` を公式サンプルどおりの `-backupTarget:E:`（末尾バックスラッシュなし）へ統一し、付録 A のユニバーサルグループの説明を「Linked Value Replication により差分レプリケートだが、メンバー一覧はグローバルカタログへ可視化される」という現行のドメイン機能レベルに即した記述へ訂正した |
| 状態 | **設計のみ・未実施**。前提となる windows-ad-lab.md §4 のフォレスト昇格自体が本書執筆時点で `NOT RUN` のため、本書のいずれの手順も未着手。試験項目書 T-01〜T-26 の実測結果欄はすべて空欄 |

### 2026-08-26 の更新内容（追補3：網羅範囲の縮小 — IT サポート・Windows 補助証跡・中長期ロードマップの整理）

未経験のサーバー構築エンジニア志望のポートフォリオとして、網羅している内容の範囲が広すぎるという
指摘を受け、第一志望（Linux サーバー構築）との関係が薄い項目を削減した。

| 対応 | 内容 |
| --- | --- |
| IT サポート業務資料の削除 | `docs/it-support/`（FAQ・アカウント管理・トラブルシューティング・Service Desk メトリクスの 4 本）を削除。IT サポート・社内 SE 補助は応募先次第の補助トラックであり、Linux サーバー構築より優先度が低いため |
| Windows / AD 関連の圧縮 | `docs/evidence/templates/windows-winget-provisioning.md`（端末セットアップテンプレート）を削除。現職（Windows Server / AD 研修）を反映する技術的な部分（[06 シェルスクリプト演習設計 Level 4（AD 操作）](./docs/learning-plan/06-shell-scripting-exercise-design.md#44-level-4-active-directory-運用スクリプト)、[Windows / AD 公開再現ラボ](./docs/evidence/templates/windows-ad-lab.md)）は差別化材料として最小限残した |
| 中長期ロードマップの一本化 | 実装・実機検証が一切ない `docs/roadmap/` 配下の個別設計書 10 本（分散トレーシング、インシデント対応、セキュリティ運用、キャパシティプランニング、メタモニタリング、FinOps、DB 運用、ネットワーク運用、ID 運用、カオスエンジニアリング）と `docs/server-monitor-improvements/08-kubernetes-roadmap.md` を削除し、[今後の興味リスト](./docs/roadmap/README.md)という短い一覧へ集約した |
| 相互参照の修正 | 上記の削除に伴い、README・本ファイル・ADR・server-monitor 改善設計・学習プラン・証跡採録チェックリスト・career-bridge・target-roles など約 20 ファイルのリンクを修正・削除した |
| 整合性チェック | markdownlint（45 ファイル、0 件）、Mermaid 構文検証（16 図、全パース成功）、リポジトリ内リンク・アンカーの解決チェック（934 件、0 件切れ）を実行し、いずれも問題なし |

削除した設計は破棄したのではなく、実装が伴わないまま個別ページとして積み上がっていた状態を、
実際の到達度に合わせて縮小したものである。着手時期が近づいた際は、改めて一次導線へ追加する。

### 2026-08-26 の更新内容（追補4：06 Windows/PowerShell 側 Level 1・2・演習A の実行、演習B〜E の実施キット準備）

[06 シェルスクリプト演習設計](./docs/learning-plan/06-shell-scripting-exercise-design.md)の 4 章
（Windows／PowerShell）に着手した。この AI 支援セッションには Windows 実行環境は無いが、Linux
コンテナへ PowerShell 7.4.6（公式 tar.gz）を導入できたため、クロスプラットフォームに動作する範囲
（Level 1・Level 2、演習A `Backup-Rotate.ps1`）は Bash 側と同様に**実際に実行**して確認した。

| 内容 | 詳細 |
| --- | --- |
| 実行できた範囲 | 4.1 Level 1（L1-1〜L1-5）・4.2 Level 2（L2-1〜L2-5、L2-2 は `Get-Service` が Linux 版に無いため `Get-Item` で代替）・4.3 演習A `Backup-Rotate.ps1`（A-1〜A-4：圧縮バックアップの展開一致、世代管理、Mutex による排他制御、異常系での transcript 終了と Mutex 解放）を、Linux コンテナ上の PowerShell 7.4.6 で実際に実行し確認した |
| 実行できなかった範囲 | 演習B（サービス操作）・演習C（イベントログ）・演習C フラッグシップ `Invoke-EnvironmentCheck.ps1`・演習D（AD 基礎操作）・演習E フラッグシップ `New-LabUserBatch.ps1` は、`Get-Service` コマンドレット自体が Linux 版 PowerShell 7 に存在しない、`*-EventLog` 系コマンドレットが Windows PowerShell 5.1 専用、`ActiveDirectory` モジュールが無いため、いずれも実行できなかった |
| 実施キットの準備 | 実行できなかった範囲は、[05 の phase1-kit](./docs/learning-plan/phase1-kit/README.md)・[07 の python-ops-kit](./docs/learning-plan/python-ops-kit/README.md)と同じ考え方で [windows-ps-kit](./docs/learning-plan/windows-ps-kit/README.md) として実装した。既存 2 キットの「目視のみ」より一段階踏み込み、PowerShell の構文パーサー（`[System.Management.Automation.Language.Parser]::ParseFile()`）で構文エラーが無いことを確認し、さらに AD/Windows 非依存の部分（ディスク使用率チェック関数、CSV 読み込み・列検証・グループ名導出・`-WhatIf` 既定化ロジック）は関数単体で切り出して実行し、意図どおりの結果を確認した |
| 状態 | **本人が実機（Windows）で再現・検証した記録ではない**。AD ラボドメインの構築自体も [Windows / AD 公開再現ラボ](./docs/evidence/templates/windows-ad-lab.md)側で引き続き `NOT RUN` |

### 2026-08-26 の更新内容（追補：06 Bash 側 Level 1・2・演習B の実行）

06 シェルスクリプト演習設計のうち、演習 A に続けて **Bash 側（3 章）の残り全部**（Level 1・Level 2 のハンズオン全 10 項目、演習 B `env-check.sh`）を、演習 A と同じ AI 支援セッションの作業環境で実行した。

| 内容 | 詳細 |
| --- | --- |
| Level 1・2 | L1-1〜L1-5・L2-1〜L2-5 の全ハンズオンを個別に実行し、到達確認の記述どおりの結果を確認した |
| 追加の発見 | L2-2（`trap ... EXIT`）を `exit` を明示的に呼ばない単純な形で `kill -TERM` を送ったところ、`$?`（`wait` から見た終了コード）は `143` のままだった。演習 A の T-11 で見つけた「`exit "$rc"` を呼んでも `wait` から見た終了コードは変わらない」という発見が、trap 内の実装に関わらず一般的な性質であることの裏付けになった |
| 演習B `env-check.sh` | 設計どおりに実装し `shellcheck` クリーンを確認。ディスク使用率・証明書残日数のしきい値超過/警告の両方の異常系を含めて動作を確認した |
| 環境の制約 | 演習B の B-1（サービス稼働）・B-4（時刻同期）は `systemctl`/`timedatectl` を使うが、このセッションのコンテナは systemd が PID 1 として起動しておらず、実際のサービス起動・停止に対する検知はできなかった（`systemctl` 自体が動作不能というエラーで失敗する状態のみ確認）。集約ロジック（B-5）は、`systemctl`/`timedatectl` をスタブに置き換えて全項目 OK → 終了コード `0` になる経路を別途確認した |
| 状態 | **本人が実機で再現・検証した記録ではない**。Windows（PowerShell）側はこのセッションが Linux コンテナのため引き続き未実施。B-1・B-4 は systemd が動く実機でなければ十分な検証ができない |

### 2026-08-26 の更新内容（追補2：07 Python 運用自動化演習設計の Linux 側を実行）

下記（追補）の設計を、この AI 支援セッションの作業環境（`Linux 6.18.44-fc-v21`、Ubuntu 24.04.4、systemd が PID 1 では
ないコンテナ）上で実際に実行した。lab-base01 / LAB-WINOPS1 という実機での実施ではないが、`routine.py`・`backup.py`・
`check.py` の Linux 側コードは実際に配備・実行し、試験項目書 49 項目中 31 項目の実測結果を得た。
[docs/learning-plan/07-python-ops-automation-exercise-design.md の付録](./docs/learning-plan/07-python-ops-automation-exercise-design.md#付録この作業環境での実行記録)。

| 内容 | 詳細 |
| --- | --- |
| 実行結果 | `routine.py`（Linux、TRL-01〜12 のうち 9 項目）・`backup.py`（TBK-01〜12 のうち 10 項目）・`check.py`（TCK-01〜14 のうち 12 項目）の計 31 項目を実行。30 項目が OK 判定（うち 3 項目は環境に合わせて手順を調整：`journalctl` のバグを発見・修正した上で OK、権限テストは root では再現しないため非 root ユーザーを作って再実行、RTO 計測は稼働中の systemd timer が無いため手動起動で計測）。残り 1 項目（TCK-05・TLS 証明書残日数の OK 判定）はコードは正しく動作したが、`example.com` の実際の証明書残日数が実行時点でしきい値を下回っており `WARNING` になった |
| 発見した不具合 | `routine.py` の `recent_errors()` が、エラーが1件も無い状態でも `journalctl` 自身の境界メッセージ `-- No entries --` を「1件のエラー」として誤検知する不具合を発見。`--quiet` オプションを追加して修正し、設計書のコード例にも反映した。静的レビューでは見つからない類の不具合で、実行して初めて分かった |
| 未実施のまま残る範囲 | Windows 側（`TW-01`〜`11` 全 11 項目）はこの環境に Windows が無いため未実施。systemd timer / タスクスケジューラによる定期実行そのもの（`TRL-06`・`TBK-05`・`TCK-07`・`TCK-08`）は、unit ファイルの静的構文検証（`systemd-analyze verify`）はできたが、稼働中の systemd インスタンスが無いため実登録・実発火は未確認。lab-base01 / LAB-WINOPS1 の実機での実施は依然として今後のタスク |
| 整合性チェック | markdownlint（58 ファイル、0 件）、Mermaid 構文検証（55 図、全パース成功）、`lychee --include-fragments`（CI と同じツール）でリポジトリ全体 0 エラーを再確認した |

### 2026-08-26 の更新内容（追補3：07 Python 運用自動化演習設計の実施キットを準備）

上記（追補2）で Linux 側ロジックの実行確認までは進んだが、Windows 側（`TW-` 全 11 項目）と
lab-base01 / LAB-WINOPS1 という実機（VM）での実施はこの AI 支援セッションには行えない
（Windows 実行環境も Hyper-V ホストへのアクセスも無い）。本人が実機で実施する際の準備物として、
[Phase 1 演習の実施キット](./docs/learning-plan/phase1-kit/README.md)と同じ考え方で
[docs/learning-plan/python-ops-kit/](./docs/learning-plan/python-ops-kit/README.md) を新規作成した。

| 内容 | 詳細 |
| --- | --- |
| キットの中身 | Linux / Windows それぞれの配置用ファイル一式（`routine.py`・`backup.py`・`check.py` とその YAML 設定）、systemd unit 6 本、タスクスケジューラ登録用 PowerShell スクリプト 3 本、LAB-WINOPS1 用 Hyper-V PowerShell スクリプト 5 本（Internal スイッチ作成・VM 作成・チェックポイント操作・TLS 試験用の外部疎通の一時追加撤去）、進捗チェックリスト、証跡記入用テンプレート |
| ファイル分割と疎通確認 | 07 章の中核コード例（可読性のため単一ファイル）を、同章の「ファイル/関数構成」表が示す `backup_common.py`/`backup_linux.py`/`backup_windows.py`/`backup.py`、`routine_common.py`/`routine_windows.py` という複数ファイル構成へキット作成時に分割した。Linux 側（`linux/` 配下）はこの分割構成のまま AI 支援セッションの作業環境（Python 3.12.3 venv）で実際に動かし、`backup.py backup`→`restore` の往復でアーカイブが元データと完全一致すること、`check.py` の6チェックが正常動作すること、`routine.py` のディスク確認・ドライラン削除が正しく動作することを確認した（lab-base01 実機ではなく、このセッション自身のコンテナ上での疎通確認。07章付録の正式な試験IDの再実施ではない） |
| 未検証の範囲 | Windows 実行環境にも Hyper-V ホストへのアクセスにもこの AI 支援セッションからは到達できないため、`windows/` 配下と `hyperv/*.ps1` は一度も実行していない（構文は目視で確認したのみ）。Linux 側も、systemd timer による実際の定期実行登録・発火、専用アカウント（`opsadmin`/`svc-monitor`）での実行、lab-base01 実機での実施はまだ行っていない |
| 状態 | **未実行の雛形。** 07 章の実施ステータス（Windows 側・実機・定期実行が未実施）は変わらない |

### 2026-08-26 の更新内容（Phase 1 演習：実施キットの準備）

[「コードでは埋められない、残っている穴」の 2 番目](#コードでは埋められない残っている穴)（空の VM に OS を入れるところからやっていない）は、
05 の演習設計だけでは埋まらない。この AI 支援セッションの実行環境には KVM/qemu が無く、VirtualBox/Hyper-V での
実機 VM 作成ができないため、本人が Hyper-V で実施する際の準備物として
[docs/learning-plan/phase1-kit/](./docs/learning-plan/phase1-kit/README.md) を新規作成した。

| 内容 | 詳細 |
| --- | --- |
| キットの中身 | netplan・`sshd_config.d` の設定ファイル雛形、Hyper-V 用 PowerShell スクリプト 6 本（Internal スイッチ作成・VM 作成・チェックポイント操作・検証用セグメントの追加撤去）、進捗チェックリスト、証跡記入用テンプレート |
| 未検証の範囲（当初） | Hyper-V ホストへのアクセスが無いため、PowerShell スクリプトは目視での構文確認のみで一度も実行していない。cmdlet の実際の挙動・エラーメッセージは未検証だった |
| 状態 | **未実行の雛形。** 演習そのもの（空の VM への OS インストール）の実施ステータスは変わらず「設計のみ・未実施」のまま。この穴は残タスクのまま |

**追記（同日・本人が実機で初回実行）**: 本人が Hyper-V ホストで `00-create-internal-switch.ps1` を実行し、`New-VMSwitch` が
権限不足（`VirtualizationException`）で失敗する事象に遭遇した。その調査で、スクリプト側に**実バグ**が見つかった。
`New-VMSwitch` が失敗しても PowerShell の既定動作（非終了エラー）のままだと後続の `Write-Host` がそのまま実行され、
失敗したのに成功したと表示していた（`スイッチ 'lab-internal'（Internal）を作成しました。`）。`hyperv/*.ps1` 全 5 本に
`$ErrorActionPreference = 'Stop'` と `try/catch` を追加し、実際の成否を判定してから成功メッセージを出すよう修正した
（詳細は [phase1-kit/README.md の未検証の範囲](./docs/learning-plan/phase1-kit/README.md#未検証の範囲)）。元の権限エラー
自体（Hyper-V の実行権限・グループ設定）はスクリプトの不具合ではなく、実施者側の環境の問題として引き続き対応中。

**追記2（同日・`01-create-vm.ps1` の実行で見つかった 2 件目の実バグ）**: `hyperv/*.ps1` が UTF-8（BOM 無し）で
保存されていたため、Windows PowerShell 5.1（PowerShell 7/pwsh ではない、Windows 既定の Desktop 版）が
BOM の無い `.ps1` をシステムの ANSI コードページ（日本語 Windows では Shift-JIS）として読み込み、UTF-8 の
日本語コメント・文字列がバイト単位で誤読された。文字化けだけでなく `"` の対応がずれて構文エラー（文字列の
終端記号が無い、`}` が無い）にまで発展していた。`hyperv/*.ps1` 全 5 本の先頭に UTF-8 BOM を追加して修正した。
`netplan/*.yaml`・`sshd/*.conf` は Linux ゲスト側で消費するため、BOM を付けると壊れる可能性があり対象外とした。

### 2026-08-26 の更新内容（追補：06 演習 A `backup-rotate.sh` の初回実行）

下記の 06 シェルスクリプト演習設計のうち、Bash 側フラッグシップ演習 A（`backup-rotate.sh`）を
**AI 支援セッションの作業環境**（コンテナ、`Linux 6.18.44-fc-v21`、bash 5.2.21、root 権限）で実装・実行し、
[試験項目書](./docs/learning-plan/06-shell-scripting-exercise-design.md#試験項目書) T-01〜T-12 を採録した（12/12 OK）。

| 内容 | 詳細 |
| --- | --- |
| 実行内容 | 設計書どおりに `backup-rotate.sh` を実装し `shellcheck` クリーンを確認したうえで、正常系 7 件・異常系 5 件（多重起動、強制終了、書き込み不可、対象ディレクトリなし、ディスク容量不足）を実行した |
| レビューで指摘された不具合の検証 | 事前の独立レビューで指摘・修正した 2 点（`trap` の終了コード上書き、`tar` 失敗時の後始末）が、実行によって実際に正しく機能することを確認した（T-08〜T-12） |
| 環境起因の代替手順 | 3 件（T-07・T-09・T-11）は、想定環境（Ubuntu 24.04 の `lab-base01`）と異なる代替手順・観察になった。詳細は試験項目書の各行注記を参照。特に T-09 は、このセッションが常に root 権限のため `chmod 555` では書き込み不可を再現できず（root は DAC をバイパスするため）、`chattr +i` で代替した |
| 実行して分かったこと | T-11（`kill -TERM` 中断）で、`trap ... EXIT` はシグナル終了時も発火しロック解放・後始末は機能したが、trap 内で捕捉した `$?` は `0` になり、`wait` で見える実際のプロセス終了コード `143`（SIGTERM 由来）とは一致しなかった。設計書のシグナル終了時の記述はロック解放・クリーンアップの発火自体については正確だが、`$?` の具体的な値までは踏み込んでいなかった |
| 状態 | **本人が実機で再現・検証した記録ではない**。Level 1・2、演習 B、Windows（PowerShell）側はいずれも未実施のまま。raw ログは AI セッションの一時領域にのみ存在し、[7 章の証跡採録計画](./docs/learning-plan/06-shell-scripting-exercise-design.md#7-証跡採録計画)が想定する `server-monitor` 側への保存はまだ行っていない |

### 2026-08-26 の更新内容（追補：07 Python 運用自動化演習設計：定型作業・バックアップ・監視チェック）

下記の 06 シェルスクリプト演習設計と同じ日に、同じ W4 / W18 の題材（定型作業・バックアップ・監視チェック）を Python で扱う
発展演習として、[05 Phase 1 演習設計](./docs/learning-plan/05-phase1-exercise-design.md)と同じ様式で、Linux（lab-base01）と
Windows（新規ラボホスト LAB-WINOPS1）の両方を対象にした演習設計を新規作成した。
[docs/learning-plan/07-python-ops-automation-exercise-design.md](./docs/learning-plan/07-python-ops-automation-exercise-design.md)。
06 とは言語（Bash/PowerShell と Python）が異なる並行案であり、どちらか一方が他方を置き換えるものではない。AD 操作は扱わないため、
「コードでは埋められない、残っている穴」5 番目への対応は 06 側が担う。

| 内容 | 詳細 |
| --- | --- |
| 演習設計 | `routine.py`（Linux / Windows）・`backup.py`（tarfile / zipfile、SHA-256 manifest によるリストア検証）・`check.py`（Nagios 系終了コード規約でのしきい値監視）の 3 本を独立ツールとして設計し、systemd timer / タスクスケジューラへの定期実行登録まで、[03 構築工程の実務ドキュメント](./docs/learning-plan/03-build-process.md)の様式（パラメータシート・構築手順書・試験項目書）でコマンドと想定結果まで具体化した |
| 精査 | 4 本のモジュール（`routine.py` Linux 実装・Windows 実装・`backup.py`・`check.py`）をそれぞれ独立した技術レビューにかけ、Python / systemd / Windows タスクスケジューラ・イベントログ API の記述、および構築手順書と試験項目書の期待結果の整合性を確認し、指摘のあった 23 件（Windows 版イベントログ抽出が「該当イベントなし」と「アクセス拒否」を区別できていなかった点、`backup.py` のリストアが manifest 検証を経ずに展開してしまっていた点、両モジュールの異常系ログ出力が未実装だった点、Ubuntu Server 24.04 の最小構成に `python3-venv` が入っておらず `venv` 作成手順が失敗する点 等）を反映した。あわせて、4 本を統合する過程で見つかった Windows 版バックアップ・監視チェックの venv 未使用（グローバル Python への `pip install`）を統一し、GitHub の見出しアンカー生成規則を実装で再現したうえで文書内リンク・外部リンクを `lychee --include-fragments`（CI と同じツール）で 0 エラーまで確認した |
| 状態 | 設計時点では**設計のみ・未実施**（試験項目書 TRL-01〜TRL-12、TW-01〜TW-11、TBK-01〜TBK-12、TCK-01〜TCK-14、計 49 項目の実測結果欄はすべて空欄）だった。同日中に Linux 側 31 項目を実際に実行した経緯は上記（追補2）を参照。Windows 側・実機（lab-base01 / LAB-WINOPS1）・定期実行そのものは今も未実施 |

### 2026-08-26 の更新内容（06 シェルスクリプト演習設計：Linux (Bash) / Windows (PowerShell)）

[STATUS.md の「コードでは埋められない、残っている穴」の 5 番目](#コードでは埋められない残っている穴)（研修で触れている Windows Server / AD が portfolio に出ていない）に対応する土台として、[docs/learning-plan/06-shell-scripting-exercise-design.md](./docs/learning-plan/06-shell-scripting-exercise-design.md) を新規作成した。

| 内容 | 詳細 |
| --- | --- |
| 演習設計 | [02 フェーズ別カリキュラム](./docs/learning-plan/02-curriculum.md) W4 / W18 が見出しだけで済ませていたシェルスクリプト学習項目を、Linux（Bash）と Windows（PowerShell）の両方で基礎文法から実務水準まで具体化した。Windows 側は [01 学習環境 §6](./docs/learning-plan/01-environment.md#6-windows-server-の学習環境任意)が 1 行で済ませていた「PowerShell での一括操作」を、Windows サービス操作・イベントログ操作・ラボドメインに対する Active Directory 操作（ユーザー・グループ・OU、CSV 一括作成、棚卸し）まで含めて新規に設計した |
| 技術検証 | Bash（`set -euo pipefail` の除外条件、`trap` の発火条件、`flock` のロック解放、パイプラインの終了ステータス伝播 等）と PowerShell（ストリームの分離、終端/非終端エラーと `try`/`catch`、`$LASTEXITCODE`、`$null` 比較の罠、`Start-Transcript` の多重起動、ネイティブコマンドの終了コード 等）で計 24 件の技術的挙動を独立に検証させ、記述へ反映した |
| 精査 | 3 系統の独立レビュー（Bash の技術的正確性、PowerShell の技術的正確性、AD 操作の正確性と [Windows / AD 公開再現ラボ](./docs/evidence/templates/windows-ad-lab.md)との整合）を通し、15 件の指摘（`trap` が本来の終了コードを上書きする不具合、`Mutex.WaitOne()` の呼び忘れ、`Get-Date -Format` の戻り値型の誤り、`*-EventLog` 系コマンドレットが PowerShell 7 に存在しないこと、`Add-ADGroupMember` の重複時の挙動誤認 等）をすべて反映した |
| 整合性チェック | markdownlint（57 ファイル、0 件）、Mermaid 構文検証（54 図、全パース成功）、リポジトリ内リンク・アンカーの解決チェック（209 件、0 件切れ）をローカルで実行し、いずれも問題なし |
| 状態 | **設計のみ・未実施**。全試験項目書の実測結果欄は空欄。Level 4（AD 操作）はさらに [Windows / AD 公開再現ラボ §4](./docs/evidence/templates/windows-ad-lab.md#4-greenfield-ad-ds--dns-forest-の構築)のラボドメイン構築（これ自体も `NOT RUN`）が前提条件になる |

### 2026-08-25 の更新内容（Phase 1 演習設計：空の VM からの初期構築）

「コードでは埋められない、残っている穴」の 2 番目（空の VM に OS を入れるところからやっていない）に対応する
演習設計を新規作成した。[docs/learning-plan/05-phase1-exercise-design.md](./docs/learning-plan/05-phase1-exercise-design.md)。

| 内容 | 詳細 |
| --- | --- |
| 演習設計 | Ubuntu Server 24.04 LTS を空の VM（`lab-base01`）へ導入し、[01 学習環境](./docs/learning-plan/01-environment.md)の初期設定チェックリストを、[03 構築工程の実務ドキュメント](./docs/learning-plan/03-build-process.md)の様式（パラメータシート・構築手順書・試験項目書・切り戻し手順）でコマンドと想定結果まで具体化した |
| 精査 | 4 系統の独立レビュー（Linux/Ubuntu 24.04 コマンドの実機挙動、リポジトリ内の記述との整合、STATUS §0 の開示ルールとの整合、設計としての実施可能性）を通し、69 件の指摘のうち検証で残った 42 件（cloud-init と sshd_config.d の読み込み順序が逆で SSH 強化が無効化される、`authorized_keys` を `644` にしても OpenSSH は拒否しない、試験に必要な「許可セグメント外」の接続元がラボ構成に存在しない、切り戻し手順に実在する復元先が無い、他ドキュメントの記述を誤って引用していた 等）を反映した |
| 状態 | **設計のみ・未実施**。試験項目書 T-01〜T-21 の実測結果欄はすべて空欄 |

### 2026-08-23 の更新内容（追補：構築の基礎を埋める・RHEL 系対応・提示の整理）

ポートフォリオ全体のレビューで挙がった穴のうち、**コードで埋められるもの**を実装した。

| 対応 | 内容 | リポジトリ |
| --- | --- | --- |
| RHEL 系対応 | `common` / `docker` / `nginx` role を Debian 系 / RHEL 系の両対応に再構成（`dnf`、firewalld の rich rule + rate limit、SELinux、dnf-automatic、`sshd_config.d` の上書き検査）。Molecule に `el9` シナリオを追加 | server-monitor |
| ディスク設計 | `storage` role を新設（LVM の VG / LV / filesystem / fstab / online 拡張）。安全装置の negative test を 7 ケース実装 | server-monitor |
| 3 層構成 | `labs/three-tier`（nginx / gunicorn / PostgreSQL、層を分離）。層別 health endpoint、障害切り分け演習、DB 復元演習 | server-monitor |
| L2 / L3 | `labs/routing`（静的ルート、`ip_forward`、802.1Q VLAN）。default route を持たない構成 | server-monitor |
| 証跡の自動生成 | B-1〜B-4 の演習スクリプトが実行結果から証跡を生成する。判定は期待値との比較で、手で PASS を書けない | server-monitor |
| 手順書のずれ修正 | パラメータシートの時刻同期が `systemd-timesyncd` のままだった（実装は chrony）。ディスク・ユーザー・SELinux の欄を追加し、ずれを検出する回帰テストを追加 | server-monitor |
| 試験仕様書の見え方 | 全項目 `NOT RUN` の理由と、実測済み範囲への索引を冒頭に追加 | server-monitor |
| AI 開示の修正 | 「文書の整形」だけでなく**実装コードの生成にも使っている**ことを明記。`git log` の `Author: Claude` と整合させた | 3 リポジトリ |
| 免責の圧縮 | 1 ページ版・target-roles で 4 重複していた未実測リストを、証跡台帳へのリンク 1 か所に集約 | ns7jp |
| 自己採点 | 学習プランの G1〜G6 に本人の到達状況（○ / △）と、残る 3 つの穴を明記 | ns7jp |
| 重複の解消 | ポートフォリオサイトに残っていた Promtail 版監視スタックをアーカイブ扱いに（server-monitor 側は Alloy へ移行済みで、記述が矛盾していた） | ns7jp.github.io |

#### 2026-08-24 の更新：B-1〜B-4 をすべて実機で実行し、証跡を採録した

上で「動くはず」と書いていた B シリーズ 4 本を、実際に実行して確認した。
device-mapper が無い環境では qemu で Ubuntu 24.04 を起動し、コンテナが
使えない環境では `docker` をスタブに置き換えて script の判定ロジックを
先に検証してから実機で走らせる、という手順を踏んだ。

| 演習 | 結果 | 証跡 |
| --- | --- | --- |
| B-1 ディスク設計・LVM 拡張 | 5 PASS / 0 FAIL | [`2026-08-24-B-1.md`](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-1.md) |
| B-2 3 層構成の障害切り分け | 9 PASS / 0 FAIL | [`2026-08-24-B-2.md`](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-2.md) |
| B-3 DB バックアップ・復元 | 7 PASS / 0 FAIL（RTO 0.149 秒 / RPO 2.344 秒） | [`2026-08-24-B-3.md`](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-3.md) |
| B-4 L2 / L3 切り分け | 6 PASS / 0 FAIL / 3 SKIP-ENV（VLAN 部は kernel 都合で未検証） | [`2026-08-24-B-4.md`](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-24-B-4.md) |

**実行して初めて見つかった実バグは通算 29 件（2026-08-25 に台帳を起こして数え直した。
それ以前は「19 件・うち 11 件」と書いていたが、根拠にたどり着けなかったため実数へ改めた。
うち 3 件は同日、el9 の Molecule シナリオを初めて実行して見つけた）。
静的検査（shellcheck / ansible-lint / molecule / 構文検査）で捕まえられたものは 0 件、
うち 6 件は「壊れているのに PASS」する偽 PASS だった。**
1 件ずつの症状・発見方法・修正 PR は
[欠陥台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/defects-found.md)にまとめている。
特に重かったもの:

- 3 層ラボの層分離チェックが `set -e` に巻き込まれ、**遮断できているときにだけ**
  演習が中断していた（壊れている環境の方が完走する、という逆転現象）
- `storage` role が対象 OS（Ubuntu 24.04 の既定 Ansible）で play ごと失敗していた
- `storage` role が冪等でなく、`site.yml` を 2 回目に流すと自分が作った LV を
  自分の安全装置が拒否していた
- B-4 の routing ラボは Docker の network 設計と衝突し、**一度も起動できて
  いなかった**（router 用の `.1` が bridge の既定アドレスと衝突）

いずれも [server-monitor #83〜#90](https://github.com/ns7jp/server-monitor/pulls?q=is%3Apr+is%3Amerged) で修正済み。

このセッションで新しく実測を増やせる範囲はここまで。残るのは次の
「コードでは埋められない、残っている穴」のみ。

#### コードでは埋められない、残っている穴

1. **恒久ホストが 1 台も無い。** 再起動後の永続性、24 / 72 時間稼働、
   Slack 実配信、実 DNS / TLS、インターネット越しの UFW がここで止まっている。
   VPS 1 台で大半が解決する。
2. **空の VM に OS を入れるところからやっていない。** 3 層ラボはコンテナ構成。
3. **物理層（L1）に触っていない。** スイッチ、ケーブル、ポート VLAN。
4. **Terraform 約 3,000 行が `apply` 0 回。**
5. **研修で触っている Windows Server / AD / AlmaLinux が portfolio に出ていない。**
   一番の差別化材料が `LEARNINGS.md` の 1 エントリに留まっている。

### 2026-08-23 の更新内容（Git SHA 指定rollback CI）

| 観点 | 対応 |
| --- | --- |
| 追加実測 | [server-monitor PR #77 / run 32611251044](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)でcandidate `84e1492`を配備・検証後、前版`59aa88e`へrollbackしてPASS |
| 合格条件 | revision marker、runtime manifest、app container再作成、stale file除去、loopback bind、Loki取り込みまで再確認 |
| 実行範囲 | GitHub-hostedの使い捨てUbuntu runner、`/opt/server-monitor`、immutable Git SHA |
| 未実測境界 | PR #77のmain反映、永続hostのrollback・再起動・24 / 72時間、Slack実配信、AWS apply / destroy / restore、D-2、Windows / AD・winget公開再現ラボは`NOT RUN` |
| 関連文書 | README、採用担当者向け1ページ版、職務経歴書、証跡索引、採録チェックリストを同期 |

2026-08-22のFull-stack baselineは[PR #75の23/23 PASS](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)で、実測対象`7622a9d`、証跡文書更新`cf9419b`、main merge`4a292026`を区別して保持します。最新の追加runtime実測はPR #77のrollback CIですが、PR branch上の結果でありmain統合済みとは扱いません。

### 2026-08-22 の更新内容（hardened Full-stack E2E・3 リポジトリ同期）

| 観点 | 対応 |
| --- | --- |
| README 冒頭 | 主作品の価値を「使い捨て Ubuntu 24.04 への新規構築から監視・障害復旧・backup / restoreまでを一気通貫で検証し、23/23 ID PASS」と明示 |
| 最短確認先 | [案件概要](https://ns7jp.github.io/project-brief.html)・[最新の実測証跡](https://ns7jp.github.io/evidence-demo.html)・[2 分 15 秒の歴史的証跡リプレイ](https://ns7jp.github.io/demo.html)の3役割に分離 |
| 動画の公開状態 | 保存済み実測画面と D-1 復旧ログを再構成した証跡リプレイを公開。**実操作の連続録画ではない**ことを映像内・ページ上・プロフィールで明記 |
| 実測範囲 | runtime commit `7622a9d`を Docker 導入済み runner で検証。`site.yml` 2 回目 `changed=0`、core 10 services + CI sink（計 11 containers）、Docker API proxy の GET 成功・POST 拒否・Loki log 到達、local webhook、network / UFW、D-1 RTO 1 秒、3 volumes restore を23/23 PASS |
| 未実測境界 | Slack 実配信、AWS、D-2、Docker 未導入の引き渡し対象ホストと別の独立管理端末、組織 DNS、ホスト再起動後の永続性、24時間・72時間の継続稼働。runner 内の結果をこれらへ読み替えない |
| 関連文書 | README、採用担当者向け1ページ版、職務経歴書、証跡採録チェックリスト、ビジュアルショーケースを同期 |
| 3 リポジトリの公開状態 | [server-monitor PR #75](https://github.com/ns7jp/server-monitor/pull/75)（main `4a292026`）、[site PR #25](https://github.com/ns7jp/ns7jp.github.io/pull/25)（main `5ab3367b`）、[profile PR #46](https://github.com/ns7jp/ns7jp/pull/46)（main `c360f84a`）をマージ済み |
| profile docs CI | PR #46 head `20ec405`の [docs-check run 32571600184](https://github.com/ns7jp/ns7jp/actions/runs/32571600184) が SUCCESS。後続変更は改めて検証する |

[2026-08-19 の 11/21 PASS](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-build-validation.md)と[D-1 RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)は当時の履歴として保持します。この節の次に完了したruntime実測は、上記2026-08-23節のPR #77 rollback CIとして別管理します。

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

> **2026-08-17 のこの証跡の範囲を広げて解釈しない。** この記録で確認できたのは「ロールが適用でき、冪等で、期待した状態になる」ところまでです。監視スタック全体の起動と復旧演習は、その後 2026-08-18〜22 に別証跡として採録しました。AWS 適用は引き続き未実測です。

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
| docs CI（markdownlint / Mermaid 構文 / リンク） | ✅ 完了（2026-07 にリンクチェックを強化。PR #46 head `20ec405`の [run 32571600184](https://github.com/ns7jp/ns7jp/actions/runs/32571600184)でも SUCCESS、main merge `c360f84a`） |
| デモ動画台本 | ✅ 整備済み。2026-08-22 に歴史的証跡リプレイを公開（実操作の連続録画は未公開） |
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
- [x] ~~**GitHub プロフィールの Bio・ピン留めリポジトリを設定**~~ → **2026-08-22 完了**。公開 Bio を「サーバー設計・構築エンジニア志望」から始まる文面へ更新し、ログアウト状態でピン順が `server-monitor`、`ns7jp`、`post`、`pulse`、`works`、`ns7jp.github.io` であることを確認（[適用記録](./docs/github-profile-settings.md)）

#### 今月（1 晩〜半日・0 円）

- [x] ~~**LEARNINGS.md にトライアル就業中のつまずきを追記**~~ → **2026-08-22 完了**。研修中の AD ドメイン参加時に、クライアント DNS が DC を向いていなかった問題を、機密情報を含めず症状 → 原因 → 対処 → 学びで記録
- [x] ~~**ネットワーク切り分けの一次メモ**（[優先 6](./docs/evidence-capture-checklist.md)）~~ → **2026-08-21 実質完了**。`ss` / `docker port` / `docker inspect` で切り分け、`frontend` ネットワークの `internal: true` がホストへのポート公開を無効化する不具合を発見・原因特定した（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)）。当初想定していたホスト公開ポート経由ではなく、`docker compose exec` 経由・コンテナ IP を直接指定する方法で、名前解決・経路（traceroute）・実際のパケット（tcpdump）のすべてを `internal: true` の制約を受けずに確認できた。なお、このタスク行の見出しは従来「二セグメント障害ラボの実行ログ」となっていたが、それは別タスク（[labs/network-troubleshooting](https://github.com/ns7jp/server-monitor/tree/main/labs/network-troubleshooting)、2026-08-19 に別途採録済み）を指しており、優先6の内容と一致していなかったため見出しも訂正した
- [ ] **Alertmanager → Slack の実通知配信**（[現行順位 3](./docs/evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)、Slack Webhook が必要）

#### 継続

- [ ] **Issue #5〜#8 の月次更新**（§0 ルール 2。週 1 回から緩和済み）
- [x] ~~**ポートフォリオサイト（ns7jp.github.io）を本 README の構成へ同期**~~ → **2026-08-22 完了**。[PR #23](https://github.com/ns7jp/ns7jp.github.io/pull/23)で採用担当者向け階層、[PR #24](https://github.com/ns7jp/ns7jp.github.io/pull/24)で証跡リプレイとE2E現況、[PR #25](https://github.com/ns7jp/ns7jp.github.io/pull/25)で証跡整合性とアクセシビリティを改善。site main SHAは [`5ab3367`](https://github.com/ns7jp/ns7jp.github.io/commit/5ab3367b6c8b298d62ee786bb23a3392ec3040c6)
- [ ] 業務改善レポートの **想定値部分を実数に置き換え**（記憶 / 当時の上長への確認次第）

#### 就業内容が固まってから

- [ ] 実操作の連続録画を常設公開（2026-08-18・19 の保存済み証跡を再構成した2分15秒リプレイは公開済み。E2E artifact の terminal cast は全工程の連続動画ではない）
- [ ] **Windows / AD の公開可能な再現証跡を採録**（旧優先 8）。研修での AD DS 構築・DNS 障害切り分けは [LEARNINGS.md](./LEARNINGS.md) に記録済みだが、PowerShell のユーザー作成・棚卸し一次出力は未採録
- [ ] `terraform apply` → `destroy` の実費と Cost Explorer 記録（[現行順位 6](./docs/evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)）
- [ ] IT サポート資料を **実体験ベース** に書き換え（該当業務に従事してから）

---

## 2. ns7jp/server-monitor（別リポジトリ・別セッション作業）

server-monitor には Linux / Docker / Prometheus / Grafana / Nginx / Alertmanager に
加え、ログ集約、構成管理、SLO、復旧手順、AWS IaC のコードが実装されている。
コード実装と実行実績は区別して表示する。

> **実測証跡の現状（2026-08-22 更新）**
>
> **PR #75 の runtime 最終 commit `7622a9d`を使い捨て Ubuntu 24.04 runner で Full-stack E2E 23/23 PASS**
> （[記録](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)）。
> `site.yml` の一括適用と 2 回目 `changed=0`、計 11 containers、Docker API proxy の GET 成功・
> POST 拒否・固有 Nginx log の Loki 到達、runner 内の network / UFW、3 volumes の backup / restore、
> D-1 自動復旧（RTO 1 秒）、Alertmanager から local webhook への FIRING / RESOLVED 配送まで、同一 run で確認した。
>
> これは [2026-08-17 の Molecule 4 ロール完走](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)と、
> [2026-08-19 のローカル D-1（RTO 13 秒）](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)とは別の実測記録であり、いずれも履歴として保持する。
>
> **この証跡の範囲を広げて解釈しない。** local webhook は Slack 実配信ではなく、
> runner 内の network / UFW 検証は独立した管理端末、引き渡し対象ホスト、組織 DNS での検証を代替しない。
> Docker も runner に事前導入済みだった。AWS `apply / destroy`、D-2、Slack 実配信、Docker 未導入の独立対象ホスト、ホスト再起動後の永続性、長期稼働は引き続き未実測である。

### 実装済み / 証跡待ち

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v1.0 | 基本構成（Linux + Docker + Prometheus + Grafana + Nginx + Alertmanager） | ✅ 実装済み。PR #75 E2E で core 10 services + 検証用 sink（計 11 containers）の稼働を確認 | — |
| v1.1 | Loki + Grafana Alloy ログ集約 | ✅ 構成実装済み。Promtail EOL に伴い移行し、Docker API は GET / HEAD 限定 proxy 経由に制限。E2E で固有 Nginx log の Loki 到達を確認 | [01](./docs/server-monitor-improvements/01-loki-log-aggregation.md) |
| v1.2 | Ansible 構成管理 | ✅ roles / playbook 実装済み。**full `molecule test` 4 ロール完走を [2026-08-17 に採録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md)**。さらに [PR #75 の Full-stack E2E](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)で `site.yml` 一括適用・2 回目 `changed=0` を含む 23/23 PASS | [02](./docs/server-monitor-improvements/02-ansible-automation.md) |
| v1.3 | SLO / バーンレートアラート | ✅ rules / dashboard 実装済み。2026-08-22 E2E で local webhook の FIRING / RESOLVED を実測。Slack 実配信は未採録 | [04](./docs/server-monitor-improvements/04-slo-design.md) |
| v1.3 | バックアップ・復旧演習 | ✅ 手順・自動化実装済み。**ローカル D-1 を 2026-08-19 に採録**（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)、RTO 13 秒で PASS）。[PR #75 E2E](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)でも D-1 RTO 1 秒と 3 volumes の backup / restore を PASS。D-2 は未収録 | [05](./docs/server-monitor-improvements/05-backup-recovery-drill.md) |
| v2.0 | AWS + Terraform 化 | ✅ IaC 実装済み。`apply` / Cost Explorer 証跡は未収録 | [03](./docs/server-monitor-improvements/03-terraform-aws.md) |

### 設計済み / 順次実装

| # | テーマ | 状態 | 設計書 |
| --- | --- | --- | --- |
| v3.0 | Kubernetes / EKS 発展計画 | ⬜ 学習ロードマップ段階（就業後の資格計画と連動） | [今後の興味リスト](./docs/roadmap/README.md) |
| v1.2 | 変更管理プロセス | ✅ PR / Issue テンプレートとミニ運用を server-monitor 側へ追加 | [11](./docs/server-monitor-improvements/11-change-management.md) |

### 中長期ロードマップへ縮退（2026-07-03、2026-08-19 追加）

実装着手が 1 年以上先のテーマ、または実装のない純粋な設計サンプルは、選考フェーズの一次導線から外し [docs/roadmap/](./docs/roadmap/README.md) で保管します（設計を捨てたのではなく、露出の優先順位を変更）。

| # | テーマ | 設計書 | 縮退時期 |
| --- | --- | --- | --- |
| 13 | FinOps（コスト最適化運用） | [今後の興味リスト](./docs/roadmap/README.md) | 2026-07 |
| 14 | データベース運用設計 | [今後の興味リスト](./docs/roadmap/README.md) | 2026-07 |
| 16 | アイデンティティ運用 | [今後の興味リスト](./docs/roadmap/README.md) | 2026-07 |
| 17 | カオスエンジニアリング / Game Day | [今後の興味リスト](./docs/roadmap/README.md) | 2026-07 |
| 06 | 分散トレーシング（Tempo + OpenTelemetry） | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |
| 07 | インシデント対応プロセス・ポストモーテム | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |
| 09 | セキュリティ運用プロセス | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |
| 10 | キャパシティプランニング・負荷試験 | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |
| 12 | メタモニタリング（監視の監視） | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |
| 15 | ネットワーク・DNS 運用 | [今後の興味リスト](./docs/roadmap/README.md) | 2026-08 |

> **2026-08-19 追記**: 06 / 07 / 09 / 10 / 12 / 15 は、実装着手時期の遠さに加えて、
> 未経験からのキャリアチェンジという実際のスキル水準に対して内容が高度すぎる
> （インシデントコマンダー制のポストモーテム、ITIL 準拠の変更管理相当の統制、
> 分散トレーシングなど、組織規模や複数人チームを前提にした設計）と判断し、
> ポートフォリオ全体の難易度・スコープを引き下げる整理の一環として追加で移動した。
>
> **2026-08-26 追記**: `docs/roadmap/` 配下の個別設計書 10 本は、実装・実機検証が一切ないまま
> 詳細な設計だけが積み上がる状態になっていたため全て削除し、方向性だけを短い一覧に
> 集約した（[今後の興味リスト](./docs/roadmap/README.md)）。Kubernetes / EKS 発展計画
> （旧 `docs/server-monitor-improvements/08-kubernetes-roadmap.md`）も同じ理由でここへ統合した。

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
> | `actions/checkout`・`actions/setup-python`・`aws-actions/configure-aws-credentials`・`hashicorp/setup-terraform`（元 #48 の一部） | 採用 | [PR #59](https://github.com/ns7jp/server-monitor/pull/59) として作り直し、その後マージ済み |
> | `prometheus-client`（元 #42） | 採用 | 同上。ローカルで実インストールし既存テスト 14 件が通ることを確認済み |
> | `pytest` 8→9（元 #31、メジャー更新） | 採用 | 同上。破壊的変更の報告なし、ローカルで実インストール・テスト実行して確認済み |
> | `aquasecurity/trivy-action` 0.35.0→v0.36.0（元 #48 の一部） | 採用（SHA 固定） | `git clone` してコミット系譜を確認し、v0.36.0 が `GHSA-69fq-xp46-6x23` の安全なコミットの直系の子孫であることを検証してから取り込んだ。可変タグではなくコミット SHA で固定 |
> | `hashicorp/aws` 5.x→6.x（元 #47 ほか、Terraform provider のメジャー更新） | **見送り**（継続） | 破壊的変更の有無を[アップグレードガイド](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/guides/version-6-upgrade)で確認していないため、自動更新に任せない方針を維持。行うときは本人作業とする |
>
> **「7 件が残っている」という表現自体が、実態を追っていなかった証拠**だった。この訂正自体を、
> ポートフォリオが掲げる「宣言と実態の乖離を作らない」という主張を裏付ける記録として残す。

本ポートフォリオは変更管理・保守運用・EOL 追従を主要な訴求点にしており、[LEARNINGS.md](./LEARNINGS.md) にも「採用時に保守状況・EOL 予定を確認していなかった」という反省を含む複数のつまずき記録を残しています。**リポジトリを開いた人に最初に見えるのが 3 か月放置された依存更新 PR である状態は、その訴求と正面から矛盾します。**

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
| Actions / pip 系を処理 | ✅ **2026-08-19: [PR #59](https://github.com/ns7jp/server-monitor/pull/59) をマージ済み**。更新後のCI成功を確認 |

> **面接での価値**: この provider 6.x 移行は、`terraform init` の失敗ログから制約の重複宣言を特定した実例です。**LEARNINGS.md に書く題材として、現時点で最も質が高いもの**です（症状・原因・対処・学びの 4 点が既に揃っている）。
>
> **2026-08-26 追記（再点検と処理）**: 「決着」と書いた 2026-08-19 時点の一覧（#48 / #42 / #31 / #47）には
> **当時の「残り 7 件」に含まれていた `#17`（python 3.12-slim → 3.14-slim）・`#18`（Flask）・`#20` への言及が無く**、
> 実際に GitHub で確認すると `#17` と `#18` は 2026-08-26 時点でも未処理のまま残っていた（`#20` は別途消えており、
> 追わずに放置していたことは変わらない）。加えて `#93`（boto3）・`#94`（botocore）・`#95`（ansible-core）・`#96`（pyyaml）の
> 4 件が新規に滞留していた。7 件を isolated worktree で実際に checkout → install → `pytest` 実行して検証し、
> 次のとおり処理した。
>
> | PR | 内容 | 検証結果 | 処理 |
> | --- | --- | --- | --- |
> | #96 | pyyaml（dev） | venv install 0 エラー、pytest 142 passed | ✅ merge |
> | #95 | ansible-core 2.19.4→2.21.3 | 実 PyPI パッケージであることを確認（Python 3.12+ 必須と判明）、pytest 142 passed | ✅ merge（controller 用の Python バージョン要件が上がる点を PR にコメント） |
> | #94 | botocore 1.40.0→1.43.78 | pytest 142 passed | ✅ merge |
> | #93 | boto3 1.40.0→1.43.78 | **単独では `ResolutionImpossible`**（`boto3==1.43.78` は `botocore>=1.43.78,<1.44.0` を要求） | ❌ 直接 merge 不可。`ansible/controller-requirements.txt` が 3 行しかなく、3 本の PR がそれぞれ 1 行ずつ書き換えるため、2 本を先に merge した時点で 3-way merge がコンテキスト不足で衝突（`405 merge conflicts`）。手動で同内容を適用し直した [PR #102](https://github.com/ns7jp/server-monitor/pull/102) に置き換えて #93 は close |
> | #18 | Flask 3.0→3.1.3 | venv install 0 エラー、pytest 11 passed | ✅ merge |
> | #17 | Docker base image python 3.12-slim→3.14-slim | **検証未完了**。この作業環境のネットワークポリシーが Docker Hub の image blob（`production.cloudfront.docker.com`）と deadsnakes PPA の両方を遮断しており、`docker build` も実 Python 3.14 の取得もできなかった。加えて、この PR 自体が 2026-05-28 時点の古いブランチで、後から追加された `labs/three-tier/ap/Dockerfile`（同じく `python:3.12-slim`）を含んでいない — merge しても 2 つの Dockerfile が別々の Python メジャーバージョンのまま残る | ⏸ 保留。理由を PR にコメント。CI（Docker Hub へ到達できる環境）での実 build・実行、または再作成による対象漏れの解消が必要 |
>
> `#66`（AWS provider 5.x→6.x）は今回も対象外。`terraform` バイナリがこの環境に無く検証できないため、
> 2026-08-19 の見送り判断を継続する。
>
> **記録として残す教訓**: 「決着」と書いた時点でも一覧化が不完全だったため、7 件の一部が 3 か月放置され続けた。
> 一覧化の作業そのものを検証しないまま「決着」と書くと、今回と同じ穴が残る。

### 次に採録する実測証跡

順序・手順は [証跡採録チェックリスト](./docs/evidence-capture-checklist.md) に一元化（2026-08-17 に「必要な環境」順へ組み替え）。

**GitHub Actions で採録済み**

1. ~~full `molecule test` の実行ログ（優先 1）~~ → ✅ **2026-08-17 採録済み**
2. ~~既存 CI の成功ログを証跡台帳へ記録（優先 2）~~ → ✅ **2026-08-19 採録済み**（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-19-ci-baseline.md)）
3. ~~新規構築から冪等性・network / UFW・Docker API proxy・障害復旧・backup / restoreまでの Full-stack E2E~~ → ✅ **2026-08-22 に23/23 PASS**（[PR #75 記録](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)）

**次に採録するもの**

1. Docker 未導入の独立した対象ホストと別管理端末を使った新規構築、network / UFW、待受、SSH tunnel、受け入れ・引き渡し確認
2. 同じ対象ホストの再起動後の永続性と、24時間後・72時間後の継続稼働
3. Alertmanager → Slack の実通知配信（local webhook の FIRING / RESOLVED は2026-08-22に採録済みだが、Slack Webhook は別途必要）
4. ~~ネットワーク切り分けの一次メモ（優先 6）~~ → ✅ **2026-08-21 実質完了**。ポート公開の不具合を発見・原因特定し、名前解決・経路（traceroute）・実際のパケット（tcpdump）のすべてをコンテナ IP 直接指定・`docker compose exec` 経由で確認できた（[記録](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-21-network-firstlook.md)）

**追加環境が必要なもの**

1. Windows / AD の公開可能な PowerShell 実行ログ（研修での AD DS 構築・DNS 切り分けは記録済み。自宅ラボ等で再現する）
2. D-2 ホスト障害復旧演習
3. 承認された AWS 検証で `plan` / `apply` / `destroy` と Cost Explorer 実費（[現行順位 6](./docs/evidence-capture-checklist.md#現在の残タスクlinux-サーバー構築を最優先)）

---

## 3. その他の関連リポジトリ・サイト

「関連リポジトリ全体を一元管理する」宣言に合わせ、学習作品も状態を明記します。

| リポジトリ / サイト | 位置付け | 状態 |
| --- | --- | --- |
| [server-monitor](https://github.com/ns7jp/server-monitor) | 主作品（Linux サーバー構築・運用） | [PR #75](https://github.com/ns7jp/server-monitor/pull/75)まで main へマージ済み。§2 のとおり |
| [post](https://github.com/ns7jp/post) | 学習作品（PHP / MySQL、CSRF / bcrypt / PDO） | 完成・公開中。DB 運用は[今後の興味リスト](./docs/roadmap/README.md)の題材 |
| [pulse](https://github.com/ns7jp/pulse) | 学習作品（PHP / SQLite） | 完成・公開中 |
| [works](https://github.com/ns7jp/works) | 学習作品集（Python / HTML / CSS） | 公開中（学習過程の記録） |
| [ns7jp.github.io](https://ns7jp.github.io/) | ポートフォリオサイト | ✅ 同期済み（PR #23〜#24で採用担当者向け階層・証跡リプレイ・E2Eを統合し、[PR #25](https://github.com/ns7jp/ns7jp.github.io/pull/25)で証跡整合性とアクセシビリティを改善。main SHA `5ab3367`） |

---

## 4. 既知の制約・注意

- 本リポジトリの **IT サポート系ドキュメント**（FAQ / TS / Account / Service Desk Metrics）は実体験ではなく業務設計サンプルです（各文書冒頭にも明記）
- **業務改善レポート** はコア事実（約 1 時間短縮）以外は再構成した想定値を含みます
- **資格ロードマップ** の日程は現時点での計画案であり、確約ではありません（変更は[見直し記録](./docs/certifications/roadmap.md)に残します）
- **server-monitor の改善コード 01-05 は別リポジトリに実装済み**。Full-stack E2E の範囲は
  2026-08-22 に実測済みですが、AWS 稼働・費用、Slack 実配信、D-2、Docker 未導入の引き渡し対象ホストと別の独立管理端末、組織 DNS、ホスト再起動後の永続性、24時間・72時間の継続稼働の検証は、その証跡が追加されるまで実績として扱いません
- **06 以降は設計サンプル / ロードマップ** であり、実装コードや実測証跡と混同しません
- **ビジュアルショーケース** は公開済み実機キャプチャとテキストモックアップを分離しています。未実測項目は採録できた場合だけ追加します
- **[学習プラン](./docs/learning-plan/README.md) は計画** であり実績ではありません。同ページの「本人の現在地」は自己申告であり、実測証跡の有無は本ファイルと[証跡採録チェックリスト](./docs/evidence-capture-checklist.md)を一次情報とします
- **ドキュメント整備には AI を活用**しています（役割分担は [README の開示セクション](./README.md#ai-の利用について) を参照）
- **実測証跡は複数件へ増加**し、2026-08-22 には PR #75 の Full-stack E2E 23/23 PASS まで採録済みです。一方、Slack 実配信、AWS、D-2、Docker 未導入の引き渡し対象ホストと別の独立管理端末、組織 DNS、ホスト再起動後の永続性、24時間・72時間の継続稼働は未実測のため、新規の設計追加より残る証跡の採録を優先します

これらは採用面接などで実物を見せる際に、**「設計力」と「実績」を明確に区別** して説明してください。
