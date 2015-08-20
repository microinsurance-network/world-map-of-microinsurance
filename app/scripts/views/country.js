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

  Mi.Views.Country = Backbone.View.extend({

  template: JST['app/scripts/templates/country.ejs'],
  tagName: 'div',
  el: '#content',

  initialize: function (options) {
    this.year = options.year;
    this.type = options.type;
    this.region = options.region;
    this.data = options.data;
    this.iso = options.iso;
    this.extraData = options.extraData;
    this.render();
  },

    render: function () {
      var _self = this;

      var centroid = null;

      Mi.countryGeo.eachLayer(function (layer) {
        if (layer.feature.properties.iso_a3 === _self.iso) {
          Mi.map.fitBounds(layer.getBounds());
        }
      });

      _.each(this.data, function(d){
        d.indicatorValue = '';
        if (d.name.indexOf('ratio') >= 0){
          if (d.indicatorValue != null) {
            d.indicatorValue = d.mostRecent.value + '%';
            d.crudeCoverage = _.filter(_self.data, function(f){
              return f.varName === d.varName.replace('-ratio','');
            })[0].mostRecent.value;
          }
        } else {
          d.indicatorValue = d.mostRecent.value;
        }
      });
      console.log(this.extraData);
      this.$el.html(this.template({
        data: this.data,
        numberWithCommas: this.numberWithCommas,
        type: this.type,
        countryStats: [
          {
            name: 'Microinsurance Premiums',
            info: this.extraData['microinsurance-gross-premium-(usd)'],
            suffix: '$ (US)'
          },
          {
            name: 'Population',
            info: this.extraData['population-(total)']
          },
          {
            name: 'GDP',
            info: this.extraData['gdp-(current-us$)'],
            suffix: '$ (US)'
          }
        ]
      }));

      _.each(this.data, function(value, index) {
        if (value.name.indexOf('ratio') >= 0 &&
          value.mostRecent.value != null &&
          value.mostRecent.value > 0 &&
          value.name != 'Life coverage ratio (excluding credit life)' &&
          value.name != 'Life and accident coverage ratio (excluding credit life)') {

          var chartData = [];
          var yearLabels = [];
          $.each(value.timeseries, function(index, year) {
            if (year.value != 0) {
             chartData.push(year.value);
             yearLabels.push(year.year);
            }
          });

          _self.drawLineChart('#' + value.iso + '-chart-' + index, chartData, yearLabels, value.name, value.varName);
        }
      });

      $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});

      // share links
      $('#twitter-share-btn').attr('href', 'https://twitter.com/home?status=' + window.location.href);
      $('#facebook-share-btn').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
      $('#linkedin-share-btn').attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href);
    },


    drawLineChart: function(id, data, categories, name, type) {

      var color = this.getColor(2, type).hex();

      $(id).highcharts({
        chart: {
      	  plotBorderColor: 'transparent',
      	  backgroundColor: 'transparent'
      	},
      	title: {
      		text: '',
      		x: -20 //center
      	},
      	subtitle: {
      		text: '',
      		x: -20
      	},
      	xAxis: { categories: categories },
      	yAxis: {
      		title: { text: '' },
      		labels: { enabled: false },
      		gridLineColor: '#fff'
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
      		name: 'Ratio',
      		color: color,
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

  });

})();
