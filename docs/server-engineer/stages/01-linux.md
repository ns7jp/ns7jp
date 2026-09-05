# SE01 Linuxを一台構築する — 設定と実際の状態を照合する

[育成システムの入口](../README.md) / [評価手順](../assessment.md) / [前: 準備](00-orientation.md) / [次: ネットワーク](02-network.md)

目標は、空のVMへOSを導入し、ユーザー、サービス、ログ、追加ディスクが設計した状態になったことを、自分の出力で説明することです。OSは建物の基礎、ユーザーと権限は鍵、サービスは働く設備、ログは設備の日誌に相当します。設定ファイルを書いた後に、実際の動きまで確認します。

前提はSE00の合格、破棄できるUbuntu Server 24.04 VM、管理端末、VMのコンソールと再作成方法です。目安はW1〜W4ですが、日付が来たことでは合格になりません。このページは教材であり、以下の実機操作を今回実行済みとはしていません。

| 条件 | 提出の中心 | 使う環境 |
| --- | --- | --- |
| SE01-C1 | 新規OS導入、構成表と実出力の比較 | 通常のVM |
| SE01-C2 | 権限の許可・拒否・元へ戻した結果 | 同じ学習VM |
| SE01-C3 | サービス状態、ログ、更新記録、修正前後 | 同じ学習VM |
| SE01-C4 | 新しく追加した仮想ディスクと再起動後のマウント | 追加ディスク付きVM |

## SE01-C1 新規VMにOSを導入し構成表と照合する

具体的なOS導入、固定IP、SSH、初期更新は[既存のPhase 1演習設計](../../learning-plan/05-phase1-exercise-design.md)を正本として使います。準備段階で同じ工程を実行し、初期状態からの証跡を残していれば、その自分の証跡を参照できます。OS導入済みイメージを起動しただけなら、空VMへの導入工程は別途必要です。

1. VM設定画面から、CPU、メモリ、OSディスク、NICの予定値を転記します。ディスクを取り違えないよう、VM名と仮想ディスク名を対応付けます。
2. 新規VMへOSを導入し、一般ユーザーでログインします。ISO・OS版、導入時刻、選んだディスク、ユーザー作成、OpenSSHの導入有無を記録します。
3. 次をVMのBashで実行します。情報取得に使う権限を区別し、むやみに全てをrootで実行しません。

   ```bash
   cat /etc/os-release
   hostnamectl
   timedatectl
   lscpu
   free -h
   lsblk -o NAME,PATH,SIZE,TYPE,FSTYPE,MOUNTPOINTS
   df -hT
   ip -brief address
   ```

4. 予定と実測を行ごとに比較します。メモリのGB/GiBの違いや予約領域を、すぐに不具合と判定せず説明します。NIC名は環境ごとに異なるので、`enp0s8`などを実在確認なしに使いません。
5. [既存演習の3-7〜3-9](../../learning-plan/05-phase1-exercise-design.md)に従って鍵接続と到達制御を構築します。**鍵で別セッションから接続できることを確かめてから**パスワード認証の制限へ進みます。コンソールと既存の接続を維持します。

| 項目 | 予定値 | 実際の値 | 根拠 | 差分の扱い |
| --- | --- | --- | --- | --- |
| OS / ホスト名 / CPU / メモリ | 自分の構成表 | 自分の出力から転記 | コマンドと対象行 | 一致、意図した差、修正待ち |
| 時刻同期 / NIC / IP | 自分の構成表 | 自分の出力から転記 | コマンドと対象行 | 一致、意図した差、修正待ち |

期待結果は表を埋めたことだけではなく、構成と観測の差を説明できることです。誤ったNICやディスクを選んでいたら、その場で推測して書き換えず、初期構築の切り戻し手順へ戻ります。

## SE01-C2 ユーザー・権限の許可と拒否を試験する

`r/w/x`は読む・書く・実行する権限です。ディレクトリの`x`は、その中のパスを辿る権限です。ファイルが読めないときはファイルだけでなく親ディレクトリも調べます。

### ダミーファイルで許可と拒否を比較する

次は一般ユーザーが作った専用一時フォルダのダミー文だけを扱います。`nobody`という既存の低権限ユーザーがいるか先に確認し、存在しない環境では作り足さず、評価者と用意した試験ユーザーへ置き換えます。

```bash
id
id nobody
SE01_PERM="$(mktemp -d /tmp/se01-permission.XXXXXX)"
chmod 711 "$SE01_PERM"
printf 'permission practice only\n' > "$SE01_PERM/sample.txt"
chmod 600 "$SE01_PERM/sample.txt"
ls -ld "$SE01_PERM"
ls -l "$SE01_PERM/sample.txt"
cat "$SE01_PERM/sample.txt"
sudo -u nobody cat "$SE01_PERM/sample.txt"
printf '別ユーザーの終了コード=%s\n' "$?"
```

期待する結果は、自分は本文を読め、別ユーザーはファイルを読めず非ゼロ終了することです。`sudo`自体の拒否や`nobody`不存在なら、権限の負の試験を実施できていないので`BLOCKED`です。エラーの原因を確かめず「拒否できた」としません。

```bash
chmod 644 "$SE01_PERM/sample.txt"
sudo -u nobody cat "$SE01_PERM/sample.txt"
chmod 600 "$SE01_PERM/sample.txt"
sudo -u nobody cat "$SE01_PERM/sample.txt"
printf '元へ戻した後の終了コード=%s\n' "$?"
```

600→644→600の変更で、別ユーザーが「読めない→読める→読めない」と変わることを記録します。実際の秘密情報に644を設定する練習ではありません。終了後は対象パスを確認してこの一時フォルダだけを片付けるか、VMを演習前の状態へ戻します。

さらに既存のPhase 1設計で作った一般ユーザーとsudo権限を、`id`、`groups`、`sudo -l`で照合します。`sudo -l`が広範な権限を示す場合は、「最小権限を達成した」ではなく、学習用管理者として許可した範囲を説明します。認証情報を公開する必要はありません。

## SE01-C3 サービス・ログ・更新を確認し不具合を直す

`active`は今動いていること、`enabled`は通常起動時に開始する設定です。同じ状態ではありません。サービスによってsocket経由で起動する場合もあるため、OS版と実際のunitを記録します。

```bash
systemctl is-active ssh
systemctl is-enabled ssh
systemctl status ssh --no-pager
journalctl -u ssh --since today --no-pager -n 30
apt list --upgradable
```

SSHは管理経路なので、ここで停止故障の題材にはしません。SSHの設定変更が必要なら既存Phase 1の順番と`sshd -t`による確認を使い、接続を残した状態で行います。更新は[既存Phase 1の3-10](../../learning-plan/05-phase1-exercise-design.md)で、対象VM、更新前後、再起動要否、復旧方法を記録して実施します。`apt list --upgradable`だけでは更新済みになりません。

### 自作の小さなサービスで失敗と復旧を確認する

VM内の一般ユーザーのBashで、ログを出すだけの一時的なunitを作ります。既存の同名unitがあれば実行せず、別の演習番号へ変更します。

```bash
systemctl status se01-practice.service --no-pager
```

`could not be found`で未使用と確認した後、存在する`/usr/bin/false`を指定して意図的な終了コード1を観測します。存在しないプログラムではunit作成前に拒否される場合があるため、サービスとして起動した後に失敗する方法を使います。

```bash
sudo systemd-run --unit=se01-practice --property=Type=oneshot --wait /usr/bin/false
systemctl status se01-practice.service --no-pager
journalctl -u se01-practice.service --no-pager -n 20
```

期待する根拠は、`failed`と`status=1/FAILURE`など終了コードによる失敗の記録です。`--wait`は一時サービスの終了まで待ちます。失敗時の非ゼロ終了はこの演習の期待結果です。ログを保存してから、この演習unitを止めて失敗状態を解除します。

```bash
sudo systemctl stop se01-practice.service
sudo systemctl reset-failed se01-practice.service
sudo systemd-run --unit=se01-practice --property=Type=oneshot --wait /usr/bin/printf 'SE01 service recovered\n'
journalctl -u se01-practice.service --no-pager -n 20
```

一時unitの同名再利用が拒否された場合は、新しい名前`se01-practice-recovered`を使い、変更した理由と対応する両方のログを残します。期待結果は`SE01 service recovered`が記録され、実行が成功したことです。oneshotは処理が終わると常時activeにはなりません。この演習では恒久設定ファイルを作成しません。不要なサービスを一括停止せず、操作は指定した演習unitだけに限定します。

## SE01-C4 追加の学習用ディスクと永続マウントを再起動後に確認する

追加ディスクは「VMに別の空の保管場所を接続する」作業です。LVMはディスクをPV→VG→LVとしてまとめ、ファイルシステムを作り、マウント先へ接続します。`fstab`は次回起動時にも接続する設定です。

既存の[storage role](https://github.com/ns7jp/server/tree/main/ansible/roles/storage)と[storage.yml](https://github.com/ns7jp/server/blob/main/ansible/playbooks/storage.yml)を使います。Ansibleの詳細はSE05で学びますが、ここでは「宣言した追加ディスクだけを検査して設定する道具」として、設定値・対象・出力を読んで使います。導入と依存collectionは[Ansible配備手順](https://github.com/ns7jp/server/blob/main/docs/deployment-ansible.md)の準備に従います。

1. 対象VMを停止し、仮想化ソフトで**新しい空の仮想ディスク**を追加します。ホストの物理ディスクを渡す設定は使いません。VMと追加ディスクを含む復元方法を先に用意します。
2. 起動後に`lsblk -o NAME,PATH,SIZE,TYPE,FSTYPE,MOUNTPOINTS`を読み、追加前後の差を記録します。OSディスク、その子パーティション、既存のマウント先と別物であることを確認します。容量が同じという理由だけで選びません。
3. 新規ディスクの実パスを確定し、`sudo wipefs --no-act -- 実パス`で署名を**読むだけ**の確認をします。署名があればここで停止します。削除オプションは加えません。
4. `server`直下に個人用の`.artifacts/se01-storage.yml`を作成します。下の`REPLACE_WITH_CONFIRMED_DISK`を、確認した追加ディスクの`PATH`へ置換します。これは未置換では動かない様式です。

   ```yaml
   all:
     hosts:
       se01-storage-vm:
         ansible_connection: local
         ansible_python_interpreter: /usr/bin/python3
         storage_apply: false
         storage_allow_existing_signature: false
         storage_allow_loop_devices: false
         storage_persist_fstab: true
         storage_volumes:
           - vg: vg_se01
             devices: [REPLACE_WITH_CONFIRMED_DISK]
             lv: lv_practice
             size: 100%FREE
             fstype: ext4
             mount: /mnt/se01-data
   ```

5. **対象VM内のserver直下**で、対象一覧、構文、事前検査の順に進みます。このinventoryは`local`接続なので、実行したOS自体が対象です。手元PCや別ホストから実行しません。

   ```bash
   export ANSIBLE_ROLES_PATH="$PWD/ansible/roles"
   ansible-playbook -i .artifacts/se01-storage.yml ansible/playbooks/storage.yml --list-hosts
   ansible-playbook -i .artifacts/se01-storage.yml ansible/playbooks/storage.yml --syntax-check
   ansible-playbook -i .artifacts/se01-storage.yml ansible/playbooks/storage.yml --ask-become-pass
   ```

   `storage_apply: false`の検査ではLVM・mkfs・fstabの適用を止めますが、検査に必要なOSパッケージは導入される場合があります。「完全に読み取りだけ」とは記録しません。既存署名、既存VG、パス不明で拒否されたら、許可スイッチを緩めず原因を確認します。

6. 検査出力と対象表を評価者と確認し、学習用の空ディスクだと特定できた場合だけ、inventoryの`storage_apply`を`true`へ変更して同じ適用コマンドを実行します。これがディスクの初期化・構築操作です。
7. `findmnt /mnt/se01-data`、`lsblk -f`、`df -hT /mnt/se01-data`でLV、UUID、マウント先を照合します。`sudo findmnt --verify --verbose`でfstabを検査し、警告やエラーを解消してから再起動します。
8. 試験用の目印を保存し、内容を採録します。

   ```bash
   printf 'SE01 persistence check\n' | sudo tee /mnt/se01-data/se01-marker.txt
   sudo cat /mnt/se01-data/se01-marker.txt
   findmnt /mnt/se01-data
   ```

9. SSH以外のコンソールから戻れることを再確認し、この学習VMだけを通常再起動します。再接続後、**手動mountを実行する前に**`findmnt`と目印の内容を確認します。UUID・マウント先・内容が一致すれば永続性の根拠になります。

**失敗した場合:** データやfstabを推測で削除しません。ログとVMコンソールの状態を保存し、対象VMと追加ディスクを演習前へ戻します。起動不能ならコンソールと事前の復元手順を使います。作成したストレージだけを個別削除する作業は、依存関係を説明できるまで行いません。

[B-1 LVM演習](https://github.com/ns7jp/server/blob/main/docs/drills/B-1-lvm.md)は補習用です。loopファイルによる容量拡張を示すもので、追加仮想ディスクの認識や再起動後マウントを代替しません。そのスクリプトは管理者権限とcleanupを使うため、初心者は専用の破棄可能VMだけで検討し、本課題の必須コマンドとしては使いません。

## 提出・説明・補習

- [ ] C1: 空VMからの導入記録と、予定・実測・差分の表。
- [ ] C2: 所有者と別ユーザーでの許可・拒否・復元後の3状態。sudoの失敗と権限の拒否を区別。
- [ ] C3: 状態とログ、実際の更新結果、障害の原因と修正後のログ。
- [ ] C4: 新規追加ディスクの特定、事前検査、適用、再起動前後のUUIDと目印。loopの結果で代用していない。
- [ ] 各記録に実行者、UTC時刻、環境、Git SHA、支援量を付け、[個人台帳](../tracker-guide.md)へ登録。

| 説明問題 | 解答の観点 | 詰まった場合 |
| --- | --- | --- |
| activeとenabledはどう違うか | 今の状態と次回起動時の設定。oneshotの終了も説明する | C3の状態・ログを時系列で並べる |
| chmodだけを変えても読めないのはなぜか | 親ディレクトリの通過権限、利用者、グループも影響する | C2の`ls -ld`と`id`を比較 |
| ディスク名を`/dev/sdb`と決め打ちしないのはなぜか | 接続順・環境で採番が変わる。OSディスクへの誤操作を防ぐ | C4の追加前後の図を描き直す |
| マウントできた直後に永続化合格と言えるか | 再起動後、手動操作前の確認が必要 | C4の8〜9を再実施 |
| 構文チェック成功でディスクを構築したと言えるか | 構文検査と実機適用・データ確認は別 | [評価手順](../assessment.md) |

基礎コマンドが難しければ[W1〜W4のカリキュラム](../../learning-plan/02-curriculum.md)と[Phase 1演習設計](../../learning-plan/05-phase1-exercise-design.md)へ戻り、1日1観点に分けます。失敗は消さず再試行を追加し、評価を受けてから[SE02](02-network.md)へ進みます。
