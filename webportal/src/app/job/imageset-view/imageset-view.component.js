// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('./imageset-view.component.scss');
const url = require('url');
const markdown = require('marked');
const loadingComponent = require('../loading/loading.component.ejs');
const imagesetTableComponent = require('./imageset-table.component.ejs');
const imagesetViewComponent = require('./imageset-view.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const common = require('../../common/common');
let table = null;

let ImageMap = [];

const imagesetViewHtml = imagesetViewComponent({
  loading: loadingComponent,
  imagesetTable: imagesetTableComponent,
});

const loadDataSets = () => {
  userAuth.checkToken((token) => {
  loading.showLoading();
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/imagesets`,
    type: 'GET',
    headers: {
          Authorization: `Bearer ${token}`,
        },
    success: (data) => {
      if (data.retCode !=='0') {
        alert(data.retMsg);
      } else {
          ImageMap = data.result;
        $('#view-table').html(imagesetTableComponent({
          imagesets: Object.values(ImageMap)
        }));

        table = $('#imageset-table').dataTable({
          'scrollY': (($(window).height() - 265)) + 'px',
          'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
          'order': [[2, 'desc']],
          'columnDefs': [
            {type: 'natural', targets: [0, 1, 2, 3]},
            //{type: 'title-numeric', targets: [2, 3]},
          ],
        }).api();

          $(".imageId").click(function(event){
              let imageId = $(event.target).text();
              let clickImageDesc = ImageMap[imageId].description;

              $(".modal-body").html(clickImageDesc);
              $("#myModal").modal('show');
          });

      }
      loading.hideLoading();
    },
    error: (xhr, textStatus, error) => {
        if (xhr.status === 401) {
            window.location.replace('/login.html');
            return;
        }
      common.errorHandle(xhr);
      loading.hideLoading();
    },
  });
 });

};

const loadDataSetDetail = (imageSetId) => {
  userAuth.checkToken((token) => {
  loading.showLoading();
    $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/imagesets/${imageSetId}`,
    type: 'GET',
    headers: {
          Authorization: `Bearer ${token}`,
        },
    success: (data) => {
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#view-table').html(markdown(data.data[0].description));
      }
    },
    error: (xhr, textStatus, error) => {
        if (xhr.status === 401) {
            window.location.replace('/login.html');
            return;
        }
        common.errorHandle(xhr);
    },
    });
  });
};

window.loadDataSets = loadDataSets;
window.loadDataSetDetail = loadDataSetDetail;

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    table.columns.adjust().draw();
  }
};

$('#content-wrapper').html(imagesetViewHtml);

$(document).ready(() => {
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  $('#sidebar-menu-imageset-view').addClass('active');
  const query = url.parse(window.location.href, true).query;

  if (query['imageSet']) {
    loadDataSetDetail(query['imageSet']);
    $('#content-wrapper').css({'overflow': 'auto'});
  } else {
      loadDataSets();
      $('#content-wrapper').css({'overflow': 'hidden'});
  }




});

module.exports = {loadDataSets, loadDataSetDetail};
