# Azure Kubernetes Services (AKS)

## Step 1: Setup AKS

First we'll set up some variables:

```bash
RESOURCE_GROUP=wb-js-site-aks
RESOURCE_GROUP_LOCATION=centralus
AKS_NAME=wb-js-site-aks
ACR_NAME=weatherballoonaks
```

You can check the Kubernetes versions available in AKS by running:

    az aks get-versions --location $RESOURCE_GROUP_LOCATION

Now we'll create a resource group, container registry and AKS instance:

```bash
az group create --name $RESOURCE_GROUP --location $RESOURCE_GROUP_LOCATION

az acr create --name $ACR_NAME --resource-group $RESOURCE_GROUP --sku Standard

az aks create --resource-group $RESOURCE_GROUP \
            --location $RESOURCE_GROUP_LOCATION \
            --name $AKS_NAME \
            --kubernetes-version 1.12.5 \
            --node-count 1 \
            --generate-ssh-keys
```

## Step 2: Connect to your Kubernetes environmemt

First of all, install the `kubectl` cli:

    sudo az aks install-cli

You should now be able to run [`kubectl`](https://kubernetes.io/docs/reference/kubectl/overview/)
commands against your cluster:

    kubectl get nodes
    kubectl describe nodes

If you need to re-connect for any reason:

    az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

Take a look at the Kubernetes dashboard [by configuring RBAC](https://docs.microsoft.com/en-au/azure/aks/kubernetes-dashboard):

    kubectl create clusterrolebinding kubernetes-dashboard --clusterrole=cluster-admin --serviceaccount=kube-system:kubernetes-dashboard

Then launch the dashboard:

    az aks browse --resource-group wb-js-site-aks --name wb-js-site-aks

## Step 3: Create a `dev` namespace

Check the currently available namespaces

    kubectl get namespaces

Make sure you're in the `deploy/azure-aks` directory and create the `dev` namespace:

    kubectl create -f ./dev-namespace.yaml

## Step 4: Setup Helm

First up, [install Helm](https://helm.sh/docs/using_helm/#installing-helm). Note that I'll 
run without [TLS between Helm and Tiller](https://helm.sh/docs/using_helm/#using-ssl-between-helm-and-tiller)
as I'll blow away the cluster in the short-term.

The [documentation for setting up Helm](https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm)
is pretty good so I'll summarise here:

```bash
kubectl create -f ./helm-rbac.yaml
helm init --service-account tiller
```


## Step 5: Setup Draft

I'll use [Draft](https://draft.sh/) to help deployment. 

Install Draft as per the [instructions](https://github.com/azure/draft). I just downloaded
the binary and installed it under `/usr/local/bin`.

Working from the project root directory:

```bash
draft init
draft create --pack javascript
```

Configuration:

```bash
draft config set registry $ACR_NAME.azurecr.io
az acr login --name $ACR_NAME
```

Run:

```bash
draft up
kubectl get service --watch
```

