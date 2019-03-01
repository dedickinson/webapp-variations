FROM microsoft/azure-cli

# Build: docker build -t az .
# Run: docker run -it -v /c/Users/$($env:UserName.ToLower()):/home/az az

RUN adduser -D az

USER az

VOLUME /home/az
