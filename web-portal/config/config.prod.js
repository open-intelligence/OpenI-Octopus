import webportalConfig from '../src/webportal.config.js';

global.jobTypesFilter = {
    gpuTypeMap:{"run":true,"debug":true},
    cpuTypeMap:{"debug_cpu":true}
};

export default {
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
            path: '/openi/user',
            component: '../layouts/UserLayout',
            routes: [
                { path: '/', redirect: '/openi/user/login' },
                { path: 'login', component: './User/Login' },
                { path: 'register',component:'./User/Register'},
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
            path: '/openi/admin',
            component: '../layouts/IframeLayout',
            routes: [
                { path: 'dashboard',component:'./Admin/ClusterDashboard'},
                {
                    component: '404',
                }
            ],
        },
        {
            path: '/openi',
            component: '../layouts/BasicLayout',
            routes: [
                { path: '/', redirect: '/openi/user/login' },
                {
                    path: 'overview',
                    component: './Overview'
                },
                {
                    path:"imageset",
                    component:"./ImageSet",

                },
                {
                    path:"dataset",
                    component:"./DataSet",

                },
                {
                    path:"submit",
                    component:"./JobSubmit",

                },
                {

                    path: 'change-password',
                    component:'./User/ChangePwd'
                },
                {
                    path: 'userInfo',
                    component:'./User/UserInfo'
                },
                {
                    path:"jobs",
                    component:"./JobList",

                },
                {
                    path:"job",
                    component:"./JobDetail",

                },
                {
                    component: '404',
                }
            ]
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
