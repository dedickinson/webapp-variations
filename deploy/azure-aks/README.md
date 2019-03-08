# Azure Kubernetes Services (AKS)

[`kubectl`](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the primary 
command line tool for working with Kubernetes. It's worth installing that first of all - note that you
can do this via the `az` cli but I'd suggest going to the Kubernetes site and following their install
instructions.

I'd also suggest you use the [Kubernetes extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools).

## Try out Minikube

Before running up a Kubernetes cluster in Azure, why not try [Minikube](https://kubernetes.io/docs/setup/minikube/)
on your local machine?

Once you've installed Minikube you can get running quickly with:

```bash
# Start Minikube
minikube start

# Configure kubectl to access Minikube
kubectl config use-context minikube
```

It's always handy to use the dashboard whilst you're working:

    minikube dashboard

From there you can run most of the commands given in Step 3 and on in the next section. 

## Get AKS running
### Step 1: Setup AKS

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

### Step 2: Connect to your Kubernetes environmemt

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

### Step 3: Create a `dev` namespace

Check the currently available namespaces

    kubectl get namespaces

Make sure you're in the `deploy/azure-aks` directory and create the `dev` namespace:

    kubectl create -f ./dev-namespace.yaml






