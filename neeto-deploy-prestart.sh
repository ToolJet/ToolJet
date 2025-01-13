
#!/bin/sh

echo "Running prestart script ......"

if [ $NEETODEPLOY_APP_DEFAULT_URL ]
then
    echo "Exporting envs: TOOLJET_HOST TOOLJET_SERVER_URL" 
    TOOLJET_HOST=$NEETODEPLOY_APP_DEFAULT_URL
    TOOLJET_SERVER_URL=$NEETODEPLOY_APP_DEFAULT_URL

    export TOOLJET_HOST
    export TOOLJET_SERVER_URL
fi

if [ $PGRST_URL ]
then
    echo "Exporting envs: PGRST_HOST" 
    PGRST_HOST=$PGRST_URL

    export PGRST_HOST
fi

if [ $DATABASE_URL ]
then
    echo "Exporting envs: TOOLJET_DB_USER TOOLJET_DB_PASS TOOLJET_DB_HOST" 
    
    username=$(echo "$DATABASE_URL" | sed -n 's#postgres://\([^:]*\):.*@\([^:]*\):.*#\1#p')
    password=$(echo "$DATABASE_URL" | sed -n 's#postgres://[^:]*:\([^@]*\)@.*#\1#p')
    host=$(echo "$DATABASE_URL" | sed -n 's#postgres://[^@]*@\([^:]*\):.*#\1#p')
    
    export TOOLJET_DB_USER=$username
    export TOOLJET_DB_PASS=$password
    export TOOLJET_DB_HOST=$host
fi
    
