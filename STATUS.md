# ポートフォリオ進捗 STATUS

このファイルは、公開リポジトリから参照される「更新の運用ルール」「LEARNINGS.md 記入待ちリスト」と、2026-08-24 時点の「コードでは埋められない、残っている穴」だけを残した短い版です。2026-09-23 までの詳しい変更記録は、ポートフォリオ運営のための非公開リポジトリへ移しました。

## 2026-09-23 更新：入口で Windows Server / AD の実測を示し、就業状況を更新

採用担当者が最初に開く README・[採用担当向けページ](docs/overview-for-recruiters.md)・[職務経歴書](docs/resume.md)・[志望トラック](docs/target-roles.md)を書き直しました。

- 9 月に手元の Hyper-V で行った Windows Server / AD / WSUS の実測（AD 構築の必須 31 項目 PASS、System State 復元、2 台目 DC と FSMO 奪取、WSUS の判定 FAIL と原因特定）と、Ubuntu の初期構築を、各ページの先頭に置きました。これまでは主作品の証跡台帳と詳細一覧（`project-reference.md`）にしか載っておらず、`target-roles.md` では AD を「設計サンプル」と書いていました。
- README と採用担当向けページの表から「限界」列をやめ、前提と未実施は README の「この資料の読み方」と採用担当向けページの「正直な境界」にまとめました。
- 自分を「本人」と書いていた箇所を一人称にそろえました（証跡の来歴欄と過去の変更記録は変えていません）。
- **就業状況**: トライアル就業は 2026-09-15 に終了し、現在は求職中です（すぐに勤務を開始できます）。下の 2026-09-17 追補にある「9/11 の確認情報を保持」は、この更新で置き換えます。
- `LEARNINGS.md` は私だけが書く運用のため、変更していません。資格計画も変えていません。

独力での再現と学び一件、VM 再起動・24 時間観測・別 VM 復元・第三者確認は、引き続き未完了です。

- **リポジトリの分割（2026-09-23）**: 初心者向けの教材（やさしいガイド・24 週の学習プラン・用語集・コマンド集・学習用 Issue テンプレート）は [ns7jp/learning](https://github.com/ns7jp/learning) へ、`archive/` の運営ツール一式とこのファイルの全履歴は非公開のリポジトリへ移しました。移動したファイルへのリンクは、移動先の URL に張り替えています。

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
   | 実測値（23/23・RTO・SHA・run ID・PR 番号） | [server 検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md) |
   | 実行して見つかった欠陥の件数 | [server 欠陥台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/defects-found.md) |
   | 採録の優先順位 | [`docs/evidence-capture-checklist.md`](./docs/evidence-capture-checklist.md) の「現在の残タスク」表 |
   | AI 支援の範囲 | [`README.md` の AI の利用について](./README.md#3-つの前提ai-の利用を含む) |

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
| 8 | Phase 1 演習キットの `00-create-internal-switch.ps1` を Hyper-V ホストで初回実行したところ、`New-VMSwitch` が権限不足で失敗した。その調査で、スクリプト自体が失敗を検知できておらず、失敗したのに「作成しました」と成功表示していたことが分かった（PowerShell の既定の非終了エラーのため）（2026-08-26） | PowerShellの非終端エラーは、対話的に使う分には「多少失敗してもスクリプトを止めない」という親切設計だが、無人実行・自動化スクリプトでは「失敗を隠す」機能に反転する。実機で動かして初めて、その反転が起きることを学べた。 |
| 9 | 続けて `01-create-vm.ps1` を実行したところ、日本語コメント・文字列が文字化けし、さらに構文エラー（文字列の終端記号が無い等）で実行できなかった。原因は、スクリプトが UTF-8（BOM 無し）で保存されており、Windows PowerShell 5.1 が BOM の無いファイルをシステムの ANSI コードページ（Shift-JIS）として読んでいたこと（2026-08-26） | このケースでは幸い、文字化けが構文エラー(文字列終端記号が無い等)にまで至ったため、私は「何かおかしい」と気づけた。もしコメント部分だけが文字化けし、コード自体はたまたま構文的に成立してしまっていたら、気づかないまま実行されていた可能性がある。エラーで止まった方がまだ「発見しやすい失敗」だった、という気づきになった。 |

### 9 月分（2026-09 の証跡 60 件から抽出。事実のみ・「学び」は空欄）

2026-08 以降、`LEARNINGS.md` に新規エントリはありません。同じ期間に 9 月の演習記録（証跡）は 60 件増えました。
事実（症状・確認できた数値・証跡へのリンク）はこちらで揃えてありますので、本人は各行の「学び」欄に 2〜3 行書くだけで済みます。
60 件のうち **30 件は題材が 0 件**でした。想定どおりに成功し、外した仮説が無かった演習です。残る 30 件から取れた題材 64 件を、同じ原因・同じ構造のものへ統合し、面接で一般化して話せるものを優先して 12 件へ絞りました（全件は載せていません）。
番号は既存の 1〜9 に続けて 10 から始めています。

| # | 症状（事実） | 学び |
| --- | --- | --- |
| 10 | Nginx（入口のWebサーバー）を計画停止した状態で、app コンテナは healthy を維持したまま `curl` が接続エラー（終了 7）と HTTP 000 を返した。000 は HTTP ステータスではなく、応答を取得できなかったことを示す表示だった。Nginx を手動で再開すると `/healthz` は 200 へ復帰した。利用者の経路は 127.0.0.1:8080 の Nginx を経て app へ届く構成で、app の 5000/tcp はコンテナ側のポートでホストへは公開されていない。「なぜ app が healthy でもアクセスできないか」への回答はその場では出せなかった（2026-09-08、[証跡 compose](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-compose-practice.md)） | |
| 11 | 合否表示・集計・終了コードが実態と違った例が 3 件。(a) 障害演習 D-1 のスクリプトは `recover_seconds 2`・`verdict PASS`・終了コード 0 を出したが、その計測直後のコンテナは health `starting`（起動直後で健全判定が未確定）で、healthy と HTTP 200 は後続の確認で得た。復帰判定が `curl -f` の成功だけに依存し、healthcheck 状態と再起動回数を条件に含めていない。(b) `block` 内で意図的に失敗させた回は、タスク出力に FAILED が出た後に rescue（失敗時の後始末）が走り、最終集計は ok3/changed3/failed0/rescued1・終了コード 0 だった。(c) ログ欠落の検査では、ファイルを開けない場合（No such file or directory / FAILED open or read）も、内容のハッシュが合わない場合も、終了コードはどちらも 1 だった（2026-09-08 [証跡 d1](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-d1-practice.md)、2026-09-14 [証跡 block](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-block-practice.md)、2026-09-15 [証跡 missing-log](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-missing-log-practice.md)） | |
| 12 | 予測だけの実行（`--check`、いわゆる dry-run）と通常実行が、手元でも記録でも区別できていなかった例が 3 件。(a) 適用後の確認として `--check --diff` を案内したが、画像に写っている最後の実行は `ansible-playbook -i localhost, first.yml --diff` で、予測ではなく通常実行だった。結果が changed 0/failed 0・終了 0 で本文が維持されたため、書き換えは起きなかった。(b) 保存済みログ 5 段階では、preview（`--check --diff`）も apply（`--diff`）も changed 1・ANSIBLE_EXIT 0 で、集計行だけでは見分けられなかった。(c) 生成済み `app.conf` が 9999、指定値が 8091 の状態での `--check --diff` は changed1・終了 0 と「9999 削除・8091 追加」を表示したが、実ファイルの本文は staging/9999 のままだった（2026-09-09 [証跡 check-diff](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-09-lab-base01-check-diff-practice.md)、2026-09-15 [証跡 cycle-review](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-cycle-review-practice.md)、2026-09-14 [証跡 drift](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-drift-practice.md)） | |
| 13 | 検査は実行できて問題も出なかったが、守りたい対象が検査の範囲に入っていなかった例が 2 件。(a) 作成直後の `README.md` は未追跡（`?? README.md`）で、その時点の `git diff --check`（空白の混入検査）は README を対象に含んでいなかった。`git diff --check` は作業ツリーの追跡済み変更だけを見る。(b) 5 つの変更ログを tar.gz にまとめて別フォルダーへ展開し、`sha256sum -c` で 5 件すべて OK・終了 0 を得たが、照合に使った `SHA256SUMS.txt` は `cp` 後の作業コピー側（`/home/opsadmin/ansible-change-archive/payload`）で生成したもので、元ログとアーカイブ内容の個別ハッシュ比較は行っていない（2026-09-15 [証跡 checker-readme](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-checker-readme-practice.md)、2026-09-15 [証跡 log-archive](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-log-archive-practice.md)） | |
| 14 | 作業自体は成功していたのに、画面の採り方が原因で証拠として採用できず、再実施または主張範囲の縮小になった例が 4 件。(a) ポート下限 1 の試験は成功していたが、E02 上部で見出しが切れていたため確定証拠に採用せず、入力・`--check`・結果が 1 画面に収まる形で E06 に再採録した。(b) tar 展開後の復元先の `du` 約 1.0M と終了 0 は同じ画像に写っていたが、直前の展開コマンド行が画面外だったため、判定を「PASS（限定）」とした。(c) アーカイブ展開直後の「5 件すべて OK」は実行結果の画像が提供されず、試験の基準状態を未採録として扱った。(d) `-e` なしの初回実行はコマンド入力行が画面外で、`-e` なしの直接確認を再実行の E03 に限定した（2026-09-14 [証跡 boundary](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-boundary-practice.md)、2026-09-08 [証跡 restore](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-restore-practice.md)、2026-09-15 [証跡 missing-log](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-missing-log-practice.md)、2026-09-15 [証跡 default-8085](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-default-8085-practice.md)） | |
| 15 | 秘密値（パスワード等）を隠す・消す仕組みが、想定より狭い範囲にしか効かなかった例が 2 件。(a) `no_log: true`（実行ログに値を出さない指定）を付けた assert タスクの実行出力に値は出なかったが、Playbook を作成する入力が写った E03 にはダミー値 `practice-only-not-a-real-secret` が表示されていた。`no_log` が隠すのは当該タスクの実行結果だけで、作成時の入力や他の画面表示には及ばない。(b) Grafana 用の秘密値を SSH 経由で Windows のクリップボードへ渡した後、後片付けとして案内した `Set-Clipboard -Value ""` がこの環境では ArgumentNullException となり、非秘密の文字列 `cleared` で置き換える手順へ切り替えたが、置き換えの成功とクリップボード履歴の削除は未採録で、完了とは断言していない（2026-09-14 [証跡 vault](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-vault-practice.md)、2026-09-08 [証跡 monitoring](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-monitoring-practice.md)） | |
| 16 | Git で戻す・持ち運ぶ操作が、実機の状態や環境設定までは戻さなかった例が 3 件。(a) ソースをタグ `practice-validated-v1`（38559f2）へ `switch --detach` で切り替えても、`managed-role-validated/app.conf` の本文は training/8085 のままで SHA-256 も切替前と一致し、Git 上は「変更なし」だった。その後 Ansible を通常実行して初めて 8085 削除/8080 追加の差分が出て（ok3/changed1/failed0・終了 0）、本文が training/8080 へ戻った。app.conf は Git の除外対象の生成物である。(b) bundle（リポジトリを 1 ファイルに固めたもの）から復元した `/home/opsadmin/ansible-tagged-restore` では commit が Author identity unknown で停止し、`--local` で user.name と user.email を設定してから dac8a0f（1 insertion/1 deletion）が成功した。(c) 同じ停止は 2026-09-09 の初回 commit でも起きており、設定後に root commit a94c1d3（9 files changed, 127 insertions）を作成している（2026-09-15 [証跡 tag-rollback](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-15-lab-base01-tag-rollback-practice.md)、2026-09-14 [証跡 from-tag](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-from-tag-practice.md)、2026-09-09 [証跡 git-intro](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-09-lab-base01-git-intro-practice.md)） | |
| 17 | Docker 操作のため opsadmin を docker グループへ追加し、sudo なしの `docker ps` が成功した（CP-06）。記録はこれを root 相当の強い権限を与える変更と記載している。これにより、前段で得ていた「sudo にパスワードが必要」という試験結果を、Docker を含むすべての管理操作にパスワードが必要という意味へは拡張できなくなった（2026-09-08、[証跡 compose](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-lab-base01-compose-practice.md)） | |
| 18 | role 演習の最初の実行画像は、lab-base01 とは異なるユーザー名・ホスト名のプロンプトで、初回生成の成功を示していた。この結果は lab-base01 の実績に含めず、SSH で VM へ戻って role 用 3 パスが未使用（NOT FOUND）であることを確認したうえで VM 内で作り直し、以後はユーザー名・ホスト名を検査するガードを付けた手順を用いた。別環境側に生成されたファイルの削除は未実施・未確認のまま残っている（2026-09-14、[証跡 role](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-14-lab-base01-role-practice.md)） | |
| 19 | 中断手順の `Stop-Service BITS -Force` が、依存サービスの `WsusService` も黙って一緒に停止させた。同期の実行中にこれが起き、同期はデータベース上 `Running` のまま固まった（`GetSynchronizationStatus()` は `Running` なのに `GetSynchronizationProgress()` は `Phase=NotProcessing`・`0/0`）。状態を返す API が 2 つあり、片方だけを見ると実行中に見えた。手順書に依存関係を注記し、固まった同期は `WsusService` 開始後に `StopSynchronization()` で解除する手順を追記した（2026-09-08、[証跡 wsus](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)） | |
| 20 | 前日に書いた原因推定が、件数の突き合わせで否定された。2026-09-07 の実測は「同期済み 557 件のうち 555 件を承認」で、`UpdateScope` で数えた設計どおりの絞り込みの対象は 87 件（分類のみ 473 件、製品のみ 105 件）。555 件は 557 件から拒否済み 2 件を引いた「絞り込みが一切効いていない場合の件数」と一致した。実機に残っていたルールは `Enabled = False`・`Classifications (0)`・`Categories (0)`・`TargetGroups (1) = Pilot` で、`ApplyRule()` は絞り込みを正しく守っており、真因は分類 0 件・製品 0 件を WSUS が「絞り込みなし＝全分類・全製品」と解釈したことだった。次に有力とした「WSUS コンソール（GUI）の自動承認ダイアログでの書き戻し」も、同日の報告書が全作業を Hyper-V PowerShell Direct（GUI を操作できないテキストコンソール）で行ったと記録していることと矛盾するため、実機の追試ではなく自分たちの記録同士の突合で取り下げた（2026-09-08、[証跡 wsus](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)） | |
| 21 | 「再現しなかった」「結果が出なかった」の原因が、対象の挙動ではなく試験の側にあった例が 2 件。(a) 絞り込みが空になった操作は再現できず、`.Enabled` のみ変更＋`Save()`（読み戻しで cls=2/cat=1/grp=1 を保持）、`ApplyRule()` 自身、週次クリーンアップタスク（`LastRunTime = 1999/11/30`、`NextRunTime = 2026/09/13` で一度も実行されていない）は否定したが、同期は「否定しきれていない」とした。否定の根拠に使った同期が差分ゼロ・45 秒の同期で、当日の 64 分・557 件の初回全同期とは条件が違ったため。(b) 承認の継承を確かめる検証 5 は 2 回失敗した。1 回目は拒否解除に `Approve(NotApproved, Pilot)` を使ったため `Pilot` に明示的な「未承認」レコードが残って継承を打ち消し、2 回目は対象に ARM64 向け更新を選んでしまい x64 機には元々適用対象外だった。3 回目で `Servers` のみへ承認しても `Pilot` 直下のクライアントへ提示されること（`search OK: 1 offered`、KB5120242）を確認した（2026-09-08、[証跡 wsus](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)） | |

> **どれから書くべきか（推奨 3 件）**
>
> 1. **#11（合否表示・集計・終了コードが実態と違った）** — 別々の 3 演習で同じ構造が出ているため、偶然ではないと示せます。「合格条件を実際の復旧状態より緩く作ると、サマリーだけを信じた側は復旧していない状態を PASS として受け取る」という形にすれば、監視・CI・受け入れ試験の設計の話として、そのまま実務の場面に置き換えて話せます。
> 2. **#10（監視は緑なのに利用者からは応答が無い）** — ヘルスチェックの定番の落とし穴で、面接官が自分の現場の例をすぐ思い浮かべられる題材です。その場では理由を答えられなかったところまで含めて書けば、「何を確認すれば切り分けられたか」を後から言語化した記録になります。
> 3. **#12（予測のつもりが通常実行だった）** — 本番の変更作業の事故とまったく同じ構造で、しかも被害が出なかったのは結果がたまたま changed 0 だったからにすぎません。証跡のレビューで自分の手順の食い違いを見つけた、という発見の経緯まで話せる点も強みになります。

### 実施待ち

- LPIC-1 学習でつまずいた箇所（[#5](https://github.com/ns7jp/ns7jp/issues/5) と連動）
- 就業先で遭遇した障害・問い合わせのうち、技術的な学びとして一般化できるもの
  （社名・システム名・IP・アカウント名は書かない。判断に迷う場合は書かない）

---

## コードでは埋められない、残っている穴

2026-08-24 時点で書いた一覧です。その後の進み具合は、上の記入待ちリストと各証跡で確認します。

1. **恒久ホストが 1 台も無い。** 再起動後の永続性、24 / 72 時間稼働、
   Slack 実配信、実 DNS / TLS、インターネット越しの UFW がここで止まっている。
   VPS 1 台で大半が解決する。
2. **空の VM に OS を入れるところからやっていない。** 3 層ラボはコンテナ構成。
3. **物理層（L1）に触っていない。** スイッチ、ケーブル、ポート VLAN。
4. **Terraform 約 3,000 行が `apply` 0 回。**
5. **研修で触っている Windows Server / AD / AlmaLinux が portfolio に出ていない。**
   一番の差別化材料が `LEARNINGS.md` の 1 エントリに留まっている。
6. **人間の第三者による技術レビュー・協働の実績が一件も無い。** 実装・レビュー・マージが
   本人と AI のみで完結しており、先輩エンジニアやコミュニティからのコードレビュー、
   PR での合意形成を経た経験がない（2026-08-30、外部レビューで指摘）。
