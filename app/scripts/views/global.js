/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

  Mi.Views.Global = Mi.Views.Base.extend({

    template: JST['app/scripts/templates/global.ejs'],

    initialize: function (options) {
      this.year = options.year;
      this.type = options.type;
      this.region = 'global';
      this.data = options.data;
      this.graphData = options.graphData;

      this.processData();
      this.render();
    },

    events: {
      'click .region-nav': 'regionNav'
    },

    render: function () {

      var _self = this;

      $('.region-value').text('Global');
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
        numberWithCommas: this.numberWithCommas,
        type: this.type,
        region: this.region,
        year: this.year,
        regions: this.regions,
        name: this.data[0].name
      }));

      // draw map and charts
      this.resetMapStyle();
      _.each(this.regions, function (region, key) {
        _self.drawLineChart('#' + key + '-chart',
          _.pluck(region.chartData,'value'), _.pluck(region.chartData,'year'),
          _self.data[0].name, _self.type, true, Math.round(_self.globalMax / 5) * 5);
      });

      _.each(this.data, function(value) {
        _self.updateMap(value);
      });

      $('#map').animate({height: '450px'});
      $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});

    },

    processData: function () {
      var _self = this;

      // data handling (for the map only)
      _.each(this.data, function(d){
        // set our year and get the correct value for the map
        d.mainValue = _self.getFromTimeseries(d.timeseries, _self.year);
        d.filterYear = _self.getFromTimeseries(d.timeseries, _self.year, 'year');
      });

      var regions = {
        'americas': {},
        'africa': {},
        'asia': {}
      };
      _.each(regions, function (r, key) {
        // years available
        var yearLabels = [];

        // calculate regional aggregated population by year
        var populationArray = _.pluck(_self.graphData.population.filter(function (f) {
          return _self.regionMatch(f.region, key);
        }), 'timeseries');
        var sumPopulation = _self.aggregateTimeseries(populationArray);
        r.sumPopulation = sumPopulation;

        var crudeArray = _.pluck(_self.graphData.crudeCoverage.filter(function (f) {
          return _self.regionMatch(f.region, key);
        }), 'timeseries')
        // get a timeseries of crude value
        var sumCrude = _self.aggregateTimeseries(crudeArray);

        // calculate data for charts
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

        r.chartData = chartData.filter(function(f) { return !!f; });
        r.mainValue = mainValue,
        r.crudeCoverage = crudeCoverage;
        r.year = year;
      });

      this.regions = regions;
      this.globalMax = d3.max(_.flatten(_.map(regions, function (m) {
        return _.map(m.chartData, function (c) {
          return c.value;
        });
      })));
    }
  });

})();
