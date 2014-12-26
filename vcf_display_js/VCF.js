
!function(exports) {
    'use strict';

    var VCF = {
        drawSingleView: drawSingleView,
        drawGroupView: drawGroupView,
        union: union,
        intersection: intersection,
        difference: difference,
        summary: summary,
        drawQualChart: drawQualChart,
        drawDPChart: drawDPChart,
        drawAminoAcidChangeChart: drawAminoAcidChangeChart,
        drawVariantTable: drawVariantTable,
        drawGTChart: drawGTChart,
        drawNovelVariantChart: drawNovelVariantChart,
        drawRegionChart: drawRegionChart,
        drawClinicalSignificanceChart: drawClinicalSignificanceChart,
        drawRepetitionChart: drawRepetitionChart,
        drawMultiLineChart: drawMultiLineChart,
        drawBubbleChart: drawBubbleChart,
        addData: addData,
        hasData: hasData,
        removeData: removeData,
        removeAllData: removeAllData,
        numberDisplay: numberDisplay,
        chartResetAll: chartResetAll
    };

    var _data = {_TEMP: []}; //dataID: [SAMPLE, FIELD_NAME, crossfilter]
    var CONSTANT = {
//NAVIGATION_PANEL_CLASS: 'NAVIATION_PANEL',
//MAIN_PANEL_CLASS: 'MAIN_PANEL',
        ROOT_CLASS: 'JJ',
        TEMP_DATA_KEY: '_TEMP',
        SUMMARY_CLASS: 'SUMMARY',
        CATEGORICAL_CHART_CLASS: 'CATEGORICAL_CHART',
        QUALITY_CHART_CLASS: 'QUALITY_CHART',
        DEPTH_CHART_CLASS: 'DEPTH_CHART',
        REPETITION_CHART_CLASS: 'REPETITION_CHART',
        GENOTYPE_CHART_CLASS: 'GENOTYPE_CHART',
        CLINICAL_SIGNIFICANCE_CHART_CLASS: 'CLINICAL_SIGNIFICANCE_CHART',
        BASE_CHANGE_CHART_CLASS: 'BASE_CHANGE_CHART',
        AMINOACID_CHANGE_CHART_CLASS: 'AMINOACID_CHANGE_CHART',
        NOVEL_VARIANT_CHART_CLASS: 'NOVEL_VARIANT_CHART',
        REGION_CHART_CLASS: 'REGION_CHART',
        BUTTON_CHART_CLASS: 'BUTTON_CHART',
        VARIANT_TABLE_CLASS: 'VARIANT_TABLE',
        ARITHMETIC_PANEL_CLASS: 'ARITHMETIC_PANEL',
        CHR: {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
            11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20,
            21: 21, 22: 22,
            x: 23, X: 23, y: 24, Y: 24},
        FIELDS_WIDTH: {sample_index: 1, CHR: 2, POS: 2, REF: 2, ALT: 2, QUAL: 2, GQ: 2, DP: 2, GT: 2,
            LOC: 3, GENE: 3, ANNO: 3, ANNO_ALL: 4, DBSNP: 3,
            AA_REF: 2, AA_ALT: 2,
            TYPE: 3, CVAR: 4, CVAR_DESC: 6, CVAR_ACC: 3, CVAR_VER: 3}
    };



    function drawSingleView(parent, dataID) {
        var o_root = d3.select(parent).classed(CONSTANT.ROOT_CLASS, true);
        o_root.selectAll('div').remove();

        chartResetAll();

        //number display
        numberDisplay(dataID);

        //first row
        var o_row = o_root.append('div').classed('row', true);
        //summary panel
        o_row.append('div')
                .classed('col-md-6', true)
                .classed(CONSTANT.SUMMARY_CLASS, true);
        drawSummary(parent + ' .' + CONSTANT.SUMMARY_CLASS, dataID);

        //categorical charts     
        o_row.append('div')
                .classed('col-md-6', true)
                .classed(CONSTANT.CATEGORICAL_CHART_CLASS, true);

        var o_body = box(parent + ' .' + CONSTANT.CATEGORICAL_CHART_CLASS, 'Category');
        if (isMergedData(dataID)) {
            o_body.append('div').classed(CONSTANT.REPETITION_CHART_CLASS, true);
            drawRepetitionChart(parent + '.' + CONSTANT.REPETITION_CHART_CLASS, dataID);
        }

        o_body.append('div').classed(CONSTANT.NOVEL_VARIANT_CHART_CLASS, true);
        drawNovelVariantChart(parent + ' .' + CONSTANT.NOVEL_VARIANT_CHART_CLASS, dataID, {verticalMode: true});
        o_body.append('div').classed(CONSTANT.GENOTYPE_CHART_CLASS, true);
        drawGTChart(parent + ' .' + CONSTANT.GENOTYPE_CHART_CLASS, dataID);
        o_body.append('div').classed(CONSTANT.REGION_CHART_CLASS, true);
        drawRegionChart(parent + ' .' + CONSTANT.REGION_CHART_CLASS, dataID, {verticalMode: true});
        o_body.append('div').classed(CONSTANT.CLINICAL_SIGNIFICANCE_CHART_CLASS, true);
        drawClinicalSignificanceChart(parent + ' .' + CONSTANT.CLINICAL_SIGNIFICANCE_CHART_CLASS, dataID, {headerText: '', verticalMode: true});


        //second row
        o_row = o_root.append('div').classed('row', true);

        //quality chart panel        
        o_row.append('div')
                .classed('col-md-6', true)
                .classed(CONSTANT.QUALITY_CHART_CLASS, true);
        drawQualChart(parent + ' .' + CONSTANT.QUALITY_CHART_CLASS, dataID, {headerTitle: 'Quality Score', maxQual: 60});

        //depth chart panel        
        o_row.append('div')
                .classed('col-md-6', true)
                .classed(CONSTANT.DEPTH_CHART_CLASS, true);
        drawDPChart(parent + ' .' + CONSTANT.DEPTH_CHART_CLASS, dataID, {headerTitle: 'Depth'});
        //third row
        o_row = o_root.append('div').classed('row', true);
        /*
         //base change chart
         o_row.append('div')
         .classed('col-md-6', true)
         .classed(CONSTANT.BASE_CHANGE_CHART_CLASS, true);
         drawBaseChangeChart(parent + ' .' + CONSTANT.BASE_CHANGE_CHART_CLASS, dataID);
         */

        //amino acid change chart        
        o_row.append('div')
                .classed('col-md-6', true)
                .classed(CONSTANT.AMINOACID_CHANGE_CHART_CLASS, true);
        drawAminoAcidChangeChart(parent + ' .' + CONSTANT.AMINOACID_CHANGE_CHART_CLASS, dataID, {headerTitle: 'Amino Acid Change', height: 300});

        //variant table
        o_row = o_root.append('div').classed('row', true);
        o_row.append('div')
                .classed('col-md-12', true)
                .classed(CONSTANT.VARIANT_TABLE_CLASS, true);
        drawVariantTable(parent + ' .' + CONSTANT.VARIANT_TABLE_CLASS, dataID, {headerTitle: 'Variants'});


        chartApplyAllFilters();

    }


    /*
     var _root;
     function drawFirst(parent) {
     var o_root = d3.select(parent);
     _root = o_root;
     var o_row = o_root.append('div').classed('row', true);
     drawNavigationPanel(o_row);
     o_row = o_root.append('div').classed('row', true);
     drawMainPanel(o_row);
     }
     
     
     
     function drawMainPanel(parent) {
     var o_root = selection(parent);
     var body = panel(o_root);
     }
     
     function drawNavigationPanel(parent) {
     var o_root = selection(parent);
     var body = panel(o_root).classed(CONSTANT.NAVIGATION_PANEL_CLASS, true)
     .append('ul').classed('nav nav-pills', true);
     //group button
     for (var i = 0; i < dataLength(); i++) {
     body.append('li')
     .append('a')
     .text('G' + i)
     ;
     }
     
     //add group button
     body.append('li').classed('active', true).style('cursor', 'pointer')
     .on('click', function() {
     removeActiveClass();
     addGroup();
     })
     .append('a')
     .append('span')
     .classed('glyphicon glyphicon-plus', true);
     //add comparison button
     body.append('li').style({'left': '5px'})
     .append('a')
     .append('span')
     .classed('glyphicon glyphicon-asterisk', true);
     }
     
     function removeGroup(dataID) {
     delete _data[dataID];
     }
     
     function addGroup() {
     _root.select('.' + CONSTANT.NAVIGATION_PANEL_CLASS + ' ul')
     .insert('li', ':nth-last-child(2)')
     .on('click', function() {
     alert('click');
     })
     .classed('active', true)
     .append('a')
     .text('G')
     .append('i')
     .classed('glyphicon glyphicon-remove-circle', true)
     ;
     addData();
     }
     
     function removeActiveClass() {
     _root.selectAll('.' + CONSTANT.NAVIGATION_PANEL_CLASS + ' li')
     .classed('active', false);
     }
     
     */




    function drawGroupView(parent, dataID_1, dataID_2) {
        var o_root = d3.select(parent);
        o_root.selectAll('div').remove();
        var o_row = o_root.append('div').classed('row', true);
        //group1 panel
        var _p = o_row.append('div')
                .classed('col-md-5', true).classed(CONSTANT.SUMMARY_CLASS, true)
                .classed('GROUP_1', true);
        panel(_p);
        //arithmetic panel
        _p = o_row.append('div')
                .classed('col-md-2', true)
                .classed(CONSTANT.ARITHMETIC_PANEL_CLASS, true);
        //group2 panel
        _p = o_row.append('div')
                .classed('col-md-5', true)
                .classed(CONSTANT.SUMMARY_CLASS, true)
                .classed('GROUP_2', true);
        panel(_p);
        //variant table panel
        o_row = o_root.append('div').classed('row', true);
        _p = o_row.append('div').classed('col-md-12', true);
        panel(_p).classed(CONSTANT.VARIANT_TABLE_CLASS, true);
        var s_target = parent + ' .' + CONSTANT.SUMMARY_CLASS + '.GROUP_1 .panel-body';
        drawSummary(s_target, dataID_1);
        s_target = parent + ' .' + CONSTANT.SUMMARY_CLASS + '.GROUP_2 .panel-body';
        drawSummary(s_target, dataID_2, dataID_2);
        s_target = parent + ' .' + CONSTANT.VARIANT_TABLE_CLASS;
        drawArithmeticMarks(parent + ' .' + CONSTANT.ARITHMETIC_PANEL_CLASS, dataID_1, dataID_2, s_target);
    }


    function numberDisplay(dataID) {
        if (!d3.select('#numberDisplay').node()) {
            d3.select('body').append('div').attr('id'
                    , 'numberDisplay').classed('hidden', true);
        }

        var o_group = getCrossfilter(dataID).groupAll()
                .reduce(
                function(p, v) {
                    ++p.n;
                    return p;
                },
                function(p, v) {
                    --p.n;
                    return p;
                },
                function() {
                    return {n: 0};
                }
        );
        dc.numberDisplay('#numberDisplay')
                .group(o_group)
                .formatNumber(d3.format("n"))
                .valueAccessor(function(d) {
            return d.n;
        })
                .render();
    }


    function setSingleNGroupButton(chart) {

        var parent = chart.root().select('.box_header');

        if (!parent.node()) { //if no headerTitle
            parent = chart.root().select('.box_body');
        }

        var buttonGroup = parent
                .append('div').classed('btn-group', true).classed('SingleGroupButton', true).attr('data-toggle', 'buttons');

        buttonGroup.append('label').classed('btn btn-default btn-xs', true)
                .text('S')
                .classed('active', true)
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'auto')
                .attr('title', 'by Sample')
                .on('click', function() {
            chart.coloring('s');
        })
                .append('input').attr('type', 'radio');

        buttonGroup.append('label').classed('btn btn-default btn-xs', true)
                .text('G')
                .classed('acitve', false)
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'auto')
                .attr('title', 'by Group')
                .on('click', function() {
            chart.coloring('g');
        })
                .append('input').attr('type', 'radio');


        $(chart.root().node()).find('[data-toggle=tooltip]').tooltip({container: 'body'});

        return chart;
    }


    function drawMultiLineChart(parent, o_data, o_options) {
        if (!o_options || !o_options.Y) {
            return console.log('absence of parameter "Y"');
        }

        var title;

        if (o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        box(parent, title);
        var chart = multiLineChart(parent).data(o_data);

        if (o_options) {
            chart.options(o_options);
        }

        setSingleNGroupButton(chart);

        chart.draw();
        setAutoResizeSVG(chart);

        return chart;
    }

    /**
     * 
     * @param {String|d3.selection} parent
     * @returns {_L2.multiLineChart._chart}
     */
    function multiLineChart(parent) {

        var _chart = JJChart();
        _chart.root(parent);

        var _Y;
        var _gridLine = true;

        _chart.draw = function() {

            var data = _chart.data();
            var width = _chart.effectiveWidth();
            var height = _chart.effectiveHeight();
            var margins = _chart.margins();
            var xAxisLabel = _chart.xAxisLabel();
            var yAxisLabel = _chart.yAxisLabel();

            var x = d3.scale.linear()
                    .range([0, width])
                    .domain([0, data[0][_Y].length]);
            var y = d3.scale.linear()
                    .range([height, 0])
                    .domain([0, d3.max(data, function(d) {
                    return d3.max(d[_Y]);
                })]);
            var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
            var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
            var svg = selection(parent).classed('JJ_chart', true).append('svg')
                    .attr('width', _chart.width())
                    .attr('height', _chart.height())
                    .append('g')
                    .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

            var line = d3.svg.line()
                    .x(function(d, i) {
                return x(i);
            })
                    .y(function(d, i) {
                return y(d);
            })
                    .interpolate("basis")
                    ;
            var axis = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);
            if (xAxisLabel) {
                axis.append('text')
                        .classed('axis_label', true)
                        .attr('x', width / 2)
                        .attr('y', margins.bottom - 5)
                        .attr('text-anchor', 'middle')
                        .text(xAxisLabel);
            }


            axis = svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
            if (yAxisLabel) {
                axis.append("text")
                        .classed('axis_label', true)
                        .attr('x', -height / 2)
                        .attr("y", -margins.left + 10)
                        .attr("transform", "rotate(-90)")

                        .attr('text-anchor', 'middle')
                        .text(yAxisLabel);
            }

            //grid line
            if (_gridLine) {
                svg.append('g').selectAll('line').data(y.ticks(yAxis.ticks()[0]))
                        .enter()
                        .append('line')
                        .classed('gridLine', true)
                        .attr("x1", 1)
                        .attr("y1", function(d) {
                    return y(d);
                })
                        .attr("x2", width)
                        .attr("y2", function(d) {
                    return y(d);
                })
                        //       .attr("opacity", 0);
                        //   dc.transition(linesGEnter, _chart.transitionDuration())
                        .attr("opacity", 1);
            }


            //chart line
            var pathEnter = svg.selectAll('.line').data(data).enter()
                    .append('g').classed('line', true)
                    .append('path');

            pathEnter
                    //.style('stroke', function(d, i) {
                    //return color(i);
                    //})
                    .attr('group', function(d) {
                return d.group;
            })
                    .attr('d', function(d) {
                return line(d[_Y]);
            }).style('stroke', 'white');

            _chart.coloring('s');

            if (_chart.tooltip()) {
                pathEnter.attr('data-toggle', 'tooltip')
                        .attr('data-placement', 'auto')
                        .attr('title', _chart.tooltip())
                        ;
                $(parent + ' .line path[data-toggle=tooltip]').tooltip({container: 'body'});
            }


            pathEnter.on('mouseenter', function(d) {
                svg.selectAll('.line path').classed('deselected', true);
                d3.select(this).classed('deselected', false).classed('selected', true);
            })
                    .on('mouseleave', function(d) {
                svg.selectAll('.line path').classed('deselected', false);
                d3.select(this).classed('selected', false);
            });


            return _chart;
        };

        _chart.coloring = function(by) {
            var byGroup = by && by.toLocaleUpperCase() === 'G';
            var color = _chart.color();

            var root = _chart.root();
            root.selectAll('.line path').each(function(d, i) {
                var d3_this = d3.select(this);
                d3_this.transition().style('stroke', color(byGroup ? d3_this.attr('group') : i));
            });

            return _chart;
        };

        _chart.Y = function(_) {
            if (!arguments.length)
                return _Y;
            _Y = _;
            return _chart;
        };

        _chart.gridLine = function(_) {
            if (!arguments.length)
                return _gridLine;
            _gridLine = _;
            return _chart;
        };

        return _chart;
    }



    function drawBubbleChart(parent, o_data, o_options) {
        if (!o_options || !o_options.Y || !o_options.X || !o_options.R) {
            return console.log('absence of parameter "X, Y, R"');
        }

        var title;

        if (o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        box(parent, title);
        var chart = bubbleChart(parent).data(o_data);




        if (o_options) {
            chart.options(o_options);
        }

        setSingleNGroupButton(chart);

        chart.draw();
        setAutoResizeSVG(chart);

        return chart;
    }


    function bubbleChart(parent) {

        var _chart = JJChart();
        _chart.root(parent);

        var _X,
                _Y,
                _R;

        var _minRadius = 3;
        var _maxRadius = 30;

        var _gridLine = true;

        _chart.draw = function() {

            var data = _chart.data();
            var width = _chart.effectiveWidth();
            var height = _chart.effectiveHeight();
            var margin = _chart.margins();
            var xAxisLabel = _chart.xAxisLabel();
            var yAxisLabel = _chart.yAxisLabel();

            var x = d3.scale.linear()
                    .range([0, width])
                    .domain([0, d3.max(data, function(d) {
                    return d[_X];
                })]);
            var y = d3.scale.linear()
                    .range([height, 0])
                    .domain([0, d3.max(data, function(d) {
                    return d[_Y];
                })]);
            var r = d3.scale.linear()
                    .range([_minRadius, _maxRadius])
                    .domain([0, d3.max(data, function(d) {
                    return d[_R];
                })]);
            var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");
            var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left");
            var svg = selection(parent).classed('JJ_chart', true).append('svg')
                    .attr('width', _chart.width())
                    .attr('height', _chart.height())
                    .append('g')
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            var axis = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);
            if (xAxisLabel) {
                axis.append('text')
                        .classed('axis_label', true)
                        .attr('x', width / 2)
                        .attr('y', margin.bottom - 5)
                        .attr('text-anchor', 'middle')
                        .text(xAxisLabel);
            }


            axis = svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
            if (yAxisLabel) {
                axis.append("text")
                        .classed('axis_label', true)
                        .attr('x', -height / 2)
                        .attr("y", -margin.left + 10)
                        .attr("transform", "rotate(-90)")

                        .attr('text-anchor', 'middle')
                        .text(yAxisLabel);
            }

            //grid line
            if (_gridLine) {
                svg.append('g').selectAll('line').data(y.ticks(yAxis.ticks()[0]))
                        .enter()
                        .append('line')
                        .classed('gridLine', true)
                        .attr("x1", 1)
                        .attr("y1", function(d) {
                    return y(d);
                })
                        .attr("x2", width)
                        .attr("y2", function(d) {
                    return y(d);
                })
                        //       .attr("opacity", 0);
                        //   dc.transition(linesGEnter, _chart.transitionDuration())
                        .attr("opacity", 1);
            }


            var enter = svg.selectAll('g.bubble').data(data).enter()
                    .append('g').classed('bubble', true)
                    .on('mouseenter', function(d) {
                svg.selectAll('.bubble').classed('deselected', true);
                d3.select(this).classed('deselected', false).classed('selected', true);
            })
                    .on('mouseleave', function(d) {
                svg.selectAll('.bubble').classed('deselected', false);
                d3.select(this).classed('selected', false);
            })
                    .append('circle')
                    ;

            enter
                    .attr('group', function(d) {
                return d.group;
            })
                    .attr('r', function(d) {
                return r(d[_R]);
            })
                    .attr('transform', function(d) {
                return 'translate(' + x(d[_X]) + ', ' + y(d[_Y]) + ')';
            }).attr('fill', 'white')
                    ;

            if (_chart.tooltip()) {
                enter.attr('data-toggle', 'tooltip')
                        .attr('title', _chart.tooltip());

                $(parent + ' .bubble circle[data-toggle=tooltip]').tooltip({container: 'body', placement: 'auto'});
                //$(parent + ' .bubble circle[data-toggle=popover]').popover({container: 'body', trigger:'hover', placement:'auto'});

            }

            _chart.coloring();





        };
        _chart.X = function(_) {
            if (!arguments.length)
                return _X;
            _X = _;
            return _chart;
        };
        _chart.Y = function(_) {
            if (!arguments.length)
                return _Y;
            _Y = _;
            return _chart;
        };
        _chart.R = function(_) {
            if (!arguments.length)
                return _R;
            _R = _;
            return _chart;
        };

        _chart.minRadius = function(_) {
            if (!arguments.length)
                return _minRadius;
            _minRadius = _;
            return _chart;
        };
        _chart.maxRadius = function(_) {
            if (!arguments.length)
                return _maxRadius;
            _maxRadius = _;
            return _chart;
        };

        _chart.coloring = function(by) {
            var byGroup = by && by.toLocaleUpperCase() === 'G';
            var color = _chart.color();

            var root = _chart.root();
            root.selectAll('.bubble circle').each(function(d, i) {
                var d3_this = d3.select(this);
                d3_this.transition().attr('fill', color(byGroup ? d3_this.attr('group') : i));
            });

            return _chart;
        };

        _chart.gridLine = function(_) {
            if (!arguments.length)
                return _gridLine;
            _gridLine = _;
            return _chart;
        };

        return _chart;
    }



    function JJChart() {

        var _chart = {};
        var _data;

        var _root;

        var _minWidth = 200;
        var _minHeight = 150;

        var _default_width = function(element) {
            var width = element && element.getBoundingClientRect && element.getBoundingClientRect().width;
            return (width && width > _minWidth) ? width : _minWidth;
        };
        var _width = _default_width;

        var _minHeight = 200;
        var _default_height = function(element) {
            var height = element && element.getBoundingClientRect && element.getBoundingClientRect().height;
            return (height && height > _minHeight) ? height : _minHeight;
        };
        var _height = _default_height;

        var _margin = {top: 10, right: 30, bottom: 40, left: 50};
        var _color = d3.scale.category10();
        var _xAxisLabel,
                _yAxisLabel;


        var _tooltip = false;


        _chart.draw = function() {

        };

        _chart.root = function(_) {
            if (!arguments.length)
                return _root;
            _root = selection(_);
            return _chart;
        };

        _chart.svg = function() {
            return _root.select('svg');
        };

        _chart.data = function(_) {
            if (!arguments.length)
                return _data;
            _data = _;
            return _chart;
        };

        _chart.minWidth = function(w) {
            if (!arguments.length)
                return _minWidth;
            _minWidth = w;
            return _chart;
        };

        _chart.minHeight = function(w) {
            if (!arguments.length)
                return _minHeight;
            _minHeight = w;
            return _chart;
        };

        _chart.width = function(w) {
            if (!arguments.length)
                return _width(_root.node());
            _width = d3.functor(w || _default_width);
            return _chart;
        };
        _chart.height = function(h) {
            if (!arguments.length)
                return _height(_root.node());
            _height = d3.functor(h || _default_height);
            return _chart;
        };
        _chart.margins = function(m) {
            if (!arguments.length)
                return _margin;
            _margin = m;
            return _chart;
        };

        _chart.effectiveWidth = function() {
            return _chart.width() - _chart.margins().left - _chart.margins().right;
        };

        _chart.effectiveHeight = function() {
            return _chart.height() - _chart.margins().top - _chart.margins().bottom;
        };


        _chart.xAxisLabel = function(_) {
            if (!arguments.length)
                return _xAxisLabel;
            _xAxisLabel = _;
            return _chart;
        };
        _chart.yAxisLabel = function(_) {
            if (!arguments.length)
                return _yAxisLabel;
            _yAxisLabel = _;
            return _chart;
        };

        _chart.tooltip = function(_) {
            if (!arguments.length)
                return _tooltip;
            _tooltip = _;

            return _chart;
        };

        /**
         * 
         * @param {d3.scale.category}
         * @returns {chart}
         */
        _chart.color = function(_) {
            if (!arguments.length)
                return _color;
            _color = _;
            return _chart;
        };
        _chart.options = function(opts) {
            for (var o in opts) {
                if (typeof(_chart[o]) === 'function') {
                    _chart[o].call(_chart, opts[o]);
                } else {
                    console.log("Not a valid option setter name: " + o);
                }
            }
            return _chart;
        };
        return _chart;
    }

    function difference(dataID_1, dataID_2) {
        if (!isSameDataFormat(dataID_1, dataID_2)) {
            console.log('function:difference - unmatched data format between two groups');
            return undefined;
        }

        var a_data_1 = getFilteredData(dataID_1),
                a_data_2 = getFilteredData(dataID_2);
        var n_1 = 0, n_2 = 0;
        var a_row_1 = a_data_1[n_1],
                a_row_2 = a_data_2[n_2];
        var a_fieldName = getFieldName(dataID_1);
        var n_indexOfChr = a_fieldName.indexOf('CHR'),
                n_indexOfPos = a_fieldName.indexOf('POS');
        var json = {SAMPLE: getSamplesName(dataID_1),
            FIELD_NAME: a_fieldName,
            VAR: []};
        while (a_row_1 && a_row_2) {
            var n_c = comparePos(a_row_1, a_row_2, n_indexOfChr, n_indexOfPos);
            if (n_c === 1) {
                a_row_2 = a_data_2[++n_2];
            } else if (n_c === -1) {
                json.VAR.push(a_row_1);
                a_row_1 = a_data_1[++n_1];
            } else {  //n_c === 0               
                a_row_1 = a_data_1[++n_1];
                a_row_2 = a_data_2[++n_2];
            }
        }

        while (a_row_1) {
            json.VAR.push(a_row_1);
            a_row_1 = a_data_1[++n_1];
        }

        return json;
    }

    function intersection(dataID_1, dataID_2) {
        if (!isSameDataFormat(dataID_1, dataID_2)) {
            console.log('function:intersection - unmatched data format between two groups');
            return undefined;
        }

        var a_data_1 = getFilteredData(dataID_1),
                a_data_2 = getFilteredData(dataID_2);
        var n_1 = 0, n_2 = 0;
        var a_row_1 = a_data_1[n_1],
                a_row_2 = a_data_2[n_2];
        var a_fieldName = getFieldName(dataID_1);
        var n_data_1_sampleLength = getSamplesName(dataID_1).length;
        var n_indexOfChr = a_fieldName.indexOf('CHR'),
                n_indexOfPos = a_fieldName.indexOf('POS');
        var json = {SAMPLE: getSamplesName(dataID_1).concat(getSamplesName(dataID_2)),
            FIELD_NAME: a_fieldName,
            VAR: []};
        while (a_row_1 && a_row_2) {
            var n_c = comparePos(a_row_1, a_row_2, n_indexOfChr, n_indexOfPos);
            if (n_c === 1) {
                a_row_2 = a_data_2[++n_2];
            } else if (n_c === -1) {
                a_row_1 = a_data_1[++n_1];
            } else {  //n_c === 0
                a_row_2[0] = a_row_2[0].map(function(n) {
                    return n + n_data_1_sampleLength;
                });
                json.VAR.push(merge(a_row_1, a_row_2));
                a_row_1 = a_data_1[++n_1];
                a_row_2 = a_data_2[++n_2];
            }
        }

        return json;
    }


    function union(dataID_1, dataID_2) {
        if (!isSameDataFormat(dataID_1, dataID_2)) {
            console.log('function:union - unmatched data format between two groups');
            return undefined;
        }

        var a_data_1 = getFilteredData(dataID_1),
                a_data_2 = getFilteredData(dataID_2);
        var n_1 = 0, n_2 = 0;
        var a_row_1 = a_data_1[n_1],
                a_row_2 = a_data_2[n_2];
        var a_fieldName = getFieldName(dataID_1);
        var n_data_1_sampleLength = getSamplesName(dataID_1).length;
        var n_indexOfChr = a_fieldName.indexOf('CHR'),
                n_indexOfPos = a_fieldName.indexOf('POS');
        var json = {SAMPLE: getSamplesName(dataID_1).concat(getSamplesName(dataID_2)),
            FIELD_NAME: a_fieldName,
            VAR: []};
        while (a_row_1 && a_row_2) {
            var n_c = comparePos(a_row_1, a_row_2, n_indexOfChr, n_indexOfPos);
            if (n_c === 1) {
                a_row_2[0] = a_row_2[0].map(function(n) {
                    return n + n_data_1_sampleLength;
                });
                json.VAR.push(a_row_2);
                a_row_2 = a_data_2[++n_2];
            } else if (n_c === -1) {
                json.VAR.push(a_row_1);
                a_row_1 = a_data_1[++n_1];
            } else {  //n_c === 0
                a_row_2[0] = a_row_2[0].map(function(n) {
                    return n + n_data_1_sampleLength;
                });
                json.VAR.push(merge(a_row_1, a_row_2));
                a_row_1 = a_data_1[++n_1];
                a_row_2 = a_data_2[++n_2];
            }
        }

        while (a_row_1) {
            json.VAR.push(a_row_1);
            a_row_1 = a_data_1[++n_1];
        }
        while (a_row_2) {
            a_row_2[0] = a_row_2[0].map(function(n) {
                return n + n_data_1_sampleLength;
            });
            json.VAR.push(a_row_2);
            a_row_2 = a_data_2[++n_2];
        }

        return json;
    }


    /**
     * concate values by index
     * @param {Array} a_row_1
     * @param {Array} a_row_2
     * @returns {Array}
     */
    function merge(a_row_1, a_row_2) {
        var a_new = [];
        for (var i = 0; i < a_row_1.length; i++) {
            if (Array.isArray(a_row_1[i])) {
                a_new[i] = a_row_1[i].concat(a_row_2[i]);
            } else {
                a_new[i] = a_row_1[i];
            }
        }

        return a_new;
    }


    /**
     * check length of fields
     * @param {String} dataID_1
     * @param {String} dataID_2
     * @returns {Boolean}
     */
    function isSameDataFormat(dataID_1, dataID_2) {

        if (getFieldName(dataID_1).length !== getFieldName(dataID_2).length) {
            return false;
        } else {
            return true;
        }
    }


    /**
     * 
     * @param {type} a_row_1
     * @param {type} a_row_2
     * @param {type} n_indexChr
     * @param {type} n_indexPos
     * @returns {Number} if row_1 is after row_2 then return 1, same 0, before -1
     */
    function comparePos(a_row_1, a_row_2, n_indexChr, n_indexPos) {

        if (a_row_1[n_indexChr] === a_row_2[n_indexChr] && a_row_1[n_indexPos] === a_row_2[n_indexPos]) {
            return 0;
        }

        var n_chr_1 = chrToNumber(a_row_1[n_indexChr]),
                n_chr_2 = chrToNumber(a_row_2[n_indexChr]);
        if (n_chr_1 > n_chr_2) {
            return 1;
        } else if (n_chr_1 < n_chr_2) {
            return -1;
        } else {
            if (a_row_1[n_indexPos] > a_row_2[n_indexPos]) {
                return 1;
            } else if (a_row_1[n_indexPos] < a_row_2[n_indexPos]) {
                return -1;
            }
        }
    }

    function chrToNumber(s_chr) {

        var _type = typeof s_chr;
        if (_type === 'number') {
            return s_chr;
        } else if (_type === 'string') {
            return CONSTANT.CHR[s_chr];
        } else {
            console.log('error: typeof CHR');
        }
    }


    /**
     * 
     * @param {String||d3.selection} parent
     * @param {String} s_dataID_1
     * @param {String} s_dataID_2
     * @param {String} parentOfTable - selector of variant table panel
     * @returns {undefined}
     */
    function drawArithmeticMarks(parent, s_dataID_1, s_dataID_2, parentOfTable) {
        var root = selection(parent).classed(CONSTANT.ARITHMETIC_PANEL_CLASS, true);
        var MARK_DOT = 'M50 39c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11z',
                MARK_UNION = 'M75.995 45h-21v-21c0-2.76-2.235-3-5-3-2.76 0-5 0.235-5 3v21h-20.995c-2.765 0-3 2.24-3 5s0.235 5 3 5h20.995v21c0 2.76 2.24 3 5 3 2.765 0 5-0.24 5-3v-21h21c2.765 0 3.005-2.24 3.005-5s-0.24-5-3.005-5z',
                MARK_DIFFERENCE = 'M75.995 45h-51.995c-2.765 0-3 2.24-3 5s0.235 5 3 5h51.995c2.765 0 3.005-2.24 3.005-5s-0.24-5-3.005-5z',
                MARK_INTERSECTION = 'M71.745 65.76l-13.79-15.76 13.79-15.76c2.345-2.345 2.345-6.145 0-8.485s-6.145-2.34-8.485 0l-13.26 15.155-13.255-15.15c-2.345-2.345-6.145-2.345-8.485 0s-2.34 6.145 0 8.485l13.785 15.755-13.79 15.76c-2.34 2.345-2.34 6.135 0 8.475 2.345 2.345 6.145 2.345 8.485 0l13.26-15.145 13.255 15.145c2.345 2.345 6.145 2.345 8.485 0s2.345-6.13 0.005-8.475z';
        root.selectAll('div').remove();
        var o_row = root.append('div').classed('row text-center', true);
        //union mark
        o_row.append('div').classed('col-md-4', true)
                .append('img').attr('src', 'image/plus.png').classed('transition_button', true)
                //.append('h2').classed(MARK_UNION, true).classed('transition_button', true)
                .on('click', function() {
//operationPanel.attr('class', MARK_UNION).classed('arithmetic_mark_lg', true);
            operationPanel.transition().duration(1000)
                    .attr('d', MARK_UNION);
            var newData = union(s_dataID_1, s_dataID_2);
            addData(CONSTANT.TEMP_DATA_KEY, newData);
            drawVariantTable(parentOfTable, CONSTANT.TEMP_DATA_KEY);
        });
//difference mark
        o_row.append('div').classed('col-md-4', true)
                .append('img').attr('src', 'image/minus.png').classed('transition_button', true)
                //.append('h2').classed(MARK_DIFFERENCE, true).classed('transition_button', true)
                .on('click', function() {
//operationPanel.attr('class', MARK_DIFFERENCE).classed('arithmetic_mark_lg', true);
            operationPanel.transition().duration(1000).attr('d', MARK_DIFFERENCE);
            var newData = difference(s_dataID_1, s_dataID_2);
            addData(CONSTANT.TEMP_DATA_KEY, newData);
            drawVariantTable(parentOfTable, CONSTANT.TEMP_DATA_KEY);
        });
//intersection mark
        o_row.append('div').classed('col-md-4', true)
                .append('img').attr('src', 'image/cross.png').classed('transition_button', true)
                //.append('h2').classed(MARK_INTERSECTION, true).classed('transition_button', true)
                .on('click', function() {
            operationPanel.transition().duration(1000).attr('d', MARK_INTERSECTION);
            var newData = intersection(s_dataID_1, s_dataID_2);
            addData(CONSTANT.TEMP_DATA_KEY, newData);
            drawVariantTable(parentOfTable, CONSTANT.TEMP_DATA_KEY);
        });
        //var operationPanel = root.append('div').classed('row text-center', true).append('span');
        var operationPanel = root.append('div').classed('col-md-12', true)
                .append('svg')
                .append('g').append('path')
                .attr('d', MARK_DOT);
    }



    function getFilteredData(dataID) {
        var o_dimension = getCrossfilter(dataID).dimension(sortFunc('CHR', dataID));
        var _filteredAllData = o_dimension.bottom(Infinity);
        o_dimension.dispose();
        return _filteredAllData;
    }



    function drawSummary(parent, dataID, s_title) {
        var title = s_title || 'Summary';
        box(parent, title);
        resetButton(parent + ' .box_header');
        summary(parent + ' .box_body', dataID);
    }

    function summary(parent, dataID) {
        var o_root = selection(parent);
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return repValue(d[0]); //
        });
        var all = getCrossfilter(dataID).groupAll();
        var chart = dc.baseMixin({})
                .dimension(o_dimension)
                .group(all);
        var o_node = o_root.append('dl').classed('dl-horizontal', true);
        o_node.append('dt').text('Samples');
        o_node.append('dd').text(getSamplesName(dataID));
        o_node.append('dt').text('No.Variants');
        var o_ = o_node.append('dd');
        o_.append('strong').classed('filter_count', true);
        o_.append('small').classed('total_count', true);
        //mean qualty score
        o_node.append('dt').text('Mean Quality Score');
        o_node.append('dd').classed('mean_quality', true);
        //mean depth
        o_node.append('dt').text('Mean Depth');
        o_node.append('dd').classed('mean_depth', true);
        var n_indexQUAL = getFieldName(dataID).indexOf('QUAL');
        var n_indexDP = getFieldName(dataID).indexOf('DP');
        var formatNumber = d3.format(",d");
        var n_total = formatNumber(getCrossfilter(dataID).size());
        chart._doRender = function() {
            var selected = chart.dimension().top(Infinity),
                    meanQual = d3.mean(selected, function(d) {
                return repValue(d[n_indexQUAL]);
            }),
                    meanDepth = d3.mean(selected, function(d) {
                return repValue(d[n_indexDP]);
            });
            o_root.select('.filter_count').text(formatNumber(selected.length));
            o_root.select('.total_count').text(' / ' + n_total);
            o_root.select('.mean_quality').text(d3.round(meanQual, 1));
            o_root.select('.mean_depth').text(d3.round(meanDepth, 1));
            return chart;
        };
        chart._doRedraw = function() {
            return chart._doRender();
        };
        chart.anchor(parent);
        chart.render();
    }

    function resetButton(parent) {
        d3.select(parent).append('a')
                //.attr('href', "javascript:dc.filterAll(); dc.renderAll();")
                .classed('btn btn-info btn-xs', true)
                .classed('pull-right', true)
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'top')
                .attr('title', 'Clear All Filters')
                .text('RESET')
                .on('click', function(d) {
            //dc.filterAll();
            filterResetAll();
            dc.renderAll();
        });
        $(parent + ' a').tooltip({container: 'body'});
    }



    function drawDPChart(parent, dataID, o_options) {
        var title;

        if (o_options && o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        box(parent, title);
        var chart = DPChart(parent + ' .box_body', dataID, o_options.maxDP);
        setBarChartOptions(chart);
        if (o_options) {
            chart.options(o_options);
            //o_options.width && chart.width(o_options.width); 
            //o_options.height && chart.height(o_options.height);
        }

        setFilterDisplay(chart);

        chart.render();

        setAutoResizeSVG(chart);

        return chart;
    }

    function drawQualChart(parent, dataID, o_options) {
        var title;

        if (o_options && o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        box(parent, title);
        var chart = qualChart(parent + ' .box_body', dataID, o_options.maxQual);
        setBarChartOptions(chart);
        if (o_options) {
            chart.options(o_options);
        }

        setFilterDisplay(chart);


        chart.render();
        setAutoResizeSVG(chart);

        return chart;
    }


    function drawAminoAcidChangeChart(parent, dataID, o_options) {
        var title;

        if (o_options && o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        box(parent, title);
        var chart = aminoAcidChangeChart(parent + ' .box_body', dataID);
        setHeatMapOptions(chart);
        setFilterDisplay(chart);
        if (o_options) {
            chart.options(o_options);
        }

        chart.render();
        setAutoResizeSVG(chart);

        return chart;
    }

    function aminoAcidChangeChart(parent, dataID) {
        var n_indexRef = getFieldName(dataID).indexOf('AA_REF'),
                n_indexAlt = getFieldName(dataID).indexOf('AA_ALT');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            if (d[n_indexRef] === 'NA' || d[n_indexAlt] === 'NA') {
                return ['0', '0'];
            }
            if (d[n_indexRef].length > 1 || d[n_indexAlt].length > 1) {
                return ['0', '0'];
            }
            return [repValue(d[n_indexRef]), repValue(d[n_indexAlt])];
        });
        var o_group = o_dimension.group();
        var chart = heatMap(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group                                                                
                .keyAccessor(function(d) {
            return d.key[0];
        })
                .valueAccessor(function(d) {
            return d.key[1];
        })
                .title(function(d) {
            return d.key[0] + '->' + d.key[1] + ': ' + d.value;
        })
                ;
        return chart;
    }


    function drawBaseChangeChart(parent, dataID, o_options) {
        var title = 'Base Change';
        box(parent, title);
        var chart = baseChangeChart(parent + ' .box_body', dataID);
        setHeatMapOptions(chart);
        setFilterDisplay(chart);
        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }

    function baseChangeChart(parent, dataID) {
        var n_indexRef = getFieldName(dataID).indexOf('REF'),
                n_indexAlt = getFieldName(dataID).indexOf('ALT');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return [repValue(d[n_indexRef]), repValue(d[n_indexAlt])[0]];
        });
        var o_group = o_dimension.group();
        var chart = heatMap(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group                                                                
                .keyAccessor(function(d) {
            return d.key[0];
        })
                .valueAccessor(function(d) {
            return d.key[1];
        })
                .title(function(d) {
            return d.key[0] + '->' + d.key[1] + ': ' + d.value;
        })
                ;
        return chart;
    }


    function setHeatMapOptions(chart) {
        chart
                .height(200)
                .linearColors(['#fdd0a2', '#e6550d'])
                .colorAccessor(function(d) {
            return d.value;
        })
                .calculateColorDomain()
                ;
        setNumberDisplay(chart);
        //chart.xBorderRadius(3);
        //chart.yBorderRadius(3);

        return chart;
    }

    function heatMap(parent, chartGroup) {

        var DEFAULT_BORDER_RADIUS = 5;
        var _chartBody;
        var _cols;
        var _rows;
        var _xBorderRadius = DEFAULT_BORDER_RADIUS;
        var _yBorderRadius = DEFAULT_BORDER_RADIUS;
        var _chart = dc.colorMixin(dc.marginMixin(dc.baseMixin({})));
        _chart._mandatoryAttributes(['group']);
        _chart.title(_chart.colorAccessor());
        var _xAxisOnClick = function(d) {
            filterAxis(0, d);
        };
        var _yAxisOnClick = function(d) {
            filterAxis(1, d);
        };
        var _boxOnClick = function(d) {
            var filter = d.key;
            dc.events.trigger(function() {
                _chart.filter(filter);
                _chart.redrawGroup();
            });
        };
        function filterAxis(axis, value) {
            var cellsOnAxis = _chart.selectAll(".box-group").filter(function(d) {
                return d.key[axis] == value;
            });
            var unfilteredCellsOnAxis = cellsOnAxis.filter(function(d) {
                return !_chart.hasFilter(d.key);
            });
            dc.events.trigger(function() {
                if (unfilteredCellsOnAxis.empty()) {
                    cellsOnAxis.each(function(d) {
                        _chart.filter(d.key);
                    });
                } else {
                    unfilteredCellsOnAxis.each(function(d) {
                        _chart.filter(d.key);
                    });
                }
                _chart.redrawGroup();
            });
        }

        dc.override(_chart, "filter", function(filter) {
            if (!arguments.length)
                return _chart._filter();
            return _chart._filter(dc.filters.TwoDimensionalFilter(filter));
        });
        function uniq(d, i, a) {
            return !i || a[i - 1] != d;
        }

        _chart.rows = function(_) {
            if (arguments.length) {
                _rows = _;
                return _chart;
            }
            if (_rows)
                return _rows;
            var rowValues = _chart.data().map(_chart.valueAccessor());
            rowValues.sort(d3.ascending);
            return d3.scale.ordinal().domain(rowValues.filter(uniq));
        };
        _chart.cols = function(_) {
            if (arguments.length) {
                _cols = _;
                return _chart;
            }
            if (_cols)
                return _cols;
            var colValues = _chart.data().map(_chart.keyAccessor());
            colValues.sort(d3.ascending);
            return d3.scale.ordinal().domain(colValues.filter(uniq));
        };
        _chart._doRender = function() {
            _chart.resetSvg();
            _chartBody = _chart.svg()
                    .append("g")
                    .attr("class", "heatmap")
                    .attr("transform", "translate(" + _chart.margins().left + "," + _chart.margins().top + ")");
            return _chart._doRedraw();
        };
        _chart._doRedraw = function() {
            var rows = _chart.rows(),
                    cols = _chart.cols(),
                    rowCount = rows.domain().length,
                    colCount = cols.domain().length,
                    boxWidth = Math.floor(_chart.effectiveWidth() / colCount),
                    boxHeight = Math.floor(_chart.effectiveHeight() / rowCount);
            cols.rangeRoundBands([0, _chart.effectiveWidth()]);
            rows.rangeRoundBands([_chart.effectiveHeight(), 0]);
            var boxes = _chartBody.selectAll("g.box-group").data(_chart.data(), function(d, i) {
                return _chart.keyAccessor()(d, i) + '\0' + _chart.valueAccessor()(d, i);
            });
            var gEnter = boxes.enter().append("g")
                    .attr("class", "box-group");
            gEnter.append("rect")
                    .attr("class", "heat-box")
                    .attr("fill", "white")
                    .attr('data-toggle', 'tooltip')
                    .on("click", _chart.boxOnClick());
            dc.transition(boxes.selectAll("rect"), _chart.transitionDuration())
                    .attr("x", function(d, i) {
                return cols(_chart.keyAccessor()(d, i));
            })
                    .attr("y", function(d, i) {
                return rows(_chart.valueAccessor()(d, i));
            })
                    .attr("rx", _xBorderRadius)
                    .attr("ry", _yBorderRadius)
                    .attr("fill", _chart.getColor)
                    .attr("width", boxWidth)
                    .attr("height", boxHeight)
                    .attr('data-original-title', _chart.title()); //added

            boxes.exit().remove();
            $(parent + ' [data-toggle="tooltip"]').tooltip({container: 'body'});
            var gCols = _chartBody.selectAll("g.cols");
            if (gCols.empty())
                gCols = _chartBody.append("g").attr("class", "cols axis");
            gCols.selectAll('text').data(cols.domain())
                    .enter().append("text")
                    .attr("x", function(d) {
                return cols(d) + boxWidth / 2;
            })
                    .style("text-anchor", "middle")
                    .attr("y", _chart.effectiveHeight())
                    .attr("dy", 12)
                    .on("click", _chart.xAxisOnClick())
                    .text(function(d) {
                return d;
            });
            var gRows = _chartBody.selectAll("g.rows");
            if (gRows.empty())
                gRows = _chartBody.append("g").attr("class", "rows axis");
            gRows.selectAll('text').data(rows.domain())
                    .enter().append("text")
                    .attr("dy", 6)
                    .style("text-anchor", "end")
                    .attr("x", 0)
                    .attr("dx", -2)
                    .on("click", _chart.yAxisOnClick())
                    .text(function(d) {
                return d;
            });
            dc.transition(gRows.selectAll('text'), _chart.transitionDuration())
                    .text(function(d) {
                return d;
            })
                    .attr("y", function(d) {
                return rows(d) + boxHeight / 2;
            });
            if (_chart.hasFilter()) {
                _chart.selectAll("g.box-group").each(function(d) {
                    if (_chart.isSelectedNode(d)) {
                        _chart.highlightSelected(this);
                    } else {
                        _chart.fadeDeselected(this);
                    }
                });
            } else {
                _chart.selectAll("g.box-group").each(function() {
                    _chart.resetHighlight(this);
                });
            }
            return _chart;
        };
        _chart.boxOnClick = function(f) {
            if (!arguments.length)
                return _boxOnClick;
            _boxOnClick = f;
            return _chart;
        };
        _chart.xAxisOnClick = function(f) {
            if (!arguments.length)
                return _xAxisOnClick;
            _xAxisOnClick = f;
            return _chart;
        };
        _chart.yAxisOnClick = function(f) {
            if (!arguments.length)
                return _yAxisOnClick;
            _yAxisOnClick = f;
            return _chart;
        };
        _chart.xBorderRadius = function(d) {
            if (arguments.length) {
                _xBorderRadius = d;
            }
            return _xBorderRadius;
        };
        _chart.yBorderRadius = function(d) {
            if (arguments.length) {
                _yBorderRadius = d;
            }
            return _yBorderRadius;
        };
        _chart.isSelectedNode = function(d) {
            return _chart.hasFilter(d.key);
        };
        return _chart.anchor(parent, chartGroup);
    }
    ;




    function drawNovelVariantChart(parent, dataID, o_options) {
        var n_index = getFieldName(dataID).indexOf('DBSNP');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return d[n_index] === 'NA' ? 'Unknown' : 'Known';
        });
        var o_group = o_dimension.group();

        var chart = buttonChart(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group     
                .headerText('Novel Variant');

        setButtonChartOptions(chart);

        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }

    function drawRepetitionChart(parent, dataID, o_options) {
        var n_indexRepetition = getFieldName(dataID).indexOf('sample_index');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return d[n_indexRepetition].length;
        });
        var o_group = o_dimension.group();

        var chart = buttonChart(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group     
                .headerText('Repetition');

        setButtonChartOptions(chart);

        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }


    function drawGTChart(parent, dataID, o_options) {
        var n_indexGT = getFieldName(dataID).indexOf('GT');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return d[n_indexGT][0];
        });
        var o_group = o_dimension.group();
        var chart = buttonChart(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group     
                .headerText('Genotype');
        setButtonChartOptions(chart);

        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }


    function drawClinicalSignificanceChart(parent, dataID, o_options) {
        var n_indexCS = getFieldName(dataID).indexOf('CVAR');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return d[n_indexCS];
        });
        var o_group = o_dimension.group();

        var chart = buttonChart(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group     
                .headerText('Clinvar');

        setButtonChartOptions(chart);

        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }

    function drawRegionChart(parent, dataID, o_options) {
        var n_index = getFieldName(dataID).indexOf('LOC');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            return d[n_index];
        });
        var o_group = o_dimension.group();

        var chart = buttonChart(parent)
                .dimension(o_dimension) // set dimension
                .group(o_group) // set group     
                .headerText('Region');

        setButtonChartOptions(chart);

        if (o_options) {
            chart.options(o_options);
        }

        return chart.render();
    }





    function setButtonChartOptions(chart) {
        chart
                //         .width(180) // (optional) define chart width, :default = 200
                .height(30) // (optional) define chart height, :default = 200                    
                // (optional) set x offset for labels, default is 10
                .labelOffsetX(5)
                // (optional) set y offset for labels, default is 15
                .labelOffsetY(14)
                // (optional) whether chart should render labels, :default = true
                .renderLabel(true)
                // (optional) by default pie chart will use group.key and group.value as its title
                // you can overwrite it with a closure
                //.title(function(d) { return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)"; })   
                .ordinalColors(['#8ca252', '#bcbd22', '#cedb9c'])
                //.colors(d3.scale.category10())
                ;
        ;
        setNumberDisplay(chart);
        return chart;
    }


    function buttonChart(parent, chartGroup) {

        var _g;

        var _headerText;
        var _headerWidth = 80;
        var _rowHeight = 20;

        var _effectiveWidth;
        var _width3 = 20;

        var _labelOffsetX = 10;
        var _labelOffsetY = 15;

        var _verticalMode = false;
        var _verticalGap = 3;

        var _class = 'buttonChart';
        var _headerClass = 'header';
        var _rowCssClass = "row";

        var _chart = dc.capMixin(dc.marginMixin(dc.colorMixin(dc.baseMixin({}))));

        _chart.margins({top: 5, left: 10, right: 10, bottom: 5});
        _chart.rowsCap = _chart.cap;

        _chart.title(function(d) {
            //return _chart.cappedKeyAccessor(d) + ": " + _chart.cappedValueAccessor(d);
            return d.value;
        });


        _chart._doRender = function() {
            if (_verticalMode) {
                _chart.height((_rowHeight + _verticalGap) * (_chart.data().length + (_headerText ? 1 : 0)) + _chart.margins().top + _chart.margins().bottom);
            }


            _chart.resetSvg();

            //
            setAutoResizeSVG(_chart);


            var _svg = _chart.svg().classed(_class, true)
                    .append("g")
                    .attr("transform", "translate(" + _chart.margins().left + "," + _chart.margins().top + ")");

            _effectiveWidth = _chart.effectiveWidth();

//header part

            if (!_headerText) {
                _g = _svg.append("g");

            } else {

                var header = _svg.append('rect').classed(_headerClass, true)
                        .attr('stroke', _chart.colors()(0))
                        .attr('fill', '#fff');

                _svg.append('text').text(_headerText)
                        .attr('x', _labelOffsetX)
                        .attr('y', _labelOffsetY);

                if (_verticalMode) {

                    header
                            .attr('width', _effectiveWidth)
                            .attr('height', _rowHeight);

                    _g = _svg
                            .append("g")
                            .attr("transform", "translate(0, " + (_rowHeight + _verticalGap) + ")");


                } else {    //header text & horizontal mode
                    header
                            .attr('width', _headerWidth)
                            .attr('height', _rowHeight);

                    _g = _svg
                            .append("g")
                            .attr("transform", "translate(" + _headerWidth + ", 0)");

                    _effectiveWidth = _effectiveWidth - _headerWidth;

                }
            }



            drawChart();

            return _chart;
        };



        function drawChart() {
            var rowData = _chart.data();



            var rows = _g.selectAll("g." + _rowCssClass)
                    .data(rowData);
            createElements(rows);
            updateElements(rows);
            removeElements(rows);

        }

        function createElements(rows) {
            var rowEnter = rows.enter()
                    .append("g")
                    .attr("class", function(d, i) {
                return _rowCssClass + " _" + i;
            })
                    .on("click", onClick);

            rowEnter.append("rect").attr("width", 0).attr('stroke', _chart.colors()(0));
            if (_verticalMode) {
                rowEnter.append("rect").classed('rect2', true).attr("width", 0).attr('stroke', _chart.colors()(0));
                rowEnter.append("rect").classed('rect3', true).attr("width", 0).attr('stroke', _chart.colors()(0));

            }

            createLabels(rowEnter);
            updateLabels(rows);
        }

        function removeElements(rows) {
            rows.exit().remove();
        }

        function updateElements(rows) {
            var n = rows[0].length;

            rows.classed("deselected", function(d) {
                return (_chart.hasFilter()) ? !isSelectedRow(d) : false;
            })
                    .classed("selected", function(d) {
                return (_chart.hasFilter()) ? isSelectedRow(d) : false;
            })
                    .attr('data-toggle', 'tooltip')
                    .attr('data-original-title', _chart.title())
                    ;


            rows
                    .select("rect").attr("fill", _chart.colors()(1));




            if (_verticalMode) {    //vertical mode                                                

                var width = _effectiveWidth / 2;
                var width2 = width - _width3;

                //var height = (_effectiveHeight - _verticalGap * (n - 1)) / n;

                rows
                        .attr("transform", function(d, i) {
                    return "translate(0, " + (i * (_rowHeight + _verticalGap)) + ")";
                });

                rows.select("rect")
                        .attr("height", _rowHeight)
                        .attr('width', width);

                rows.select(".rect2").attr("fill", _chart.colors()(1));

                rows.select(".rect2")
                        .attr('transform', 'translate(' + width + ',0)')
                        .attr("height", _rowHeight)
                        .attr('width', width2);

                rows.select(".rect3").attr("fill", _chart.colors()(1));
                rows.select(".rect3")
                        .attr('transform', 'translate(' + (width + width2) + ',0)')
                        .attr("height", _rowHeight)
                        .attr('width', _width3);


            } else {    //horizontal
                var width = _effectiveWidth / n;
                //var height = _effectiveHeight;

                rows
                        .attr("transform", function(d, i) {
                    return "translate(" + (i * width) + ",0)";
                }).select("rect")
                        .attr("height", _rowHeight)
                        .attr('width', width)
                        ;


                //apply tooltip only horizontal mode
                $(parent + ' [data-toggle="tooltip"]').tooltip({
                    container: 'body'
                });

            }


            updateLabels(rows);
        }


        function createLabels(rowEnter) {
            if (_chart.renderLabel()) {
                rowEnter.append("text");
                //         .on("click", onClick);

                if (_verticalMode) {
                    rowEnter.append('text').classed('text2', true);
                    rowEnter.append('text').classed('text3', true);
                    //.classed('glyphicon glyphicon-check', true);
                }
            }
        }

        function updateLabels(rows) {
            if (_chart.renderLabel()) {
                rows.select("text")
                        .attr("x", _labelOffsetX)
                        .attr("y", _labelOffsetY)
                        //  .on("click", onClick)
                        .attr("class", function(d, i) {
                    return _rowCssClass + " _" + i;
                })
                        .text(function(d) {
                    return _chart.label()(d);
                });

                if (_verticalMode) {
                    var width = _effectiveWidth / 2;

                    rows.select('.text2')
                            .attr("x", width + _labelOffsetX)
                            .attr("y", _labelOffsetY)
                            .text(_chart.title());

                    rows.select('.text3')
                            .attr("x", _effectiveWidth - _width3 + _labelOffsetX)
                            .attr("y", _labelOffsetY)
                            .text('V');

                }

            }

        }


        function onClick(d) {
            _chart.onClick(d);
        }

        _chart._doRedraw = function() {
            drawChart();
            return _chart;
        };
        _chart.headerWidth = function(_) {
            if (!arguments.length)
                return _headerWidth;
            _headerWidth = _;
            return _chart;
        };
        _chart.headerText = function(_) {
            if (!arguments.length)
                return _headerText;
            _headerText = _;
            return _chart;
        };

        _chart.verticalMode = function(_) {
            if (!arguments.length)
                return _verticalMode;
            _verticalMode = _;
            return _chart;
        };

        _chart.verticalGap = function(_) {
            if (!arguments.length)
                return _verticalGap;
            _verticalGap = _;
            return _chart;
        };

        /**
         #### .labelOffsetX([x])
         Get or set the x offset (horizontal space to the top left corner of a row) for labels on a particular row chart. Default x offset is 10px;
         
         **/
        _chart.labelOffsetX = function(o) {
            if (!arguments.length)
                return _labelOffsetX;
            _labelOffsetX = o;
            return _chart;
        };
        /**
         #### .labelOffsetY([y])
         Get or set the y offset (vertical space to the top left corner of a row) for labels on a particular row chart. Default y offset is 15px;
         
         **/
        _chart.labelOffsetY = function(o) {
            if (!arguments.length)
                return _labelOffsetY;
            _labelOffsetY = o;
            return _chart;
        };
        function isSelectedRow(d) {
            return _chart.hasFilter(_chart.cappedKeyAccessor(d));
        }

        return _chart.anchor(parent, chartGroup);
    }



    function drawVariantTable(parent, dataID, o_options) {
        var title;

        if (o_options && o_options.headerTitle) {
            title = o_options.headerTitle;
            delete o_options.headerTitle;
        }

        var boxBody = box(parent, title);

        var table = variantTable(parent + ' .box_body', dataID);

        setTableOptions(table);

        if (title === undefined) {
            selection(parent).insert('div', ':first-child')
                    .classed('box_configure', true);


            configureButton(parent + ' .box_configure', table);
            tableCopyButton(parent + ' .box_configure', table);
            tableSearchButton(parent + ' .box_configure', table);
        }
        else {

            configureButton(parent + ' .box_header', table);
            tableCopyButton(parent + ' .box_header', table);
            tableSearchButton(parent + ' .box_header', table);
        }

        if (o_options) {
            table.options(o_options);
        }



        return table.render();
    }

    function variantTable(parent, dataID) {

        var a_colName = ['CHR', 'POS', 'REF', 'ALT', 'GT', 'QUAL', 'DP', 'GENE', 'CVAR'];
        var o_dimension = getCrossfilter(dataID).dimension(sortFunc('CHR', dataID));
        var o_group = function() { //not use group info
            return 'Group';
        };

        d3.select(parent).append('div')
                .append('table')
                .classed('table', true)
                .classed('table-striped', true)
                .classed('table-condensed', true)
                .classed('table-hover', true)
                .classed('header-fixed', true);

        var o_table = dataTable(parent + ' table')
                .dimension(o_dimension)
                .group(o_group)
                .colNames(a_colName)
                .dataID(dataID)
                //.columns(columnFormat(a_colName, dataID))
                .sortBy(sortFunc(a_colName[0], dataID));

        tableHeader(o_table);

        //run popover
        $('body').popover({
            selector: parent + ' span[data-toggle="popover"]',
            container: 'body',
            trigger: 'hover',
            placement: 'auto'
        });

        return o_table;
    }


    function tableHeader(o_table) {


        var o_root = o_table.root();
        o_root.select('thead').remove();
        var a_colNames = o_table.colNames();
        var s_dataID = o_table.dataID();
        var f_cellWidth = cellWidthFunc(a_colNames);
        o_root.insert('thead', ':first-child')
                .append('tr')
                .selectAll('th')
                .data(a_colNames)
                .enter()
                .append('th')
                .attr('actived', function(d, i) {
            if (i === 0) {
                return true;
            } else {
                return false;
            }
        })
                //.style('width', 100 / a_colName.length + '%')
                .style('width', function(d) {
            return f_cellWidth(d);
        })
                .text(function(d) {
            return d;
        })
                //add sorting listener at table header 
                .on('click', function(d) {
            var self = d3.select(this);
            var isActived = self.attr('actived');
            var _order = d3.ascending;

            if (isActived === 'true') {
                _order = o_table.order() === d3.ascending ? d3.descending : d3.ascending;
            } else {
                o_table.dimension().dispose();
                o_table.dimension(getCrossfilter(s_dataID).dimension(sortFunc(d, s_dataID)));
                o_table.sortBy(sortFunc(d, s_dataID));
                d3.select(this.parentNode).selectAll('th').attr('actived', false);
                self.attr('actived', true);
            }

            return o_table.order(_order).redraw();
        })
                .append('span').classed({'glyphicon': true, 'glyphicon-sort': true, 'pull-right': true})
                ;
    }


    /**
     * 
     * @param {Array} a_colName
     * @returns {Function} function(s_column_name)
     */
    function cellWidthFunc(a_colName) {
//var FIELD_LENGTH = {sample_index: 1, CHR: 2, POS: 2, REF: 2, ALT: 2, QUAL: 2, GQ: 2, DP: 2, GT: 2,
//    var_type: 3, loc_anno: 3, gene_anno: 3, dbsnp_rs_number: 3,
//    clinical_significance: 4, clinvar_description: 6, clinvar_acc: 3, clinvar_ver: 3};

        var n_totalLength = 0;
        a_colName.forEach(function(d) {
            n_totalLength += CONSTANT.FIELDS_WIDTH[d];
        });
        return function(s_colName) {
            return 100 * CONSTANT.FIELDS_WIDTH[s_colName] / n_totalLength + '%';
        };
    }


    /**
     * 
     * @param {Array} a_colName
     * @param {String} dataID
     * @returns {Array}
     */
    function columnFormat(a_colName, dataID) {
        var a_rtn = [];
        a_colName.forEach(function(d, i) {
            var n_index = getFieldName(dataID).indexOf(d);
            if (d === 'CVAR') {
                var n_indexDescription = getFieldName(dataID).indexOf('CVAR_DESC');
                a_rtn[i] = (function(n_index) {
                    return function(dx) {
                        var _text = repValue(dx[n_index]);
                        return _text === 'NA' ? _text : _text +
                                ' <span class="glyphicon glyphicon-info-sign" data-toggle="popover"' +
                                'data-content="' + dx[n_indexDescription] + '">' +
                                '</span>';
                    };
                })(n_index);
            } else if (d === 'ANNO') {
                var n_indexDetail = getFieldName(dataID).indexOf('ANNO_ALL');
                a_rtn[i] = (function(n_index) {
                    return function(dx) {
                        var _text = repValue(dx[n_index]);
                        return _text === 'NA' ? _text : _text +
                                ' <span class="glyphicon glyphicon-info-sign" data-toggle="popover"' +
                                'data-content="' + dx[n_indexDetail] + '">' +
                                '</span>';
                    };
                })(n_index);
            } else {
                a_rtn[i] = (function(n_index) {
                    return function(dx) {
                        return repValue(dx[n_index]);
                    };
                })(n_index);
            }


        });
        return a_rtn;
    }


    function sortFunc(field, dataID) {
        var n_index = getFieldName(dataID).indexOf(field);
        var MULTIPLE = 1000000000;
        var n_indexPOS = getFieldName(dataID).indexOf('POS');
        var forCHR = function(d) {
            var n_chr = chrToNumber(d[n_index]);
            return n_chr * MULTIPLE + d[n_indexPOS];
        };
        var rtnFunc = function(d) {
            return repValue(d[n_index]);
        };
        return n_index === getFieldName(dataID).indexOf('CHR') ? forCHR : rtnFunc;
    }


    function configureButton(parent, table) {
        var _root = selection(parent);

        _root.append('span')
                .style('margin-left', '10px')   //space between copy_button
                .classed('glyphicon glyphicon-cog', true)
                .classed('pull-right', true)
                .classed('transition_button', true)
                .attr('data-toggle', 'modal')
                .attr('data-target', '.tableConfigure');


        //modal
        var o_modal = _root.append('div')
                .classed('modal fade tableConfigure', true)
                .attr('role', 'dialog')
                .attr('tabindex', '-1')
                .attr('aria-labelledby', 'variant table configure')
                .attr('aria-hidden', true)
                .append('div').classed('modal-dialog modal-lg', true)
                .append('div').classed('modal-content', true);

        //modal header
        var o_header = o_modal.append('div').classed('modal-header', true);

        o_header.append('button').attr('type', 'button').classed('close', true).attr('data-dismiss', 'modal')
                .append('span').attr('aria-hidden', 'true').html('&times;');
        o_header.append('h4').classed('modal-title', true).text('Variant Table Setting');

        //modal body
        var o_body = o_modal.append('div').classed('modal-body', true).append('dl').classed('dl-horizontal', true);
        tableConfigureMaxRows(o_body, table);
        tableConfigureColumns(o_body, table);
        $('.modal-body .btn').button();

        //modal footer
        var o_footer = o_modal.append('div').classed('modal-footer', true);
        o_footer.append('button').attr('type', 'button').attr('data-dismiss', 'modal')
                .classed('btn btn-primary btn-sm', true).text('Save')
                .on('click', function() {
            var o_options = {};
            o_options.size = d3.select('.modal-body .cfg_maxRows .active').text();
            o_options.colNames = [];
            d3.selectAll('.cfg_columns .active').each(function() {
                o_options.colNames.push(d3.select(this).text());
            });

            if (table.size() !== o_options.size) {
                table.pageNumber(1);
            }
            table.options(o_options);
            tableHeader(table);
            table.redraw();
        });
    }


    function tableConfigureMaxRows(parent, table) {
        var a_SIZE = [25, 50, 100, 500, 'Infinity'];
        var n_sizeNow = table.size();
        parent.append('dt').text('Max Rows');
        parent.append('dd').append('div').classed('cfg_maxRows btn-group', true).attr('data-toggle', 'buttons')
                .selectAll('label').data(a_SIZE).enter()
                .append('label').classed('btn btn-default btn-xs', true)
                .classed('active', function(d) {
            return d === n_sizeNow ? true : false;
        })
                .text(function(d) {
            return d;
        })
                .append('input').attr('type', 'radio');
    }


    function tableConfigureColumns(parent, table) {
        var a_totalColumns = d3.keys(CONSTANT.FIELDS_WIDTH);
        var a_selectedColumns = table.colNames();
        parent.append('dt').text('Columns');
        var o_ = parent.append('dd').classed('cfg_columns', true);
        var a_columnsGroup = [];
        var n_sumColWidth = 0;
        var n_maxColWidth = 10;
        a_totalColumns.forEach(function(d) {
            n_sumColWidth += CONSTANT.FIELDS_WIDTH[d];
            a_columnsGroup.push(d);
            if (n_sumColWidth >= n_maxColWidth) {
                appendButtonGroup();
                o_.append('br');
                n_sumColWidth = 0;
                a_columnsGroup = [];
            }
        });
        appendButtonGroup();
        /*
         //first buttons group
         o_.append('div').classed('btn-group', true).attr('data-toggle', 'buttons')
         .selectAll('label').data(a_COLUMNS_1).enter()
         .append('label').classed('btn btn-default btn-xs', true)
         .classed('active', function(d) {
         return a_selectedColumns.indexOf(d) !== -1 ? true : false;
         }).text(function(d) {
         return d;
         }).property('value', function(d) {
         return d;
         })
         .append('input').attr('type', 'checkbox');
         
         //second buttons group
         o_.append('div').classed('btn-group', true).attr('data-toggle', 'buttons')
         .selectAll('label').data(a_COLUMNS_2).enter()
         .append('label').classed('btn btn-default btn-xs', true)
         .classed('active', function(d) {
         return a_selectedColumns.indexOf(d) !== -1 ? true : false;
         }).text(function(d) {
         return d;
         }).property('value', function(d) {
         return d;
         })
         .append('input').attr('type', 'checkbox');
         */

        function appendButtonGroup() {
            o_.append('div').classed('btn-group', true).attr('data-toggle', 'buttons')
                    .selectAll('label').data(a_columnsGroup).enter()
                    .append('label').classed('btn btn-default btn-xs', true)
                    .classed('active', function(d) {
                return a_selectedColumns.indexOf(d) !== -1 ? true : false;
            }).text(function(d) {
                return d;
            })
                    .append('input').attr('type', 'checkbox');
        }
    }





    function tableSearchButton(parent, o_table) {

        var inputGroup = selection(parent)
                .append('div').classed('input-group input-group-sm pull-right', true);

        inputGroup.append('input').attr('type', 'text').attr('placeholder', 'gene symbol').classed('form-control', true);
        inputGroup.append('span').classed('input-group-btn', true)
                .append('button').attr('type', 'button').classed('btn btn-default', true)
                .on('click', function() {
            var searchWord = d3.select(this.parentNode.parentNode).select('input').property('value');
            o_table.searchWord(searchWord);
            o_table.pageNumber(1);
            o_table.redraw();
        })
                .append('span').classed('glyphicon glyphicon-search', true)
                ;

    }


    function tableCopyButton(parent, o_table) {
        var CLASS_BUTTON = 'clip_button';
        var root = o_table.root();
        
        selection(parent).append('span')
                .classed('glyphicon glyphicon-floppy-disk', true)
                .classed(CLASS_BUTTON, true)
                .attr('data-toggle', 'tooltip')
                .attr('data-placement', 'top')
                .attr('title', 'Copy to Clipboard')
                //.classed('btn btn-info btn-xs', true)                  
                .classed('pull-right', true)    //align right
                ;
                
        var client = new ZeroClipboard($(parent + ' .' + CLASS_BUTTON));
        
        client.on('copy', function(event) {
            var tableText = '';
            //column name
            var dt = root.selectAll('thead th');
            dt.forEach(function(d) {
                d.forEach(function(dd) {
                    tableText += dd.innerText + '\t';
                });
            });
            tableText = tableText.trim();
            //row contents
            dt = root.selectAll('tbody .dc-table-row');
            dt.each(function(d) {
                tableText += '\n';
                d3.select(this).selectAll('td').forEach(function(d) {
                    d.forEach(function(dd, ii) {
                        tableText += ii === 0 ? dd.innerText : '\t' + dd.innerText;
                    });
                });
            });
            event.clipboardData.setData('text/plain', tableText);
        });
        
        //action after copy
        client.on('aftercopy', function(event) {
            $(parent + ' .' + CLASS_BUTTON)
                    .attr('data-original-title', 'Done!')
                    .tooltip('show')
                    .attr('data-original-title', 'Copy to Clipboard');
        });
        
        client.on('error', function(event) {
            ZeroClipboard.destroy();
        });
        
        $(parent + ' .' + CLASS_BUTTON).on('mouseenter', function() {
            $(this).tooltip('show');
        }).on('mouseleave', function() {
            $(this).tooltip('hide');
        }).tooltip({
            trigger: 'manual',
            container: 'body'
        });
    }


    function DPChart(parent, dataID, maxDP) {
        var MAX_DP = maxDP || 100;
        var n_indexDP = getFieldName(dataID).indexOf('DP');
        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            var _n = repValue(d[n_indexDP]);
            return  _n > MAX_DP ? MAX_DP : _n;
        });


        var o_group = o_dimension.group(function(d) {
            return d;
        });

        MAX_DP = Math.min(MAX_DP, o_group.all().slice(-1)[0]['key']);

        var chart = dc.barChart(parent)
                .dimension(o_dimension)
                .group(o_group)
                .x(d3.scale.linear().domain([0, MAX_DP]))
                .xAxisLabel('DP')
                .yAxisLabel('COUNT(n)')
                .filterHandler(function(dimension, filters) {
            if (filters.length === 0)
                dimension.filter(null);
            else {

                var filter = filters[0];
                for (var i = 0; i < filter.length; i++) {
                    filter[i] = Math.floor(filter[i]);
                }
                filter[1] = filter[1] === MAX_DP ? MAX_DP + 0.1 : filter[1];
                dimension.filter(filter);
            }
            return filters;
        })
                ;
        return chart;
    }


    function qualChart(parent, dataID, maxQual) {
        var MAX_QUAL = maxQual || 100;
        var n_indexQUAL = getFieldName(dataID).indexOf('QUAL');

        var o_dimension = getCrossfilter(dataID).dimension(function(d) {
            var _n = repValue(d[n_indexQUAL]);
            return _n > MAX_QUAL ? MAX_QUAL : _n;
        });
        var o_group = o_dimension.group(function(d) {
            return Math.floor(d);
        });

        MAX_QUAL = Math.min(MAX_QUAL, o_group.all().slice(-1)[0]['key']);



        var chart = dc.barChart(parent)
                .dimension(o_dimension)
                .group(o_group)
                .x(d3.scale.linear().domain([0, MAX_QUAL]))
                .xAxisLabel('QUAL')
                .yAxisLabel('COUNT(n)')
                //handle filter        
                .filterHandler(function(dimension, filters) {
            if (filters.length === 0)
                dimension.filter(null);
            else {
                var filter = filters[0];
                for (var i = 0; i < filter.length; i++) {
                    filter[i] = Math.floor(filter[i]);
                }
                filter[1] = filter[1] === MAX_QUAL ? MAX_QUAL + 0.1 : filter[1];
                dimension.filter(filter);
            }
            return filters;
        });
        return chart;
    }




    function setNumberDisplay(o_chart) {
        var _timeOut;
        o_chart.on("filtered", function() {

            if (_timeOut) {
                clearTimeout(_timeOut);
            }

            d3.select('#numberDisplay').classed('hidden', false);
            _timeOut = setTimeout(function() {
                d3.select('#numberDisplay').classed('hidden', true);
            }, 1000);
        });
        return o_chart;
    }


    function setPieChartOptions(chart) {
        chart
                //.width(200) // (optional) define chart width, :default = 200
                .height(150)
                .transitionDuration(500) // (optional) define chart transition duration, :default = 350    
                //.colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])    
                //.colorDomain([-1750, 1644])    
                //.colorAccessor(function(d, i){return d.value;})
                .radius(70) // define pie radius    
                .innerRadius(30)
                //.label(function(d) { return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)"; })    
                .renderLabel(true)
                .title(function(d) {
            return '#Variants: ' + d.value;
        })
                .renderTitle(true);
        return chart;
    }

    function setTableOptions(table) {
        table
                .displayGroup(false)    //display group-rows
                .size(50)  //max rows to be shown(or Infinity)
                .order(d3.ascending);
    }


    function setBarChartOptions(chart) {

        chart
                .centerBar(true)
                .elasticY(true)
                .elasticX(false) //if false, 0 tick is shown in DP chart
                //.width(350)
                //.height(200)
                //.gap(0)
                //.renderHorizontalGridLines(true)                  
                //.height(200)                
                .margins({top: 10, right: 40, bottom: 45, left: 60})
                .yAxis().tickFormat(d3.format("s"))
                ;
        setNumberDisplay(chart);
        return chart;
    }

    function setAutoResizeSVG(chart) {
        chart.svg()
                .attr('viewBox', "0 0 " + chart.svg().attr('width') + ' ' + chart.svg().attr('height'))
                .attr('perserveAspectRatio', 'xMinYMid');

        return chart;
    }


    /**
     * add '.filter_display' in '.box_header'
     * @param {object} chart - box_headered chart
     * @returns {_L1.setFilterDisplay.chart}
     */
    function setFilterDisplay(chart) {
        var parent = d3.select(chart.root().node().parentNode).select('.box_header');

        //if no title header
        if (!parent.node()) {
            parent = chart.root();
        }

        parent
                .append('button').classed('close filter_display', true).style('display', 'none')
                .on('click', function() {
            chart.filterAll();
            dc.renderAll();
        })
                .append('span').classed('small', true);
        ;

//set filter_display event
        chart.turnOnControls = function() {
            var filter = this.filter();
            d3.select(this.root().node().parentNode)
                    .selectAll(".filter_display").style("display", 'inline')
                    .select('span').text(filterPrintFormat(filter));
            return this;
        };
        chart.turnOffControls = function() {
            d3.select(this.root().node().parentNode)
                    .selectAll(".filter_display")
                    .style("display", "none");
            return this;
        };
        return chart;
    }

    function filterPrintFormat(filter) {
        if (typeof filter[1] !== 'number')
            return 'reset';
        return d3.round(filter[0]) + " -> " + d3.round(filter[1]);
    }



    function dataTable(parent, chartGroup) {
        var LABEL_CSS_CLASS = "dc-table-label";
        var ROW_CSS_CLASS = "dc-table-row";
        var COLUMN_CSS_CLASS = "dc-table-column";
        var GROUP_CSS_CLASS = "dc-table-group";
        var _chart = dc.baseMixin({});

        var _size = 25;
        var _pageNumber = 1;
        var _dataID = null;
        var _columns = [];
        var _colNames = [];
        var _sortBy = function(d) {
            return d;
        };
        var _order = d3.ascending;
        var _displayGroup = true;

        var _searchWord;
        var _entries = [];

        _chart._doRender = function() {
            _chart.selectAll("tbody").remove();
            _chart.selectAll('nav').remove();

            renderRows(renderGroups());
            pagination();

            return _chart;
        };

        function renderGroups() {
            var groups = _chart.root().selectAll("tbody")
                    .data(nestEntries(), function(d) {
                return _chart.keyAccessor()(d);
            });
            var rowGroup = groups
                    .enter()
                    .append("tbody");

            if (_displayGroup) {
                rowGroup
                        .append("tr")
                        .attr("class", GROUP_CSS_CLASS)
                        .append("td")
                        .attr("class", LABEL_CSS_CLASS)
                        .attr("colspan", _columns.length)
                        .html(function(d) {
                    return _chart.keyAccessor()(d);
                });
                groups.exit().remove();
            }
            return rowGroup;
        }

        function nestEntries() {

            /*
             var entries = [];
             
             if (_searchWord) {
             var searchWord = _searchWord.toUpperCase();
             var indexOfGene = getFieldName(_dataID).indexOf('GENE');
             
             var a_data = _order === d3.ascending ? _chart.dimension().bottom('Infinity') : _chart.dimension().top('Infinity');
             
             a_data.every(function(a_row) {
             a_row[indexOfGene].toUpperCase().indexOf(searchWord) > -1 ? entries.push(a_row) : null;
             
             return entries.length < _size ? true : false;
             });
             
             } else {
             entries = _order === d3.ascending ? _chart.dimension().bottom(_size) : _chart.dimension().top(_size);
             }
             
             return d3.nest()
             .key(_chart.group())
             .sortKeys(_order)
             .entries(_entries.sort(function(a, b) {
             return _order(_sortBy(a), _sortBy(b));
             }));
             */


            var a_data = _order === d3.ascending ? _chart.dimension().bottom('Infinity') : _chart.dimension().top('Infinity');

            if (_searchWord) {
                var searchWord = _searchWord.toUpperCase();
                var indexOfGene = getFieldName(_dataID).indexOf('GENE');

                _entries = [];

                a_data.forEach(function(a_row) {
                    a_row[indexOfGene].toUpperCase().indexOf(searchWord) > -1 ? _entries.push(a_row) : null;
                });


            } else {
                _entries = a_data;
            }



            return d3.nest()
                    .key(_chart.group())
                    .sortKeys(_order)
                    .entries(_entries.slice(_size * (_pageNumber - 1), _size * _pageNumber).sort(function(a, b) {
                return _order(_sortBy(a), _sortBy(b));
            }));
        }

        function renderRows(groups) {
            var rows = groups.order()
                    .selectAll("tr." + ROW_CSS_CLASS)
                    .data(function(d) {
                return d.values;
            });
            var f_cellWidth = cellWidthFunc(_colNames);
            var rowEnter = rows.enter()
                    .append("tr")
                    .attr("class", ROW_CSS_CLASS);

            _columns.forEach(function(f, i) {
                rowEnter.append("td")
                        .attr("class", COLUMN_CSS_CLASS + " _" + i)
                        //.style('width', 100 / _columns.length + '%') //added
                        .style('width', f_cellWidth(_colNames[i]))
                        .html(f);
            });

            rows.exit().remove();

            return rows;
        }


        function pagination() {

            var n_pageNaviRange = 3;

            var nav = selection(parent).append('nav').classed('text-center', true);
            var ul = nav.append('ul').classed('pagination pagination-sm', true);

            var n_lastPagesNumber = Math.ceil(_entries.length / _size);

            //previous
            d3.range(Math.max(1, _pageNumber - n_pageNaviRange), _pageNumber).forEach(function(d) {
                ul.append('li')
                        .on('click', paginationClick(d))
                        .append('span')
                        .text(d);

            });

            ul.append('li').classed('active', true)
                    .on('click', paginationClick(_pageNumber))
                    .append('span')
                    .text(_pageNumber);

            //next
            d3.range(_pageNumber + 1, Math.min(n_lastPagesNumber + 1, _pageNumber + n_pageNaviRange + 1)).forEach(function(d) {
                ul.append('li')
                        .on('click', paginationClick(d))
                        .append('span')
                        .text(d);

            });

           
            ul.insert('li', ':first-child')
                    .on('click', function() {
                _chart.pageNumber(1);
                _chart.redraw();
            })
                    .append('span').html('&laquo;');

            ul.append('li')
                    .on('click', function() {
                _chart.pageNumber(n_lastPagesNumber);
                _chart.redraw();
            })
                    .append('span').html('&raquo;');

            function paginationClick(d) {
                return function() {
                    _chart.pageNumber(d);
                    _chart.redraw();
                };
            }

        }

        _chart._doRedraw = function() {
            return _chart._doRender();
        };

        _chart.size = function(s) {
            if (!arguments.length)
                return _size;
            _size = s;
            return _chart;
        };
        _chart.displayGroup = function(_) {
            if (!arguments.length)
                return _displayGroup;
            _displayGroup = _;
            return _chart;
        };
        /*
         _chart.columns = function(_) {
         if (!arguments.length)
         return _columns;
         _columns = _;
         return _chart;
         };
         */
        _chart.colNames = function(_) {
            if (!arguments.length)
                return _colNames;
            _colNames = _;
            if (_dataID) {
                _columns = columnFormat(_colNames, _dataID);
            }
            return _chart;
        };
        _chart.dataID = function(_) {
            if (!arguments.length)
                return _dataID;
            _dataID = _;
            if (_colNames.length) {
                _columns = columnFormat(_colNames, _dataID);
            }
            return _chart;
        };

        _chart.pageNumber = function(_) {
            if (!arguments.length)
                return _pageNumber;
            _pageNumber = _;

            return _chart;
        };

        _chart.searchWord = function(_) {
            if (!arguments.length)
                return _searchWord;
            _searchWord = _;

            return _chart;
        };

        _chart.sortBy = function(_) {
            if (!arguments.length)
                return _sortBy;
            _sortBy = _;
            return _chart;
        };
        _chart.order = function(_) {
            if (!arguments.length)
                return _order;
            _order = _;
            return _chart;
        };
        /*
         _chart.options = function(_) {
         var o_options = {};
         if (!arguments.length) {
         o_options.size = _chart.size();
         return o_options;
         }
         
         'size' in _ ? _chart.size(_.size) : null;
         'colNames' in _ ? _chart.colNames(_.colNames) : null;
         
         return _chart;
         };
         */

        return _chart.anchor(parent, chartGroup);
    }


    var _filters = [];


    function filterResetAll() {
        var charts = dc.chartRegistry.list();

        for (var i = 0; i < charts.length; ++i) {


            charts[i].filterAll();
            // charts[i].expireCache();
        }
    }

    function chartResetAll() {
        _filters = [];

        var charts = dc.chartRegistry.list();

        for (var i = 0; i < charts.length; ++i) {

            var filter = charts[i].filters();
            if (filter.length && Array.isArray(filter[0]) && filter[0]) {
                filter = filter[0];
            }

            _filters.push(filter);

            if (charts[i].dimension()) {
                charts[i].dimension().dispose();
            }
            charts[i].filterAll();
            // charts[i].expireCache();
        }

        dc.chartRegistry.clear();
    }

    function chartApplyAllFilters() {
        if (!_filters.length)
            return;
      
        var charts = dc.chartRegistry.list();

        for (var i = 0; i < charts.length; ++i) {
            _filters[i].length && charts[i].filter(_filters[i]) && charts[i].render();

        }

        //dc.redrawAll();
    }



    function isMergedData(dataID) {
        if (getSamplesName(dataID).length > 1) {
            return true;
        } else {
            return false;
        }
    }

    function dataLength() {
        var _ = 0;
        for (var x in _data) {
            _++;
        }

        return _;
    }



    function getSamplesName(dataID) {
        return getData(dataID)[0];
    }
    function getFieldName(dataID) {
        return getData(dataID)[1];
    }
    function getCrossfilter(dataID) {
        return getData(dataID)[2];
    }

    function getData(dataID) {
        if (_data[dataID]) {
            return _data[dataID];
        } else {
            console.log('no exist dataID: [' + dataID + ']');
        }

    }


    function removeData(dataID) {
        delete _data[dataID];
        return dataLength();
    }

    function removeAllData() {
        _data = {_TEMP: []};
        return dataLength();
    }

    function hasData(s_dataID) {
        return _data[s_dataID] ? true : false;
    }


    /**
     * 
     * @param {String} dataID
     * @param {Object} json
     * @returns {Array} 
     */
    function addData(dataID, json) {

        if (hasData()) {
            console.log('overwriting data: ' + dataID);
        }
        if (!json['SAMPLE']) {
            console.log('undefined property: json[SAMPLE]');
            return undefined;
        }
        if (!json['FIELD_NAME']) {
            console.log('undefined property: json[FIELD_NAME]');
            return undefined;
        }
        if (!json['VAR']) {
            console.log('undefined property: json[VAR]');
            return undefined;
        }

        _data[dataID] = [json['SAMPLE'], json['FIELD_NAME'], crossfilter(json['VAR'])];
        return _data[dataID];
    }






    function panel(parent, title) {
        var o_root = selection(parent);
        o_root.selectAll('div').remove();
        var o_box = o_root.append('div').classed('panel panel-default', true);
        if (title !== null) {
            o_box.append('div').classed('panel-heading', true)
                    .append('h4').classed('panel-title', true).style('display', 'inline').text(title);
        }

        return o_box.append('div').classed('panel-body', true);
    }

    function box(parent, title) {
        var o_root = selection(parent);
        o_root.selectAll('div').remove();
        if (title !== undefined) {
            o_root.append('div').classed('page-header box_header', true)
                    .append('h4').style('display', 'inline').text(title);
        }

        return o_root.append('div').classed('box_body', true);
    }



    function repValue(_) {
        if (Array.isArray(_)) {
            if (typeof _[0] === 'number') {
                return d3.round(d3.mean(_), 1);
                //return _;
            } else {  // 'string'
                return _;
            }

        } else {
            return _;
        }
    }


    function selection(_) {
        if (_ instanceof d3.selection) {
            return _;
        } else if (typeof _ === 'string') {
            return d3.select(_);
        } else {
            throw new Error('Unknown selector');
        }
    }



    exports.VCF = VCF;
}(typeof exports !== 'undefined' && exports || this);
