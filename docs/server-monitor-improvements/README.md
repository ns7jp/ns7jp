# server-monitor 改善設計の実装対応表

このディレクトリは [server-monitor](https://github.com/ns7jp/server-monitor) に対して
先行作成した設計資料である。現在は server-monitor 側へ実装済みの内容と、
実環境での検証証跡が未収録の内容を分けて管理する。

## 対応状況

技術選定の根拠は [ADR（アーキテクチャ決定記録）](../adr/README.md) に分離して記録しています。

---

| # | テーマ | server-monitor 側の反映 | 証跡状態 |
| --- | --- | --- | --- |
| 01 | [Loki + ログ収集](./01-loki-log-aggregation.md) | Loki + Grafana Alloy、Grafana query / dashboard | Promtail 設計は EOL により Alloy へ置換。Linux(WSL2) 上での実行ログ・LogQL 検索は[実測済み](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| 02 | [Ansible 構成管理](./02-ansible-automation.md) | roles、playbooks、構文 CI、手動 full Molecule workflow | 4 ロールの `molecule test` に加え、[2026-08-22 Full-stack E2E](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)で disposable Ubuntu 24.04 への `site.yml` 一括適用と 2 回目 `changed=0` を含む 23/23 PASS。独立した引き渡し対象ホストは未実測 |
| 03 | [AWS + Terraform](./03-terraform-aws.md) | network / compute / alb / monitoring / backup modules、dev / prod | `apply` / `destroy` と実費は未収録 |
| 04 | [SLO / SLI](./04-slo-design.md) | blackbox、recording / burn-rate rules、dashboard、runbooks | 同一ホスト内のラボ SLI。外部 probe による SLO は未実装。ダッシュボードの数値自体は[実測済み](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | backup verification CI、D-1 script、D-2 runbook、templates | [2026-08-19 の D-1 RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)を履歴として保持。[2026-08-22 E2E](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)では D-1 RTO 1 秒、3 volumes の backup / restore、local webhook の FIRING / RESOLVED を PASS。D-2 は未収録 |
| 11 | [変更管理プロセス](./11-change-management.md) | PR テンプレート、Change request / Evidence capture Issue、変更管理ミニ運用 | テンプレート整備済み・実例未収録 |

## 重要な更新

- Promtail は 2026 年 3 月 2 日に EOL となったため、実装は Grafana Alloy に移行した。
- AWS Terraform はコードとして用意されているが、稼働中の環境や費用実績を示すものではない。
- 2026-08-22 の 23/23 PASS は使い捨て GitHub-hosted runner 内の実測である。Slack 実配信、
  AWS `apply / destroy`、D-2、長期稼働、独立した管理端末・引き渡し対象ホストは含まない。
- AWS の本番相当 SLO では、対象 EC2 外からの synthetic probe と中央 metrics / logs
  保存先が必要であり、現時点では追加実装・検証対象である。
- 変更管理は CAB など組織前提の部分を設計サンプルとして残しつつ、個人ラボでは
  PR / Issue テンプレートで実運用できる軽量版へ落とし込んだ。
- 実装着手が 1 年以上先の中長期テーマ（13 / 14 / 16 / 17）は、選考フェーズでは
  実装済みテーマと証跡を主軸にするため、2026-07 に
  [中長期ロードマップ](../roadmap/README.md) へ移動した（設計は継続して保守する）。
- 証跡は server-monitor の
  [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
  に沿って採録する。

### 運用基盤の強化（v1.1 〜 v2.0 実装対象）

| # | テーマ | 目的 | 想定工数 | 優先度 |
| --- | --- | --- | --- | --- |
| 01 | [Loki + Grafana Alloy によるログ集約](./01-loki-log-aggregation.md) | メトリクスとログを同一ダッシュボードで可視化 | 約 2 週間 | 高 |
| 02 | [Ansible による構成管理自動化](./02-ansible-automation.md) | 手順書をコード化し、再現性と移植性を確保 | 約 3 週間 | 高 |
| 03 | [AWS + Terraform 化](./03-terraform-aws.md) | クラウド + IaC への移行（学習要素を兼ねる） | 約 4 週間 | 中 |
| 04 | [SLO / SLI / エラーバジェット設計](./04-slo-design.md) | 「何を守るか」を数値で定義し、運用品質を可視化 | 約 1 週間 | 中 |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | 設計だけでなく実演し、復旧手順を実証 | 約 1 週間 | 中 |
| 06 | [分散トレーシング（Tempo + OpenTelemetry）](../roadmap/06-observability-traces.md) | 可観測性の三本柱（Metrics / Logs / **Traces**）を完成 | 約 2 週間 | 中長期ロードマップへ移動（2026-08 縮退） |
| 07 | [インシデント対応プロセス・ポストモーテム](../roadmap/07-incident-response.md) | 障害から「組織として学ぶ仕組み」を整備 | 約 1 週間 | 中長期ロードマップへ移動（2026-08 縮退） |
| 09 | [セキュリティ運用プロセス](../roadmap/09-security-operations.md) | 設定だけでなく運用継続できるセキュリティへ | 約 2 週間 | 中長期ロードマップへ移動（2026-08 縮退） |

### 運用品質・周辺技術の拡張（v1.1 〜 v2.0 実装対象、第二弾）

| # | テーマ | 目的 | 想定工数 | 優先度 |
| --- | --- | --- | --- | --- |
| 10 | [キャパシティプランニング・負荷試験](../roadmap/10-capacity-planning.md) | k6 で SLO 限界値を実測、スケール判断を数値化 | 約 1 週間 | 中長期ロードマップへ移動（2026-08 縮退） |
| 11 | [変更管理プロセス](./11-change-management.md) | 平常時変更の統制、PR / Issue ベースの軽量版 | 約 1 週間 | 高 |
| 12 | [メタモニタリング（監視の監視）](../roadmap/12-meta-monitoring.md) | Prometheus 自身が落ちた時の外部検知設計 | 約 1 週間 | 中長期ロードマップへ移動（2026-08 縮退） |
| 13 | [FinOps（コスト最適化運用）](../roadmap/13-finops.md) | タグ規約・コストアラート・Rightsizing 月次運用 | 約 2 週間 | 中長期ロードマップへ移動（2026-07 縮退） |
| 14 | [データベース運用設計](../roadmap/14-database-operations.md) | バックアップ階層化・PITR・スロークエリ調査 | 約 2 週間 | 中長期ロードマップへ移動（2026-07 縮退） |
| 15 | [ネットワーク・DNS 運用](../roadmap/15-network-operations.md) | TLS 期限監視・SG 棚卸し・VPN / SSM 設計 | 約 2 週間 | 中長期ロードマップへ移動（2026-08 縮退） |
| 16 | [アイデンティティ運用](../roadmap/16-identity-operations.md) | ID ライフサイクル・SSO・特権管理・MFA | 約 2 週間 | 中長期ロードマップへ移動（2026-07 縮退） |
| 17 | [カオスエンジニアリング・Game Day](../roadmap/17-chaos-engineering.md) | 「想定外」を仕組みで気付く、メタ監視の実証 | 約 1 週間 | 中長期ロードマップへ移動（2026-07 縮退） |

実装着手が 1 年以上先、または実装のない純粋な設計サンプルであるテーマ
（06 / 07 / 09 / 10 / 12 / 13 / 14 / 15 / 16 / 17）は、一次導線を実装済み + 証跡に絞るため
[中長期ロードマップ](../roadmap/README.md) へ移動した（2026-07 に 13/14/16/17、
2026-08 に未経験者の実際のスキル水準へ合わせる整理として 06/07/09/10/12/15 を追加）。
行は経緯が辿れるよう表に残している。

### 学習ロードマップ寄り（実装は中長期）

| # | テーマ | 目的 | 想定期間 | 優先度 |
| --- | --- | --- | --- | --- |
| 08 | [Kubernetes / EKS 発展計画](./08-kubernetes-roadmap.md) | CKAD / CKA と連動した段階的 K8s 習得 | 5 か月（学習） | 低（中長期） |

合計：実装系（01〜07、09〜17）で約 28 週間（並列実施で 20 週間想定）。08 は資格学習と連動して 2027 年以降。

## 証跡追加の順序

1. ✅ Linux (WSL2) 上で Loki / Alloy の収集と D-1 RTO 13 秒を記録済み（2026-08-18〜19、履歴として保持）。
2. ✅ GitHub Actions 上で Ansible 4 ロールの full Molecule 結果を記録済み（2026-08-17）。
3. ✅ disposable Ubuntu 24.04 上で `site.yml`、2 回目 `changed=0`、network / UFW、D-1 RTO 1 秒、3-volume restore、local webhook を 23/23 PASS として[記録済み](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-22-full-stack-e2e.md)。
4. 独立した管理端末・引き渡し対象ホストで構築と network 試験を採録する。
5. 承認された短時間 AWS 検証で `apply` / `destroy` と Cost Explorer 実費を記録する。
6. Slack 実配信と D-2 を採録し、外部 probe と中央 telemetry の追加後に AWS 向け SLO を再定義する。

## 主要リンク

- [アーキテクチャ図（実装済み構成 / 検証境界）](../architecture-diagram.md)

## 全体ロードマップ

> 以下の Gantt 図・依存関係図は、当初構想していた全体像をそのまま残しています。
> 06 / 07 / 09 / 10 / 12 / 13 / 14 / 15 / 16 / 17 は現在 [中長期ロードマップ](../roadmap/README.md)
> に移動済みで、図中の番号は当時の計画時点のものです。

```mermaid
gantt
    title server-monitor 改善ロードマップ
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section v1.1 ログ + 三本柱 + メタ監視
    01. Loki 設計           :done, l1, 2026-05-27, 3d
    01. 実装・検証          :active, l2, after l1, 11d
    06. Tempo 設計          :tr1, after l2, 3d
    06. 実装・検証          :tr2, after tr1, 11d
    12. メタモニタリング    :mm, after l2, 7d

    section v1.2 自動化 + 変更管理
    02. Ansible 設計        :a1, after tr2, 5d
    02. 実装・検証          :a2, after a1, 16d
    11. 変更管理            :cm, after a1, 7d

    section v1.3 運用品質
    04. SLO 設計            :s1, after a2, 7d
    10. キャパシティ        :cap, after s1, 7d
    07. インシデント対応    :ir1, after s1, 5d
    05. 復旧演習            :b1, after ir1, 7d
    17. カオス / Game Day   :ce, after b1, 7d
    14. DB 運用             :db, after b1, 14d
    09. セキュリティ運用    :se1, after b1, 10d
    16. ID 運用             :id, after se1, 14d

    section v2.0 クラウド
    15. ネットワーク運用    :nw, after se1, 14d
    03. Terraform 設計      :t1, after se1, 7d
    03. 実装・検証          :t2, after t1, 21d
    13. FinOps              :fo, after t2, 14d

    section v3.0 学習トラック
    08. K8s Phase 1-2 学習  :k1, 2027-04-01, 60d
    08. K8s Phase 3-4 学習  :k2, after k1, 90d
```

---

## 各テーマ間の依存関係

```mermaid
flowchart LR
    L[01. Loki<br/>ログ集約] --> S[04. SLO 設計]
    L --> Tr[06. Tempo<br/>トレース]
    Tr --> S
    A[02. Ansible<br/>構成管理] --> T[03. Terraform<br/>AWS 化]
    A --> CM[11. 変更管理]
    S --> IR[07. インシデント<br/>対応]
    S --> Cap[10. キャパシティ]
    IR --> B[05. 復旧演習]
    B --> CE[17. カオス / Game Day]
    L --> T
    A --> B
    A --> Sec[09. セキュリティ<br/>運用]
    L --> MM[12. メタ監視]
    MM --> CE
    Sec --> T
    Sec --> ID[16. ID 運用]
    A --> DB[14. DB 運用]
    DB --> B
    T --> NW[15. ネットワーク運用]
    T --> Fin[13. FinOps]
    T --> ID
    T --> K[08. Kubernetes<br/>発展計画]
```

### 主要な依存関係

- **Loki → SLO**：ログ由来の SLI（エラー率）を測るために Loki が先
- **Loki → Tempo**：Trace から Log への相関ジャンプを使うため、ログ集約が先
- **Tempo → SLO**：レイテンシ SLI の調査を Exemplars でトレースに繋ぐため
- **Ansible → Terraform**：OS 内の構成を Ansible で完全自動化してから AWS にコピーする
- **Ansible → 変更管理**：構成変更が PR 化される基盤として Ansible が先
- **SLO → キャパシティ**：「守るべき品質」を決めてから「容量」を語る順序
- **SLO → インシデント対応**：Sev 判定の数値根拠（バーンレート）として SLO が必要
- **インシデント対応 → 復旧演習 → カオス**：計画演習からカオスへ徐々に拡張
- **Loki → メタ監視**：自身のログ集約状態を Loki でも観測
- **メタ監視 → カオス**：「気付ける設計」を Game Day で実証
- **Ansible → セキュリティ運用**：パッチ管理の実体が Ansible にあるため
- **セキュリティ運用 → ID 運用**：SSO / MFA 統合の前段
- **Terraform → ネットワーク / FinOps / ID**：クラウドリソースが揃ってからの周辺運用
- **Terraform → Kubernetes**：VM ベース AWS 環境を理解してから EKS に進む

---

## ADR（アーキテクチャ決定記録）との対応

各設計書の **「なぜこの技術か」** は [ADR](../adr/README.md) に分離記録しています。

| 設計書 | 主要 ADR |
| --- | --- |
| 01 Loki | [ADR-0003 Loki 採用](../adr/0003-loki-for-logs.md) |
| 02 Ansible | [ADR-0004 Ansible 採用](../adr/0004-ansible-for-config.md) |
| 03 Terraform/AWS | [ADR-0005 Terraform 採用](../adr/0005-terraform-for-iac.md) |
| 04 SLO | [ADR-0001 Prometheus 採用](../adr/0001-monitoring-stack.md) |
| 07 IR | [ADR-0007 Slack 通知](../adr/0007-slack-notifications.md) |
| 08 K8s | [ADR-0002 Docker Compose 採用](../adr/0002-deploy-with-docker-compose.md) |
| 09 セキュリティ運用 | [ADR-0008 段階的認証](../adr/0008-stepwise-auth.md) |
| 13 FinOps | [ADR-0006 監視自前運用](../adr/0006-self-host-monitoring.md) |
| 16 ID 運用 | [ADR-0008 段階的認証](../adr/0008-stepwise-auth.md) |

---

## 関連ドキュメント

- [ADR 一覧](../adr/README.md)
- [アーキテクチャ図（現状 / 将来構想）](../architecture-diagram.md)
- [資格取得ロードマップ](../certifications/roadmap.md)
- [現場経験 ↔ インフラ運用 橋渡し](../career-bridge.md)
