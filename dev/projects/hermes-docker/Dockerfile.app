# ========================================
# Layer 2: Hermes Agent App
# 基于 base 镜像，安装 Hermes 源码 + Python 依赖
# 版本更新时只需重新构建这层
# ========================================
ARG BASE_IMAGE=hermes-base:latest
FROM ${BASE_IMAGE}

ARG HERMES_VERSION=main

# 克隆 Hermes 源码
RUN git clone --depth 1 --branch ${HERMES_VERSION} \
    https://github.com/NousResearch/hermes-agent.git /opt/hermes && \
    rm -rf /opt/hermes/.git

WORKDIR /opt/hermes

# 安装 Node 依赖
RUN npm install --prefer-offline --no-audit && \
    cd /opt/hermes/scripts/whatsapp-bridge && \
    npm install --prefer-offline --no-audit && \
    npm cache clean --force

# 权限
RUN chown -R hermes:hermes /opt/hermes

# 安装 Python 依赖
USER hermes
RUN uv venv && \
    uv pip install --no-cache-dir -e ".[all]"

USER root

# entrypoint
COPY --chmod=0755 entrypoint.sh /opt/hermes/docker/entrypoint.sh

ENV HERMES_HOME=/opt/data
VOLUME ["/opt/data"]
ENTRYPOINT ["/opt/hermes/docker/entrypoint.sh"]
