var parseDate = d3.time.format("%d-%b-%y").parse;

var forward_mapping={}
var reverse_mapping={}
function getData(symbols,days){
	var layers=[];
	var dates=[]
	$.ajax({
        url: '/timeseries?symbols='+symbols+"&days="+days,
        success: function (d) {
			var multiple=(Object.keys(d).length==1);
			for (var key in d) {
				var layer={}
				var values=[];
				var scale_factor;
				if (multiple){scale_factor=1}
				else {scale_factor=d[key]['meta']['open']};
				$(d[key]['values']).each(function(i,price){
                    date=new Date(price['date']);
                    dates.push(date.valueOf());
					values.push({
                        date: date,
                        price:price['dailyViewcount']
					})
				})
				layer['key']=key
				layer['values']=values
				layers.push(layer)
			}
            $.unique(dates).sort();
            $(dates).each(function(i,date){
                forward_mapping[new Date(date)]=i;
                reverse_mapping[i]=new Date(date)
            });
		},
        async: false
	})
	return layers
}



function addShading(data,x,height){
  var c10 = d3.scale.category10();
    var marginTop=30
    var marginBottom=100;
    //d3.select("#chart svg").remove("rect");
    d3.selectAll("rect.shading").remove();
    d3.select('#chart svg').append("rect")
       .attr("class", "shading")
       .attr("x", function(d){console.log(d); return x(d[0].values[d[0].values.length-10].date)})
       .attr("y", marginTop)
       .attr("width", function(d){return x(d[0].values[d[0].values.length-1].date)-x(d[0].values[d[0].values.length-20].date);})
       .attr("height", height-marginBottom-marginTop)
         .attr("opacity", 0.1)
       .attr("fill", c10(0));
}

function drawChart(symbols,trading_days)
{	
	var data=getData(symbols,trading_days);
    console.log(data);
	var height=400;
	nv.addGraph(function() {
	var chart = nv.models.lineWithFocusChart()
					.useInteractiveGuideline(true).height(height)
					.x(function(d) {return forward_mapping[d.date]; })
                    .y(function(d) {return d.price; })
					;
	var x = d3.scale.linear();
    var y = d3.scale.linear().range([height, 0]);
    var dateFormat=d3.time.format.utc("%d-%b-%y");
    //x.domain(d3.extent(data, function(d) { console.log(d);return d.weekday; }));
    y.domain([0, d3.max(data, function(d) { return d.dailyViewcount; })]);
	chart.xScale(x)
		;
     
    chart.xAxis
        .tickFormat(function(x) { 
			try{
				return dateFormat(reverse_mapping[x]);
			}catch(error){
				console.log(x,error);
			};
		} )
		.orient("bottom")
		.ticks(5);
	    chart.x2Axis
            .tickFormat(function(x) { 
                try{
                    return dateFormat(reverse_mapping[x]);
                }catch(error){
                    console.log(x,error);
                };
            } )
        .orient("bottom").ticks(5);
	  chart.yAxis
		  .tickFormat(d3.format(',.2f')).orient("left").ticks(5);

	  chart.y2Axis
		  .tickFormat(d3.format(',.2f')).orient("left").ticks(5);
	  d3.select('#chart svg')
		  .datum(data)
		  .transition().duration(500)
		  .call(chart);
      if (trading_days==1){
        ;//addShading(data,x,height);
        }else{d3.selectAll("rect.shading").remove();}
	  nv.utils.windowResize(chart.update);
	  return chart;
	});
}