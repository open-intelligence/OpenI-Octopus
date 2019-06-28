'use strict';

module.exports = (app, router) => {

  /**
   * @api {GET} /api/v1/imagesets/ ListImageSet
   * @apiSampleRequest off
   * @apiName ListImageSet
   * @apiDescription list image sets.
   * @apiVersion 1.0.0
   * @apiGroup ImageSet
   *
   * @apiHeader {String} Authorization Bearer {token} <code>required</code>
   * @apiHeaderExample {json} Header-Example:
   * {
   *  "Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * @apiParam {String="dgx","debug","other"} platformKey The type of platform.
   * @apiParamExample {json} Request-Example:
   *  ?platformKey=other
   *
   * @apiSuccess {String} code Equal to 'S000' when successfully.
   * @apiSuccess {String} msg Equal to 'success' when successfully.
   * @apiSuccess {Object} payload The map of ImageSets.
   * @apiSuccess {Object} payload.:ImageSetId ImageSet.
   * @apiSuccess {String} payload.:ImageSetId.id ImageSetId.
   * @apiSuccess {String} payload.:ImageSetId.name ImageSet`s name.
   * @apiSuccess {String} payload.:ImageSetId.place ImageSet`s address.
   * @apiSuccess {String} payload.:ImageSetId.provider ImageSet`s provider.
   * @apiSuccess {String} payload.:ImageSetId.remark remark.
   * @apiSuccess {String} payload.:ImageSetId.description ImageSet`s description.
   * @apiSuccess {String} payload.:ImageSetId.createtime ImageSet`s create time.
   * @apiSuccessExample Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *   "code": "S000",
   *   "msg": "success",
   *   "payload":{
   *    "1000000":{
   *      "createtime": "2018-12-03T04:40:27.000Z"
   *      "description": "<h1 id="deepo-v2-0-">deepo:v2.0镜像</h1>↵<ul>↵<li><p>Deepo是一个几乎包含所有流行深度学习框架的Docker映像，拥有一个完整的可复制的深度学习研究环境。它涵盖了当前最流行的深度学习框架： ↵theano, tensorflow, sonnet, pytorch, keras, lasagne, mxnet, cntk, chainer, caffe, torch。</p>↵</li>↵<li><p>镜像内容：↵  操作系统      Ubuntu16.04  </p>↵<p>  CUDA          8.0.61  </p>↵<p>  CUDNN         V6   </p>↵<p>  Python        3.6.6    </p>↵<p>  PyTorch       0.4.0    </p>↵<p>  Tensorflow    1.8.0   </p>↵<p>  Keras         2.2.2    </p>↵<p>  Theano        1.0.1    </p>↵<p>  Sonnet        1.23    </p>↵<p>  MxNett        1.2.0    </p>↵<p>  Caffe         1.0.0    </p>↵<p>  CNTK          2.5.1</p>↵<p>  jupyter</p>↵</li>↵<li><p>详情请参考镜像的<a href="https://github.com/ufoym/deepo">github</a></p>↵</li>↵</ul>↵"
   *      "id": 1000000
   *      "name": "deepo:v2.0"
   *      "place": "172.168.1.1:5000/user-images/deepo:v2.0"
   *      "provider": "admin"
   *      "remark": "good"
   *    }
   *   }
   *  }
   *
   * @apiUse OperationForbiddenError
   */
  router.get('/', 'imageset.list');

  // 获取单个镜像具体信息
  // router.get('/:imagesetId', 'imageset.get');
};
