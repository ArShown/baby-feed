/* -------------------------------------------------
 * ajax methods
 * -------------------------------------------------
 */
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
 * sheet
 * -------------------------------------------------
 */
function SheetStore() {
  var _store = [];
  var methods = {};


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

  methods.isHasDatesInSheet = function (sheetId) {
    var target = _store.find(function (sheet) {
      return sheet.sheetId === sheetId;
    }) || { data: null };
    return Boolean(target.data);
  };
  methods.getDatesFromSheet = function (sheetId) {
    return _store.find(function (sheet) {
      return sheet.sheetId === sheetId;
    });
  };
  methods.setDatesToSheet = function (sheetId, data) {
    var targetIdx = _store.findIndex(function (sheet) {
      return sheet.sheetId === sheetId;
    });
    _store[targetIdx]['data'] = data;
  };

  return methods;
}

function SheetModel() {
  var Sheet = new SheetStore();
  var methods = {};
  var ajaxGet = _get('https://script.google.com/macros/s/AKfycbzKeT3fhBZfZ7bTESYvoGisLzdDAZnxqiVt2oubvjAxTfWXR34/exec');

  methods.getSheetsList = function (callback) {
    if (Sheet.isHasList()) {
      callback(Sheet.getList());
      return false;
    }
    ajaxGet({}, function (res) {
      Sheet.setList(res);
      callback(res);
    });
  };

  methods.getDatesListFromSheetId = function (sheetId, callback) {
    if (Sheet.isHasDatesInSheet(sheetId)) {
      callback(Sheet.getDatesFromSheet(sheetId));
      return false;
    }
    ajaxGet({ sheetId: sheetId }, function (res) {
      Sheet.setDatesToSheet(sheetId, res.data);
      callback(res);
    });
  };


  return methods;
}


/* -------------------------------------------------
 * anchor
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

  return methods;
}

function AnchorModel() {
  var Anchor = new AnchorStore();
  var methods = {};
  var ajaxGet = _get('https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');

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

  return methods;
}


/* -------------------------------------------------
 * main function
 * -------------------------------------------------
 */

var SheetModelImp = new SheetModel();
var AnchorModelImp = new AnchorModel();

function sidebarOpen() {
  $('.sidebar').addClass('sidebar--open');
  $('body').addClass('scroll-lock');
  $('.sidebar__shadow').one('click', sidebarClose).one('touchStart', sidebarClose).show();
}

function sidebarClose() {
  $('.sidebar').removeClass('sidebar--open');
  $('body').removeClass('scroll-lock');
  $('.sidebar__shadow').hide();
}

function loadSheetList() {
  SheetModelImp.getSheetsList(function (res) {
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
  SheetModelImp.getDatesListFromSheetId(sheetId, function (res) {
    $('.date-sheet__loading').hide();
    res.data.forEach(function (item, idx) {
      $("<tr>").html('<td>' + (idx + 1) + '</td>' +
        '<td>' + (new Date(item.date).getMonth() + 1) + '/' + new Date(item.date).getDate() + '</td>' +
        '<td>' + (item.mommilk + item.formula) + '</td>' +
        '<td>' + item.pee + '</td>' +
        '<td>' + item.poo + '</td>').appendTo('.date-sheet__body');
    });
  });
}

function loadAnchorList() {
  $('.main__anchor__list').empty();
  $('.main__anchor__loading').show();
  AnchorModelImp.getAnchorList(function (res) {
    $('.main__anchor__loading').hide();
    res.forEach(function (item, idx) {
      var card = $('<div>').addClass('main__anchor__card');
      var user = $('<div>').
      addClass('main__anchor__user').
      html('<div class="main__anchor__image"></div><div class="main__anchor__name">妍妍小朋友</div>');
      var title = $('<h5>').html(item.note);
      var content = $('<div>').addClass('main__anchor__content').html('<pre>' + item.info + '</pre>');
      var date = new Date(item.date);
      var dateToFormat = $('<div>').
      addClass('main__anchor__date').
      html(date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate());
      card.append([user, title, content, dateToFormat]).prependTo($('.main__anchor__list'));

      /* images */
      if (item.images.length > 0) {
        var album = $('<div>').addClass('main__anchor__album');
        var pictures = item.images.map(function (image, idx) {
          return $('<div>').
          addClass('main__anchor__picture').
          css('background-image', 'url("' + image + '")').
          data('fancybox', 'images-' + idx).
          attr('href', image).
          click(function () {
            var parent = $(this).parent();
            $.fancybox.open($(parent).children('.main__anchor__picture'), {
              buttons: [
                "zoom",
                "close"
              ]
            }, idx);
          });

        });

        album.append(pictures).insertAfter(content);
      }
    });
  });

}

function emitRecord() {
  loadSheetList();
  $('.sidebar-pick').click(sidebarOpen);
}

function emitAnchor() {
  loadAnchorList();
}

$(function () {
  $(".nav-page").each(function () {
    $(this).click(function () {
      $('.nav-page.active').removeClass('active');
      $(this).addClass('active');

      var target = $(this).data('target');
      $('.main__content').hide();
      $('.main__' + target).addClass('main__' + target + '--active').show();

      if (target === 'record') {
        emitRecord();
      }
      else {
        emitAnchor();
      }

      $('.navbar-toggler[aria-expanded=true]').click();

      return false;
    });
  });

  $(".nav-page").eq(0).click();
});
