function getQuery(field) {
	var urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(field);
}

/* -------------------------------------------------
 * store and model
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
	methods.insertAnchor = function (data) {
		if (methods.isHasAnchors())
			_store.unshift({
				row: +data.row,
				date: data.date,
				note: data.note,
				info: data.info,
				images: data.images === "" ? [] : data.images.split(',')
			});
	};
	methods.updateAnchor = function (row, data) {
		if (methods.isHasAnchors())
			_store = _store.map(function (anchor) {
				return anchor.row === +row ? {
					date: data.date,
					note: data.note,
					info: data.info,
					images: data.images === "" ? [] : data.images.split(','),
					row: +row
				} : anchor;
			});
	};
	methods.removeAnchor = function (row) {
		if (methods.isHasAnchors())
			_store = _store.filter(function (anchor) {
				return anchor.row !== +row;
			}).map(function (anchor) {
				if (anchor.row > +row)
					anchor.row -= 1;
				return anchor;
			});
	};

	return methods;
}

function AnchorModel() {
	var Anchor = new AnchorStore();
	var methods = {};
	var url = "https://script.google.com/macros/s/AKfycbxgzEYDSB8cjD9gjpEiwkV0X_Tl7ho-LhPPk3S_DLpvH36wM5xg2Q8/exec";
	var ajaxGet = _get(url);
	var ajaxPost = _post(url);
	var req = null;

	methods.getAnchorList = function (callback) {
		if (Anchor.isHasAnchors()) {
			callback(Anchor.getAnchors());
			return false;
		}
		req = ajaxGet({
			id: getQuery('id')
		}, function (res) {
			Anchor.setAnchors(res);
			callback(res);
			req = null;
		});
	};

	methods.createAnchor = function (data, callback) {
		req = ajaxPost({
			id: getQuery('id'),
			action: 'create',
			date: data.date,
			note: data.note,
			info: data.info,
			images: data.images
		}, function (res) {
			if (res.success)
				Anchor.insertAnchor({
					row: res.row,
					date: data.date,
					note: data.note,
					info: data.info,
					images: data.images
				});

			callback(res);
			req = null;
		});
	};

	methods.updateAnchor = function (row, data, callback) {
		req = ajaxPost({
			id: getQuery('id'),
			action: 'update',
			row: row,
			date: data.date,
			note: data.note,
			info: data.info,
			images: data.images
		}, function (res) {
			if (res.success)
				Anchor.updateAnchor(row, data);

			callback(res);
			req = null;
		});
	};

	methods.deleteAnchor = function (row, callback) {
		req = ajaxPost({
			id: getQuery('id'),
			action: 'delete',
			row: row
		}, function (res) {
			if (res.success)
				Anchor.removeAnchor(row);

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

function SheetStore() {
	var _store = {
		slots: [],
		notes: []
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
	methods.isHasNotes = function () {
		return _store.notes.length > 0;
	};
	methods.getNotes = function () {
		return _store.notes;
	};
	methods.setNotes = function (data) {
		_store.notes = data;
	};

	return methods;
}

function SheetModel() {
	var Sheet = new SheetStore();
	var methods = {};
	var url = 'https://script.google.com/macros/s/AKfycbxqrbMyYR-_McgXiKHeLdzR3FxfS3kovjzl5_UPlwM3RsHYRSBXg0cA/exec';
	var ajaxGet = _get(url);
	var ajaxPost = _post(url);
	var req = null;

	methods.getLastChange = function (callback) {
		req = ajaxGet({
			id: getQuery('id'),
			action: 'last_pee'
		}, function (res) {
			callback(res);
			req = null;
		});
	};

	methods.getLastFeed = function (callback) {
		req = ajaxGet({
			id: getQuery('id'),
			action: 'last_feed'
		}, function (res) {
			callback(res);
			req = null;
		});
	};

	methods.getSlots = function (callback) {
		if (Sheet.isHasSlots()) {
			callback(Sheet.getSlots());
			return false;
		}
		req = ajaxGet({id: getQuery('id'), action: 'slots'}, function (res) {
			Sheet.setSlots(res);
			callback(res);
			req = null;
		});
	};

	methods.getNotes = function (callback) {
		if (Sheet.isHasNotes()) {
			callback(Sheet.getNotes());
			return false;
		}
		req = ajaxGet({id: getQuery('id'), action: 'notes'}, function (res) {
			Sheet.setNotes(res);
			callback(res);
			req = null;
		});
	};

	methods.getRecordByDate = function (date, callback) {
		req = ajaxGet({id: getQuery('id'), action: 'range', start: date, end: date}, function (res) {
			callback(res);
			req = null;
		});
	};

	methods.insertRecord = function (data, callback) {
		req = ajaxPost(Object.assign({
			id: getQuery('id'),
			action: 'insert'
		}, data), function (res) {
			callback(res);
			req = null;
		});
	};

	methods.updateRecord = function (data, callback) {
		req = ajaxPost(Object.assign({
			id: getQuery('id'),
			action: 'update'
		}, data), function (res) {
			callback(res);
			req = null;
		});
	};

	methods.removeRecord = function (row, callback) {
		req = ajaxPost({
			id: getQuery('id'),
			action: 'remove',
			row: row
		}, function (res) {
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

function ImagesModel() {
	var methods = {};
	var ajaxPost = _post(
		'https://script.google.com/macros/s/AKfycbwoZ49_JZOjCPO5YKkaYyZCQUAWckyQaoOfEoqiEDKhUK-OLK4/exec');
	var req = null;

	methods.uploadFile = function (base, filename, callback) {
		req = ajaxPost({
			folderId: getQuery('f_id'),
			action: 'add',
			file: base,
			filename: filename
		}, function (res) {
			callback(res);
			req = null;
		});
	};

	methods.deleteById = function (id, callback) {
		req = ajaxPost({
			folderId: getQuery('f_id'),
			action: 'remove',
			id: id
		}, function (res) {
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

var AnchorModelImp = new AnchorModel();
var ImageModelImp = new ImagesModel();
var SheetModelImp = new SheetModel();

/* -------------------------------------------------
 * file upload
 * -------------------------------------------------
 */
function fileUpload(file, callback) {
	var fileSplit = file['type'].split('/');

	function _isImage() {
		return fileSplit[0] === 'image';
	}

	/* 圖片方向 */
	var orientation;
	EXIF.getData(file, function () {
		orientation = EXIF.getTag(this, 'Orientation');
	});

	var reader = new FileReader();
	reader.onload = function (e) {
		if (_isImage()) {
			dealImage(this.result, fileSplit[1], orientation, function (base) {
				ImageModelImp.uploadFile(base, file.name, callback);
			});
			return false;
		}
		anchorCreateBreak('檔案格式不支援');
		return false;
	};
	reader.readAsDataURL(file);
	return false;
}

/**
 * https://segmentfault.com/a/1190000004346191
 */
function dealImage(path, type, dir, callback) {
	if (type === 'gif') {
		callback(path);
		return false;
	}

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
			// case 6:
			//   canvas.width = height;
			//   canvas.height = width;
			//   degree = 90;
			//   drawWidth = width;
			//   drawHeight = -height;
			//   break;
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
		callback(canvas.toDataURL('image/jpeg', 0.8));
	};
	img.src = path;
}

/* -------------------------------------------------
 * main function
 * -------------------------------------------------
 */
function backToHome() {
	$('.main').load('admin/templates/main.body.html', function () {
		$('.nav-main').addClass('active');
		$('.news-manager').removeClass('active');
		$('.record-message').removeClass('active');
	});
}

function loading(toggle) {
	toggle ? $('.loading').addClass('loading--show') : $('.loading').removeClass('loading--show');
}

function loadPage(self, page) {
	$('.nav-main').removeClass('active');
	switch (page) {
		case 'news':
			$('.main').load('admin/templates/anchor.form.html');
			break;
		case 'news-manager':
			$('.main').load('admin/templates/anchor.list.html', function () {
				$('.news-manager').addClass('active');
				$('.record-message').removeClass('active');
			});
			break;
		case 'record-message':
			$('.main').load('admin/templates/record.list.html', function () {
				$('.news-manager').removeClass('active');
				$('.record-message').addClass('active');
			});
			break;
		case 'feed-done':
			$('.main').load('admin/templates/feed-done.form.html');
			break;
		case 'notes':
			$('.main').load('admin/templates/notes.form.html');
			break;
	}
}

function displayTime(num) {
	if (num === '') return '????';
	if (parseInt(num) === 'NaN') return num;
	return +num < 1000 ? '0' + num : num.toString();
}

$(function () {
	if (getQuery('id') && getQuery('f_id') && getQuery('number')) {

		$('.header').load('admin/templates/main.header.html', () => {
			const number = getQuery('number');
			if(+number === 1)
				$("#baby-name").text("欣妍");
			else if(+number === 2)
				$("#baby-name").text("欣彤");
			backToHome();
		});
	} else {
		$('body').html('缺少必要參數');
	}
});
