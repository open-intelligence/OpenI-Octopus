import createLoading from 'dva-loading';
export const dva = {
    config: {
        onError(e) {
            e.preventDefault();
            console.error("Error:",e);
        },
    },
    plugins: [
        //require('dva-logger')(),
    ],
};
