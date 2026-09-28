# 補助トラックの実測証跡

主作品であるLinuxサーバー構築の証跡は
[`ns7jp/server`](https://github.com/ns7jp/server/tree/main/docs/evidence) で管理します。
このディレクトリは、Windows / Active Directory などプロフィール固有の補助証跡を、
研修先・顧客・個人の情報を持ち出さずに再現して保存する場所です。
主作品側の実測をプロフィール文書から参照する場合は、一次証跡を複製せず、実行対象と
境界を確認できる索引メモだけをここに置きます。

## 採録済みの索引

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| server-monitor の Git SHA 指定変更・ロールバック CI | [2026-08-23 索引メモ](./2026-08-23-server-monitor-git-rollback-ci.md) | `PASS`（使い捨て runner） |

2026-09-01〜08 の Windows Server / AD / WSUS の記録は、主作品の [検証証跡台帳](https://github.com/ns7jp/server/blob/main/docs/evidence/README.md#主要な記録) にあります（AI の手順案内を受けて私が VM を操作した記録）。

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| AD の構築・試験（必須 31 項目） | [2026-09-01](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-01-ad-build-validation.md) | `PASS` |
| System State 復元 | [2026-09-02](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-02-ad-restore-drill.md) | `PASS`（SYSVOL の欠損を翌日に訂正） |
| 2 台目の DC と複製 | [2026-09-03](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-03-ad-second-dc-replication.md) | `PASS` |
| FSMO 役割の奪取 | [2026-09-04](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-04-ad-fsmo-seize.md) | `PASS`（最終状態は DC 1 台） |
| WSUS の構築・試験 | [2026-09-07](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-07-wsus-build-validation.md) | `FAIL`（原因調査は [2026-09-08](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-08-wsus-sit04-sit06-root-cause.md)） |

## AI が実行した新ラボの記録

旧環境とは別の Hyper-V ラボで、承認を受けて Codex が操作した記録です。本人操作・独力再現・人間の第三者確認の実績には数えません。

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| 2026-09-27〜28 の Ubuntu・AD・WSUS・復元先 VM | [新ラボの公開結果票](https://github.com/ns7jp/server/blob/main/docs/evidence/2026-09-28-new-hyperv-lab-operations.md) | Ubuntu 10 サービス・再起動後 33 項目 PASS。24 時間試験は欠測・時刻差があり、到達前に本人の指示で終了（未合格・`STOPPED_BY_USER`）。AD・WSUS は部分実施、別 VM への復元は `NOT RUN` |

詳細と公開用集計は server 側を正本とし、未加工ログや機器識別子は複製しません。過去の AD・WSUS の結果を、新環境の結果で上書きしません。

## 記録予定

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| Windows Server 評価版 / AD DS 公開再現ラボ（上の 9 月の記録とは別に、このテンプレートで行う再現） | `YYYY-MM-DD-windows-ad-lab.md` | `NOT RUN` |

## テンプレート

- [Windows / AD 公開再現ラボ](./templates/windows-ad-lab.md)

テンプレートや計画の存在を実行実績として扱いません。公開前にドメイン名、ユーザー名、
IP、ライセンス情報、研修先情報、個人情報をマスクし、実際のコマンドと出力を確認します。

`ad.example.test` のように、この公開ラボ専用に作成した架空の名前は、その由来を明記した
場合に限り公開できます。実在組織・研修環境・家庭内ネットワークで使っている名前は、似た
文字列への置換ではなく `<REDACTED>` に置き換えます。

## 公開境界

- raw transcript、未加工画像、credential、VM export は Git 管理外へ保存する。
- 公開用コピーだけを `docs/evidence/` 配下へ置き、SHA-256、マスク実施者、再確認者または
  独立した再確認セッションを記録する。
- `.gitignore` は raw ファイルの誤追加を防ぐ補助策であり、公開前確認の代わりにはしない。
- `PASS / FAIL / BLOCKED / NOT RUN` を結果ごとに残し、未確認を `PASS` にしない。
