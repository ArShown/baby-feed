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
        var d = new Date().toLocaleDateString();
        $(this).find('input[type=date]').val(d.replace(new RegExp('/', 'g'), '-'));
      });

      break;
  }
}

function anchorSubmit() {
  function _vaildField(obj) {
    return function (field) {
      if (obj[field] === '') {
        $('.anchor-form input[name=' + field + ']').addClass('is-invalid');
        return false;
      }
      $('.anchor-form input[name=' + field + ']').removeClass('is-invalid');
      return true;
    };
  }

  function _validate(obj) {
    var vaild = _vaildField(obj);
    var dateValid = vaild('date');
    var noteValid = vaild('note');
    return dateValid && noteValid;
  }

  function imageUpload(file, callback) {
    var orientation;
    EXIF.getData(file, function () {
      orientation = EXIF.getTag(this, 'Orientation');
    });
    var reader = new FileReader();
    reader.onload = function (e) {
      var content = dealImage(this.result, orientation, function (base) {
        var ajaxPost = _post(
          'https://script.google.com/macros/s/AKfycbwoZ49_JZOjCPO5YKkaYyZCQUAWckyQaoOfEoqiEDKhUK-OLK4/exec');
        ajaxPost({
          folderId: getQuery('f_id'),
          action: 'add',
          file: base,
          filename: file.name
        }, function (res) {
          callback(res);
        });
      });

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

  function send(data) {
    var ajaxPost = _post(
      'https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');
    ajaxPost(data, function (res) {
      if (!res.success) {
        alert(res.reason);
        return false;
      }
      loading(false);
      $('.server-message').html('新增成功');
      $('.anchor-form input').val('');
      $('.anchor-form textarea').val('');
      var d = new Date().toLocaleDateString();
      $('.anchor-form input[type=date]').val(d.replace(new RegExp('/', 'g'), '-'));
    });
  }

  /* init */
  loading(true);
  $('.server-message').html('');

  var formDataArray = $('.anchor-form').serializeArray();
  var formDataObj = formDataArray.reduce(function (obj, data) {
    obj[data.name] = data.value;
    return obj;
  }, {});

  /* validate */
  if (!_validate(formDataObj)) return false;

  /* request */
  var req = {
    id: getQuery('id'),
    action: 'create',
    date: new Date(formDataObj.date).toLocaleDateString(),
    note: formDataObj.note,
    info: formDataObj.info,
    images: ""
  };

  /* images upload */
  var files = $('.anchor-form').find('input[type="file"]')[0].files;
  var filesCount = files.length;
  if (filesCount > 0) {
    var filePromise = Array.from(files).map(function (file, idx) {
      $('.server-message').append('<div>' + file.name + '...</div>');
      return new Promise(function (resolve, reject) {
        imageUpload(file, function (res) {
          if (!res.success) return reject(res.reason);
          $('.server-message > div').eq(idx).html(function () {
            return $(this).html() + 'done';
          });
          $('.anchor-form').append('');
          return resolve(res.id);
        });
      });
    });
    Promise.all(filePromise).then(ids => {
      req['images'] = ids.join(',');
      send(req);
    }).catch(function (err) {
      $('.server-message').html(err);
    });
  } else send(req);

  return false;
}

$(function () {
  if (getQuery('id') && getQuery('f_id')) {
    backToHome();
  } else {
    $('body').html('缺少必要參數');
  }
});