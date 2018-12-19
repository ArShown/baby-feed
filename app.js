function _get(data, callback){
	$.ajax({
	  	method: "GET",
	  	crossDomain: true,
		url:'https://script.google.com/macros/s/AKfycbzKeT3fhBZfZ7bTESYvoGisLzdDAZnxqiVt2oubvjAxTfWXR34/exec',
		data: data,
		dataType: 'json'
	}).done(callback);
}

function loadSheetList(){
	_get({}, function(res){
		res.forEach(function (item, idx) {
			var ele = $("<div>").addClass("nav-link nav-sheet__item")
				.html(item.name)
				.click(function(){
					loadSheetDates(item.sheetId);
					$(".nav-sheet__item--active").removeClass("nav-sheet__item--active");
					$(this).addClass('nav-sheet__item--active');
				})
				.appendTo('.nav-sheet');

			if(idx === 0) ele.click();
		});
	});
}

function loadSheetDates(sheetId){
	_get({sheetId:sheetId}, function(res){
		res.data.forEach(function (item) {
			console.log(item);
			$("<tr>").html('<td></td>')
				.appendTo('.date-sheet__body');

		});

	});
}

$(function(){
	//loadSheetList();
})
