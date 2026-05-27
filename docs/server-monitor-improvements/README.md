# server-monitor 改善計画 一覧

[server-monitor](https://github.com/ns7jp/server-monitor) リポジトリに対して着手予定の改善を、設計書として先行整備したものです。
本リポジトリ（プロフィール）上で設計を固めてから、server-monitor 側で実装します。

---

## 改善テーマ一覧

| # | テーマ | 目的 | 想定工数 | 優先度 |
| --- | --- | --- | --- | --- |
| 01 | [Loki + Promtail によるログ集約](./01-loki-log-aggregation.md) | メトリクスとログを同一ダッシュボードで可視化 | 約 2 週間 | 高 |
| 02 | [Ansible による構成管理自動化](./02-ansible-automation.md) | 手順書をコード化し、再現性と移植性を確保 | 約 3 週間 | 高 |
| 03 | [AWS + Terraform 化](./03-terraform-aws.md) | クラウド + IaC への移行（学習要素を兼ねる） | 約 4 週間 | 中 |
| 04 | [SLO / SLI / エラーバジェット設計](./04-slo-design.md) | 「何を守るか」を数値で定義し、運用品質を可視化 | 約 1 週間 | 中 |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | 設計だけでなく実演し、復旧手順を実証 | 約 1 週間 | 中 |

合計：約 11 週間（並列実施で 8 週間程度を想定）

---

## 全体ロードマップ

```mermaid
gantt
    title server-monitor 改善ロードマップ
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section v1.1: ログ集約
    01. Loki 設計        :done, l1, 2026-05-27, 3d
    01. 実装・検証       :active, l2, after l1, 11d

    section v1.2: 自動化
    02. Ansible 設計     :a1, 2026-06-15, 5d
    02. 実装・検証       :a2, after a1, 16d

    section v1.3: 運用品質
    04. SLO 設計         :s1, 2026-07-06, 7d
    05. 復旧演習         :b1, 2026-07-13, 7d

    section v2.0: クラウド
    03. Terraform 設計   :t1, 2026-07-20, 7d
    03. 実装・検証       :t2, after t1, 21d
```

---

## 各テーマ間の依存関係

```mermaid
flowchart LR
    L[01. Loki<br/>ログ集約] --> S[04. SLO 設計]
    A[02. Ansible<br/>構成管理] --> T[03. Terraform<br/>AWS 化]
    S --> B[05. 復旧演習]
    L --> T
    A --> B
```

- **Loki → SLO**：ログ由来の SLI（エラー率）を測るために Loki が先
- **Ansible → Terraform**：OS 内の構成を Ansible で完全自動化してから AWS にコピーする
- **SLO → 復旧演習**：「何分以内に復旧すべきか」を SLO で決めてから演習する

---

## 関連ドキュメント

- [アーキテクチャ図（現状 / 将来構想）](../architecture-diagram.md)
- [資格取得ロードマップ](../certifications/roadmap.md)
