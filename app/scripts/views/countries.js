/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

var blue = '#006Da1',
    green = '#3a3',
    red = 'maroon',
    orange = '#a61',
    purple = '#63b',
    brown = '#321';

  Mi.Views.Countries = Backbone.View.extend({

    template: JST['app/scripts/templates/countries.ejs'],

    el: '#content',

    initialize: function (options) {
      this.year = options.year;
      this.type = options.type;
      this.region = options.region;
      this.data = options.data;
      this.extraData = options.extraData // not filtered by type

      this.processData();
      this.render();
    },

    render: function () {

      var _self = this;

      if (!(this.region)) {
        this.region = 'Global';
      }

      $('.region-value').text(this.capitalizeFirstLetter(this.region));
      $('.type-value').text(this.capitalizeFirstLetter(this.type.replace(/-/g, ' ')));
      if (this.year === 'all') {
        $('.year-value').text('Most recent value');
      } else {
        $('.year-value').text(this.year);
      }

      this.setView(this.region);
      this.drawLegend();

      // share links
      $('#twitter-share-btn').attr('href', 'https://twitter.com/home?status=' + window.location.href);
      $('#facebook-share-btn').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
      $('#linkedin-share-btn').attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href);

      // render template
      this.$el.html(this.template({
        data: this.data,
        numberWithCommas: this.numberWithCommas,
        type: this.type,
        region: this.region,
        year: this.year,
        aggregate: this.aggregate
      }));

      // draw map and charts
      this.resetMapStyle();
      _.each(this.aggregate.graphs, function (graph) {
        _self.drawLineChart('#chart-' + graph.type, graph.chartData, _self.aggregate.years, graph.name, graph.type, true);
      });
      //this.drawLineChart('#aggregate-growth-chart', this.aggregate.graph, this.aggregate.years, this.aggregate.name);
      _.each(this.data, function(value) {

        Mi.countryGeo.eachLayer(function(layer){
          if (value.iso === layer.feature.properties.iso_a3) {
            var color = _self.getColor(value.mainValue, _self.type);
            layer.setStyle({
              fillColor: color,
              fillOpacity: (value.mainValue) ? 0.8 : 0.3
            });
            // make the countries with data clickable
            if (layer._path) {
              layer._path.setAttribute('class','leaflet-clickable');
            } else {
              _.each(layer._layers, function (l) {
                l._path.setAttribute('class','leaflet-clickable');
              });
            }

            var markup = '<div class="inner"><span class="country-name">' + value.country +
            '</span><span class="year"> (' + value.filterYear + ')</span><br>' +
            '<span class="popup-value">' + _self.capitalizeFirstLetter(_self.type.replace(/-/g, ' ')) + ': ' + value.mainValue + '%</span><br>' +
                         '<a href="#country/' + value.iso +'">View profile</a></div>';
            layer.bindPopup(markup, { autoPan: true });
          }
        });


        if (value.mainValue > 0) {

          var chartData = [];
          var yearLabels = [];
          _.each(value.timeseries, function(year) {
            if (year.value != 0) {
             chartData.push(year.value);
             yearLabels.push(year.year);
            }
          });

          _self.drawLineChart('#' + value.iso + '-chart', chartData, yearLabels, value.name);

        }

       });

       $('#map').animate({height: '450px'});
       $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});

    },

    capitalizeFirstLetter: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    drawLineChart: function(selector, data, categories, name, type, agg) {

      var _self = this;
      var typeUsed = type || this.type;
      var color = _self.getColor(2, typeUsed).hex();

      $(selector).highcharts({
        chart: {
          plotBorderColor: '#fff',
          style: {
            fontFamily: "'Abel', sans-serif",
          }
        },
        title: { text: '', x: -20 /*center*/},
        subtitle: { text: '', x: -20 },
        xAxis: {
          categories: categories,
          labels: {
            enabled: true,
            style: { color: '#aaa'}
          }
        },
        yAxis: {
          allowDecimals: (!!agg),
          min: 0,
          title: { text: '' },
          labels: {
            x: -8,
            enabled: true,
            style: { color: '#aaa'}
          },
          gridLineColor: '#fff',
          tickWidth: 1,
          tickLength: 5
        },
        credits: { enabled: false },
        tooltip: { valueSuffix: '%' },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle',
          borderWidth: 0,
          enabled: false
        },
        series: [{
          color: color,
          name: 'Ratio',
          data: data
        }]
      });

    },

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    capitalizeFirstLetter: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    processData: function () {
      var _self = this;
      this.metaData = _.groupBy(Mi.data, 'country');

      // data handling
      _.each(this.data, function(d){
        d.crudeCoverage = 0;
        d.crudeCoverageType = (_self.type === 'all') ? 'total-microinsurance-coverage' : _self.type.slice(0, -6);
        _.each(_self.metaData[d.country], function(indicator) {
          // get main value, population, and non-ratio values
          // from either the most recent or selected year
          if (_self.year === 'all') {
            d.filterYear = d.mostRecent.year;
            d.mainValue = d.mostRecent.value;
            if (indicator.varName === 'population-(total)') {
              d.population = indicator.mostRecent.value;
            } else if (indicator.varName === d.crudeCoverageType) {
              d.crudeCoverage = indicator.mostRecent.value;
            }
          } else {
            d.filterYear = _self.year;
            _.each(d.timeseries, function(year) {
              if (parseFloat(_self.year) === year.year) {
                d.mainValue = year.value;
              }
            });
            if (indicator.varName === 'population-(total)') {
              _.each(indicator.timeseries, function(year) {
                if (year.year === parseFloat(_self.year)) {
                  d.population = year.value;
                }
              });
            } else if (indicator.varName === d.crudeCoverageType) {
              _.each(indicator.timeseries, function(year) {
                if (year.year === parseFloat(_self.year)) {
                  d.crudeCoverage = year.value;
                }
              });
            }
          }
        });
      });

      this.data.sort(function (a,b) { return b.mainValue - a.mainValue; });

      // aggregate ratios desired
      var ratios = ['total-microinsurance-coverage-ratio',
        'credit-life-coverage-ratio','health-coverage-ratio',
        'accident-coverage-ratio','property-coverage-ratio',
        'agriculture-coverage-ratio'];
      // years available
      var yearLabels = [];
      // calculate regional aggregated population by year
      var sumPopulation;
      _.pluck(_self.extraData.filter(function(f) {
        return f.varName === 'population-(total)';
      }), 'timeseries').forEach(function(d) {
        if (!sumPopulation) {
          sumPopulation = _.pluck(d, 'value');
        } else {
          d.forEach(function (t, i) {
            sumPopulation[i] = Number(sumPopulation[i]) + Number(t.value);
          });
        }
      });
      var graphs = ratios.map(function (ratio) {
        var mainValue, crudeCoverage;
        // grab the data for just this ratio (but the absolute/crude numbers)
        var filtered = _self.extraData.filter(function(f) {
          return f.varName === ratio.slice(0, -6);
        });
        // get a timeseries of crude value
        var timeseries = [];
        filtered.forEach(function(d) {
          if (!timeseries.length) {
            timeseries = _.cloneDeep(d.timeseries);
          } else {
            d.timeseries.forEach(function (t, i) {
              timeseries[i].value = Number(timeseries[i].value) + Number(t.value);
            });
          }
        });
        var chartData = [];
        var popYear = [];
        _.each(timeseries, function(year, index) {
           if (sumPopulation[index]) {
             chartData.push(Number((year.value / sumPopulation[index] * 100).toFixed(2)));
             popYear.push(sumPopulation[index]);
           } else {
             chartData.push(0);
             popYear.push(0);
           }
           yearLabels.push(year.year);
           if (year.year === parseFloat(_self.year)) {
             mainValue = Number((year.value / sumPopulation[index] * 100).toFixed(2));
             crudeCoverage = year.value.toFixed(0);
           }
        });
        return {
          type: ratio,
          chartData: chartData,
          name: filtered[0].name,
          mainValue: mainValue,
          crudeCoverage: crudeCoverage,
          popYear: popYear
        }
      });
      yearLabels = _.unique(yearLabels);
      yearLabels.sort(function (a,b) { return a - b; });
      // get rid of years and values where everything is zero
      var zeroArray = new Array(graphs[0].chartData.length);
      graphs.forEach(function(d) {
        d.chartData.forEach(function(cd, i) {
          zeroArray[i] = !zeroArray[i] ? 0 : zeroArray[i];
          zeroArray[i] += cd;
        });
      });
      // do this backwards so we keep the indicies in order
      zeroArray.reverse();
      var l = zeroArray.length;
      zeroArray.forEach(function (d, i) {
        if (d === 0) {
          yearLabels.splice(l - i - 1, 1);
          graphs.forEach(function(g) {
            g.chartData.splice(l - i - 1, 1);
            g.popYear.splice(l - i - 1, 1)
          });
        }
      });
      // for "most recent" grab certain values now
      if (this.year === 'all') {
        graphs.forEach(function (g) {
          g.mainValue = g.chartData[g.chartData.length - 1];
          g.crudeCoverage = (g.chartData[g.chartData.length - 1] *
            g.popYear[g.popYear.length - 1] / 100).toFixed(0);
        });
      }

      this.aggregate = {
        graphs: graphs,
        years: yearLabels//,
        //regionStats:
      };
    },

    setView: function (region) {
      switch (region) {
        case 'Africa':
          Mi.map.setView([4.43, 28.83], 3);
          break;
        case 'Americas':
          Mi.map.setView([2.20, -77.26], 3);
          break;
        case 'Asia':
          Mi.map.setView([26.98, 87.10], 3);
          break;
        case 'Oceania':
          Mi.map.setView([-7.36, 162.60], 3);
          break;
        default:
          Mi.map.setView([20, 0], 2);
      }
    },

    drawLegend: function () {
      var _self = this;

      d3.select('.legend').select('*').remove();

      var margin = {top: 20, right: 10, bottom: 10, left: 10};

      var width = d3.select('.legend').style('width').replace('px','') - margin.left - margin.right,
          height = d3.select('.legend').style('height').replace('px','') - margin.top - margin.bottom;

      var svg = d3.select('.legend').append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      var data = [0, 0.1, 1, 2, 3];

      svg.selectAll('color')
        .data(data)
        .enter()
        .append('rect')
        .attr('fill', function(d) { return _self.getColor(d, _self.type); })
        .attr('opacity', function(d) { return d ? 0.8 : 0.4; })
        .attr('width', width / data.length)
        .attr('height', height)
        .attr('y',0)
        .attr('x', function(d,i) { return i * width / data.length});

     svg.selectAll('label')
       .data(data)
       .enter()
       .append('text')
       .attr('class','label')
       .attr('dy', -5)
       .attr('x', function(d,i) { return (i + 0.5) * width / data.length; })
       .attr('text-anchor','middle')
       .text(function(d, i) {
         if (d === 0) { return '0%'; }
         return Math.floor(data[i]) +
         ((data[i+1]) ? ' - ' + data[i+1] + '%' : '%+');
       });
    },

    typeToColor: function (type) {
      switch (type) {
        case 'total-microinsurance-coverage-ratio':
          return blue;
          break;
        case 'credit-life-coverage-ratio':
          return red;
          break;
        case 'health-coverage-ratio':
          return green;
          break;
        case 'accident-coverage-ratio':
          return orange;
          break;
        case 'property-coverage-ratio':
          return brown;
          break;
        case 'agriculture-coverage-ratio':
          return purple;
          break;
      }
    },

    getColor: function (value, type) {
      var palette = ['white', this.typeToColor(type)];
      var scale = chroma.scale(palette)
        .mode('hsl')
        .domain([-1, 0, 1, 2, 3, 4]);
      return (value === 0) ? '#ddd' : scale(Math.floor(Math.min(value, 3)));
    },

    resetMapStyle: function () {
      Mi.countryGeo.eachLayer(function(layer){
        layer.setStyle({
          color: 'white',
          weight: 1,
          fillColor: 'url(#hash)',
          fillOpacity: 1
        });
        // hack until https://github.com/Leaflet/Leaflet/issues/2662
        // is resolved
        d3.selectAll('.leaflet-overlay-pane path').classed('no-data', true);
      });
    }
  });

})();
