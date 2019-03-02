# Azure Dev Spaces

[Azure Dev Spaces](https://docs.microsoft.com/en-us/azure/dev-spaces/) provides a development
environment for Kubernetes - just note that it's in preview at the moment.

For this work I'll be working in [Visual Studio Code](https://code.visualstudio.com/)

## Step 1: Create a `dev` namespace

Check the currently available namespaces

    kubectl get namespaces

We'll create a namespace call `dev` that will hold our 

## Step 2: Install .NET Core Runtime

The Dev Spaces setup tries to install the .NET Core Runtime but this was a bit hit-and-miss for me so 
I'd suggest you head to the [download page](https://dotnet.microsoft.com/download/dotnet-core/2.2) 
and set it up yourself first.

As I'm on Linux Mint, this went something like:

```bash
cd /tmp
wget -q https://packages.microsoft.com/config/ubuntu/18.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo add-apt-repository universe
sudo apt install apt-transport-https
sudo apt update
sudo apt install aspnetcore-runtime-2.2
```

Double check that you now have a .NET Core Runtime (I'm on 2.2.2):

    dotnet --list-runtimes

## Step 3: Enable Dev Spaces

We enable Dev Spaces:

```bash
az aks use-dev-spaces --resource-group $RESOURCE_GROUP --name $AKS_NAME
```

The following things will happen:

1. You'll be prompted to agree to the licence terms and privacy statement 
1. The `.NET Core Runtime` may be downloaded and installed on your system. This takes a while so make yourself a cup of tea.

You'll then be prompted for a few things:

1. Should a Dev Spaces Controller be created? _Yes_
1. Select a dev space or Kubernetes namespace to use as a dev space. _I created a new one named `dev`_
1. Select a parent dev space or Kubernetes namespace to use as a parent dev space.

You'll also want to install the Azure Dev Spaces extension in Visual Studio Code.

