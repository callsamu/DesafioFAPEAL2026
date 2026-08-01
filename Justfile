dev:
    docker compose --env-file .env.test up -d

down:
    docker compose --env-file .env.test down

prod:
    docker compose \
        -f docker-compose.yml \
        -f docker-compose.prod.yml \
        --env-file .env.prod \
        up -d
