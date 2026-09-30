set shell := ["bash", "-uc"]

image := "ghcr.io/itmagelab/psy.yainna.ru"

run:
    podman rm -f psy >/dev/null 2>&1 || true
    podman volume exists psy-caddy-data || podman volume create psy-caddy-data
    podman volume exists psy-caddy-config || podman volume create psy-caddy-config
    podman run -d --name psy -p 8088:8080 -p 8443:8443 -e DOMAIN=http://localhost -v psy-caddy-data:/data -v psy-caddy-config:/config {{image}}:latest
    @echo "http://localhost:8088"

stop:
    podman rm -f psy
