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
  methods.getAnchorsLength = function () {
    return _store.length;
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
  var _limit = 10;
  var ajaxGet = _get('https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');

  methods.getAnchorList = function (fromRow, callback) {
    if (Anchor.isHasAnchors()) {
      var limit = Math.min(fromRow + _limit, Anchor.getAnchorsLength());
      callback({ limit: limit, data: Anchor.getAnchors().slice(fromRow, limit) });
      return false;
    }
    ajaxGet({}, function (res) {
      Anchor.setAnchors(res);
      var limit = Math.min(fromRow + _limit, res.length);
      callback({ limit: limit, data: res.slice(fromRow, limit) });
    });
  };

  methods.isDone = function (fromRow) {
    return fromRow >= Anchor.getAnchorsLength();
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
        '<td>' + item.date + '</td>' +
        '<td>' + (item.mommilk + item.formula) + '</td>' +
        '<td>' + item.pee + '</td>' +
        '<td>' + item.poo + '</td>').appendTo('.date-sheet__body');
    });
  });
}

function loadAnchorMore() {
  $('.main__anchor__loading').show();
  var limit = $('.main__anchor__list').data('limit') || 0;
  AnchorModelImp.getAnchorList(limit, function (res) {
    $('.main__anchor__loading').hide();
    var list = $('.main__anchor__list').data('limit', res.limit);
    res.data.forEach(function (item, idx) {
      var card = $('<div>').addClass('main__anchor__card');
      var user = $('<div>').
      addClass('main__anchor__user').
      html('<div class="main__anchor__image"></div><div class="main__anchor__name">妍妍小朋友</div>');
      var title = $('<h5>').html(item.note);
      var content = $('<div>').addClass('main__anchor__content').html('<pre>' + item.info + '</pre>');
      var date = $('<div>').
      addClass('main__anchor__date').
      html(item.date);
      card.append([user, title, content, date]).appendTo(list);

      /* images */
      if (item.images.length > 0) {
        var album = $('<div>').addClass('main__anchor__album');
        var pictures = item.images.map(function (image, idx) {
          var href = 'http://drive.google.com/uc?export=view&id=' + image;
          return $('<div>').
          addClass('main__anchor__picture').
          css('background-image', 'url("' + href + '")').
          data('fancybox', 'images-' + idx).
          attr('href', href).
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

function loadAnchorList() {
  $('.main__anchor__list').empty();
  loadAnchorMore();
}

function emitRecord() {
  loadSheetList();
  $('.sidebar-pick').click(sidebarOpen);
  $(window).off('scroll');
}

function emitAnchor() {
  loadAnchorList();
  $(window).on('scroll', function () {
    if ($(window).scrollTop() === $(document).height() - $(window).height()) {
      !AnchorModelImp.isDone($('.main__anchor__list').data('limit') || 0) && loadAnchorMore();
    }
  });
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
