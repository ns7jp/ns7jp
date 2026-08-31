variable "region" {
  description = "AWS リージョン。11-aws-foundational-exercise-design.md §2/§3 で東京リージョンに固定している。"
  type        = string
  default     = "ap-northeast-1"
}

variable "profile" {
  description = "`aws configure sso` で作成したプロファイル名。長期アクセスキーは発行しない前提（同 §2）。"
  type        = string
  default     = "lab-aws"
}

variable "instance_type" {
  description = "EC2 インスタンスタイプ。region で t2.micro が提供されない場合は t3.micro に変更する（同 §3）。"
  type        = string
  default     = "t2.micro"
}

variable "project_name" {
  description = "タグ用のプロジェクト名。"
  type        = string
  default     = "ns7jp-learning"
}
