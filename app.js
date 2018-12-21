function Store() {
    var _store = {
        sheets: [],
        dates: []
    };
    var methods = {};

    /* sheets */
    methods.isHasList = function () {
        return _store.sheets.length > 0;
    };
    methods.getList = function () {
        return _store.sheets.filter(function (sheet) {
            return {
                sheetId: sheet.sheetId,
                name: sheet.name
            };
        });
    };
    methods.setList = function (data) {
        _store.sheets = data;
    };

    /* dates in sheets */
    methods.isHasDatesInSheet = function (sheetId) {
        var target = _store.sheets.find(function (sheet) {
                return sheet.sheetId === sheetId;
            }) || {data: null};
        return Boolean(target.data);
    };
    methods.getDatesFromSheet = function (sheetId) {
        return _store.sheets.find(function (sheet) {
            return sheet.sheetId === sheetId;
        });
    };
    methods.setDatesToSheet = function (sheetId, data) {
        var targetIdx = _store.sheets.findIndex(function (sheet) {
            return sheet.sheetId === sheetId;
        });
        _store.sheets[targetIdx]['data'] = data;
    };

    /* dates */
    methods.isHasDates = function () {
        return _store.dates.length > 0;
    };
    methods.getDates = function () {
        return _store.dates;
    };
    methods.setDates = function (data) {
        _store.dates = data;
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
        if (SheetStore.isHasDatesInSheet(sheetId)) {
            callback(SheetStore.getDatesFromSheet(sheetId));
            return false;
        }
        _get({sheetId: sheetId}, function (res) {
            SheetStore.setDatesToSheet(sheetId, res.data);
            callback(res);
        });
    };

    methods.getDatesList = function (callback) {
        if (SheetStore.isHasDates()) {
            callback(SheetStore.getDates());
            return false;
        }
        _get({action: 'dates'}, function (res) {
            SheetStore.setDates(res);
            callback(res);
        });
    };

    return methods;
}

var SheetModel = new Model();

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
                '<td>' + item.poo + '</td>').appendTo('.date-sheet__body');
        });
    });
}

function loadDateList() {
    $('.main__anchor__list').empty();
    $('.main__anchor__loading').show();
    SheetModel.getDatesList(function (res) {
        $('.main__anchor__loading').hide();
        res.forEach(function (item,idx) {
            if (item.note === "") return true;

            var card = $('<div>').addClass('main__anchor__card');
            var user = $('<div>').addClass('main__anchor__user').html('<div class="main__anchor__image"></div><div class="main__anchor__name">妍妍小朋友</div>');
            var title = $('<h5>').html(item.note);
            var content = $('<div>').addClass('main__anchor__content').html('<pre>' + item.info + '</pre>');
            var date = new Date(item.date);
            var dateToFormat = $('<div>').addClass('main__anchor__date').html(date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate());
            card.append([user, title, content, dateToFormat]).appendTo($('.main__anchor__list'));

            /* images */
            if (item.images.length > 0) {
                var album = $('<div>').addClass('main__anchor__album');
                var pictures = item.images.map(function (image) {
                    return $('<div>').addClass('main__anchor__picture')
                        .css('background-image', 'url("' + image + '")')
                        .data('fancybox', 'images-'+idx)
                        .attr('href', image)
                        .click(function(){
                            var parent = $(this).parent();
                            $.fancybox.open( $(parent).children('.main__anchor__picture'), {
                                buttons: [
                                    "zoom",
                                    "close"
                                ],

                            });
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
    loadDateList();
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
