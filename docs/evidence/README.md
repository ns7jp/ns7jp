# 補助トラックの実測証跡

主作品であるLinuxサーバー構築の証跡は
[`ns7jp/server-monitor`](https://github.com/ns7jp/server-monitor/tree/main/docs/evidence) で管理します。
このディレクトリは、Windows / Active Directory などプロフィール固有の補助証跡を、
研修先・顧客・個人の情報を持ち出さずに再現して保存する場所です。
主作品側の実測をプロフィール文書から参照する場合は、一次証跡を複製せず、実行対象と
境界を確認できる索引メモだけをここに置きます。

## 採録済みの索引

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| server-monitor の Git SHA 指定変更・ロールバック CI | [2026-08-23 索引メモ](2026-08-23-server-monitor-git-rollback-ci.md) | `PASS`（使い捨て runner） |

## 記録予定

| 検証 | 記録先 | 状態 |
| --- | --- | --- |
| Windows Server 評価版 / AD DS 公開再現ラボ | `YYYY-MM-DD-windows-ad-lab.md` | `NOT RUN` |
| Windows テスト VM / winget 端末セットアップ | `YYYY-MM-DD-windows-winget-provisioning.md` | `NOT RUN` |

## テンプレート

- [Windows / AD 公開再現ラボ](templates/windows-ad-lab.md)
- [Windows / winget 端末セットアップ](templates/windows-winget-provisioning.md)

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
