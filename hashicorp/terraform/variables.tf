variable "kubeconfig_path" {
  description = "Path to kubeconfig used by Terraform providers."
  type        = string
  default     = "~/.kube/config"
}

variable "kube_context" {
  description = "Optional kubeconfig context name. Leave blank to use the current context."
  type        = string
  default     = ""
}

variable "hashicorp_namespace" {
  description = "Namespace where Consul/Nomad components will run."
  type        = string
  default     = "estatewise-mesh"
}

variable "estatewise_namespace" {
  description = "Namespace for EstateWise application workloads."
  type        = string
  default     = "estatewise"
}

variable "consul_chart_version" {
  description = "Consul Helm chart version."
  type        = string
  default     = "1.4.3"
}

variable "nomad_chart_version" {
  description = "Nomad Helm chart version."
  type        = string
  default     = "0.15.0"
}

variable "nomad_server_count" {
  description = "Number of Nomad server pods."
  type        = number
  default     = 3
}

variable "nomad_client_count" {
  description = "Number of Nomad client agents."
  type        = number
  default     = 3
}

variable "enable_mesh_gateway" {
  description = "Deploy Consul mesh gateways for north-south traffic."
  type        = bool
  default     = true
}
