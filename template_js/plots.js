function areaPlot(id, data, width, height ){

    var margin={ top:10, bottom:30, left:30, right:10};
    var padding =30;

    var x= d3.scale.linear().range( [ margin.left, width-margin.right ] );
    var y= d3.scale.linear().range( [ height-margin.bottom, margin.top ] );

    var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(10);
    var yAxis = d3.svg.axis().scale(y).orient('left').ticks(5);

    var area = d3.svg.area()
                    .x( function(d) { return x( d.key ) })
                    .y0( height-margin.bottom)
                    .y1( function(d){ return y( d.value ) });

    var svg = d3.select(id).append('svg')
                .attr('width', width)
                .attr('height', height  )
                    .append('g');

    x.domain([0, d3.max( data, function(d){ return d.key  })]);
    y.domain([0, d3.max( data, function(d){ return d.value  })]);

    svg.append('path').datum(data)
            .attr('class','area')
            .attr('d', area );

    svg.append('g')
            .attr('class','x axis')
            .attr('transform', 'translate(0,'+( height-margin.bottom) +')').call(xAxis);

    svg.append('g')
            .attr('class','y axis')
            .attr('transform' , 'translate('+ margin.left +',0)')
            .call(yAxis)
            .append( 'text')
                .attr("transform", "rotate(-90)")
                  .attr("y", 6)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')



}



function chr_dist_plot(id, data ){
	var barColor = 'steelblue'; 

	function histoGram( hD ){
		var hG={};
		var hGDim={};
		
	}

	function pieChart(pD ){
	
	}
}
