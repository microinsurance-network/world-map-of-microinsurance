/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

  Mi.Views.Global = Mi.Views.Base.extend({

    template: JST['app/scripts/templates/global.ejs'],

    initialize: function (options) {
      this.year = options.year;
      this.type = options.type;
      this.region = 'Global';
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
        _self.drawLineChart('#' + key + '-chart', region.chartData, region.yearLabels, _self.data[0].name, _self.type, true);
      });

      _.each(this.data, function(value) {
        _self.updateMap(value);
      });

      $('#map').animate({height: '450px'});
      $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});

    },

    processData: function () {
      var _self = this;

      // for the map
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

      var regions = {
        'americas': {},
        'africa': {},
        'asia': {}
      };
      _.each(regions, function (r, key) {
        // years available
        var yearLabels = [];
        // calculate regional aggregated population by year
        var sumPopulation = false;
        _.pluck(_self.graphData.population.filter(function (f) {
          return _self.regionMatch(f.region, key);
        }), 'timeseries').forEach(function(d) {
          if (!sumPopulation) {
            sumPopulation = _.pluck(d, 'value');
          } else {
            d.forEach(function (t, i) {
              sumPopulation[i] = Number(sumPopulation[i]) + Number(t.value);
            });
          }
        });
        r.sumPopulation = sumPopulation;

        // get a timeseries of crude value
        var timeseries = [];
        _.pluck(_self.graphData.crudeCoverage.filter(function (f) {
          return _self.regionMatch(f.region, key);
        }), 'timeseries').forEach(function(d) {
          if (!timeseries.length) {
            timeseries = _.cloneDeep(d);
          } else {
            d.forEach(function (t, i) {
              timeseries[i].value = Number(timeseries[i].value) + Number(t.value);
            });
          }
        });

        // calculate data for charts
        var mainValue, crudeCoverage;
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

        yearLabels = _.unique(yearLabels);
        yearLabels.sort(function (a,b) { return a - b; });

        // get rid of years and values where everything is zero
        var zeroArray = new Array(chartData.length);
        chartData.forEach(function(cd, i) {
          zeroArray[i] = !zeroArray[i] ? 0 : zeroArray[i];
          zeroArray[i] += cd;
        });
        // do this backwards so we keep the indicies in order
        zeroArray.reverse();
        var l = zeroArray.length;
        zeroArray.forEach(function (d, i) {
          if (d === 0) {
            yearLabels.splice(l - i - 1, 1);
            chartData.splice(l - i - 1, 1);
            popYear.splice(l - i - 1, 1);
          }
        });
        // for "most recent" grab certain values now
        if (_self.year === 'all') {
          mainValue = chartData[chartData.length - 1];
          crudeCoverage = (chartData[chartData.length - 1] *
              popYear[popYear.length - 1] / 100).toFixed(0);
        }

        r.chartData = chartData;
        r.mainValue = mainValue,
        r.crudeCoverage = crudeCoverage;
        r.popYear = popYear;
        r.yearLabels = yearLabels;
        r.year = yearLabels[yearLabels.length - 1];

      });

      this.regions = regions;
    }
  });

})();
