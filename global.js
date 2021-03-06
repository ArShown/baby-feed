var PEE_TEXT = ['淡黃', '深黃', '橘黃', '淡紅', '暗棕', '白色', '帶血'];

var POOP_TEXT = ['黃綠糊軟', '拉稀', '滲便', '白灰', '帶血', '便秘'];

/**
 * ======================================================================================
 * Polyfill for rAF
 * ======================================================================================
 */
window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * ======================================================================================
 * date format transfer
 * ======================================================================================
 */
function toDate(date) {
	return moment(date).format("YYYY-MM-DD");
}

/**
 * ======================================================================================
 * Throttling function
 * ======================================================================================
 */
var rafThrottle = function rafThrottle(fn) { // takes a function as parameter
	var busy = false;
	return function () { // returning function (a closure)
		if (busy) return; // busy? go away!
		busy = true; // hanging "busy" plate on the door
		fn.apply(this, arguments); // calling function
		// using rAF to remove the "busy" plate, when browser is ready
		requestAnimFrame(function () {
			busy = false;
		});
	};
};

/**
 * ======================================================================================
 * ajax methods
 * ======================================================================================
 */
function _post(url) {
	return function (data, callback) {
		return $.ajax({
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
		return $.ajax({
			method: "GET",
			crossDomain: true,
			url: url,
			data: data,
			dataType: 'json'
		}).done(callback);
	};
}

/**
 * ======================================================================================
 * 引入 MVC 架構
 * ======================================================================================
 */

/**
 * 觀察者模式 類別
 */
class Event {
	constructor() {
		this._listeners = [];
		this._index = 0;
	}

	/**
	 * 新增觀察者
	 * @param observer
	 */
	attach(observer) {
		const listenerObject = {
			id: this._index,
			observer: observer
		};
		this._listeners.push(listenerObject);
		this._index += 1;
		return listenerObject.id;
	}

	/**
	 * 移除觀察者
	 * @param listenerId
	 */
	detach(listenerId) {
		this._listeners = this._listeners.filter(listener => listener.id !== listenerId);
	}

	/**
	 * 通知所有觀察者
	 * @param message
	 */
	notifyObservers(message) {
		this._listeners.forEach(listener => listener.observer(message));
	}
}

/**
 * Model 父類別
 */
class BaseModel {
	constructor(data) {
		this._data = data;
		this.event = new Event();
		return this;
	}

	quietUpdate(val) {
		this._data = val;
	}

	set data(val) {
		this._data = val;
		this.event.notifyObservers(val);
	}

	get data() {
		return this._data;
	}

	subscribe(callback) {
		return this.event.attach(callback);
	}

	unsubscribe(eventId) {
		this.event.detach(eventId);
	}
}

/**
 * View 父類別
 */
class BaseView {
	constructor(data = null, events = {}) {
		this.init(data, events);
		this.willMount();
		this.render();
		return this;
	}

	init(data, events) {
		this.data = data;
		this.events = events;
	}

	willMount() {
		return false;
	}

	destroy() {
		return false;
	}

	update(data) {
		this.data = data;
		this.render();
	}

	render() {
		return false;
	}
}
