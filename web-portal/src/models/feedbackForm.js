import { submitFeedback } from '@/services/api';
import BraftEditor from "braft-editor";
import { ContentUtils } from 'braft-utils'
const feedbackTypes = {
  SystemException:'SYSTEM_EXCEPTION',
  ResourceProblem:'RESOURCE_PROBLEM'
};

const initState = {
  feedbackTypes:feedbackTypes,
  defaultSelectFeedbackType:feedbackTypes.SystemException,
  editorState: BraftEditor.createEditorState(null)
}

export default {
  namespace: 'feedbackForm',
  state: {
    ...initState
  },
  reducers:{
    clearContent (state,{payload}) {
      return {
        ...state,
        editorState: ContentUtils.clear(state.editorState)
      }
    }
  },
  effects: {
    *submitFeedback({payload:{feedback,callback}},{ call, put }){
      const response = yield call(submitFeedback, feedback);
      if (response.success) {

        // yield put({
        //   type: 'changeLoginStatus',
        //   payload: {
        //     status:true,
        //     load:false,
        //     ...response.payload
        //   }
        // });

        callback && callback()
        return
      }
      callback && callback(response)
    }
  },
}
