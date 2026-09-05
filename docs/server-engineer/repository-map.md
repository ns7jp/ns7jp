# 既存リポジトリと学習段階の対応

[育成システムへ戻る](README.md)

**一度にすべてのリポジトリを読む必要はありません。** まず `ns7jp` で今日の課題を決め、`server` で実行し、不足する基礎を分野別教材で補います。

2026-09-05にGitHubで現在のリポジトリ名を確認しました。旧名 `server-monitor` は現在 `server` へのリダイレクトとして使われています。設定中のアプリ名・Composeプロジェクト名まで一括置換しないでください。

| リポジトリ | この仕組みでの役割 | 開く時期 |
| --- | --- | --- |
| [ns7jp](https://github.com/ns7jp/ns7jp) | 全体計画、育成台帳、設計・提出・評価 | 最初から |
| [server](https://github.com/ns7jp/server) | Linux構築、最小アプリ、3層、監視、障害・復元の実習 | SE01〜SE07 |
| [network](https://github.com/ns7jp/network) | アドレス・経路・名前解決の補習 | SE02で不足したとき |
| [shell](https://github.com/ns7jp/shell) | BashとPowerShellの操作・自動化の補習 | SE01、SE05 |
| [design](https://github.com/ns7jp/design) | 要件・設計の補習 | SE04 |
| [automation](https://github.com/ns7jp/automation) | 定型作業の自動化の発展 | SE05以降 |
| [sql](https://github.com/ns7jp/sql) | DB操作の補習 | SE03 |
| [python](https://github.com/ns7jp/python) / [php](https://github.com/ns7jp/php) | アプリがOS・DBへ依頼する処理を理解する | SE03の補助 |
| [aws](https://github.com/ns7jp/aws) / [azure](https://github.com/ns7jp/azure) | クラウドを選んだ場合の追加学習 | 基礎必修の後 |
| [support](https://github.com/ns7jp/support) | 質問・状況報告・利用者対応の補習 | SE06、配属後 |
| [javascript](https://github.com/ns7jp/javascript) / [works](https://github.com/ns7jp/works) | 必要になったアプリ・制作分野の参考 | 任意 |
| [ns7jp.github.io](https://github.com/ns7jp/ns7jp.github.io) | 公開する成果の入口 | 証跡確認後 |

この対応表は教材の用途の整理です。各リポジトリの全コードを今回実行したという意味ではありません。

## 実施キットへの最短経路

| やりたいこと | 実施入口 |
| --- | --- |
| Windowsから学習用VMを準備 | [学習環境](../learning-plan/01-environment.md)、[Phase 1キット](../learning-plan/phase1-kit/README.md) |
| Linuxの最初の確認 | [開始前30分](../learning-plan/00-start-here.md) |
| 小さなアプリを動かす | [server初心者ガイド](https://github.com/ns7jp/server/blob/main/docs/beginner-learning-guide.md) |
| 1台VM内で3層を動かす | [SE03の実施経路](stages/03-services.md)、[3層ラボ](https://github.com/ns7jp/server/tree/main/labs/three-tier) |
| 要件から試験票を作る | [構築工程](../learning-plan/03-build-process.md)、[server案件パック](https://github.com/ns7jp/server/tree/main/docs/build-package) |
| 設定をAnsibleでそろえる | [server Ansible手順](https://github.com/ns7jp/server/blob/main/docs/deployment-ansible.md) |
| 復旧の観測項目を決める | [serverランブック](https://github.com/ns7jp/server/tree/main/docs/runbooks) |
| Windows Server／ADを追加する | [Windows基礎](../learning-plan/12-windows-server-exercise-design.md)、[ADキット](../learning-plan/ad-exercise-kit/README.md) |
| 恒久ホストやクラウドを追加する | [恒久ホスト設計](../learning-plan/13-persistent-host-exercise-design.md)、[AWS設計](../learning-plan/11-aws-foundational-exercise-design.md) |

外部の実施手順は更新されます。実行の直前に取得したGit SHAと実際のファイル名を記録してください。サンプル値を実対象と確認せず適用しません。

## コースを増やす条件

Linux必修の修了前は、足りない前提だけ補習します。修了後は求人や担当予定に合わせ、Windows／AD、AWS、Azure、物理ネットワークのうち一つを選びます。

追加コースでも「設計→構築→正常／異常試験→復旧→引き渡し」を繰り返し、対象製品・OS・クラウドごとに別の証跡を残します。LinuxラボのSE07合格をWindowsやAWSの合格へコピーしません。アカウント契約、課金上限、組織の許可は実施前に決める事項です。
