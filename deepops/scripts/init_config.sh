
# Update submodules kubespray to release 2.11 (k8s 1.15.5)
#git status >/dev/null 2>&1
#if [ $? -eq 0 ] ; then
#    git rm --cache kube-openi-octopus
#    git submodule add -f http://192.168.202.74/octopus/k8s-ansible.git kube-openi-octopus
#    git submodule update --remote 
#else
#    echo "ERROR: Unable to update Git submodules"
#fi

# Copy default configuration
CONFIG_DIR=${CONFIG_DIR:-./config}
if [ ! -d "${CONFIG_DIR}" ] ; then
    cp -rfp ./config.example "${CONFIG_DIR}"
    echo "Copied default configuration to ${CONFIG_DIR}"
else
    echo "Configuration directory '${CONFIG_DIR}' exists, not overwriting"
fi