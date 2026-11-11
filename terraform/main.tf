terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0.0"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

# Updated to the _v1 resource
resource "kubernetes_namespace_v1" "staging" {
  metadata {
    name = "kijani-staging"
    labels = {
      environment = "staging"
      managed_by  = "terraform"
    }
  }
}

# Updated to the _v1 resource
resource "kubernetes_config_map_v1" "staging_config" {
  metadata {
    name      = "kk-payments-config"
    namespace = kubernetes_namespace_v1.staging.metadata[0].name
  }

  data = {
    DB_HOST = "staging-db.kijani.local"
    ENV     = "staging"
  }
}