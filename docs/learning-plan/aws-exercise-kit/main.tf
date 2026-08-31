locals {
  common_tags = {
    Project  = var.project_name
    Exercise = "11-aws-foundational"
  }
}

# 11-aws-foundational-exercise-design.md §3「コンピュート」: Ubuntu Server 24.04 LTS（Canonical 公式）
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd*/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- ネットワーク（A-4〜A-7 のコード化） ---

resource "aws_vpc" "lab" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "lab-aws-vpc" })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.lab.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = true # Elastic IP は使わず自動割り当てのみに絞る（§2 の決定事項）
  tags                    = merge(local.common_tags, { Name = "lab-aws-public" })
}

resource "aws_internet_gateway" "lab" {
  vpc_id = aws_vpc.lab.id
  tags   = merge(local.common_tags, { Name = "lab-aws-igw" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lab.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lab.id
  }

  tags = merge(local.common_tags, { Name = "lab-aws-rt" })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# --- セキュリティグループ（A-8）: 80 番のみ許可、22 番は開けない ---

resource "aws_security_group" "lab" {
  name        = "lab-aws-sg"
  description = "11 AWS基礎構築演習: HTTP(80)のみ許可。SSHは開放しない（接続はSSM Session Managerのみ）"
  vpc_id      = aws_vpc.lab.id

  ingress {
    description = "HTTP from anywhere（演習用の一時公開）"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "既定のまま全許可"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "lab-aws-sg" })
}

# --- IAM（A-9）: SSM Session Manager 用ロール・インスタンスプロファイル ---

data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ssm" {
  name               = "lab-aws-ssm-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm" {
  name = "lab-aws-ssm-profile"
  role = aws_iam_role.ssm.name
}

# --- EC2（A-10）: キーペアなし。SSM Session Manager のみで接続する ---

resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.lab.id]
  iam_instance_profile   = aws_iam_instance_profile.ssm.name
  # key_name は設定しない（SSM Session Manager のみで接続する。§2 の決定事項）

  metadata_options {
    http_tokens = "required" # IMDSv2 強制
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name      = "lab-aws01"
    ManagedBy = "terraform"
  })
}
