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
  var req = null;

  methods.getSlots = function (callback) {
    if (Sheet.isHasSlots()) {
      callback(Sheet.getSlots());
      return false;
    }
    req = ajaxGet({ action: 'slots' }, function (res) {
      Sheet.setSlots(res);
      callback(res);
      req = null;
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
    req = ajaxGet({ action: 'range', start: start, end: end }, function (res) {
      Sheet.setList(res);
      Sheet.setSearchCondition(condition);
      callback(res);
      req = null;
    });
  };

  methods.cancel = function () {
    req && req.abort();
    req = null;
  };

  return methods;
}


/* -------------------------------------------------
 * anchor
 * -------------------------------------------------
 */
class AnchorModel extends BaseModel {
  constructor() {
    super({
      limit: 0,
      list: [],
      mount: []
    });
    this.ajaxGet = _get('https://script.google.com/macros/s/AKfycbyCHIq0lHYV8sDwwUUXlLXMMVvzkuNx9QEfkl0HgSzdkxg-YA/exec');
    this.req = null;
    return this;
  }

  set list(result) {
    this.data.list = result;
  }

  get list() {
    return this.data.list;
  }

  set limitMount(limit) {
    const mount = this.list.slice(this.limit, Math.min(limit, this.list.length));
    this.data.limit = limit;
    this.data.mount = mount;
    this.event.notifyObservers({
      limit: limit,
      mount: mount
    });
  }

  get mount() {
    return this.data.mount;
  }

  get limit() {
    return this.data.limit;
  }

  getAnchorList(fromRow) {
    if (this.list.length > 0) {
      this.limitMount = fromRow;
      return false;
    }
    this.req = this.ajaxGet({}, res => {
      this.list = res;
      this.limitMount = fromRow;
      this.req = null;
    });
  }

  cancel() {
    this.req && this.req.abort();
    this.req = null;
  };
}

class AnchorView extends BaseView {
  constructor(data, events) {
    return super(data, events);
  }

  init(data, events) {
    super.init(data, events);
    this.limitCount = 10;
  }

  fetchModel(limitCount) {
    $('.main__anchor__loading').show();
    this.events.fetchList(limitCount);
  }

  willMount() {
    this.fetchModel(this.limitCount);
    $(window).on('scroll', rafThrottle(_ => {
      if ($(window).scrollTop() >= ($(document).height() - $(window).height()) * 0.7) {
        const reqLimit = this.data.limit + this.limitCount;
        !this.events.isDone(reqLimit) && this.fetchModel(reqLimit);
      }
    }));
  }

  destroy() {
    $(window).off('scroll');
  }

  render() {
    if (this.data.mount.length === 0) return false;

    $('.main__anchor__loading').hide();
    const list = $('.main__anchor__list');
    this.data.mount.forEach(function (item, idx) {
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
  }
}

class AnchorController {
  constructor() {
    this.observerId = null;
    return this;
  }

  run() {
    this.model = new AnchorModel();
    this.view = new AnchorView({
      limit: this.model.limit,
      mount: this.model.mount
    }, {
      fetchList: this.fetchList.bind(this),
      isDone: this.isDone.bind(this)
    });
    this.observerId = this.model.subscribe(this.view.update.bind(this.view));
  }

  fetchList(limit) {
    this.model.getAnchorList(limit);
  }

  isDone(fromRow) {
    return fromRow >= this.model.list.length;
  };

  destroy() {
    this.view.destroy();
    this.model.unsubscribe(this.observerId);
    this.view = null;
    this.model = null;
  }
}


/* -------------------------------------------------
 * main function
 * -------------------------------------------------
 */

var SheetModelImp = new SheetModel();

$(function () {

  const anchorPage = new AnchorController();

  function emitRecord() {
    anchorPage.destroy();
  }

  function emitAnchor() {
    anchorPage.run();
  }

  $(".nav-page").each(function () {
    $(this).click(function () {
      $('.nav-page.active').removeClass('active');
      $(this).addClass('active');

      var page = $(this).data('page');
      if (page === 'record')
        $('.main').load('src/templates/record.html', emitRecord);
      else
        $('.main').load('src/templates/anchor.html', emitAnchor);
    });
  });

  $('.main').load('src/templates/anchor.html', emitAnchor);
});
