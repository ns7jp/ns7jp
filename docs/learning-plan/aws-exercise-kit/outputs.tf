output "instance_id" {
  description = "作成した EC2 インスタンス ID"
  value       = aws_instance.web.id
}

output "public_ip" {
  description = "EC2 の自動割り当てパブリック IP（Elastic IP は使わない）"
  value       = aws_instance.web.public_ip
}

output "ssm_connect_command" {
  description = "SSM Session Manager で接続するコマンド（B-8）"
  value       = "aws ssm start-session --target ${aws_instance.web.id} --profile ${var.profile}"
}

output "healthcheck_url" {
  description = "Nginx 導入後、ブラウザ/curl で確認する URL（A-13 / B-8）"
  value       = "http://${aws_instance.web.public_ip}/"
}
