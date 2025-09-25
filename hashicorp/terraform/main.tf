locals {
  estatewise_labels = {
    "app.kubernetes.io/managed-by" = "terraform"
    "app.kubernetes.io/part-of"   = "estatewise"
  }
}

resource "kubernetes_namespace" "mesh" {
  metadata {
    name = var.hashicorp_namespace
    labels = merge(local.estatewise_labels, {
      "mesh.hashicorp.com/consul" = "true"
    })
  }
}

resource "kubernetes_namespace" "estatewise" {
  metadata {
    name = var.estatewise_namespace
    labels = local.estatewise_labels
    annotations = {
      "consul.hashicorp.com/connect-inject" = "true"
    }
  }
}

resource "helm_release" "consul" {
  name             = "consul"
  repository       = "https://helm.releases.hashicorp.com"
  chart            = "consul"
  version          = var.consul_chart_version
  namespace        = kubernetes_namespace.mesh.metadata[0].name
  create_namespace = false

  values = [file("${path.module}/values/consul-values.yaml")]

  set {
    name  = "server.replicas"
    value = tostring(3)
  }

  set {
    name  = "meshGateway.enabled"
    value = var.enable_mesh_gateway ? "true" : "false"
  }

  lifecycle {
    ignore_changes = [values]
  }
}

resource "helm_release" "nomad" {
  name             = "nomad"
  repository       = "https://helm.releases.hashicorp.com"
  chart            = "nomad"
  version          = var.nomad_chart_version
  namespace        = kubernetes_namespace.mesh.metadata[0].name
  create_namespace = false

  values = [file("${path.module}/values/nomad-values.yaml")]

  set {
    name  = "server.replicas"
    value = tostring(var.nomad_server_count)
  }

  set {
    name  = "client.replicaCount"
    value = tostring(var.nomad_client_count)
  }

  depends_on = [helm_release.consul]
}

resource "kubernetes_network_policy" "allow_consul_mesh" {
  metadata {
    name      = "allow-consul-mesh"
    namespace = kubernetes_namespace.mesh.metadata[0].name
    labels    = local.estatewise_labels
  }
  spec {
    pod_selector {}

    ingress {
      from {
        namespace_selector {
          match_labels = local.estatewise_labels
        }
      }
    }

    egress {
      to {
        namespace_selector {
          match_labels = local.estatewise_labels
        }
      }
    }

    policy_types = ["Ingress", "Egress"]
  }
}
