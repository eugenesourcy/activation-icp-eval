FROM ghcr.io/openclaw/openclaw:main

ENV HOME=/home/node
ENV TERM=xterm-256color

COPY workspace/ /home/node/.openclaw/workspace/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
