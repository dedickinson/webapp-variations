FROM docker.io/alpine

# Build: docker build -t ansible .

RUN apk update \
    && apk upgrade

RUN apk add gcc linux-headers python3 python3-dev py3-pip

RUN pip3 install ansible

RUN pip3 install ansible[azure]

RUN adduser -D ansible

USER ansible

VOLUME /home/ansible
