# Azure Kubernetes Services (AKS) with Helm

Packaging an application makes it easier to deploy and upgrade. [Helm](https://helm.sh/) is 
promoted as the package manager for Kubernetes. There's a lot to Helm but you'll see in the 
[`webapp-variations-chart`](webapp-variations-chart/) directory a very basic chart that
defines how the web app is packaged.

In this variation we'll package the chart and deploy it to Azure Container Registry. We'll then 
install the chart in an Azure Kubernetes Service.

## Step 0: Have AKS up and running
I'll assume you have an [AKS instance running](../azure-aks/README.md) but, if not, here's a 
quick setup:

```bash
AKS_NAME=webapp-variations-aks
RESOURCE_GROUP=webapp-variations
RESOURCE_GROUP_LOCATION=centralus

az aks create --resource-group $RESOURCE_GROUP \
            --location $RESOURCE_GROUP_LOCATION \
            --name $AKS_NAME \
            --kubernetes-version 1.12.6 \
            --node-vm-size Standard_B2s \
            --node-count 2 \
            --generate-ssh-keys
```

It can be helpful to have the dashboard running:

```bash
kubectl create clusterrolebinding \
                kubernetes-dashboard \
                --clusterrole=cluster-admin \
                --serviceaccount=kube-system:kubernetes-dashboard

az aks browse --resource-group $RESOURCE_GROUP --name $AKS_NAME
```

You can also run this variation in Minikube - the instructions given
here should work pretty well without changing much more than your [context
in `kubectl`](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/#define-clusters-users-and-contexts). I've also provided a local testing process in at the end of the article.

## Step 1: Setup Bash session

Much as I've done previously I'll configure my Bash environment:

```bash
AKS_NAME=webapp-variations-aks
AKV_NAME=webappvariationskeyvault
RESOURCE_GROUP=webapp-variations
ACR_NAME=webappvariations
IMAGE_NAME=webapp-variation
IMAGE_VERSION=cj7
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)
CHART_CONFIG=~/.webapp-variations-chart.yaml
```

## Step 2: Create a configuration file

Next I'll configure a `YAML` file that will override the default 
Helm chart values (see `webapp-variations-chart/values.yaml`) 

```bash
cat >$CHART_CONFIG <<EOF
replicaCount: 1

nameOverride: ""
fullnameOverride: ""

image:
  registry: $ACR_LOGIN_SERVER
  repository: $IMAGE_NAME
  tag: $IMAGE_VERSION
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: acr

registryCredentials:
  name: acr
  registry: $ACR_LOGIN_SERVER
  username: $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv)
  password: $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv)

service:
  type: LoadBalancer
  port: 80

resources: 
    limits:
      memory: "256M"
      cpu: "0.5"
    requests:
      memory: "128M"
      cpu: "0.25"
EOF

chmod 400 $CHART_CONFIG
```

## Step 3: Setup Helm

Next, [install Helm](https://helm.sh/docs/using_helm/#installing-helm). Note that I'll 
run without [TLS between Helm and Tiller](https://helm.sh/docs/using_helm/#using-ssl-between-helm-and-tiller)
as I'll blow away the cluster in the short-term.

If you just setup an AKS instance you may need to setup your context:

    az aks get-credentials --resource-group $RESOURCE_GROUP --name $AKS_NAME
    kubectl config current-context

The [documentation for setting up Helm](https://docs.microsoft.com/en-us/azure/aks/kubernetes-helm)
is pretty good so I'll summarise here:

```bash
kubectl create -f ./helm-rbac.yaml
helm init --service-account tiller
```

## Step 4: Push the Helm Chart to ACR

ACR has preview [support for Helm charts](https://docs.microsoft.com/en-au/azure/container-registry/container-registry-helm-repos).

This will configure the repository, package the chart and push it:

```bash
az configure --defaults acr=$ACR_NAME
az acr helm repo add

# Package the chart 
helm package webapp-variations-chart

# Push the chart
az acr helm push webapp-variations-chart-0.1.0.tgz
```

Once you've pushed the chart you can check it with:

    az acr helm list -o table

## Step 5: Install the chart

Before installing the chart, let's update the local Helm environment
and check out chart:

```bash
# This line is run after each time you push a chart
az acr helm repo add

# Update the local Helm repo and inspect the chart:
helm repo update
helm inspect $ACR_NAME/webapp-variations-chart

# Get the details from ACR
az acr helm show $ACR_NAME/webapp-variations-chart
```

Before doing the real install, a dry run gives us the opportunity
to check that there are no errors and the `--debug` option will
display the configuration we're about to use:

```bash
helm install --values $CHART_CONFIG \
             --dry-run --debug \
             $ACR_NAME/webapp-variations-chart
```

If that all looks good, it's time to deploy:

```bash
helm install --values $CHART_CONFIG \
             $ACR_NAME/webapp-variations-chart
```

If `install` succeeds, you'll get a message listing the resources deployed and
instructions for accessing the system (these are generated from 
`webapp-variations-chart/templates/NOTES.txt`). 

You'll see the name of your deployment listed in the results but you can always
check it with:

    helm list

    helm status virulent-leopard

_Naturally you swap `virulent-leopard` out for your deployment's name_

You can also monitor the deployment with:

    kubectl get deployments -w


## Step 6: Scale the deployment

If you call `kubectl get deployments` you should see the deployment created by Helm.
You can use that deployment name to scale your pods.

Pods go up:

    kubectl scale deployment.v1.apps/wobbling-robin-webapp-variations-chart --replicas=10

Pods go down:

    kubectl scale deployment.v1.apps/wobbling-robin-webapp-variations-chart --replicas=2

## Step 7: Delete the installation

You can delete the install (removing all related resources):

    helm delete wobbling-robin

Don't forget to delete the AKS instance if you won't be needing it.

## Local testing

Whilst I deployed the Helm chart into ACR, I can test the chart locally.

Start up minikube:

    minikube start

I can lint the chart by running the following command from
the __same__ directory as this README file:

```bash
helm lint webapp-variations-chart
```

Setup Tiller:

```bash
kubectl create -f ./helm-rbac.yaml
helm init --service-account tiller
```

Next, setup a configuration to use for a local installation of
the chart:

```bash
RESOURCE_GROUP=webapp-variations
AKV_NAME=webappvariationskeyvault
ACR_NAME=webappvariations
IMAGE_NAME=webapp-variation
IMAGE_VERSION=cj7
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)
CHART_CONFIG=~/.webapp-variations-chart-local.yaml

cat >$CHART_CONFIG <<EOF
replicaCount: 1

nameOverride: ""
fullnameOverride: ""

image:
  registry: $ACR_LOGIN_SERVER
  repository: $IMAGE_NAME
  tag: $IMAGE_VERSION
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: acr

registryCredentials:
  name: acr
  registry: $ACR_LOGIN_SERVER
  username: $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv)
  password: $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv)

service:
  type: NodePort
  port: 8080

resources: 
    limits:
      memory: "256M"
      cpu: "0.5"
    requests:
      memory: "128M"
      cpu: "0.25"
EOF

chmod 400 $CHART_CONFIG
```

Now install the chart:

```bash
helm install --values $CHART_CONFIG \
             webapp-variations-chart
```

To access the service when running on Minikube, use the service name returned
by `install` in the following command:

    minikube service <service name>

This process is handy when you're working on the chart.

## Conclusion

Take some time to look through the chart files under `webapp-variations-chart` - it's 
very much a template-driven version of the same YAML files I presented in the
[Azure Kubernetes Services (AKS)](../azure-aks/README.md) variation. Helm improves the ability
to deploy a package (including its dependencies) and, later on, upgrade it - a very handy tool
to have on your K8S journey.

