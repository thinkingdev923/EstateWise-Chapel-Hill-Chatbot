# HashiCorp Deployment Stack

This stack lets you run EstateWise on any Kubernetes cluster while layering in HashiCorp Consul for service discovery/mesh and Nomad for scheduled workloads (e.g., nightly analytics, ingest jobs). For a cloud-by-cloud comparison see [DEPLOYMENTS.md](../DEPLOYMENTS.md).

## Layout

```
hashicorp/
├─ deploy.sh                # Wrapper that runs terraform init/plan/apply
└─ terraform/
   ├─ main.tf               # Installs Consul + Nomad via Helm
   ├─ providers.tf          # Kubernetes, Helm, and optional Consul providers
   ├─ variables.tf          # kubeconfig / namespace settings
   ├─ outputs.tf            # Connection info (Consul UI, Nomad UI, DNS endpoints)
   └─ values/
      ├─ consul-values.yaml # Mesh + Connect injection defaults
      └─ nomad-values.yaml  # Nomad cluster tuned for scheduler workloads
```

## Prerequisites

- Existing Kubernetes cluster (EKS, AKS, GKE, k3s, or on-prem).
- `kubectl config current-context` points to the cluster (or pass `--kubeconfig` / `--context`).
- Terraform >= 1.6 and Helm provider prerequisites.
- `kubectl`, `helm`, `nomad`, and `consul` CLIs for day-to-day operations.

## Deploy

```bash
cd hashicorp
./deploy.sh \
  --kubeconfig ~/.kube/config \
  --context estatewise-prod \
  --namespace estatewise \
  --mesh-namespace estatewise-mesh \
  --do-apply

# Deploy workloads after Consul sidecar injector is online
kubectl apply -k ../kubernetes/base
```

The script runs `terraform init`, `terraform plan`, and `terraform apply` (when `--do-apply` is present). State remains in `hashicorp/terraform/.terraform/terraform.tfstate` by default; configure a remote backend if desired.

## Outputs

- Consul UI URL + bootstrap token
- Nomad UI URL
- Mesh gateway service address for north-south traffic
- Suggested DNS entries for backend/frontend services registered via Consul Connect

## Operational Notes

- Consul Connect injection is enabled by default in `kubernetes/base` (annotate other namespaces with `consul.hashicorp.com/connect-inject: "true"`).
- Nomad server/client counts can be tuned through variables (`nomad_server_count`, `nomad_client_count`).
- Mesh gateways are created to route external traffic; square them with your ingress controller (NGINX, AWS Load Balancer Controller, etc.).
- Scale via `terraform apply -var='nomad_client_count=6'` or `kubectl scale deployment` for the app tiers.

Refer to [`kubernetes/README.md`](../kubernetes/README.md) for workload manifests and overlays.
