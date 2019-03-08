# Azure Container Registry

I created an Azure Container Registry (ACR) instance through the portal as only one is really needed
across this work.

The container image is built from the `Dockerfile` located in the project's root.

Upon code commit, an image is built and deployed to the registry using an [ACR build task](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-build-task).

I [created a Personal Access Token (PAT)](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops) with Read access on the code.

```bash
GIT_PAT=YOUR_PAT_GOES_HERE

ACR_NAME=weatherballoon
GIT_REPO=https://weatherballoon@dev.azure.com/weatherballoon/Weather%20Balloon/_git/wb-js-site

az acr task create \
    --registry $ACR_NAME \
    --name wb-js-site \
    --image wb-js-site:{{.Run.ID}} \
    --context $GIT_REPO \
    --branch master \
    --file Dockerfile \
    --git-access-token $GIT_PAT \
    --os Linux
```

Once you `git push` a change, the image should be rebuilt. You can track the task runs with:

    az acr task list-runs --registry $ACR_NAME -o table

### Using the image

To login to the registry:

    az acr login --name $ACR_NAME

Then pull the image:

    docker pull $ACR_NAME.azurecr.io/wb-js-site:cj1

Then run:

    docker run --rm -ti -p 3000:3000 $ACR_NAME.azurecr.io/wb-js-site:cj1

## Deploy to Azure Container Instances

Much of what I write here is available in the [Deploy to Azure Container Instances from Azure Container Registry](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-using-azure-container-registry) guide,

First up, set up some additional variables:

    ACR_RESOURCE_GROUP=wb-core-services
    RESOURCE_GROUP=wb-js-site-aci
    RESOURCE_GROUP_LOCATION=centralus
    CONTAINER_NAME=wb-js-site
    CONTAINER_VERSION=cj1
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $ACR_RESOURCE_GROUP --query "loginServer" --output tsv)
    AKV_NAME=weatherballoon

Then add

    az keyvault secret set \
        --vault-name $AKV_NAME \
        --name $ACR_NAME-pull-pwd \
        --value $(az ad sp create-for-rbac \
                        --name http://$ACR_NAME-pull \
                        --scopes $(az acr show --name $ACR_NAME --query id --output tsv) \
                        --role acrpull \
                        --query password \
                        --output tsv)

Note that this creates a service principal as part of the call. You can find this later on if you need it:

    az ad sp list --filter "displayname eq '$ACR_NAME-pull'"

And now add the service principal's App ID to the key vault to use as a user name 

    az keyvault secret set \
        --vault-name $AKV_NAME \
        --name $ACR_NAME-pull-usr \
        --value $(az ad sp show --id http://$ACR_NAME-pull --query appId --output tsv)

Next, set up a resource group:

    az group create --name $RESOURCE_GROUP --location $RESOURCE_GROUP_LOCATION

And _FINALLY_ we can create an Azure Container Instance:

    az container create --resource-group $RESOURCE_GROUP \
                        --name $CONTAINER_NAME \
                        --image $ACR_LOGIN_SERVER/$CONTAINER_NAME:$CONTAINER_VERSION \
                        --cpu 1 --memory 1 \
                        --registry-login-server $ACR_LOGIN_SERVER \
                        --registry-username $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
                        --registry-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv) \
                        --dns-name-label $CONTAINER_NAME-$RANDOM \
                        --query ipAddress.fqdn \
                        --ports 3000

This will pop out the DNS address for the container - remember to add port 3000 when you put it into your browser.
The following command will give you what you need:

    echo http://$(az container show --name $CONTAINER_NAME --resource-group $RESOURCE_GROUP --query ipAddress.fqdn --output tsv):3000

It's a useful idea to stop your container when you're not using it:

    az container stop --name $CONTAINER_NAME --resource-group $RESOURCE_GROUP


