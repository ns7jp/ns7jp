# server-monitor 改善設計の実装対応表

このディレクトリは [server-monitor](https://github.com/ns7jp/server-monitor) に対して
先行作成した設計資料である。現在は server-monitor 側へ実装済みの内容と、
実環境での検証証跡が未収録の内容を分けて管理する。

## 対応状況

| # | テーマ | server-monitor 側の反映 | 証跡状態 |
| --- | --- | --- | --- |
| 01 | [Loki + ログ収集](./01-loki-log-aggregation.md) | Loki + Grafana Alloy、Grafana query / dashboard | Promtail 設計は EOL により Alloy へ置換。Linux Docker での実行ログは未収録 |
| 02 | [Ansible 構成管理](./02-ansible-automation.md) | roles、playbooks、構文 CI、手動 full Molecule workflow | full `molecule test` の結果は未収録 |
| 03 | [AWS + Terraform](./03-terraform-aws.md) | network / compute / alb / monitoring / backup modules、dev / prod | `apply` / `destroy` と実費は未収録 |
| 04 | [SLO / SLI](./04-slo-design.md) | blackbox、recording / burn-rate rules、dashboard、runbooks | 同一ホスト内のラボ SLI。外部 probe による SLO は未実装 |
| 05 | [バックアップ・復旧演習](./05-backup-recovery-drill.md) | backup verification CI、D-1 script、D-2 runbook、templates | D-1 / D-2 の RTO / RPO 実測は未収録 |

## 重要な更新

- Promtail は 2026 年 3 月 2 日に EOL となったため、実装は Grafana Alloy に移行した。
- AWS Terraform はコードとして用意されているが、稼働中の環境や費用実績を示すものではない。
- AWS の本番相当 SLO では、対象 EC2 外からの synthetic probe と中央 metrics / logs
  保存先が必要であり、現時点では追加実装・検証対象である。
- 証跡は server-monitor の
  [検証証跡台帳](https://github.com/ns7jp/server-monitor/blob/main/docs/evidence/README.md)
  に沿って採録する。

## 証跡追加の順序

1. Linux Docker host で Loki / Alloy の収集と D-1 復旧時間を記録する。
2. 手動 CI または Linux host で Ansible の full Molecule 結果を記録する。
3. 承認された短時間 AWS 検証で `apply` / `destroy` と Cost Explorer 実費を記録する。
4. 外部 probe と中央 telemetry の構成を追加した後、AWS 向け SLO を再定義する。

## 関連ドキュメント

- [アーキテクチャ図（実装済み構成 / 検証境界）](../architecture-diagram.md)
- [資格取得ロードマップ](../certifications/roadmap.md)
