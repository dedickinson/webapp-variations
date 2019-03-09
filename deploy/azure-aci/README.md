# Variation: Azure Container Instances

At the [root of the codebase](https://github.com/dedickinson/webapp-variations)
you'll see there's a `Dockerfile`. We can use this to create a container image
and upload it to an [Azure Container Registry (ACR)](https://docs.microsoft.com/en-us/azure/container-registry/).

Once the image is in the registry, we can then deploy (run) a container instance
using [Azure Container Instances (ACI)](https://docs.microsoft.com/en-us/azure/container-instances/).

## Step 0: Try it locally

If you have [Docker installed on your machine](https://docs.docker.com/install/)
you can build the image and run it locally.

Clone this repository (or fork it and then clone) and, from the base folder
run the following:

```bash
docker build -t webapp-variation .
docker run --rm -it -p 3000:3000 webapp-variation
```

Hop into your browser and you'll find the site at http://localhost:3000/

## Step 1: Setup your PAT and Bash session

In order to automate image builds you'll need to create a
[GitHub Personal Access Token (PAT)](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) 
with `public_repo` scope. You'll then put this token in the `GIT_PAT`
variable below.

I'll perform this work in Bash so let's get some variables set up 
(after you `az login` of course):

```bash
GIT_PAT=XXXXXXXXXX

RESOURCE_GROUP=webapp-variations
RESOURCE_GROUP_LOCATION=centralus
ACR_NAME=webappvariations
IMAGE_NAME=webapp-variation
GIT_REPO=https://github.com/dedickinson/webapp-variations.git
```

_Note:_ I created the `webapp-variations` recource group in the last
variation but you can quickly set it up by running:

    az group create --location $RESOURCE_GROUP_LOCATION --name $RESOURCE_GROUP

## Step 2: Create an Azure Container Registry (ACR)

I'll create an [Azure Container Registry (ACR)](https://docs.microsoft.com/en-us/azure/container-registry/)
to hold the container image that will be built:

```bash
az acr create --name $ACR_NAME \
              --resource-group $RESOURCE_GROUP \
              --location $RESOURCE_GROUP_LOCATION \
              --sku Standard
```

Similar to building the image with Docker, you can have ACR build it:

    az acr build --registry $ACR_NAME -t $IMAGE_NAME .

## Step 3: Create an ACR task

Running `az acr build` will add the image to your registry but that relies on us
remembering to do it. 

We'll configure it so that an image is built and deployed to
the registry when we push code changes using an 
[ACR build task](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-build-task).

```bash
az acr task create \
    --registry $ACR_NAME \
    --name $IMAGE_NAME \
    --image $IMAGE_NAME:{{.Run.ID}} \
    --context $GIT_REPO \
    --git-access-token $GIT_PAT \
    --branch master \
    --file Dockerfile \
    --platform Linux \
    --commit-trigger-enabled true
```

_Note:_ I set the image version to be the `Run.ID`. You want to [consider your
approach to tagging](https://azure.microsoft.com/en-us/resources/videos/azure-friday-pros-and-cons-of-stable-and-unique-tags-in-docker-image-tagging/)
when you're starting to get serious.

You can check your tasks with:

    az acr task list --registry $ACR_NAME -o table

Prompt a manual build using:

    az acr task run --name $IMAGE_NAME \
                    --registry $ACR_NAME

Once you `git push` a change, the image should be rebuilt. You can track the task runs with:

    az acr task list-runs --registry $ACR_NAME -o table

## Step 4: Use the image locally

You can grab your ACR images and run them on your local system.

To login to the registry:

    az acr login --name $ACR_NAME

Then pull the image:

    docker pull $ACR_NAME.azurecr.io/$IMAGE_NAME:cj2

_Where `cj2` is a version in the registry_

Then run:

    docker run --rm -ti -p 3000:3000 $ACR_NAME.azurecr.io/$IMAGE_NAME:cj2


## Step 5: Deploy an Azure Container Instance (ACI)

Now that we have an image in ACR we can deploy it as a container instance.

Much of what I write here is available in the [Deploy to Azure Container Instances from Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-using-azure-container-registry) guide but I'll boil it down to get something going quickly.



First up, set up some additional variables:

```bash
AKV_NAME=webappvariationskeyvault
IMAGE_VERSION=cj2
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)
```

First up I'll create an [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/key-vault-whatis):

    az keyvault create --name $AKV_NAME \
                       --resource-group $RESOURCE_GROUP

The Key Vault is used to hold the username and password for a 
[Service Principal](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals). 
This is used by ACI to access the image held in ACR.

Let's create the Service Principal and put its password into the Key Vault:

    az keyvault secret set \
        --vault-name $AKV_NAME \
        --name $ACR_NAME-pull-pwd \
        --value $(az ad sp create-for-rbac \
                        --name http://$ACR_NAME-pull \
                        --scopes $(az acr show --name $ACR_NAME --query id --output tsv) \
                        --role acrpull \
                        --query password \
                        --output tsv)

_Note:_ this creates a service principal as part of the call. You can find this later on if you need it:

    az ad sp list --filter "displayname eq '$ACR_NAME-pull'"

And now add the service principal's App ID to the key vault to use as a user name 

    az keyvault secret set \
        --vault-name $AKV_NAME \
        --name $ACR_NAME-pull-usr \
        --value $(az ad sp show --id http://$ACR_NAME-pull --query appId --output tsv)

And _FINALLY_ we can create an Azure Container Instance:

    az container create --resource-group $RESOURCE_GROUP \
                        --name $IMAGE_NAME \
                        --image $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_VERSION \
                        --cpu 1 --memory 1 \
                        --registry-login-server $ACR_LOGIN_SERVER \
                        --registry-username $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
                        --registry-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv) \
                        --dns-name-label $IMAGE_NAME-$RANDOM \
                        --query ipAddress.fqdn \
                        --ports 3000

This will pop out the DNS address for the container - remember to add port 3000 when you put it into your browser. The following command will give you what you need:

    echo http://$(az container show --name $IMAGE_NAME --resource-group $RESOURCE_GROUP --query ipAddress.fqdn --output tsv):3000

It's a useful idea to stop your container when you're not using it:

    az container stop --name $IMAGE_NAME --resource-group $RESOURCE_GROUP

## Conclusion

I used ACI as an example to demonstrate running an container instance of the image but
this isn't a great approach to hosting a website. 

The big news here is that we've setup a container registry and a build task to update the 
image each time a change it pushed to GitHub. The next few variations will use this 
registry to deploy the web app to other services.
