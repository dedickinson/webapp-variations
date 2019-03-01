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

To login to the 

```
az acr login --name $ACR_NAME
```

## Try out Podman

It's always interesting to try something new so why not take [Podman](https://github.com/containers/libpod/blob/master/docs/tutorials/podman_tutorial.md) for a spin.

Start up a [Vagrant](https://www.vagrantup.com/) box from this directory by running the following commands:

```bash
vagrant box add --name fedora29 https://mirror.aarnet.edu.au/pub/fedora/linux/releases/29/Cloud/x86_64/images/Fedora-Cloud-Base-Vagrant-29-1.2.x86_64.vagrant-virtualbox.box

vagrant up
```

You can then build the image with:

    buildah bud -t wb-js-site .
