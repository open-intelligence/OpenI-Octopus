require('bootstrap');
require('jquery');
require('./bootstrap-table.min.css');
require('./bootstrap-table.min.js');
require('./bootstrap-table-zh-CN.min');

const url = require('url');
// const moment = require('moment/moment.js');
const breadcrumbComponent = require('../breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../loading/loading.component.ejs');
const resourceViewComponent = require('./resource-view-component.ejs');
const resourceDetailTableComponent = require('./resource-detail-table.ejs');

const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');

let table = null;
const resourceViewHtml = resourceViewComponent({
    breadcrumb: breadcrumbComponent,
    loading: loadingComponent,
    resourceTable: resourceDetailTableComponent,
});

const loadResource= () => {
    userAuth.checkToken((token) => {
        $('#view-table').html(resourceDetailTableComponent({}));
        $('#resource-table').bootstrapTable({
            method: 'GET',
            url:`/orderServiceApi/userTime/getUserTimeRecordForCompute`,    //要请求数据的文件路径
            striped: true,    //是否显示行间隔色
            /*rowStyle: rowStyle,*/
            //dataField: "result",
            pageNumber: 1,    //初始化加载第一页，默认第一页
            pagination:true,    //是否分页
            queryParamsType:'limit',    //查询参数组织方式
            queryParams:queryParams,    //请求服务器时所传的参数
            sidePagination:'server',    //指定服务器端分页
            pageSize: 10,    //单页记录数
            locale:'zh-CN',    //中文支持,
            columns: [
                {title: 'jobName', field: 'jobName'},
                {title: 'cluster', field: 'cluster'},
                {title: 'usedCpu', field: 'cpu'},
                {title: 'usedGpu', field: 'gpu'},
                {title: 'usedMemory', field: 'memory'},
                {title: 'usedDisk', field: 'disk'},
                {title: 'usedBandWidth', field: 'net'},
                {title: 'remaindCpu', field: 'cpuSurplus'},
                {title: 'remaindGpu', field: 'gpuSurplus'},
                {title: 'remaindMemory', field: 'memorySurplus'},
                {title: 'remaindDisk', field: 'diskSurplus'},
                {title: 'remaindBandWidth', field: 'netSurplus'},
                {title: 'createTime', field: 'createDate'},
            ],
            responseHandler:function(res){
               return {
                    'total': res.count,
                    'rows' : res.result,     //在ajax获取到数据，渲染表格之前，修改数据源
                };
            //    return res;
            }

        });
    });
};
//请求服务数据时所传参数
function queryParams(params){
    return{
        token: cookies.get('bitaToken'),
        pageSize: params.limit,  //每页多少条数据
        pageNo:Math.ceil(params.offset / params.limit) + 1,  //请求第几页
        cluster: `${webportalConfig.clusterName}`,
        operateType: '0'
    }
};
/*let rowStyle = function (row, index) {
    var classes = ['success', 'info'];
    if (index % 2 === 0) {//偶数行
        return { classes: classes[0]};
    } else {//奇数行
        return {classes: classes[1]};
    }
}*/
const resizeContentWrapper = () => {
    $('#content-wrapper').css({'height': $(window).height() + 'px'});
    if (table != null) {
        $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
        table.columns.adjust().draw();
    }
};
$('#content-wrapper').html(resourceViewHtml);

$(document).ready(() => {
    window.onresize = function(envent) {
        resizeContentWrapper();
    };
    resizeContentWrapper();
    loadResource();
});