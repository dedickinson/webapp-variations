# Variation: Azure Kubernetes Services (AKS)

Running up a [container instance in ACI](../azure-aci/README.md) was interesting but deploying containers to an [Azure Web App](../azure-webapp-container/README.md) 
was probably more practical. This next variation takes it up a notch
by deploying the web app to Kubernetes (K8S) running in Azure.

[Azure Kubernetes Service](https://docs.microsoft.com/en-us/azure/aks/) is
a hosted K8S service - meaning you don't have to [deploy it yourself](https://github.com/kelseyhightower/kubernetes-the-hard-way). 

You'll find that K8S is, quite rightly, getting a lot of attention at the moment. For my money, it provides a great platform for running applications 
that can also avoid getting locked in to a specific vendor. We'll deploy to
AKS here but the model is almost the same for any K8S cluster. To prove this, 
I'll even deploy the web app to a local Minikube instance.

## Get set up

I'll assume you've run through the [Azure Container Instances variation](../azure-aci/README.md) as this configures the
resource group and Azure Container Registry we'll depend on here.

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

From there you can run most of the commands given in the AKS section of this guide. 
For ease of introduction I'll quickly outline the process of deploying the web app in the subsection below.

### Minikube and ACR

Make sure you are pointing at minikube:

    kubectl config current-context

As the container images are held in ACR I'll need to setup a secret for connecting to the repo:

```bash
AKV_NAME=webappvariationskeyvault
RESOURCE_GROUP=webapp-variations
ACR_NAME=webappvariations
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)

# Create the dev namespace
kubectl create namespace dev

# Create the secret for accessing our ACR resource
kubectl create secret docker-registry acr-auth \
                    --docker-server $ACR_LOGIN_SERVER \
                    --docker-username $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
                    --docker-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv) \
                    --namespace dev
```

From there you just create the namespace, deployment, and the service

```bash
kubectl create --filename=deployment.yaml
kubectl create --filename=service-mk.yaml
```

If all goes well you can access the site with:

    minikube service --namespace dev webapp-variation-service

To tear it all down:

    kubectl delete namespace dev

## Get AKS running

Hopefully you got the system running in Minikube. I'll go into more depth now as we
setup [Azure Kubernetes Service](https://docs.microsoft.com/en-us/azure/aks/intro-kubernetes)

### Step 1: Setup AKS cluster

First we'll set up some variables:

```bash
AKV_NAME=webappvariationskeyvault
RESOURCE_GROUP=webapp-variations
RESOURCE_GROUP_LOCATION=centralus
ACR_NAME=webappvariations
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)
AKS_NAME=webapp-variations-aks
```

You can check the Kubernetes versions available in AKS by running:

    az aks get-versions --location $RESOURCE_GROUP_LOCATION -o table

Now we'll create an AKS instance with 2 nodes:

```bash
az aks create --resource-group $RESOURCE_GROUP \
            --location $RESOURCE_GROUP_LOCATION \
            --name $AKS_NAME \
            --kubernetes-version 1.12.6 \
            --node-vm-size Standard_B2s \
            --node-count 2 \
            --generate-ssh-keys
```

As an aside, you can check for VM sizes by running:

    az vm list-sizes --location $RESOURCE_GROUP_LOCATION -o table

_Note: Not all sizes work in an AKS cluster_

### Step 2: Connect to your Kubernetes environmemt

First of all, install the `kubectl` cli:

    sudo az aks install-cli

If you need to re-connect for any reason:

    az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME

Check your context - it should be your new AKS environment:

    kubectl config current-context

You should now be able to run [`kubectl`](https://kubernetes.io/docs/reference/kubectl/overview/)
commands against your cluster:

    kubectl get nodes
    kubectl describe nodes

Take a look at the Kubernetes dashboard [by configuring RBAC](https://docs.microsoft.com/en-au/azure/aks/kubernetes-dashboard):

    kubectl create clusterrolebinding \
                    kubernetes-dashboard \
                    --clusterrole=cluster-admin \
                    --serviceaccount=kube-system:kubernetes-dashboard

Then launch the dashboard:

    az aks browse --resource-group $RESOURCE_GROUP --name $AKS_NAME

### Step 3: Create a `dev` namespace

Check the currently available namespaces

    kubectl get namespaces

Create the `dev` namespace:

    kubectl create namespace dev

You can set the default namespace using the code below but I'll be explicit in further calls.

    kubectl config set-context $(kubectl config current-context) --namespace=dev

### Step 4: Authenticate with ACR

We need create a secret (`acr-auth`) that can be used in the up-coming deployment - allowing
it to access the Azure Container Registry:

```bash
kubectl create secret docker-registry acr-auth \
                    --docker-server $ACR_LOGIN_SERVER \
                    --docker-username $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
                    --docker-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv) \
                    --namespace dev
```

### Step 5: Deploy the pod

Create the deployment and watch it come up:

```bash
kubectl create --validate=true --filename=deployment.yaml
kubectl get deployments --watch --namespace=dev
```

Once deployed, we can quickly check in on the website and see it running:

    kubectl port-forward \
        $(kubectl get pods --selector=app=webapp-variation --namespace=dev --output=json|jq -r ".items[0].metadata.name") \
        8080:6000 --namespace dev

You should be able to access the pod at http://localhost:8080

### Step 6: Deploy the service

You'll see that I deploy a slightly different service file (`service.yaml`) to the
one I used for Minikube (`service-mk.yaml`) as AKS uses a `LoadBalancer` rather than 
a `NodePort` 

```bash
kubectl create --filename=service.yaml
```

The service will take a few minutes to deploy as the `Loadbalancer` is deployed. You can
keep an eye on it with:

    kubectl get services --namespace dev --watch

Once the `EXTERNAL-IP` has a value, you'll be able to browse to that address and see the
web app up and running.

### Step 7: Tidy up

You might want to keep trying out AKS but you'll eventually want to take down the resource 
so as to save a few dollars:

    az aks delete --resource-group $RESOURCE_GROUP --name $AKS_NAME --no-wait

# Conclusion

AKS gives us a quick way to deploy a Kubernetes cluster and ACR keeps providing a useful 
repository for deploying images. Minikube is also a really handy tool
for local development processes.

# References

* [AKS documentation](https://docs.microsoft.com/en-us/azure/aks/)
* [Kubernetes documentation](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/)
* Registry (ACR) authentication:
    * [Using Azure Container Registry (ACR)](https://kubernetes.io/docs/concepts/containers/images/#using-azure-container-registry-acr)
    * [Authenticate with Azure Container Registry from Azure Kubernetes Service](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-auth-aks)
    