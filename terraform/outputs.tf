output "staging_namespace" {
  description = "The name of the provisioned staging namespace"
  value       = kubernetes_namespace_v1.staging.metadata[0].name
}
