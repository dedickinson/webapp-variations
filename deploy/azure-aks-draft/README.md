# Draft

__NOT COMPLETE__

I'll use [Draft](https://draft.sh/) to help deployment. 

## Step 1: Setup Draft
Install Draft as per the [instructions](https://github.com/azure/draft). I just downloaded
the binary and installed it under `/usr/local/bin`.

Working from the project root directory:

```bash
draft init
draft create --pack javascript
```

Configuration:

```bash
draft config set registry $ACR_NAME.azurecr.io
az acr login --name $ACR_NAME
```

Run:

```bash
draft up
kubectl get service --watch
```