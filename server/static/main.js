var quoteDict={};
function updateTable(){
	$.ajax({
        url: '/table?days='+trading_days,
        success: function (quotes) {
        
		var newTable = '<table id="quote-table"><thead>'
		newTable+='<tr><th>Song</th><th>Views Yesterday</th><th>Open Views</th><th>Highest Views</th><th>Lowest Views</th></tr></thead>'
		newTable+='<tbody>'
		$(quotes).each(function(i,quote){
			quoteDict[quote['RealQuote']]=quote;
			newTable += '<tr data-realquote="'+quote['RealQuote']+'"><td><a href="https://www.youtube.com/watch?v='+quote['RealQuote']+'">'+quote['DisplayQuote']+'</a></td><td>'+quote['price']+'</td>';
			newTable +='<td>'+quote['open']+'</td><td>'+quote['high']+'</td><td>'+quote['low']+'</td></tr>'
		})
		newTable += '</tbody></table>';
        $("#quote-div").empty()
		$('#quote-div').html(newTable);
        if (selected.length<1){
            var defaultQuote=$('#defaultSelect').find("option:selected").val();
            selected=[defaultQuote];
            }
            $(selected).each(function(i,quote){console.log(quote);$('tr[data-realquote='+quote+']').toggleClass('highlight')});
			updateText();
                drawChart(selected, trading_days);
            
		},error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
      }
	})
}
var selected=[];
var trading_days=30;

function updateText(){
	if (selected.length===1){
		//Normal view
		var quote=quoteDict[selected[0]];
        console.log(quote);
		$("#company-name").text(quote['DisplayQuote']);
		$("#exchange-date").text(quote['Exchange']+":"+quote["DisplayQuote"]+" - "+d3.time.format.utc("%b %d, %I:%M %p EST")(new Date(quote['last_datetime']))+" "+quote['DisplayYear']);
		$("#current-price").text(quote['price'])
        $("#currency").text(quote['CurrencyUnit'])
		if (quote['change']>=1){
            
			$("#price-change").text(((quote['change']-1)* 100).toFixed(2) + '%')
            $("#current-price").attr("class","green-shade")
            $("#price-change").attr("class","green-shade")
            $("#price-change").prepend("<img src='static/green-arrow.png' />")
            
        }else{
        
			$("#price-change").text(((quote['change']-1)* 100).toFixed(2) + '%')
            $("#current-price").attr("class","red-shade")
            $("#price-change").attr("class","red-shade")
            $("#price-change").prepend("<img src='static/red-arrow.png' />")
		}
		;
	}else if (selected.length>1){
		//compare view
		var compareString="";
		$(selected).each(function(i,realQuote){
			compareString+=quoteDict[realQuote]["Exchange"]+":"+quoteDict[realQuote]["DisplayQuote"]+", ";
		});
		compareString=compareString.slice(0,-2);
		$("#company-name").text("Comparing");
		$("#exchange-date").text(compareString+" - "+d3.time.format.utc("%b %d")(new Date(quoteDict[selected[0]]['last_datetime'])));//change to config
		$("#current-price").text("").removeAttr("red-shade").removeAttr("green-shade");
        $("#currency").text("");
        $("#price-change").text("").removeAttr("red-shade").removeAttr("green-shade");
		$("#after-hours").text("").removeAttr("red-shade").removeAttr("green-shade");
		;
	}

}
function selectionHandler(newQuote){
	$('tr[data-realquote='+newQuote+']').toggleClass('highlight');
	if ($.inArray(newQuote, selected)>=0){
		selected.splice(selected.indexOf(newQuote),1);
	}else{
		selected.push(newQuote)
	}
    updateText();
    drawChart(selected, trading_days);
}
function changeDate(days){
    trading_days=days;
    updateTable();
    updateText();
    drawChart(selected, trading_days);
}

$(document).ready(function() {
	updateTable();
	$(document).on("click", "#quote-table tr", function(e) {
		var quote=$(this).data('realquote');
		selectionHandler(quote);
	});
	$("#defaultSelect").change(function(){
		$(selected).each(function(i,selection){
			$('tr[data-realquote='+selection+']').toggleClass('highlight');
		});
		selected=[]
		selectionHandler($(this).val())
	});
})