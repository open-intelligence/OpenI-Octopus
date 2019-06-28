
const proxy = {
    '/api': {
        target: __WEBPORTAL__.restServerUri,
        changeOrigin: true,
    },
}

export default proxy;
