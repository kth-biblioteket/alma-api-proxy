# KTHB Proxy mot Almas API

Används främst för att göra Alma-api anrop från Primo när det finns en inloggad användare

##

###


#### Dependencies

Node 16.13.2

##### Installation

1.  Skapa folder på server med namnet på repot: "/local/docker/alma-api-proxy"
2.  Skapa och anpassa docker-compose.yml i foldern
```
version: '3.6'

services:
  ldap-api:
    container_name: alma-api-proxy
    image: ghcr.io/kth-biblioteket/alma-api-proxy:${REPO_TYPE}
    restart: always
    env_file:
      - ./alma-api-proxy.env
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.alma-api-proxy.rule=Host(`${DOMAIN_NAME}`) && PathPrefix(`${PATHPREFIX}`)"
      - "traefik.http.routers.alma-api-proxy.middlewares=alma-api-proxy-stripprefix"
      - "traefik.http.middlewares.alma-api-proxy-stripprefix.stripprefix.prefixes=${PATHPREFIX}"
      - "traefik.http.routers.alma-api-proxy.entrypoints=websecure"
      - "traefik.http.routers.alma-api-proxy.tls=true"
      - "traefik.http.routers.alma-api-proxy.tls.certresolver=myresolver"
    networks:
      - "apps-net"

networks:
  apps-net:
    external: true
```
3.  Skapa och anpassa .env(för composefilen) i foldern
```
PATHPREFIX=/alma
DOMAIN_NAME=api-ref.lib.kth.se
REPO_TYPE=ref
```
4.  Skapa och anpassa alma-api-proxy.env (för applikationen) i foldern
public key: https://api-eu.hosted.exlibrisgroup.com/auth/46KTH_INST/jwks.json
public key: https://api-eu.hosted.exlibrisgroup.com/auth/46KTH_INST/jwks.json?env=sandbox
```
ALMAPIENDPOINT=https://api-eu.hosted.exlibrisgroup.com/almaws/v1/
ALMAAPIKEY=xxxxxxxxxxxxxxxx
PORT=3008
EXLIBRISPUBLICKEY_X=xxxxxxxxxxxxxxxx
EXLIBRISPUBLICKEY_Y=xxxxxxxxxxxxxxxx
EXLIBRISPUBLICKEY_URL=https://api-eu.hosted.exlibrisgroup.com/auth/46KTH_INST/jwks.json?env=sandbox
LOG_LEVEL=debug
NODE_ENV=development
```
5. Skapa deploy_ref.yml i github actions
6. Skapa deploy_prod.yml i github actions
7. Github Actions bygger en dockerimage i github packages
8. Starta applikationen med docker compose up -d --build i "local/docker/ldap-api"

