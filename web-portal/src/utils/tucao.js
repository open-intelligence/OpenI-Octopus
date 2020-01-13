const Tucao = (function() {
    /**
     * 发起接入请求
     * @param  {Number} productId  需要接入产品 id
     * @param  {[Object]} data     需要传递的用户信息
     */
    var request = function(productId, data) {
        var form = document.createElement("form");
        form.id = "form";
        form.name = "form";
        form.target="_blank"
        document.body.appendChild(form);

        // 设置相应参数
        for (let key in data) {
            var input = document.createElement("input");
            input.type = "text";
            input.name = key;
            input.value = data[key];
            // 将该输入框插入到 form 中
            form.appendChild(input);
        }
        // form 的提交方式
        form.method = "POST";
        // form 提交路径
        form.action = "https://support.qq.com/product/" + productId;
        // 对该 form 执行提交
        form.submit();
        // 删除该 form
        document.body.removeChild(form);
    }

    var getBowerInfo = function(){
        return {
            // 客户端信息
            clientInfo: navigator.userAgent,
            // 客户端版本号
            clientVersion: navigator.appVersion,
            // 操作系统
            os: navigator.platform,
            // 操作系统版本
            // osVersion:'',
            // 网络类型
            // netType:'',
            // 设备id
            // imei:''
        }
    }
    return {
        request: request,
        getBowerInfo: getBowerInfo
    }
})();

export default Tucao
