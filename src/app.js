let SHEET_ID = null, NUMBER = null;

/**
 * ======================================================================================
 * slots
 * ======================================================================================
 */
function SheetStore() {
	var _store = {
		slots: []
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
	return methods;
}

function SheetModel() {
	var Sheet = new SheetStore();
	var methods = {};
	var ajaxGet = _get('https://script.google.com/macros/s/AKfycbxqrbMyYR-_McgXiKHeLdzR3FxfS3kovjzl5_UPlwM3RsHYRSBXg0cA/exec');
	var req = null;

	methods.getSlots = function (callback) {
		if (Sheet.isHasSlots()) {
			callback(Sheet.getSlots());
			return false;
		}
		req = ajaxGet({id: SHEET_ID, action: 'slots'}, function (res) {
			Sheet.setSlots(res);
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

var SheetModelImp = new SheetModel();

/**
 * ======================================================================================
 * Record MVC
 * ======================================================================================
 */
class RecordModel extends BaseModel {
	constructor() {
		super([]);
		this.ajaxGet = _get('https://script.google.com/macros/s/AKfycbxqrbMyYR-_McgXiKHeLdzR3FxfS3kovjzl5_UPlwM3RsHYRSBXg0cA/exec');
		this.req = null;
		return this;
	}

	getListByDateRange(start, end) {
		this.req = this.ajaxGet({id: SHEET_ID, action: 'range', start: start, end: end}, res => {
			this.data = res;
			this.req = null;
		});
	};

	cancel() {
		this.req && this.req.abort();
		this.req = null;
	};
}

class RecordView extends BaseView {
	constructor(data, events) {
		return super(data, events);
	}

	init(data, events) {
		super.init(data, events);
	}

	openDatesDialog() {
		$('#datePickModal').modal('show');
	}

	closeDatesDialog() {
		$('#datePickModal').modal('hide');
	}

	stringToCount(strOrNum) {
		return strOrNum.toString() ? strOrNum.toString().split(',').length : 0;
	}

	validMistake(pee, poop) {
		var mistake = [];
		pee.toString() && pee.toString().split(',').find(function (pe) {
			return +pe !== 0;
		}) && mistake.push('小便異常');
		poop.toString() && poop.toString().split(',').find(function (po) {
			return +po !== 0;
		}) && mistake.push('大便異常');

		return mistake;
	}

	willMount() {
		$('#choose-date-btn').on('click', this.openDatesDialog);
	}

	update(data) {
		super.update(data);
		if (this.data !== null && typeof this.data !== 'object') {
			$('.server-message').html(this.data);
			return false;
		}
		this.closeDatesDialog();
	}

	render() {
		$('.date-sheet__loading').hide();
		$('.main__table').removeClass('main__table--hidden');
		/* table clear */
		$('.date-sheet__body').empty();

		var result = this.data.reduce((result, obj) => {
			var targetIdx = result.findIndex(item => {
				return item.date === obj.date;
			});

			if (targetIdx === -1) {
				result.push({
					date: obj.date,
					drink: +(obj.mom || 0) + +(obj.milk || 0),
					pee_count: this.stringToCount(obj.pee),
					poop_count: this.stringToCount(obj.poop),
					note: +obj.slot_row === 25 ? obj.note : '',
					mistake: this.validMistake(obj.pee, obj.poop),
					detail: [obj]
				});
				return result;
			}

			result[targetIdx]['drink'] += +(obj.mom || 0) + +(obj.milk || 0);
			result[targetIdx]['pee_count'] += this.stringToCount(obj.pee);
			result[targetIdx]['poop_count'] += this.stringToCount(obj.poop);
			result[targetIdx]['note'] = +obj.slot_row === 25 ? obj.note : '';
			result[targetIdx]['mistake'] = result[targetIdx]['mistake'].concat(this.validMistake(obj.pee, obj.poop));
			result[targetIdx]['detail'].push(obj);
			return result;
		}, []);

		result.forEach((item, idx) => {
			var btn = $('<button>').addClass('btn btn-info btn-sm').html('查看').click(function () {
				showDetail(item.detail);
				return false;
			});

			var row = $('<tr>').html(
				'<td data-title="日期" class="date-sheet__no-wrap">' + toDate(item.date) + '</td>' +
				'<td data-title="喝奶總量">' + item.drink + '</td>' +
				'<td data-title="小便次數">' + item.pee_count + '</td>' +
				'<td data-title="大便次數">' + item.poop_count + '</td>' +
				'<td data-title="備註">' + (item.note || '無') + '</td>' +
				'<td data-title="特殊狀況">' + (item.mistake.length === 0 ? '無' : item.mistake.join(',')) + '</td>'
			);
			$('<td>').attr('data-title', '查看').html(btn).appendTo(row);
			row.prependTo($('.date-sheet__body'));
		});
	}
}

class RecordController {
	constructor() {
		this.observerId = null;
		this.model = null;
		this.view = null;

		this.searchObserverId = null;
		this.searchModel = null;
		this.searchView = null;
		return this;
	}

	run() {
		this.model = new RecordModel();
		this.view = new RecordView(this.model.data);
		this.observerId = this.model.subscribe(this.view.update.bind(this.view));
		this.searchModel = new RecordConditionModel();
		this.searchView = new RecordSearchView(this.searchModel.data, {
			updateCondition: this.updateCondition.bind(this),
			abortRequest: this.abortRequest.bind(this)
		});
		this.searchObserverId = this.searchModel.subscribe(res => {
			this.searchView.update(res);
			this.model.getListByDateRange(res.start, res.end);
		});
	}

	updateCondition(start, end) {
		$('.date-sheet__loading').show();
		this.searchModel.data = {start: start, end: end};
	};

	abortRequest() {
		this.model.cancel();
		$('.date-sheet__loading').hide();
	};

	destroy() {
		this.view && this.view.destroy();
		this.model && this.model.unsubscribe(this.observerId);
		this.view = null;
		this.model = null;
		this.searchView && this.searchView.destroy();
		this.searchModel && this.searchModel.unsubscribe(this.searchObserverId);
		this.searchView = null;
		this.searchModel = null;
	}
}

/**
 * ======================================================================================
 * Record Search MVC
 * ======================================================================================
 */
class RecordConditionModel extends BaseModel {
	constructor() {
		super({
			start: '',
			end: ''
		});
		return this;
	}
}

class RecordSearchView extends BaseView {
	constructor(data, events) {
		super(data, events);
		return this;
	}

	init(data, events) {
		super.init(data, events);
		this.el = {
			start: $('input[name=start]'),
			end: $('input[name=end]')
		};
	}

	willMount() {
		/* 事件綁定 */
		const fastSearch = this.fastSearch.bind(this);
		$('.fast__item').on('click', function (_) {
			fastSearch($(this).data('date'));
		});

		$('#submit-btn').on('click', this.submitSearch.bind(this));
		/* 寫入預設值 */
		var today = toDate(new Date());
		this.el.start.attr('min', '2018-11-12');
		this.el.end.attr('min', '2018-11-12');
		this.el.start.attr('max', today);
		this.el.end.attr('max', today);

		/*  */
		$('#datePickModal').on('hide.bs.modal', this.events.abortRequest);
		$('#datePickModal').on('hidden.bs.modal', function () {
			$('.server-message').html('');
			$('#datePickModal .date-pick-loading').toggleClass('date-pick-loading--show', false);
			this.el.start.toggleClass('is-invalid', false);
			this.el.end.toggleClass('is-invalid', false);
			$('#datePickModal input, #datePickModal button').prop('disabled', false);
		}.bind(this));
	}

	fastSearch(type) {
		var start = '',
			end = '',
			today = toDate(new Date());

		switch (type) {
			case 'twomonth':
				start = moment().add(-2, 'months').format('YYYY-MM-01');
				end = toDate(moment().add(-1, 'months').endOf('month'));
				break;
			case 'lastmonth':
				start = moment().add(-1, 'months').format('YYYY-MM-01');
				end = toDate(moment(start).endOf('month'));
				break;
			case 'thismonth':
				start = moment().format('YYYY-MM-01');
				end = today;
				break;
			case 'thisweek':
				start = toDate(moment().add(-6, 'days'));
				end = today;
				break;
			case 'yesterday':
				start = end = toDate(moment().add(-1, 'days'));
				break;
			case 'today':
				start = end = today;
				break;
		}
		this.el.start.toggleClass('is-invalid', false);
		this.el.end.toggleClass('is-invalid', false);
		this.emitSearch(start, end);
	};

	validateDates(start, end) {
		this.el.start.toggleClass('is-invalid', !start);
		this.el.end.toggleClass('is-invalid', !end);

		if (new Date(end).getTime() < new Date(start).getTime()) {
			$('.server-message').html('迄止日不能小於起始日');
			return false;
		}

		return start && end;
	};

	submitSearch() {
		var start = this.el.start.val();
		var end = this.el.end.val();

		if (!this.validateDates(start, end))
			return false;
		this.emitSearch(start, end);
	};

	emitSearch(start, end) {
		$('.server-message').html('');
		$('#datePickModal input, #datePickModal button').prop('disabled', true);
		$('#datePickModal .date-pick-loading').toggleClass('date-pick-loading--show', true);
		this.events.updateCondition(start, end);
	};

	render() {
		this.el.start.val(this.data.start || '');
		this.el.end.val(this.data.end || '');
	}
}

/**
 * ======================================================================================
 * Anchor MVC
 * ======================================================================================
 */
class AnchorModel extends BaseModel {
	constructor() {
		super({
			fetched: false,
			done: false,
			limit: 0,
			list: [],
			mount: []
		});
		var url = "https://script.google.com/macros/s/AKfycbxgzEYDSB8cjD9gjpEiwkV0X_Tl7ho-LhPPk3S_DLpvH36wM5xg2Q8/exec";
		this.ajaxGet = _get(url);
		this.req = null;
		return this;
	}

	set done(value) {
		this.data.done = value;
	}

	get done() {
		return this.data.done;
	}

	set fetched(value) {
		this.data.fetched = value;
	}

	get fetched() {
		return this.data.fetched;
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
			fetched: true,
			done: limit >= this.list.length,
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
		this.req = this.ajaxGet({id: SHEET_ID}, res => {
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
	}

	render() {
		if (!this.data.fetched) return false;

		if (this.data.mount.length === 0) {
			$('.main__anchor__loading').hide();
			$("<div>").addClass("main__anchor__empty").text("查無資料").appendTo($('.main__anchor__list'));
			return false;
		}

		$('.main__anchor__loading').hide();
		if ($(".main__anchor__empty").length > 0)
			$(".main__anchor__empty").remove();

		if (this.data.done) {
			$('.main__anchor__more').hide();
		} else {
			const self = this;
			$('.main__anchor__more').show().one('click', function () {
				const reqLimit = self.data.limit + self.limitCount;
				self.fetchModel(reqLimit);
			});
		}

		const list = $('.main__anchor__list');
		$('.main__anchor__loading').hide();
		this.data.mount.forEach(function (item, idx) {
			var card = $('<div>').addClass('main__anchor__card');
			var name = NUMBER === 1 ? '妍妍小朋友' : '彤彤小朋友';
			var user = $('<div>').addClass('main__anchor__user main__anchor__user--' + NUMBER).html('<div class="main__anchor__image"></div><div class="main__anchor__name">' + name + '</div>');
			var title = $('<h5>').html(item.note);
			var content = $('<div>').addClass('main__anchor__content').html('<pre>' + item.info + '</pre>');
			var date = $('<div>').addClass('main__anchor__date').html(item.date);
			card.append([user, title, content, date]).appendTo(list);

			/* images */
			if (item.images.length > 0) {
				var album = $('<div>').addClass('main__anchor__album');
				var pictures = item.images.slice(0, 4).map(function (image, idx) {
					var href = 'https://drive.google.com/uc?export=view&id=' + image;
					return $('<a>').addClass('main__anchor__picture').css('background-image', 'url("' + href + '")').attr('href', href).html(function () {
						if (idx === 3 && item.images.length > 4)
							return $('<div>').addClass('main__anchor__picture__more').html(`+${item.images.length - 4}`)
						return null;
					}).click(function () {
						const images = item.images.map(function (image) {
							return $('<div>').attr('href', 'https://drive.google.com/uc?export=view&id=' + image);
						});
						$.fancybox.open(images, {
							buttons: [
								"zoom",
								"close"
							],
						});
						return false;
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
		this.model = null;
		this.view = null;
		return this;
	}

	run() {
		this.model = new AnchorModel();
		this.view = new AnchorView({
			done: this.model.done,
			fetched: this.model.fetched,
			limit: this.model.limit,
			mount: this.model.mount
		}, {
			fetchList: this.fetchList.bind(this),
		});
		this.observerId = this.model.subscribe(this.view.update.bind(this.view));
	}

	fetchList(limit) {
		this.model.getAnchorList(limit);
	}

	destroy() {
		this.view && this.view.destroy();
		this.model && this.model.unsubscribe(this.observerId);
		this.view = null;
		this.model = null;
	}
}

/**
 * ======================================================================================
 * Video MVC
 * ======================================================================================
 */
class VideoModel extends BaseModel {
	constructor() {
		super({
			done: false,
			fetched: false,
			limit: 0,
			list: [],
			mount: []
		});
		this.ajaxGet = _get(
			'https://script.google.com/macros/s/AKfycbzAGahAUfMEEclgxxDXijO3ETrOTE9TvCAnraL_W1vUs8GJQRdoDfriuQ/exec');
		this.req = null;
		return this;
	}

	set done(value) {
		this.data.done = value;
	}

	get done() {
		return this.data.done;
	}

	set fetched(value) {
		this.data.fetched = value;
	}

	get fetched() {
		return this.data.fetched;
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
			fetched: true,
			done: limit >= this.list.length,
			limit: limit,
			mount: mount,
		});
	}

	get mount() {
		return this.data.mount;
	}

	get limit() {
		return this.data.limit;
	}

	getVideoList(fromRow) {
		if (this.list.length > 0) {
			this.limitMount = fromRow;
			return false;
		}
		this.req = this.ajaxGet({number: NUMBER}, res => {
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

class VideoView extends BaseView {
	constructor(data, events) {
		return super(data, events);
	}

	init(data, events) {
		super.init(data, events);
		this.limitCount = 10;
	}

	fetchModel(limitCount) {
		$('.main__video__loading').show();
		this.events.fetchList(limitCount);
	}

	willMount() {
		this.fetchModel(this.limitCount);
	}

	render() {
		if (!this.data.fetched) return false;

		if (this.data.mount.length === 0) {
			$('.main__video__loading').hide();
			$("<div>").addClass("main__video__empty").text("查無資料").appendTo($('.main__video__list'));
			return false;
		}

		$('.main__video__loading').hide();
		if ($(".main__video__empty").length > 0)
			$(".main__video__empty").remove();

		if (this.data.done) {
			$('.main__video__more').hide();
		} else {
			const self = this;
			$('.main__video__more').show().one('click', function () {
				const reqLimit = self.data.limit + self.limitCount;
				self.fetchModel(reqLimit);
			});
		}

		const list = $('.main__video__list');
		this.data.mount.forEach(function (item) {
			var box = $('<div>').addClass('main__video__list__item').data('data-fancybox', true).attr('href', item.url);
			var card = $('<div>').addClass('card');
			var cover = $('<img>').addClass('card-img-top').attr('src', item.cover);
			var title = $('<h5>').addClass('card-title').html(item.title);
			var description = $('<p>').addClass('card-text').html(item.time + ' ' + item.description);
			var body = $('<div>').addClass('card-body').append([title, description]);
			card.append([cover, body]);
			box.append(card).appendTo(list).click(function () {
				$(this).fancybox();
			});
		});
	}
}

class VideoController {
	constructor() {
		this.observerId = null;
		this.model = null;
		this.view = null;
		return this;
	}

	run() {
		this.model = new VideoModel();
		this.view = new VideoView({
			done: this.model.done,
			fetched: this.model.fetched,
			limit: this.model.limit,
			mount: this.model.mount
		}, {
			fetchList: this.fetchList.bind(this),
		});
		this.observerId = this.model.subscribe(this.view.update.bind(this.view));
	}

	fetchList(limit) {
		this.model.getVideoList(limit);
	}

	destroy() {
		this.view && this.view.destroy();
		this.model && this.model.unsubscribe(this.observerId);
		this.view = null;
		this.model = null;
	}
}

/**
 * ======================================================================================
 * main
 * ======================================================================================
 */
const anchorPage = new AnchorController();
const recordPage = new RecordController();
const videoPage = new VideoController();

function emitRecord() {
	anchorPage.destroy();
	videoPage.destroy();
	recordPage.run();
}

function emitAnchor() {
	recordPage.destroy();
	videoPage.destroy();
	anchorPage.run();
}

function emitVideo() {
	recordPage.destroy();
	anchorPage.destroy();
	videoPage.run();
}

$(function () {
	const search = window.location.search;
	const query = search.replace('?', '').split('&').reduce((obj, str) => {
		const [key, value] = str.split('=');
		obj[key] = value;
		return obj;
	}, {});
	const number = query["number"] || null;
	if (number === null) {
		$(".main-menu").show();
		return false;
	}
	$('.nav-bar__links, .container-fluid').show();

	if (+number === 1) {
		SHEET_ID = "1W3IPpL2wIDWi4jRl5QKf2o1pzbFNLZAuo0AHOC_dRGc";
		NUMBER = 1;
		$("#baby-name").text("欣妍");
		$("title").text("欣妍養成記錄");
	} else if (+number === 2) {
		SHEET_ID = "1z7W4-h6GQzGnekcqm1KjFWEFC0SdKtTOu_w8r2ZKie4";
		NUMBER = 2;
		$("#baby-name").text("欣彤");
		$("title").text("欣彤養成記錄");
	}

	$("a[data-toggle=link]").each(function () {
		const module = $(this).data('page');
		$(this).attr('href', `?number=${number}&m=${module}`)
	})

	if (SHEET_ID) {
		const indexRoute = query['m'] || 'anchor';

		$(".nav-bar__links__item").each(function () {
			if ($(this).data('page') === indexRoute)
				$(this).addClass('active');
		});

		switch (indexRoute) {
			case 'anchor':
				$('.main').load('src/templates/anchor.html', emitAnchor);
				break;
			case 'record':
				$('.main').load('src/templates/record.html', emitRecord);
				break;
			case 'video':
				$('.main').load('src/templates/video.html', emitVideo);
				break;
		}
	}
});
