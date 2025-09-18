# Define provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Generate a TLS private key for SSH access
resource "tls_private_key" "tooljet_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Create VPC network
resource "google_compute_network" "tooljet_vpc" {
  name                    = "tooljet-vpc"
  auto_create_subnetworks = false
  description             = "VPC network for Tooljet application"
}

# Create subnet
resource "google_compute_subnetwork" "tooljet_subnet" {
  name          = "tooljet-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.tooljet_vpc.id
}

# Create firewall rules
resource "google_compute_firewall" "tooljet_firewall" {
  name    = "tooljet-firewall"
  network = google_compute_network.tooljet_vpc.name

  allow {
    protocol = "tcp"
    ports    = var.firewall_ports
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["tooljet-server"]
}

# Get the latest Ubuntu image
data "google_compute_image" "ubuntu" {
  family  = "ubuntu-2404-lts-amd64"
  project = "ubuntu-os-cloud"
}

# Create the compute instance
resource "google_compute_instance" "tooljet_instance" {
  name         = "tooljet-instance"
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["tooljet-server"]

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 20
      type  = "pd-standard"
    }
  }

  network_interface {
    network    = google_compute_network.tooljet_vpc.id
    subnetwork = google_compute_subnetwork.tooljet_subnet.id
    
    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    ssh-keys = "${var.ssh_username}:${tls_private_key.tooljet_key.public_key_openssh}"
  }

  metadata_startup_script = file("${path.module}/install_tooljet.sh")

  service_account {
    scopes = ["cloud-platform"]
  }

  depends_on = [google_compute_firewall.tooljet_firewall]
}