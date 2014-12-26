
var qualChartSelector = "#qual_chart",
        DPChartSelector = "#dp_chart",
        dataCountSelceor = "#data-count",
        dataTableSelceor = "#data-table",
        highLowChartSelector = "#high_low_chart",
        chrChartSelector = "#chr_chart"
        ;


var HIGH_QUAL_CUTOFF = 1;

var dataset;


//get data

var getData= function(json_data ){
		dataset = json_data;

		//modify dataset
		dataset.forEach(function(d) {
			d.POS = +d.POS;
			d.QUAL = +d.QUAL;
			d.DP = +d.DP;
		});


		drawChart();

}




var drawChart = function() {
    var crossfilterData = crossfilter(dataset);


    //Qual chart
    var qualDimension = crossfilterData.dimension(function(d) {
        return d.QUAL;
    });
    var qualGroup = qualDimension.group();

    dc.barChart(qualChartSelector)
            .width(990)
            .height(200)
            .margins({top: 0, right: 50, bottom: 20, left: 40})
            .dimension(qualDimension)
            .group(qualGroup)
            .centerBar(true)
            .gap(1)
            .x(d3.scale.linear().domain([0, d3.max(dataset, function(d) {
            return d.QUAL;
        })]));


    //High Low chart
    var highLowDimension = crossfilterData.dimension(function(d) {
        return d.QUAL > HIGH_QUAL_CUTOFF ? 'HIGH' : 'LOW';
    });
    var highLowGroup = highLowDimension.group();

    dc.pieChart(highLowChartSelector)
            .width(180) // (optional) define chart width, :default = 200
            .height(180) // (optional) define chart height, :default = 200
            .radius(80) // define pie radius
            .dimension(highLowDimension) // set dimension
            .group(highLowGroup) // set group
            ;


    //DP chart
    var DPDimension = crossfilterData.dimension(function(d) {
        return d.DP;
    });

    var DPGroup = DPDimension.group();
    dc.barChart(DPChartSelector)
            .width(420)
            .height(180)
            .margins({top: 10, right: 50, bottom: 30, left: 40})
            .dimension(DPDimension)
            .group(DPGroup)
            .elasticY(true)
            .x(d3.scale.linear().domain([0, d3.max(dataset, function(d) {
            return d.DP;
        })]))
            .renderHorizontalGridLines(true)
            ;



    //chrom chart
    var chrDimension = crossfilterData.dimension(function(d) {
        return d.CHR;
    });
    var chrGroup = chrDimension.group();
    dc.rowChart(chrChartSelector)
            .group(chrGroup) // set group
            .dimension(chrDimension) // set dimension
            // (optional) define margins
            .margins({top: 20, left: 10, right: 10, bottom: 20})
    .height(700)
            // (optional) define color array for slices
           // .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
    // (optional) set x offset for labels, default is 10
  //  labelOffSetX(5)
    // (optional) set y offset for labels, default is 15
   // labelOffSetY(10)
            // (optional) whether chart should render labels, :default = true
            .renderLabel(true)
            // (optional) by default pie chart will use group.key and group.value as its title
            // you can overwrite it with a closure
            //.title(function(d) { return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)"; })
            // (optional) whether chart should render titles, :default = false
            //.renderTitle(true);
            // (optional) specify the number of ticks for the X axis
            .xAxis().ticks(4);


    //count widget
    var all = crossfilterData.groupAll();
    dc.dataCount(dataCountSelceor)
            .dimension(crossfilterData) // set dimension to all data
            .group(all);


//data table
    dc.dataTable(dataTableSelceor)
            // set dimension
            .dimension(qualDimension)
            // data table does not use crossfilter group but rather a closure
            // as a grouping function
            .group(function(d) {
        return 'QUAL';
    })
            // (optional) max number of records to be shown, :default = 25
            .size(dataset.length)
            // dynamic columns creation using an array of closures
            .columns([
        function(d) {
            return d.CHR;
        },
        function(d) {
            return d.POS;
        },
        function(d) {
            return d.QUAL;
        },
        function(d) {
            return d.DP;
        }
    ])
            // (optional) sort using the given field, :default = function(d){return d;}
            .sortBy(function(d) {
        return d.QUAL;
    })
            // (optional) sort order, :default ascending
            .order(d3.descending);


    //render
    dc.renderAll();
};



