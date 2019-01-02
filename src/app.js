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
  var _store = {
    slots: [],
    record: [],
    condition: {
      start: '',
      end: ''
    }
  };
  var methods = {};

  methods.isHasSlots = function () {
    return _store.slots.length > 0;
  };
  methods.getSlots = function () {
    return _store.slots;
  };
  methods.setSlots = function (data) {
    _store.slots = data;
  };

  methods.isHasList = function () {
    return _store.record.length > 0;
  };
  methods.getList = function () {
    return _store.record;
  };
  methods.setList = function (data) {
    _store.record = data;
  };

  methods.isSameCondition = function (condition) {
    return JSON.stringify(_store.condition) === JSON.stringify(condition);
  };
  methods.getSearchCondition = function () {
    return _store.condition;
  };
  methods.setSearchCondition = function (condition) {
    _store.condition = condition;
  };

  return methods;
}

function SheetModel() {
  var Sheet = new SheetStore();
  var methods = {};
  var ajaxGet = _get('https://script.google.com/macros/s/AKfycbzKeT3fhBZfZ7bTESYvoGisLzdDAZnxqiVt2oubvjAxTfWXR34/exec');

  methods.getSlots = function (callback) {
    if (Sheet.isHasSlots()) {
      callback(Sheet.getSlots());
      return false;
    }
    ajaxGet({ action: 'slots' }, function (res) {
      Sheet.setSlots(res);
      callback(res);
    });
  };

  methods.getSearchCondition = function (callback) {
    callback(Sheet.getSearchCondition());
  };

  methods.getListByDateRange = function (start, end, callback) {
    var condition = { start: start, end: end };
    if (Sheet.isSameCondition(condition) && Sheet.isHasList()) {
      callback(Sheet.getList());
      return false;
    }
    ajaxGet({ action: 'range', start: start, end: end }, function (res) {
      Sheet.setList(res);
      Sheet.setSearchCondition(condition);
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

function emitAnchor() {
  loadAnchorList();
  $(window).on('scroll', function () {
    if ($(window).scrollTop() === $(document).height() - $(window).height()) {
      !AnchorModelImp.isDone($('.main__anchor__list').data('limit') || 0) && loadAnchorMore();
    }
  });
}

function emitRecord() {
  $(window).off('scroll');
}

$(function () {
  $(".nav-page").each(function () {
    $(this).click(function () {
      $('.nav-page.active').removeClass('active');
      $(this).addClass('active');

      var target = $(this).data('target');
      if (target === 'record')
        $('.main').load('src/templates/record.html', emitRecord);
      else
        $('.main').load('src/templates/anchor.html', emitAnchor);

      $('.navbar-toggler[aria-expanded=true]').click();
      return false;
    });
  });

  $(".nav-page").eq(0).click();
});
