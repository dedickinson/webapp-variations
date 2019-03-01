# Web App Variations

This repository contains sources that demonstrate various approaches
to deploying a web application to Azure.

## Pre-requisites

* [Node.js](https://nodejs.org/en/) - I'm running 10.x
* [jq](https://stedolan.github.io/jq/download/)

## Running commands

I'll provide example commands for the Bash shell. If you're running Windows you
can translate the commands to PowerShell or:

1. [Run Linux on Windows](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
1. [Use a container](https://docs.docker.com/docker-for-windows/)
1. Try [Azure Cloud Shell](https://azure.microsoft.com/en-us/features/cloud-shell/) - this comes with `git` so you can clone the code into the cloud shell
1. Setup a Linux VM - maybe try out [Vagrant](https://www.vagrantup.com/)

I've setup some containers under `deploy/local-linux-*` to help out.

If you are using Docker Machine on Windows, the following PowerShell command will configure your shell for working with Docker:

    docker-machine env --shell powershell | Invoke-Expression

