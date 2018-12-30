#!/bin/bash
cat > {{privateKeyFileName}} << EOF
{{privateKey}}
EOF
chmod 600 {{privateKeyFileName}}
ssh -i {{privateKeyFileName}} -p {{sshPort}} root@{{sshIp}}