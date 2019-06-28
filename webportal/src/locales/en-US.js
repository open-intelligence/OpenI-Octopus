import globalHeader from './en-US/globalHeader';
import siderMenu from './en-US/siderMenu';
import login from './en-US/login';
import register from './en-US/register'
import standardTable from './en-US/standardTable';
import hardware from './en-US/hardware';
import imageset from './en-US/imageset';
import changePwd from './en-US/changePwd';
import jobList from './en-US/jobList';
import jobConfig from "./en-US/jobConfig";
import jobDetail from './en-US/jobDetail';
import virtualClusters from './en-US/virtualClusters';
import services from './en-US/services';
import overview from "./en-US/overview";
import exception from "./en-US/exception";
import openIPanel from "./en-US/openIPanel";
import userInfo from "./en-US/userInfo";
import datasets from "./en-US/datasets";
import jobLog from "./en-US/jobLog";

export default {
    platformName: 'SZ Cloud Brain',
    ...globalHeader,
    ...siderMenu,
    ...login,
    ...register,
    ...standardTable,
    ...hardware,
    ...imageset,
    ...changePwd,
    ...jobList,
    ...jobDetail,
    ...virtualClusters,
    ...jobDetail,
    ...services,
    ...overview,
    ...exception,
    ...openIPanel,
    ...userInfo,
    ...jobConfig,
    ...datasets,
    ...jobLog
}
