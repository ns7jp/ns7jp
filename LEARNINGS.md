# 学習の一次記録（つまずきログ）

> **本ドキュメントの位置付け**
>
> これは清書された設計書ではなく、**実際に手を動かして詰まった一次記録**です。
> 未経験からの信頼性は、整った設計書よりも「何が壊れて、どう直したか」という**生の学習過程**で証明されます。
> 各エントリは自分の言葉で、事実だけを短く書きます（盛らない・推測は推測と明記する）。

最終更新: 2026-08-17

---

## このログの位置付け

- 対象は server-monitor の構築・運用、および資格学習で**実際にハマったこと**。
- 「うまくいった成功談」より、**つまずきと、その後どうしたか**を優先して書く。
- 採録した証跡（スクショ・ログ）があればリンクする。
- エントリはまだ少ないです。設計書の量ではなく、このログと[証跡](./docs/evidence-capture-checklist.md)を増やすことを現在の最優先にしています。
- **2026-08 の 2 件は、事実（環境・症状・原因・対処・証跡）まで記入済みで「学び」が `〈 〉` のまま**です。ここは本人が書く欄なので、空のまま公開しています。

---

## 書き方のルール

1. 1 つの出来事につき 1 エントリ。見出しは `### YYYY-MM 何が起きたか`。
2. **症状 → 原因 → 対処 → 学び**の 4 点を必ず書く。
3. 環境（OS / バージョン）と日付を明記する。
4. 想定・未確認の部分は「（未確認）」と書き、事実と分ける。
5. 関連する設計書・証跡へリンクする。

---

## エントリ

### 2026-03 Promtail EOL から Grafana Alloy への移行

- **環境**: ローカル Linux + Docker Compose、ログ集約に Promtail を使用。
- **症状**: ログ収集コンポーネントとして設計していた Promtail が **2026-03-02 に EOL** を迎えることが分かった。設計書・構成図・ADR は Promtail 前提で書いてあった。
- **原因**: Promtail の開発終了に伴い、Grafana 公式の収集エージェントが **Grafana Alloy** に一本化された。採用を決めた時点で、保守状況と EOL 予定を確認していなかった。
- **対処**: ログ収集を Promtail から **Alloy へ移行**し、構成と設計書（[01 ログ集約](./docs/server-monitor-improvements/01-loki-log-aggregation.md)）・[ADR-0003](./docs/adr/0003-loki-for-logs.md)・[アーキテクチャ図](./docs/architecture-diagram.md) を更新した。
- **学び**: ソフトウェアの採用判断では、機能だけでなく**保守状況・EOL 予定を設計段階で確認する**こと。また、構成図・設計書・ADR の 3 か所に同じ前提が散らばっていたため修正の追跡が大変だった。以後、ADR に「見直しトリガー（EOL・メジャーバージョンアップ）」をあらかじめ書く運用にしている。
- **関連**: [ADR-0003 Loki 採用](./docs/adr/0003-loki-for-logs.md) / [アーキテクチャ図](./docs/architecture-diagram.md)

### 2026-08 UFW の allow と limit が同じ port を奪い合い、冪等性が壊れていた

- **環境**: GitHub Actions（`ubuntu-latest`）上の Molecule + docker driver。対象は `ansible/roles/common`。コンテナイメージは `geerlingguy/docker-ubuntu2204-ansible:latest`（Ubuntu 22.04）。
- **症状**: `molecule test` の `converge` は成功するのに、直後の `idempotence`（2 回目の適用で `changed=0` になることの確認）が必ず失敗した。報告されたのは次の 2 タスクだけだった。

    ```text
    ERROR Idempotence test failed because of the following tasks:
    *  => common : Allow configured TCP ports through UFW
    *  => common : Rate-limit SSH on port 22
    ```

- **原因**: 既定値 `common_ufw_allowed_tcp_ports` が `[22]` だったため、上記 2 タスクが**どちらも port 22 を対象にしていた**。ufw では同一 port への `allow` と `limit` は別々のルールにならず、**後から適用したほうが前を置き換える**。そのため実行のたびに `allow → limit → allow …` と交互に書き換わり、両タスクが永久に `changed` を返し続けていた。同じ play の `Configure UFW default incoming policy` は冪等と判定されていたため、**ufw モジュール自体は正常で、ロールが矛盾する 2 つのルールを同じ port へ適用していた**ことが原因だと切り分けられた。
- **対処**: `common_ufw_limit_ssh`（既定 `true`）と `common_ufw_ssh_port`（既定 `22`）を追加し、**rate limit の対象 port を allow のループから `difference` で除外**した。「SSH は allow ではなく limit で開放する」という設計意図はそのまま維持している。あわせて `map('int')` で型を正規化した（従来は許可一覧に文字列 `'22'` が入っていると `22 in ...` が偽になり、limit が適用されない不整合があった）。振り分けは 6 パターンで実測して確認した。
- **学び**: 〈ここを自分の言葉で書く。手がかり: **`ansible-lint` も `--syntax-check` も、この欠陥を検出できなかった**。文法は正しく、個々のタスクも妥当で、2 回適用して初めて矛盾が現れる種類だったため。また冪等性が壊れるだけの問題ではなく、実ホストでも毎回 SSH のルールが `ALLOW` と `LIMIT` の間で書き換わるため、**総当たり攻撃の抑止が意図した状態で維持されない**というセキュリティ上の欠陥でもあった。「設定の見た目」と「実際の状態」が一致していることを、どう担保するか〉
- **証跡**: [Molecule フル実行記録 2026-08-17](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) ／ [修正 PR #53](https://github.com/ns7jp/server-monitor/pull/53)
- **関連**: [02 Ansible 構成管理](./docs/server-monitor-improvements/02-ansible-automation.md) / [証跡採録チェックリスト](./docs/evidence-capture-checklist.md)

### 2026-08 「コンテナだから動かせない」という自分の診断が誤りだった

- **環境**: 同上（GitHub Actions 上の Molecule + docker driver、4 ロール）。
- **症状**: `common` ロールで chrony の起動が `Service is in unknown state` で失敗した。同じ症状は `docker` ロールの docker daemon 起動でも出ていた。さらに後の `verify` 段階では `timedatectl` が次のエラーで失敗した。

    ```text
    System has not been booted with systemd as init system (PID 1). Can't operate.
    Failed to connect to bus: Host is down
    ```

- **原因**: 当初、chrony の失敗を「**コンテナはホストの時計を共有するので、中で NTP デーモンを動かせない**」と判断し、変数で無効化した。しかしこれは誤りで、実際の原因は **systemd が PID 1 として起動していなかった**ことだった。molecule-plugins の docker driver は `override_command` が既定 `true` で、指定しない限り `bash -c "while true; do sleep 10000; done"` をイメージの `CMD` に上書きする。4 つの scenario はいずれも `privileged: true`・`cgroupns_mode: host`・`/sys/fs/cgroup` のマウントという **systemd 稼働の前提を全部揃えていたのに、`command` だけ指定していなかった**ため、その準備がすべて無効化されていた。
- **対処**: 全 scenario に `command: /lib/systemd/systemd` を追加した。あわせて、誤診に基づいて入れた `common_manage_services: false` の上書きを**取り消し**、chrony 起動と sshd 再起動を実際に検証する構成へ戻した。`docker_manage_service` のほうは、daemon 起動に入れ子のコンテナランタイム（storage driver / iptables）が必要で systemd だけでは足りないため据え置き、理由づけを正確な内容へ書き直した。
- **学び**: 〈ここを自分の言葉で書く。手がかり: **別々に見えた 3 件（docker daemon・chrony・`timedatectl`）が、すべて 1 つの原因に由来していた**。`nginx` と `monitoring` がサービス操作を持たず早くから完走していたことも、後から見れば同じ説明で整合していた。「症状が同じでも原因が同じとは限らない」と同時に「別々の症状が同じ原因のこともある」。また、**「環境の制約だ」と結論づけるのは、調査を打ち切る判断でもある**。どこまで確かめてからその判断をしてよいか〉
- **証跡**: [Molecule フル実行記録 2026-08-17](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-17-molecule.md) ／ [誤診した PR #52](https://github.com/ns7jp/server-monitor/pull/52) ／ [訂正した PR #54](https://github.com/ns7jp/server-monitor/pull/54)
- **関連**: [02 Ansible 構成管理](./docs/server-monitor-improvements/02-ansible-automation.md)

---

## 次に追加する予定のエントリ（未実施のため、まだ書きません）

実施したら、上記と同じ 4 点セット（症状 → 原因 → 対処 → 学び）で追記します。

**題材が既に揃っているもの（優先）**

- **Terraform AWS provider の制約が 8 ファイルに分散していて Dependabot PR が必ず CI を落ちる件**
  — 症状（`no available releases match the given constraints ~> 5.50, ~> 6.58`）、原因（`dependabot.yml` が
  `environments/` 配下 2 つしか監視しておらず、`modules/` 5 つと `terraform/versions.tf` が取り残される）、
  対処（`directories` + `groups` で 1 PR にまとめる）まで判明済み。**あとは「学び」を自分の言葉で書くだけ**。
  → 詳細は [STATUS.md](./STATUS.md) の「未処理の Dependabot PR と CI 失敗」
- **依存更新 PR を 3 か月放置していた件** — なぜ溜まったか、どう再発を防ぐかを正直に書く。
  ADR に「見直しトリガー」を書く運用にした（上記 Alloy の学び）のに、**運用そのものが回っていなかった**という反省は、
  設計と運用の差を実体験として語れる材料になる。

**実施待ち**

- Linux ホストでの全 stack 初回起動（優先 3）
- D-1 プロセス停止演習の初回実施（優先 7）
- LPIC-1 学習でつまずいた箇所（[#5](https://github.com/ns7jp/ns7jp/issues/5) と連動）
- ネットワーク切り分けメモの初回作成（dig / traceroute / tcpdump、優先 6）

**トライアル就業中に書けるもの（機密・顧客情報に触れない範囲で）**

- 就業先で遭遇した障害・問い合わせのうち、**技術的な学びとして一般化できるもの**
- 社名・システム名・IP・アカウント名は書かない。「何が起きて、どう切り分けて、何を学んだか」だけを書く
- 判断に迷う場合は書かない。**1 件も書かないより、書ける範囲で 1 件書くほうが良いが、その逆はない**

> **このログが最も費用対効果が高い理由**: 設計書は AI 支援で量産できますが、
> 「自分が詰まった経験」は本人にしか書けません。ポートフォリオ全体の中で、
> 最も埋めやすく、最も差がつく空白です。

### YYYY-MM タイトルを記入（テンプレート）

- **環境**:
- **症状**:
- **原因**:
- **対処**:
- **学び**:
- **証跡**:

---

## 関連ドキュメント

- [証跡採録チェックリスト](./docs/evidence-capture-checklist.md)
- [改善設計の実装対応表](./docs/server-monitor-improvements/README.md)
- [ADR 一覧](./docs/adr/README.md)
- [STATUS.md](./STATUS.md)
