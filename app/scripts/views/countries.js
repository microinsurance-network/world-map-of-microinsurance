/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

  Mi.Views.Countries = Mi.Views.Base.extend({

    template: JST['app/scripts/templates/countries.ejs'],

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
        this.region = 'global';
      }

      $('.region-value').text(Mi.regions[this.region]);
      $('.type-value').text(this.capitalizeFirstLetter(this.type.replace(/-/g, ' ')));
      if (this.year === 'all') {
        $('.year-value').text('Most recent value');
      } else {
        $('.year-value').text(this.year);
      }

      this.setView(this.region);
      this.drawLegend();

      // render template
      this.$el.html(this.template({
        data: this.data,
        numberWithCommas: this.numberWithCommas,
        type: this.type,
        region: Mi.regions[this.region],
        aggregate: this.aggregate
      }));

      // draw map and charts
      this.resetMapStyle();
      _.each(this.aggregate.graphs, function (graph) {
        _self.drawLineChart('#chart-' + graph.type,
          _.pluck(graph.chartData,'value'), _.pluck(graph.chartData,'year'),
          graph.name, graph.type, true);
      });

      _.each(this.data, function(value) {
        _self.updateMap(value);

        if (value.mainValue !== '') {
          var chartData = [];
          var yearLabels = [];
          _.each(value.timeseries, function(year) {
            if (year.value !== '') {
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

    processData: function () {
      var _self = this;

      // data handling
      _.each(this.data, function(d){
        d.crudeCoverageType = _self.type.slice(0, -6);
        var crudeObject = Mi.doubledGrouped[d.country][d.crudeCoverageType][0];
        // set our year and get the most recent value for the
        // map and main display ratio
        d.mainValue = _self.getFromTimeseries(d.timeseries, _self.year);
        d.crudeCoverage = _self.getFromTimeseries(crudeObject.timeseries, _self.year);
        d.filterYear = _self.getFromTimeseries(d.timeseries, _self.year, 'year');
      });
      this.data.sort(function (a,b) { return b.mainValue - a.mainValue; });

      // aggregate ratios desired
      var ratios = ['total-microinsurance-coverage-ratio',
        'credit-life-coverage-ratio','health-coverage-ratio',
        'accident-coverage-ratio','property-coverage-ratio',
        'agriculture-coverage-ratio'];

      // calculate regional aggregated population by year
      var populationArray = _.pluck(_self.extraData.filter(function(f) {
        return f.varName === 'population-(total)';
      }), 'timeseries');
      var sumPopulation = _self.aggregateTimeseries(populationArray);

      var graphs = ratios.map(function (ratio) {
        // grab the data for just this ratio (but the absolute/crude numbers)
        var crudeArray = _.pluck(_self.extraData.filter(function(f) {
          return f.varName === ratio.slice(0, -6);
        }), 'timeseries');
        // get a timeseries of crude value
        var sumCrude = _self.aggregateTimeseries(crudeArray);

        var chartData = sumCrude.map(function (m, i) {
          if (sumPopulation[i].value && m.value) {
            return {
              year: m.year,
              value: Number((m.value / sumPopulation[i].value * 100).toFixed(2))
            };
          } else {
            // do this to keep the same array size, filter out later
            return false
          }
        });

        var mainValue = _self.getFromTimeseries(chartData, _self.year);
        var crudeCoverage = _self.getFromTimeseries(sumCrude, _self.year, false, true);
        var year = _self.getFromTimeseries(chartData, _self.year, 'year');

        return {
          type: ratio,
          chartData: chartData.filter(function(f) { return !!f; }),
          name: Mi.nameObject[ratio.slice(0, -6)],
          mainValue: mainValue,
          crudeCoverage: crudeCoverage,
          year: year
        }
      });

      // sort graphs by main value
      graphs.sort(function(a,b){ return b.mainValue - a.mainValue; })

      this.aggregate = {
        graphs: graphs
      };
    }

  });

})();
