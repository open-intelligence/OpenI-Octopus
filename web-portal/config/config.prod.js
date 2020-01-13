import webportalConfig from '../src/webportal.config.js';

global.jobTypesFilter = {
    gpuTypeMap:{"dgx":true,"debug":true},
    cpuTypeMap:{"debug_cpu":true}
};

export default {
    theme: {
        "border-radius-base": "0px",
        "menu-dark-item-active-bg":"white",
        "menu-light-item-active-bg": "white",
    },
    plugins: [
        ['umi-plugin-react', {
            antd: true,
            dva: true,
            locale: {
                enable: true,
                default: 'zh-CN',
                baseNavigator: true,
            },
        }]
    ],
    routes: [
        {
            path: '/openi/v2',
            component: '../layouts/GlobalLayout',
            routes: [
                { path: '/', redirect: '/openi/v2/home' },
                { path: 'home',component:'./Home'},
                { path: 'ascend',component:'./Ascend'},
                {
                    path: 'brain',
                    component: '../layouts/SiderContentLayout',
                    routes: [
                        {
                            path:"overview",
                            component:"./Overview",
                        },
                        {
                            path:"submitJob",
                            component:"./JobSubmit",
                        },
                        {
                            path:"jobList",
                            component:"./JobList",
                        },
                        {
                            path:"job",
                            component:"./JobDetail",

                        },
                        {
                            path:"imageList",
                            component:"./ImageSet",

                        },
                        {
                            path:"datasetList",
                            component:"./DataSet",

                        },
                        {
                            path:"monitor",
                            component:"./Admin/ClusterDashboard",
                        },
                        {
                            path:"register",
                            component:"./User/Register",
                        },
                        {
                            path: 'userInfo',
                            component:'./User/UserInfo'
                        },
                        {

                            path: 'changePwd',
                            component:'./User/ChangePwd'
                        }

                    ]
                },
                {
                    component: '404',
                }
            ],
        },
        {
            path: '/openi/single',
            component: '../layouts/SinglePageLayout',
            routes: [
                { path: 'log',component:'./JobLog'},
                {
                    component: '404',
                }
            ],
        },
        {
            name: 'exception',
            icon: 'warning',
            path: '/exception',
            routes: [
                {
                    path: '/exception/403',
                    name: 'not-permission',
                    component: './Exception/403',
                },
                {
                    path: '/exception/404',
                    name: 'not-find',
                    component: './Exception/404',
                },
                {
                    path: '/exception/500',
                    name: 'server-error',
                    component: './Exception/500',
                }
            ],
        },
        {
            component: '404',
        }
    ],
    define: {
        "__WEBPORTAL__": webportalConfig,
        "$JobTypesFilter": {
            gpuTypeMap:{"dgx":true,"debug":true},
            cpuTypeMap:{"debug_cpu":true}
        }
    }
}
