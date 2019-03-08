# VM with Podman

__NOT COMPLETE__

It's always interesting to try something new so why not take [Podman](https://github.com/containers/libpod/blob/master/docs/tutorials/podman_tutorial.md) for a spin.

Start up a [Vagrant](https://www.vagrantup.com/) box from this directory by running the following commands:

```bash
vagrant box add --name fedora29 https://mirror.aarnet.edu.au/pub/fedora/linux/releases/29/Cloud/x86_64/images/Fedora-Cloud-Base-Vagrant-29-1.2.x86_64.vagrant-virtualbox.box

vagrant up
```

You can then build the image with:

    buildah bud -t wb-js-site .