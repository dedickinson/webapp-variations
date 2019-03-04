# Deploying a Web App to an Azure VM with Ansible

## Introduction

[Ansible](https://www.ansible.com/) is an open-source automation tool that allows us
to define and orchestrate the resources and software required to deploy a system environment.
Essentially, we define a state in a [YAML](http://yaml.org/) file (called a playbook)
and use Ansible to run the playbook. Ansible is run from a control machine (e.g. your laptop) and
uses SSH or Powershell Remoting to manipulate hosts. On top of this, Ansible playbooks can also
configure virtualised environments, including Azure, AWS, Docker, OpenStack, VMWare.

The [Ansible Documentation](http://docs.ansible.com/ansible/latest/index.html) is quite strong 
and there's enough [modules](http://docs.ansible.com/ansible/latest/modules_by_category.html) to keep 
you busy.

Ansible is available in the Azure Cloud Shell, allowing
access to Ansible directly inside Azure. They have also released a [Visual Studio Code
extension for Ansible](https://marketplace.visualstudio.com/items?itemName=vscoss.vscode-ansible)
that I used to develop this demonstration.

### Demo overview

In this demonstration I'll configure an Azure environment that consists of:

* A Resource Group containing all demo elements
* A Virtual Network (10.42.0.0/16) with three subnets:
  * `internal`: 10.42.1.0/24
  * `dmz`: 10.42.25.0/24
  * `external`: 10.42.50.0/24
* Network security groups (NSGs) for the subnets

This will make extensive use of the [Ansible Azure module](http://docs.ansible.com/ansible/latest/list_of_cloud_modules.html#azure).

### Other resources

* [Ansible in Azure](https://docs.microsoft.com/en-us/azure/ansible/)
* [A great developer experience for Ansible](https://azure.microsoft.com/en-us/blog/a-great-developer-experience-for-ansible/)

## Preparing your PC

Ansible can deploy and manage most operating systems but it requires a *nix (e.g. Linux or OS X) host for the control machine.

## Prepare an SSH Key

Ansible will use an SSH Key to access the host so we need to create one:

    ssh-keygen -C "Ansible user" -f ~/.ssh/ansible

### Ansible access to Azure

You need to take [a few quick steps](https://docs.microsoft.com/en-us/azure/virtual-machines/linux/ansible-install-configure#create-azure-credentials)
to configure access to Azure. The Microsoft document outlines manual tasks but you should be able to just run the following:

    sudo apt install azure-cli python-pip yamllint
    sudo pip install --upgrade pip
    sudo pip install packaging msrestazure
    sudo pip install ansible[azure] --upgrade

    az login

    AZURE_TMP_SP=$(az ad sp create-for-rbac --name ansible-demo --role Contributor --years 1 --output tsv)

    AZURE_TMP_SUB=$(az account show --output tsv --query 'id')

    mkdir ~/.azure

    cat >~/.azure/credentials<<EOM
    [default]
    subscription_id=$AZURE_TMP_SUB
    client_id=$(echo $AZURE_TMP_SP|cut -f 1 -d " ")
    secret=$(echo $AZURE_TMP_SP|cut -f 4 -d " ")
    tenant=$(echo $AZURE_TMP_SP|cut -f 5 -d " ")
    EOM
    chmod 600 ~/.azure/credentials


## Take Ansible for a spin

Naturally, you'll check your syntax:

    ansible-playbook --syntax-check base.yml

It's always nice to lint as well:

    yamllint base.yml

... then we're good to go:

    ansible-playbook base.yml
    ansible-playbook webapp-host.yml

### Clean up

The `destroy.yml` playbook will blow away the resource group. There's no going back but you can always rebuild.

    ansible-playbook destroy.ymlx

(_Typo is on-purpose_)


## Going further

* [Deploy and configure a single host](ManagingHosts.md)
