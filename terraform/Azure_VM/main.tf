# Define the Azure provider
provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id

}

# Generate a TLS private key for SSH access
resource "tls_private_key" "tooljet_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Resource Group
resource "azurerm_resource_group" "tooljet_rg" {
  name     = var.resource_group_name
  location = var.location
}

# Virtual Network
resource "azurerm_virtual_network" "tooljet_vnet" {
  name                = "TooljetVNet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.tooljet_rg.location
  resource_group_name = azurerm_resource_group.tooljet_rg.name
}

# Subnet
resource "azurerm_subnet" "tooljet_subnet" {
  name                 = "TooljetSubnet"
  resource_group_name  = azurerm_resource_group.tooljet_rg.name
  virtual_network_name = azurerm_virtual_network.tooljet_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Public IP
resource "azurerm_public_ip" "tooljet_public_ip" {
  name                = "TooljetPublicIP"
  resource_group_name = azurerm_resource_group.tooljet_rg.name
  location            = azurerm_resource_group.tooljet_rg.location
  allocation_method   = "Static"
  sku                 = "Standard"
}

# # Network Security Group (NSG) with Ingress Rules
# resource "azurerm_network_security_group" "tooljet_nsg" {
#   name                = "TooljetNSG"
#   location            = azurerm_resource_group.tooljet_rg.location
#   resource_group_name = azurerm_resource_group.tooljet_rg.name

#   dynamic "security_rule" {
#     for_each = zip(tolist(["22", "80", "443", "3000"]), range(length(["22", "80", "443", "3000"])))
#     content {
#       name                       = "AllowPort-${security_rule.value}"
#       priority                   = 100 + (security_rule.value * 10) 
#       direction                  = "Inbound"
#       access                     = "Allow"
#       protocol                   = "Tcp"
#       source_port_range          = "*"
#       destination_port_range     = security_rule.value
#       source_address_prefix      = "*"
#       destination_address_prefix = "*"
#     }
#   }
# }

resource "azurerm_network_security_group" "tooljet_nsg" {
  name                = "TooljetNSG"
  location            = azurerm_resource_group.tooljet_rg.location
  resource_group_name = azurerm_resource_group.tooljet_rg.name

  dynamic "security_rule" {
    for_each = {
      "22"   = 100,
      "80"   = 110,
      "443"  = 120,
      "3000" = 130
    }
    content {
      name                       = "AllowPort-${security_rule.key}"
      priority                   = security_rule.value  # Assign priority from the map
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = security_rule.key
      source_address_prefix      = "*"
      destination_address_prefix = "*"
    }
  }
}


# Network Interface with NSG
resource "azurerm_network_interface" "tooljet_nic" {
  name                = "TooljetNIC"
  location            = azurerm_resource_group.tooljet_rg.location
  resource_group_name = azurerm_resource_group.tooljet_rg.name

  ip_configuration {
    name                          = "TooljetIPConfig"
    subnet_id                     = azurerm_subnet.tooljet_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.tooljet_public_ip.id
  }

}

# Associate NSG with Subnet 
resource "azurerm_subnet_network_security_group_association" "tooljet_nsg_association" {
  subnet_id                 = azurerm_subnet.tooljet_subnet.id
  network_security_group_id = azurerm_network_security_group.tooljet_nsg.id
}

# Virtual Machine
resource "azurerm_linux_virtual_machine" "tooljet_vm" {
  name                = "TooljetVM"
  location            = azurerm_resource_group.tooljet_rg.location
  resource_group_name = azurerm_resource_group.tooljet_rg.name
  size                = var.vm_size
  admin_username      = var.vm_admin_username
  network_interface_ids = [azurerm_network_interface.tooljet_nic.id]

  admin_ssh_key {
    username   = var.vm_admin_username
    public_key = tls_private_key.tooljet_key.public_key_openssh
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 16
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "24_04-lts" # equivalent to a recent Ubuntu LTS version
    version   = "latest"
  }


  custom_data = base64encode(file("${path.module}/install_tooljet.sh")) # Assuming the script is in the module path

  tags = {
    Name = "TooljetAppServer"
  }
}
