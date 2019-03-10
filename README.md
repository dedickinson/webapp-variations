# Web App Variations

This repository contains sources that demonstrate various approaches to deploying a web application to Azure. I've prepared a very basic web app
and will walk through a variety of mechanisms for deploying the app to
Azure.

The variations that are ready to go right now are:

1. [Azure Web App with Azure DevOps](deploy/azure-webapp-arm)
1. [Azure Container Instances](deploy/azure-aci)
1. [Azure Web App via a container](deploy/azure-webapp-container)

## Pre-requisites

To get started you'll need a few key items installed:

* [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)
* [Node.js](https://nodejs.org/en/) - I'm running 8.x
* [jq](https://stedolan.github.io/jq/download/)

You'll also need an Azure account. Microsoft offer a [free account](https://azure.microsoft.com/en-au/free/) to help you get started.

### Running on Windows

I'll provide example commands for the Bash shell. If you're running Windows you
can translate the commands to PowerShell or:

1. [Run Linux on Windows](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
1. [Use a container](https://docs.docker.com/docker-for-windows/)
1. Try [Azure Cloud Shell](https://azure.microsoft.com/en-us/features/cloud-shell/) - this comes with `git` so you can clone the code into the cloud shell
1. Setup a Linux VM - maybe try out [Vagrant](https://www.vagrantup.com/)

I've setup some containers under `deploy/local-linux-*` to help out.

If you are using [Docker Machine](https://docs.docker.com/machine/install-machine/) on Windows, the following PowerShell command will configure your shell for working with Docker:

    docker-machine env --shell powershell | Invoke-Expression

## The Web App 

You'll find the web application code under the [`src/`](src/) directory. It's a simmple Node.js application that utilises the 
[hapi framework](https://hapijs.com/).

You can try the app out on your local machine by running the 
following:

```bash
cd src
npm install
npm start
```

Once all the dependencies have downloaded and the application has started you should be able to browse to [http://localhost:3000/](http://localhost:3000/) and see it running.

The home page is just a templated web page, nothing fancy. If you
try [http://localhost:3000/documentation](http://localhost:3000/documentation) you'll see that there's also a single-function API
at [http://localhost:3000/api/random](http://localhost:3000/api/random).

### Variation: webapp up

I'll throw this little variation here so you can get an Azure Web App running really quickly.

The `az webapp up` command 

```bash
cd src
npm install
az webapp up --name webapp-variations-dev --sku B1
```

Once the app has been deployed you'll see the details, including the App URL:

    {
        "app_url": "http://webapp-variations-dev.azurewebsites.net",
        "location": "Central US",
        "name": "webapp-variations-dev",
        "os": "Linux",
        "resourcegroup": "appsvc_rg_Linux_centralus",
        "serverfarm": "appsvc_asp_Linux_centralus",
        "sku": "PREMIUMV2",
        "src_path": "<YOUR_PATH>\\webapp-variations\\src",
        "version_detected": "1.1",
        "version_to_create": "node|8.11"
    }

## Some other quick notes

Before we get going take a moment to read through these notes - they may help
reduce frustration:

* Several of the Azure resources I deploy will have a name that may not be 
replicated. For example, if I name an Azure Web App `mywebapp` it will get
a domain name of `mywebapp.azurewebsites.net` - you won't be able to create 
another web app with the same name so try something different. It can be 
useful to use a prefix to help alleviate name clashes.
* The various instructions I provide here are focussed on a basic deployment.
I don't pretend that the setup is security hardened or production-ready so
please treat them as labs that demonstrate basic elements but need to be further refined before being released to your fan-base.
* Leading on from that last point, I may not explicitly tell you to shutdown
or delete all resources but be mindful that you need to be responsible for what you deploy. Try to shutdown/stop/delete things once you've tried them out - this will save you money and is a good idea from a security perspective.

_Why Weather Balloon?_ It's just a name I've been using for 
small projects.

## Feedback etc

Please use the GitHub Issues register if you find any mistakes. I'd 
be more than happy to look at pull requests as well.
