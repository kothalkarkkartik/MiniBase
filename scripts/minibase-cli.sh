#!/usr/bin/env bash
# MiniBase Global CLI Helper for Linux / VPS
INSTALL_DIR="${HOME}/minibase"
ACTION="${1:-status}"

case "$ACTION" in
  start)
    if command -v systemctl &> /dev/null && [ -f /etc/systemd/system/minibase.service ]; then
      sudo systemctl start minibase
      echo "✅ MiniBase started as system service."
    else
      cd "$INSTALL_DIR" && nohup node bin/minibase.js serve --http=0.0.0.0:8090 --tunnel > minibase.log 2>&1 &
      echo "✅ MiniBase started in background."
    fi
    ;;
  stop)
    if command -v systemctl &> /dev/null && [ -f /etc/systemd/system/minibase.service ]; then
      sudo systemctl stop minibase
      echo "🛑 MiniBase stopped."
    else
      pkill -f "minibase.js serve" || true
      echo "🛑 MiniBase process terminated."
    fi
    ;;
  restart)
    if command -v systemctl &> /dev/null && [ -f /etc/systemd/system/minibase.service ]; then
      sudo systemctl restart minibase
      echo "🔄 MiniBase restarted."
    else
      pkill -f "minibase.js serve" || true
      cd "$INSTALL_DIR" && nohup node bin/minibase.js serve --http=0.0.0.0:8090 --tunnel > minibase.log 2>&1 &
      echo "🔄 MiniBase restarted."
    fi
    ;;
  logs)
    if command -v systemctl &> /dev/null && [ -f /etc/systemd/system/minibase.service ]; then
      sudo journalctl -u minibase -f
    else
      tail -f "$INSTALL_DIR/minibase.log"
    fi
    ;;
  status|info|"")
    SERVER_IP=$(curl -s https://api.ipify.org || echo "localhost")
    echo "=================================================="
    echo "  ⚡ MiniBase BaaS Status"
    echo "=================================================="
    if command -v systemctl &> /dev/null && [ -f /etc/systemd/system/minibase.service ]; then
      sudo systemctl status minibase --no-pager -l
    else
      pgrep -fl "minibase.js" || echo "MiniBase is not running."
    fi
    echo ""
    echo "  ➜ Admin Studio: http://${SERVER_IP}:8090/_/"
    echo "  ➜ Default Email: admin@minibase.io"
    echo "  ➜ Default Pass:  admin12345"
    echo "=================================================="
    ;;
  *)
    # Pass arbitrary commands to node bin/minibase.js
    cd "$INSTALL_DIR" && node bin/minibase.js "$@"
    ;;
esac
