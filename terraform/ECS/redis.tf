# resource "aws_memorydb_subnet_group" "tooljet_subnet_group" {
#   name        = "tooljet-subnet-group"
#   description = "ToolJet MemoryDB subnet group"
#   subnet_ids  = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
# }

# resource "aws_memorydb_cluster" "tooljet_mem_cluster" {
#   acl_name           = "open-access"
#   name               = "tooljet-mem-cluster"
#   node_type          = "db.t4g.small"
#   num_shards         = 1
#   subnet_group_name  = aws_memorydb_subnet_group.tooljet_subnet_group.name
#   port               = 6379

#   security_group_ids = [aws_security_group.memdb_sg.id]

# #   maintenance_window = "sun:23:00-mon:01:30"
# #   snapshot_retention_limit = 7
# }

# resource "aws_security_group" "memdb_sg" {
#   name        = "tooljet-memdb-sg"
#   description = "Security group for ToolJet MemoryDB"
#   vpc_id      = aws_vpc.tooljet_vpc.id

#   ingress {
#     from_port   = 6379
#     to_port     = 6379
#     protocol    = "tcp"
#     cidr_blocks = ["0.0.0.0/0"]
#   }

#   egress {
#     from_port   = 0
#     to_port     = 0
#     protocol    = "-1"
#     cidr_blocks = ["0.0.0.0/0"]
#   }
# }
