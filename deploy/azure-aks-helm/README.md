# Azure Kubernetes Services (AKS) with Helm

__NOT COMPLETE__

## Step 1: Setup Helm

First up, [install Helm](https://helm.sh/docs/using_helm/#installing-helm). Note that I'll 
run without [TLS between Helm and Tiller](https://helm.sh/docs/using_helm/#using-ssl-between-helm-and-tiller)
as I'll blow away the cluster in the short-term.

The [documentation for setting up Helm](https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm)
is pretty good so I'll summarise here:

```bash
kubectl create -f ./helm-rbac.yaml
helm init --service-account tiller
```