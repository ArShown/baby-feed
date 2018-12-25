function getQuery(field) {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(field);
}

/* -------------------------------------------------
 * ajax methods
 * -------------------------------------------------
 */
function _post(url) {
  return function (data, callback) {
    $.ajax({
      method: "POST",
      crossDomain: true,
      url: url,
      data: data,
      dataType: 'json'
    }).done(callback);
  };
}

function _get(url) {
  return function (data, callback) {
    $.ajax({
      method: "GET",
      crossDomain: true,
      url: url,
      data: data,
      dataType: 'json'
    }).done(callback);
  };
}

/* -------------------------------------------------
 * store and model
 * -------------------------------------------------
 */
function AnchorStore() {
  var _store = [];
  var methods = {};

  methods.isHasAnchors = function () {
    return _store.length > 0;
  };
  methods.getAnchors = function () {
    return _store;
  };
  methods.setAnchors = function (data) {
    _store = data;
  };
  methods.insertAnchor = function (data) {
    if (methods.isHasAnchors())
      _store.unshift({
        row: data.row,
        date: data.date,
        note: data.note,
        info: data.info,
        images: data.images === "" ? [] : data.images.split(',')
      });
  };
  methods.updateAnchor = function (row, data) {
    if (methods.isHasAnchors())
      _store = _store.map(function (anchor) {
        return anchor.row === row ? {
          date: data.date,
          note: data.note,
          info: data.info,
          images: data.images === "" ? [] : data.images.split(','),
          row: row
        } : anchor;
      });
  };
  methods.removeAnchor = function (row) {
    if (methods.isHasAnchors())
      _store = _store.filter(function (anchor) {
        return anchor.row !== row;
      });
  };

  return methods;
}

function AnchorModel() {
  var Anchor = new AnchorStore();
  var methods = {};
  var ajaxGet = _get('https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');
  var ajaxPost = _post(
    'https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');

  methods.getAnchorList = function (callback) {
    if (Anchor.isHasAnchors()) {
      callback(Anchor.getAnchors());
      return false;
    }
    ajaxGet({}, function (res) {
      Anchor.setAnchors(res);
      callback(res);
    });
  };

  methods.createAnchor = function (data, callback) {
    ajaxPost({
      id: getQuery('id'),
      action: 'create',
      date: data.date,
      note: data.note,
      info: data.info,
      images: data.images
    }, function (res) {
      if (res.success)
        Anchor.insertAnchor({
          row: res.row,
          date: data.date,
          note: data.note,
          info: data.info,
          images: data.images
        });

      callback(res);
    });
  };

  methods.updateAnchor = function (row, data, callback) {
    ajaxPost({
      id: getQuery('id'),
      action: 'update',
      row: row,
      date: data.date,
      note: data.note,
      info: data.info,
      images: data.images
    }, function (res) {
      if (res.success)
        Anchor.updateAnchor(row, data);

      callback(res);
    });
  };

  methods.deleteAnchor = function (row, callback) {
    ajaxPost({
      id: getQuery('id'),
      action: 'delete',
      row: row
    }, function (res) {
      if (res.success)
        Anchor.removeAnchor(row);

      callback(res);
    });
  };

  return methods;
}

function ImagesModel() {
  var methods = {};
  var ajaxPost = _post(
    'https://script.google.com/macros/s/AKfycbwoZ49_JZOjCPO5YKkaYyZCQUAWckyQaoOfEoqiEDKhUK-OLK4/exec');

  methods.uploadFile = function (base, filename, callback) {
    ajaxPost({
      folderId: getQuery('f_id'),
      action: 'add',
      file: base,
      filename: filename
    }, callback);
  };

  methods.deleteById = function (id, callback) {
    ajaxPost({
      folderId: getQuery('f_id'),
      action: 'remove',
      id: id
    }, callback);
  };

  return methods;
}

var AnchorModelImp = new AnchorModel();
var ImageModelImp = new ImagesModel();

/* -------------------------------------------------
 * file upload
 * -------------------------------------------------
 */
function fileUpload(file, callback) {
  function _isImage() {
    return file['type'].split('/')[0] === 'image';
  }

  /* 圖片方向 */
  var orientation;
  EXIF.getData(file, function () {
    orientation = EXIF.getTag(this, 'Orientation');
  });

  var reader = new FileReader();
  reader.onload = function (e) {
    if (_isImage()) {
      dealImage(this.result, orientation, function (base) {
        ImageModelImp.uploadFile(base, file.name, callback);
      });
      return false;
    }
    anchorCreateBreak('檔案格式不支援');
    return false;
  };
  reader.readAsDataURL(file);
  return false;
}

/**
 * https://segmentfault.com/a/1190000004346191
 */
function dealImage(path, dir, callback) {
  var img = new Image();
  img.onload = function () {
    var degree = 0,
      drawWidth,
      drawHeight,
      width,
      height;
    drawWidth = this.naturalWidth;
    drawHeight = this.naturalHeight;

    var maxSide = Math.max(drawWidth, drawHeight);
    if (maxSide > 800) {
      var minSide = Math.min(drawWidth, drawHeight);
      minSide = minSide / maxSide * 800;
      maxSide = 800;
      if (drawWidth > drawHeight) {
        drawWidth = maxSide;
        drawHeight = minSide;
      } else {
        drawWidth = minSide;
        drawHeight = maxSide;
      }
    }
    var canvas = document.createElement('canvas');
    canvas.width = width = drawWidth;
    canvas.height = height = drawHeight;
    var context = canvas.getContext('2d');
    //判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
    switch (dir) {
      //iphone横屏拍摄，此时home键在左侧
      case 3:
        degree = 180;
        drawWidth = -width;
        drawHeight = -height;
        break;
      //iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
      case 6:
        canvas.width = height;
        canvas.height = width;
        degree = 90;
        drawWidth = width;
        drawHeight = -height;
        break;
      //iphone竖屏拍摄，此时home键在上方
      case 8:
        canvas.width = height;
        canvas.height = width;
        degree = 270;
        drawWidth = -width;
        drawHeight = height;
        break;
    }
    //使用canvas旋转校正
    context.rotate(degree * Math.PI / 180);
    context.drawImage(this, 0, 0, drawWidth, drawHeight);
    //返回校正图片
    callback(canvas.toDataURL("image/jpeg", 0.8));
  };
  img.src = path;
}

/* -------------------------------------------------
 * main function
 * -------------------------------------------------
 */
function backToHome() {
  $('.header').load('admin/templates/main.header.html');
  $('.main').load('admin/templates/main.body.html');
}

function loading(toggle) {
  toggle ? $('.loading').addClass('loading--show') : $('.loading').removeClass('loading--show');
}

function loadPage(self, page) {
  if ($(self).hasClass('menu-box--disabled')) return false;
  $('.header').load('admin/templates/page.header.html');
  switch (page) {
    case 'news':
      $('.main').load('admin/templates/anchor.form.html', function () {
        var d = new Date();
        $(this).
        find('input[type=date]').
        val(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate());
      });
      break;
    case 'news-manager':
      $('.main').load('admin/templates/anchor.list.html', function () {
        $('.news-manager').addClass('active');
      });
      break;
  }
}


$(function () {
  if (getQuery('id') && getQuery('f_id')) {
    backToHome();
  } else {
    $('body').html('缺少必要參數');
  }
});