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
    var reader = new FileReader();
    reader.onload = function (e) {
      var content = reader.result;
      var ajaxPost = _post(
        'https://script.google.com/macros/s/AKfycbwoZ49_JZOjCPO5YKkaYyZCQUAWckyQaoOfEoqiEDKhUK-OLK4/exec');
      ajaxPost({
        folderId: getQuery('f_id'),
        action: 'add',
        file: content,
        filename: 'test'
      }, function (res) {
        callback(res);
      });
    };
    reader.readAsDataURL(file);
    return false;
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
  backToHome();
});