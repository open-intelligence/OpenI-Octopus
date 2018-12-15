const randomNumber = function randomNumber() {
    let str = "";
    let range = 5 ;
    let arr = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n',
    'o','p','q','r','s','t','u','v','w','x','y','z'];
    for (var i = 0 ;i<range ;i++){
        pos = Math.round(Math.random()*(arr.length -  1));
        str += arr[pos];
    }
    return str;
}//随机数
const isNewId = function isNewId(nid) {
    this.nid = nid;
    let arrExp = [7, 9, 10, 5, 1];//加权因子
    let arrValid = [1,0,9,8,7,6,5,4,3,2,'a','b','c','y','z','d','e','f','g','k','l','m','n',
        'o','p','q','X','r','h','i','j','s','t','u','v','w','x'];//校验码
    let checkNumber;
    let sum = 0,idx = 0;
    for(let i = 0 ; i<5 ; i++){
        if((nid.substr(i,1).charCodeAt()>=97 && (nid.substr(i,1).charCodeAt()<=122))){
            sum += parseInt((nid.substr(i,1).charCodeAt()-96),10)*arrExp[i];
        }else {
            //对前5位数字与权值求和
            sum += parseInt(nid.substr(i,1),10)*arrExp[i];
            //计算模
        }
    }
    idx = sum % 37;
        //校验码
    checkNumber = arrValid[idx];

    return nid+checkNumber;
}
module.exports= {randomNumber,isNewId};
