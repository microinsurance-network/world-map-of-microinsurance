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
        year: ((this.year === 'all') ? (this.aggregate.years[this.aggregate.years.length - 1])
          : this.year) ,
        aggregate: this.aggregate
      }));

      // draw map and charts
      this.resetMapStyle();
      _.each(this.aggregate.graphs, function (graph) {
        _self.drawLineChart('#chart-' + graph.type, graph.chartData, _self.aggregate.years, graph.name, graph.type, true);
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
        if (_self.year === 'all') {
          d.filterYear = d.mostRecent.year;
          d.mainValue = d.mostRecent.value;
          d.crudeCoverage = crudeObject.mostRecent.value;
        } else {
          d.filterYear = _self.year;
          d.mainValue = _self.getFromTimeseries(d.timeseries, _self.year);
          d.crudeCoverage = _self.getFromTimeseries(crudeObject.timeseries, _self.year);
        }
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
      var populationArray = _.pluck(_self.extraData.filter(function(f) {
        return f.varName === 'population-(total)';
      }), 'timeseries');
      var sumPopulation = _self.aggregateTimeseries(populationArray);

      var graphs = ratios.map(function (ratio) {
        var mainValue, crudeCoverage;
        // grab the data for just this ratio (but the absolute/crude numbers)
        var crudeArray = _.pluck(_self.extraData.filter(function(f) {
          return f.varName === ratio.slice(0, -6);
        }), 'timeseries');
        // get a timeseries of crude value
        var sumCrude = _self.aggregateTimeseries(crudeArray);

        var chartData = [];
        var popYear = [];
        _.each(sumCrude, function(year, index) {
           if (sumPopulation[index].value) {
             chartData.push(Number((year.value / sumPopulation[index].value * 100).toFixed(2)));
             popYear.push(sumPopulation[index].value);
           } else {
             chartData.push(0);
             popYear.push(0);
           }
           yearLabels.push(year.year);
           if (year.year === parseFloat(_self.year)) {
             mainValue = Number((year.value / sumPopulation[index].value * 100).toFixed(2));
             crudeCoverage = year.value.toFixed(0);
           }
        });

        return {
          type: ratio,
          chartData: chartData,
          name: ratio.slice(0, -6),
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
      // sort graphs by main value
      graphs.sort(function(a,b){ return b.mainValue - a.mainValue; })

      this.aggregate = {
        graphs: graphs,
        years: yearLabels
      };
    }

  });

})();
