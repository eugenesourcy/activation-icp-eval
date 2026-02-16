FROM ghcr.io/openclaw/openclaw:main

COPY workspace/ /home/node/.openclaw/workspace/
COPY entrypoint.sh /entrypoint.sh

EXPOSE 8080

CMD ["sh", "/entrypoint.sh"]
