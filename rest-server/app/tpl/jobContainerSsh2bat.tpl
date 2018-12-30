@echo off

type nul> {{privateKeyFileName}}.key
<% for(var i = 0; i < privateKey.length; i++){ %>
{{if privateKey[i]}}echo {{privateKey[i]}}>> {{privateKeyFileName}}.key{{/if}}
<% } %>
ssh -i ./{{privateKeyFileName}}.key -p {{sshPort}} root@{{sshIp}}
pause