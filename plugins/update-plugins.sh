#!/bin/bash
echo "updating plugins to tooljet_server_1 filesystem"
docker exec -t tooljet_server_1 /bin/sh "rm -rf plugins"
docker cp ../plugins tooljet_server_1:plugins
docker exec -it tooljet_server_1 npm i   
echo "updated plugins to tooljet_server_1 filesystem"