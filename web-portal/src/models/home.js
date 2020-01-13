import { routerRedux } from 'dva/router';
import { getAuthority } from '@/utils/authority';

export default {
    namespace: 'home',

    state: {
    },

    effects:{

        *goToPage({payload},{ call, put }){

            let pagePath = payload.pagePath?payload.pagePath:"/openi/v2/home";

            yield put(
                routerRedux.push({
                    pathname: pagePath
                })
            );
        }

    },

    reducers:{


    }

}
