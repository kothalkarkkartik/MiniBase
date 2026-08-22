#!/usr/bin/env bash
# ==============================================================================
#  MiniBase 1-Click Automated Installer for Linux / VPS (Ubuntu, Debian, CentOS, macOS)
#  Usage: curl -fsSL https://raw.githubusercontent.com/kothalkarkkartik/MiniBase/main/scripts/install.sh | bash
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
cat << "EOF"
  ███╗   ███╗██╗███╗   ██╗██╗██████╗  █████╗ ███████╗███████╗
  ████╗ ████║██║████╗  ██║██║██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██╔████╔██║██║██╔██╗ ██║██║██████╔╝███████║███████╗█████╗  
  ██║╚██╔╝██║██║██║╚██╗██║██║██╔══██╗██╔══██║╚════██║██╔══╝  
  ██║ ╚═╝ ██║██║██║ ╚████║██║██████╔╝██║  ██║███████║███████╗
  ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
EOF
echo -e "${NC}"
echo -e "${BOLD}🚀 MiniBase Automated 1-Click Installer for VPS${NC}\n"

# 1. Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
fi

# 2. Check and Install Node.js 22 LTS if missing
if ! command -v node &> /dev/null || [ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]; then
    echo -e "${YELLOW}[1/4] Node.js 20+ not detected. Installing latest Node.js LTS...${NC}"
    if [ "$OS" == "linux" ]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update -qq
            sudo apt-get install -y -qq curl git
            curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
            sudo apt-get install -y -qq nodejs
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
            sudo yum install -y nodejs git
        else
            echo -e "${RED}Please install Node.js 20+ manually and rerun this script.${NC}"
            exit 1
        fi
    elif [ "$OS" == "macos" ]; then
        if command -v brew &> /dev/null; then
            brew install node@22
        else
            echo -e "${RED}Please install Node.js 20+ from https://nodejs.org${NC}"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✓ [1/4] Node.js $(node -v) is already installed.${NC}"
fi

# 3. Clone or Update MiniBase Repository
INSTALL_DIR="${HOME}/minibase"
echo -e "${YELLOW}[2/4] Setting up MiniBase in ${INSTALL_DIR}...${NC}"

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating existing MiniBase installation..."
    cd "$INSTALL_DIR"
    git pull origin main --quiet
else
    git clone https://github.com/kothalkarkkartik/MiniBase.git "$INSTALL_DIR" --quiet
    cd "$INSTALL_DIR"
fi

# 4. Install Dependencies
echo -e "${YELLOW}[3/4] Installing dependencies...${NC}"
npm install --production --no-audit --no-fund --quiet

# 5. Optional Systemd Service Creation (Linux Only)
if [ "$OS" == "linux" ] && command -v systemctl &> /dev/null; then
    echo -e "${YELLOW}[4/4] Setting up 24/7 background system service...${NC}"
    SERVICE_FILE="/etc/systemd/system/minibase.service"
    NODE_PATH=$(which node)
    CURRENT_USER=$(whoami)

    sudo bash -c "cat > ${SERVICE_FILE}" << SERVICE_EOF
[Unit]
Description=MiniBase Backend-as-a-Service Daemon
After=network.target

[Service]
Type=simple
User=${CURRENT_USER}
WorkingDirectory=${INSTALL_DIR}
ExecStart=${NODE_PATH} bin/minibase.js serve --http=0.0.0.0:8090 --tunnel
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=8090
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
SERVICE_EOF

    sudo systemctl daemon-reload
    sudo systemctl enable minibase --quiet
    sudo systemctl restart minibase
    echo -e "${GREEN}✓ MiniBase system service enabled and started! (Runs 24/7 on boot)${NC}"
else
    echo -e "${GREEN}✓ Starting MiniBase in background...${NC}"
    nohup node bin/minibase.js serve --http=0.0.0.0:8090 --tunnel > minibase.log 2>&1 &
fi

# 6. Setup Global 'minibase' CLI Command
if [ -f "$INSTALL_DIR/scripts/minibase-cli.sh" ]; then
    chmod +x "$INSTALL_DIR/scripts/minibase-cli.sh"
    sudo ln -sf "$INSTALL_DIR/scripts/minibase-cli.sh" /usr/local/bin/minibase 2>/dev/null || true
fi

# 7. Detect IP
SERVER_IP=$(curl -s https://api.ipify.org || echo "YOUR_VPS_IP")

echo ""
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "${GREEN}${BOLD}  🎉 MiniBase Successfully Installed & Running!       ${NC}"
echo -e "${GREEN}${BOLD}======================================================${NC}"
echo -e "  ➜ Admin Studio (Local/VPS): ${CYAN}http://${SERVER_IP}:8090/_/${NC}"
echo -e "  ➜ Default Admin Email:      ${YELLOW}admin@minibase.io${NC}"
echo -e "  ➜ Default Admin Password:   ${YELLOW}admin12345${NC}"
echo -e "  ➜ Data Directory:           ${CYAN}${INSTALL_DIR}/minibase_data${NC}"
echo ""
echo -e "  ${BOLD}⚡ Quick Management Commands (Run from anywhere):${NC}"
echo -e "  • Check Status:     ${CYAN}minibase status${NC}"
echo -e "  • View Live Logs:   ${CYAN}minibase logs${NC}"
echo -e "  • Restart Server:   ${CYAN}minibase restart${NC}"
echo -e "  • Stop Server:      ${CYAN}minibase stop${NC}"
echo -e "${GREEN}======================================================${NC}"
