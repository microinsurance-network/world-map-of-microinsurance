/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
    'use strict';

    Mi.Views.Country = Backbone.View.extend({

       template: JST['app/scripts/templates/country.ejs'],

        tagName: 'div',

        el: '#content',

        data: {},

        events: {},

        region: '',

        mainValue: '',

        metaData: '',

        year: '',

        iso: '',

        type: '',

        initialize: function () {

        },

        render: function () {

            var _self = this;

            var centroid = null;

            _.each(Mi.centroids, function(country) {
              if (country.iso_a3 === _self.iso) {
                centroid = country.coordinates;
                Mi.map.setView([centroid[1], centroid[0]], 4);
                Mi.map.closePopup();
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

            this.$el.html(this.template({data: this.data, numberWithCommas: this.numberWithCommas}))

            _.each(this.data, function(value, index) {

      			 if (value.name.indexOf('ratio') >= 0 && value.mostRecent.value != null && value.mostRecent.value > 0 && value.name != 'Life coverage ratio (excluding credit life)' && value.name != 'Life and accident coverage ratio (excluding credit life)') {

                var chartData = [];
                var yearLabels = [];
                $.each(value.timeseries, function(index, year) {
                  if (year.value != 0) {
                   chartData.push(year.value);
                   yearLabels.push(year.year);
                  }
                });

                _self.drawLineChart('#' + value.iso + '-chart-' + index, chartData, yearLabels, value.name);

              }

            });


         $('#map').animate({height: '250px'});

         $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});

        },


        drawLineChart: function(id, data, categories, name) {

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
				xAxis: {
					categories: categories
				},
				yAxis: {
					title: {
						text: ''
					},
					labels: {
					   enabled: false
					},
					gridLineColor: '#fff'
				},
				credits: {
     			  enabled: false
 			    },
				tooltip: {
					valueSuffix: '%'
				},
				legend: {
					layout: 'vertical',
					align: 'right',
					verticalAlign: 'middle',
					borderWidth: 0,
					enabled: false
				},
				series: [{
					name: 'Ratio',
					color: '#09AE8A',
					data: data
				}]
			});

        },

        numberWithCommas: function(x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

        capitalizeFirstLetter: function(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }

    });

})();
