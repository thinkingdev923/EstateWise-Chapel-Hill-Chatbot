output "consul_ui_service" {
  description = "Consul UI service DNS inside the cluster."
  value       = "consul-ui.${var.hashicorp_namespace}.svc.cluster.local"
}

output "nomad_ui_service" {
  description = "Nomad UI service DNS inside the cluster."
  value       = "nomad-ui.${var.hashicorp_namespace}.svc.cluster.local"
}

output "estatewise_namespace" {
  description = "Namespace where the EstateWise workloads should be deployed."
  value       = kubernetes_namespace.estatewise.metadata[0].name
}

output "mesh_gateway_service" {
  description = "Service name for the Consul mesh gateway (if enabled)."
  value       = var.enable_mesh_gateway ? "consul-mesh-gateway.${var.hashicorp_namespace}.svc.cluster.local" : null
}
