dev:
    docker-compose \
        -f docker-compose.yml \
        -f docker-compose.test.yml \
        --env-file .env.test \
        up
    