var express = require('express');
var cookie = require('cookie');
var proxy = require('http-proxy-middleware');
//proxy() = new function(req,res,next){}
var app = express();

const defaultTarget = process.env.DefaultTarget || "192.168.202.71";

const port = process.env.SERVER_PORT || "8080";

app.use("/jpylab",proxy('/jpylab',{
        target: defaultTarget,
        ws: true,
        changeOrigin: true,
        router: function (req) {
            //console.log("router /jpylab req query:",JSON.stringify(req.query));

            let target = req.query?req.query.target:undefined;

            if(!target)
            {
                let cookies = cookie.parse(req.headers.cookie);
                target = cookies.jpyip;
                req.cookiejpyip = target;
            }

            req.jpyip = target;

            //console.log("new target:",target);

            const newUrl = "http://"+target;

            return newUrl;
        },
        pathRewrite: function (path, req) {
            let newPath =  path.replace(/&target=(.*)/, '');
            //console.log("newPath:",newPath);
            return newPath;
        },
        onProxyRes: function(proxyRes, req, res) {
            //console.log("route /jpylab cookiejpyip:",req.cookiejpyip," jpyip:",req.jpyip);

            let cookiestr = cookie.serialize('jpyip', req.jpyip,{
                path: "/"
            });
            let cookies = proxyRes.headers['set-cookie'];
            if(cookies){
                cookies.push(cookiestr);
            }

        },
        onError: function (err, req, res) {
            console.error("Jupyter Proxy route /jpblab err",JSON.stringify(err));
        }

    })
);

app.listen(port);


process.on('uncaughtException',function (err) {
    //打印出错误
    console.log("uncaughtException:");
    //打印出错误的调用栈方便调试
    console.log(err.stack);
});

process.on('exit',function (code) {
    console.log(code);
});

process.on('SIGINT', function() {

    //2秒后程序退出,这两秒需要做程序状态记录

    setTimeout(function () {
        console.log('Got SIGINT.  Press Control-D/Control-C to exit.');
        process.exit();
    },2*1000);

});
