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
| 02 | [Ansible 構成管理](./02-ansible-automation.md) | roles、playbooks、構文 CI、手動 full Molecule workflow | 4 ロールの `molecule test` に加え、[PR #75 Full-stack E2E](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)で disposable Ubuntu 24.04 への `site.yml` 一括適用と 2 回目 `changed=0` を含む 23/23 PASS。独立した引き渡し対象ホストは未実測 |
| 03 | [AWS + Terraform](./03-terraform-aws.md) | network / compute / alb / monitoring / backup modules、dev / prod | `apply` / `destroy` と実費は未収録 |
| 04 | [SLO / SLI](./04-slo-design.md) | blackbox、recording / burn-rate rules、dashboard、runbooks | 同一ホスト内のラボ SLI。外部 probe による SLO は未実装。ダッシュボードの数値自体は[実測済み](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/2026-08-18-local-observability.md) |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | backup verification CI、D-1 script、D-2 runbook、templates | [2026-08-19 の D-1 RTO 13 秒](https://github.com/ns7jp/server-monitor/blob/main/docs/drills/logs/2026-08-19-D-1.md)を履歴として保持。[PR #75 E2E](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)では D-1 RTO 1 秒、3 volumes の backup / restore、local webhook の FIRING / RESOLVED を PASS。D-2 は未収録 |
| 11 | [変更管理プロセス](./11-change-management.md) | PR テンプレート、Change request / Evidence capture Issue、変更管理ミニ運用 | テンプレート整備済み。[PR #77のGit rollback CI](https://github.com/ns7jp/server-monitor/actions/runs/32611251044)を実例として採録。永続hostでの変更記録は未収録 |

実装・実機検証が一切ない中長期テーマ（分散トレーシング、インシデント対応プロセス、セキュリティ運用、
キャパシティプランニング、メタモニタリングほか）は個別の設計書を持たず、
[今後の興味リスト](../roadmap/README.md) に方向性だけを短くまとめています。

## 重要な更新

- Promtail は 2026 年 3 月 2 日に EOL となったため、実装は Grafana Alloy に移行した。
- AWS Terraform はコードとして用意されているが、稼働中の環境や費用実績を示すものではない。
- 2026-08-22 の 23/23 PASS は使い捨て GitHub-hosted runner 内の実測である。Slack 実配信、
  AWS `apply / destroy`、D-2、長期稼働、独立した管理端末・引き渡し対象ホストは含まない。
- 2026-08-23 のPR #77では、使い捨てrunner上のcandidateから前版へのGit rollbackを実測した。
  永続host、再起動・24 / 72時間、Slack、AWS、D-2の実績へは読み替えない。
- AWS の本番相当 SLO では、対象 EC2 外からの synthetic probe と中央 metrics / logs
  保存先が必要であり、現時点では追加実装・検証対象である。
- 変更管理は CAB など組織前提の部分を設計サンプルとして残しつつ、個人ラボでは
  PR / Issue テンプレートで実運用できる軽量版へ落とし込んだ。
- 実装が一切ない中長期テーマの個別設計書（分散トレーシング、インシデント対応、セキュリティ運用、
  キャパシティプランニング、メタモニタリング、FinOps、DB 運用、ネットワーク運用、ID 運用、
  カオスエンジニアリング、Kubernetes / EKS の計 11 本）は、2026-07・2026-08 に一次導線から
  [今後の興味リスト](../roadmap/README.md) へ退避したのち、2026-08-26 に個別ファイルを削除し
  短い一覧へ集約した（設計を捨てたのではなく、露出の量を実際の到達度に合わせた）。
- 証跡は server-monitor の
  [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
  に沿って採録する。

## 証跡追加の順序

1. ✅ Linux (WSL2) 上で Loki / Alloy の収集と D-1 RTO 13 秒を記録済み（2026-08-18〜19、履歴として保持）。
2. ✅ GitHub Actions 上で Ansible 4 ロールの full Molecule 結果を記録済み（2026-08-17）。
3. ✅ disposable Ubuntu 24.04 上で `site.yml`、2 回目 `changed=0`、Docker API proxy、network / UFW、D-1 RTO 1 秒、3-volume restore、local webhook を 23/23 PASS として[記録済み](https://github.com/ns7jp/server-monitor/blob/4a292026b569dd1a522c0f2913b4ad40aeccebe7/docs/evidence/2026-08-22-full-stack-e2e.md#pr-75-hardening後の再検証)。
4. 独立した管理端末・引き渡し対象ホストで構築と network 試験を採録する。
5. 承認された短時間 AWS 検証で `apply` / `destroy` と Cost Explorer 実費を記録する。
6. Slack 実配信と D-2 を採録し、外部 probe と中央 telemetry の追加後に AWS 向け SLO を再定義する。

## 主要リンク

- [アーキテクチャ図（実装済み構成 / 検証境界）](../architecture-diagram.md)

---

## ADR（アーキテクチャ決定記録）との対応

各設計書の **「なぜこの技術か」** は [ADR](../adr/README.md) に分離記録しています。

| 設計書 | 主要 ADR |
| --- | --- |
| 01 Loki | [ADR-0003 Loki 採用](../adr/0003-loki-for-logs.md) |
| 02 Ansible | [ADR-0004 Ansible 採用](../adr/0004-ansible-for-config.md) |
| 03 Terraform/AWS | [ADR-0005 Terraform 採用](../adr/0005-terraform-for-iac.md) |
| 04 SLO | [ADR-0001 Prometheus 採用](../adr/0001-monitoring-stack.md) |

---

## 関連ドキュメント

- [ADR 一覧](../adr/README.md)
- [アーキテクチャ図（現状 / 将来構想）](../architecture-diagram.md)
- [資格取得ロードマップ](../certifications/roadmap.md)
- [今後の興味リスト](../roadmap/README.md)
- [現場経験 ↔ インフラ運用 橋渡し](../career-bridge.md)
