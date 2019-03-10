# Variation: Azure Web App via a container

In [Variation: Azure Web App via Azure DevOps](../azure-webapp-arm) I deployed the app code
using an ARM template pushed out by Azure DevOps. This essentially relied on DevOps to
install the required Node modules, deploy the Azure resources, and copy the code to the 
Azure Web App environment.

Then, in [Variation: Azure Container Instances](../azure-aci/README.md) I built a container image and 
deployed it to Azure Container Registry. In that variation I quickly spun up a container instance 
based on the image and could then access the web app.

However, the container instance approach is probably not the best long-term hosting solution. 
Luckily, I can use that image with Azure's [Web App for Containers](https://docs.microsoft.com/en-us/azure/app-service/containers/tutorial-custom-docker-image)
approach and deploy the container image to Azure Web App and have the configuration and control 
mechanisms that platform provides.

## Step 1: Setup your Bash session

Let's get some variables set up:

```bash
# Web App details
RESOURCE_GROUP=webapp-variations-containers
RESOURCE_GROUP_LOCATION=centralus
APP_SERVICE_PLAN=webapp-variations-containers
IMAGE_NAME=webapp-variation
WEB_APP_NAME=$RESOURCE_GROUP

# Image and ACR details
ACR_NAME=webappvariations
IMAGE_VERSION=cj2
ACR_RESOURCE_GROUP=webapp-variations
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME \
                               --resource-group $ACR_RESOURCE_GROUP \
                               --query "loginServer" \
                               --output tsv)
AKV_NAME=webappvariationskeyvault
```

## Step 2: Create a new Resource Group

We'll create a new Resource Group due to [current limitations](https://docs.microsoft.com/en-gb/azure/app-service/containers/app-service-linux-intro#limitations) that prevent a Linux plan cohabitating with a Windows one.

    az group create --name $RESOURCE_GROUP \
                    --location $RESOURCE_GROUP_LOCATION

## Step 4: Create the App Service Plan

Create a Linux App Service Plan:

    az appservice plan create --name $RESOURCE_GROUP \
                              --resource-group $RESOURCE_GROUP \
                              --sku B1 \
                              --is-linux

## Step 4: Create the Web App

Now create a Web App that uses container images:

    az webapp create --resource-group $RESOURCE_GROUP \
                     --plan $RESOURCE_GROUP \
                     --name $WEB_APP_NAME \
                     --deployment-container-image-name $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_VERSION

If you try to access the Web App's URL you'll get a failure. This is because the configuration is
pointing to an image in a private repository. Let's fix this.

## Step 5: Configure the Web App

In order to pull an image from a private repository you need to configure the container settings
and registry acccess:

    az webapp config container set --name $WEB_APP_NAME \
                                   --resource-group $RESOURCE_GROUP \
                                   --docker-custom-image-name $ACR_LOGIN_SERVER/$IMAGE_NAME:$IMAGE_VERSION \
                                   --docker-registry-server-url $ACR_LOGIN_SERVER \
                                   --docker-registry-server-user $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
                                   --docker-registry-server-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv)

Once that's done the Web App will be able to pull the image from ACR. As the image uses
port 3000 to serve the app, a further configuration maps the Web App correctly:

    az webapp config appsettings set --name $WEB_APP_NAME \
                                     --resource-group $RESOURCE_GROUP \
                                     --settings WEBSITES_PORT=3000

Finally, we'll do a little clean up by removing FTPS access and requiring (at least) TLS v1.2

    az webapp config set --name $WEB_APP_NAME \
                         --resource-group $RESOURCE_GROUP \
                         --min-tls-version 1.2 \
                         --ftps-state Disabled

... and then we'll enforce HTTPS:

    az webapp update --name $WEB_APP_NAME \
                     --resource-group $RESOURCE_GROUP \
                     --https-only true

## Step 6: Check out the app

You should now be able to see the web app. To get the URL:

    echo https://$(az webapp show --name $WEB_APP_NAME \
                                  --resource-group $RESOURCE_GROUP \
                                  --query 'defaultHostName' -o tsv)

## Conclusion

Having previously prepared the container registry and image deployment made
this variation reaosnably straight forward.

Once you settle on a versioning/tagging model you can even configure [continuous deployment](https://docs.microsoft.com/en-gb/azure/app-service/containers/app-service-linux-ci-cd?toc=%2fazure%2fapp-service%2fcontainers%2ftoc.json)
so that your Web App is updated when you update the image. This backs nicely into ACR tasks and
your pipeline can include not only your code updates but updates to base images.

Don't forget to delete your Web App when you're done:

    az group delete --resource-group $RESOURCE_GROUP
