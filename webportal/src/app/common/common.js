const errorHandle = (xhr) => {
    const res = JSON.parse(xhr.responseText)
    if(res.code!=null){
        if(res.code.startsWith('UnauthorizedUserError')){
            alert('login timeout');
            window.location.replace('/login.html');
        }
    }
    if(res.error!=null){
        if(!res.error.startsWith("UserHasNoJobList")){
            alert(res.message);
        }
    }
};

module.exports = {errorHandle};
