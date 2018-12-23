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

function loadPage(self, page) {
  if ($(self).hasClass('menu-box--disabled')) return false;
  $('.header').load('admin/templates/page.header.html');
  switch (page) {
    case 'news':
      $('.main').load('admin/templates/anchor.form.html');
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

  var formDataArray = $('.anchor-form').serializeArray();
  var formDataObj = formDataArray.reduce(function (obj, data) {
    obj[data.name] = data.value;
    return obj;
  }, {});

  /* validate */
  if (!_validate(formDataObj)) return false;

  var ajaxPost = _post('https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');
  ajaxPost({
    id: getQuery('id'),
    action: 'create',
    data: {
      date: formDataObj.date.replace(new RegExp('-', 'g'), '/'),
      note: formDataObj.note,
      info: formDataObj.info
    }
  }, function (res) {
    if (!res.success) {
      alert(res.reason);
      return false;
    }

    alert('新增成功');
    $('.anchor-form input').value('');
  });

  return false;
}

$(function () {
  backToHome();
});