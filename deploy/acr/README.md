# Azure Container Registry

I created an Azure Container Registry (ACR) instance through the portal as only one is really needed
across this work.

The container image is built from the `Dockerfile` located in the project's root.

Upon code commit, an image is built and deployed to the registry using an [ACR build task](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-tutorial-build-task).

I [created a Personal Access Token (PAT)](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops) with Read access on the code.

```bash
ACR_NAME=weatherballoon.azurecr.io
GIT_REPO=https://weatherballoon@dev.azure.com/weatherballoon/Weather%20Balloon/_git/wb-js-site
GIT_PAT=YOUR_PAT_GOES_HERE

az acr task create \
    --registry $ACR_NAME \
    --name wb-js-site \
    --image helloworld:{{.Run.ID}} \
    --context $GIT_REPO \
    --branch master \
    --file Dockerfile \
    --git-access-token $GIT_PAT \
    --os Linux
```