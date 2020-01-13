import globalHeader from './zh-CN/globalHeader';
import siderMenu from './zh-CN/siderMenu';
import login from './zh-CN/login';
import register from './zh-CN/register'
import standardTable from './zh-CN/standardTable';
import imageset from './zh-CN/imageset';
import changePwd from './zh-CN/changePwd'
import jobList from './zh-CN/jobList';
import jobConfig from "./zh-CN/jobConfig";
import jobDetail from './zh-CN/jobDetail';
import virtualClusters from './zh-CN/virtualClusters';
import overview from "./zh-CN/overview";
import exception from "./zh-CN/exception";
import openIPanel from "./zh-CN/openIPanel";
import userInfo from "./zh-CN/userInfo";
import datasets from "./zh-CN/datasets";
import jobLog from "./zh-CN/jobLog";
import home from "./zh-CN/home";
import globalLayout from "./zh-CN/globalLayout";
import siderContentMenu from "./zh-CN/siderContentMenu";
import expressWay from "./zh-CN/expressWay";

export default {
    platformName: '鹏城云脑',
    ...globalHeader,
    ...siderMenu,
    ...login,
    ...register,
    ...standardTable,
    ...imageset,
    ...changePwd,
    ...jobList,
    ...jobDetail,
    ...virtualClusters,
    ...jobDetail,
    ...overview,
    ...exception,
    ...openIPanel,
    ...userInfo,
    ...jobConfig,
    ...datasets,
    ...jobLog,
    ...globalLayout,
    ...siderContentMenu,
    ...home,
    ...expressWay
}
