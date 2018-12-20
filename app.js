function Store() {
  var _store = [];
  var methods = {};

  /* sheets */
  methods.isHasList = function () {
    return _store.length > 0;
  };
  methods.getList = function () {
    return _store.filter(function (sheet) {
      return {
        sheetId: sheet.sheetId,
        name: sheet.name
      };
    });
  };
  methods.setList = function (data) {
    _store = data;
  };

  /* dates */
  methods.isHasDates = function (sheetId) {
    var target = _store.find(function (sheet) {
      return sheet.sheetId === sheetId;
    }) || { data: null };
    return Boolean(target.data);
  };
  methods.getDates = function (sheetId) {
    return _store.find(function (sheet) {
      return sheet.sheetId === sheetId;
    });
  };
  methods.setDates = function (sheetId, data) {
    var targetIdx = _store.findIndex(function (sheet) {
      return sheet.sheetId === sheetId;
    });
    _store[targetIdx]['data'] = data;
  };

  return methods;
}

function Model() {
  var SheetStore = new Store();
  var methods = {};

  function _get(data, callback) {
    $.ajax({
      method: "GET",
      crossDomain: true,
      url: 'https://script.google.com/macros/s/AKfycbzKeT3fhBZfZ7bTESYvoGisLzdDAZnxqiVt2oubvjAxTfWXR34/exec',
      data: data,
      dataType: 'json'
    }).done(callback);
  }

  methods.getSheetsList = function (callback) {
    if (SheetStore.isHasList()) {
      callback(SheetStore.getList());
      return false;
    }
    _get({}, function (res) {
      SheetStore.setList(res);
      callback(res);
    });
  };
  methods.getDatesListFromSheetId = function (sheetId, callback) {
    if (SheetStore.isHasDates(sheetId)) {
      callback(SheetStore.getDates(sheetId));
      return false;
    }
    _get({ sheetId: sheetId }, function (res) {
      SheetStore.setDates(sheetId, res.data);
      callback(res);
    });
  };

  return methods;
}

var SheetModel = new Model();

function sidebarOpen() {
  $('.sidebar').addClass('sidebar--open');
  $('body').addClass('scroll-lock');
  $('.sidebar__shadow').one('click', sidebarClose).show();
}

function sidebarClose() {
  $('.sidebar').removeClass('sidebar--open');
  $('body').removeClass('scroll-lock');
  $('.sidebar__shadow').hide();
}

function loadSheetList() {
  SheetModel.getSheetsList(function (res) {
    $('.nav-sheet').empty();
    res.forEach(function (item, idx) {
      var ele = $("<div>").addClass("nav-link nav-sheet__item").html(item.name).click(function () {
        loadSheetDates(item.sheetId);
        $(".nav-sheet__item--active").removeClass("nav-sheet__item--active");
        $(this).addClass('nav-sheet__item--active');
        sidebarClose();
      }).appendTo('.nav-sheet');

      if (idx === 0) ele.click();
    });
  });
}

function loadSheetDates(sheetId) {
  $('.date-sheet__body').empty();
  $('.date-sheet__loading').show();
  SheetModel.getDatesListFromSheetId(sheetId, function (res) {
    $('.date-sheet__loading').hide();
    res.data.forEach(function (item, idx) {
      $("<tr>").html('<td>' + (idx + 1) + '</td>' +
        '<td>' + (new Date(item.date).getMonth() + 1) + '/' + new Date(item.date).getDate() + '</td>' +
        '<td>' + (item.mommilk + item.formula) + '</td>' +
        '<td>' + item.pee + '</td>' +
        '<td>' + item.poo + '</td>' +
        '<td> - </td>').appendTo('.date-sheet__body');
    });
  });
}

function emitRecord() {
  loadSheetList();
  $('.sidebar-pick').click(sidebarOpen);
}

function emitAnchor() {

}

$(function () {
  $(".nav-page").each(function () {
    $(this).click(function () {
      $('.nav-page.active').removeClass('active');
      $(this).addClass('active')

      var target = $(this).data('target');
      $('.main__content').hide();
      $('.main__' + target).addClass('main__' + target + '--active').show();

      if (target === 'record') {
        emitRecord();
      }
      else {
        emitAnchor();
      }
      return false;
    });
  });

});
