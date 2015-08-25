/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
  'use strict';


  Mi.Views.Country = Mi.Views.Base.extend({

  template: JST['app/scripts/templates/country.ejs'],

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
            name: 'GDP',
            info: this.extraData['gdp-(current-us$)'],
            suffix: '$ (US)'
          },
          {
            name: 'Population',
            info: this.extraData['population-(total)']
          }
        ]
      }));

      _.each(this.data, function(value, index) {
        if (value.name.indexOf('ratio') >= 0 &&
          value.mostRecent.value !== '' &&
          value.name != 'Life coverage ratio (excluding credit life)' &&
          value.name != 'Life and accident coverage ratio (excluding credit life)') {

          var chartData = [];
          var yearLabels = [];
          $.each(value.timeseries, function(index, year) {
            if (year.value !== '') {
             chartData.push(year.value);
             yearLabels.push(year.year);
            }
          });

          _self.drawLineChart('#' + value.iso + '-chart-' + index, chartData, yearLabels, value.name, value.varName);
        }
      });

      $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});
    }

  });

})();
