/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
    'use strict';

    Mi.Views.Countries = Backbone.View.extend({

        template: JST['app/scripts/templates/countries.ejs'],

        el: '#content',

        data: {},

        events: {},

        region: '',

        mainValue: '',

        metaData: '',

        year: '',

        type: '',

        initialize: function () {

        },

        render: function () {

            if (!(this.region)) {
              this.region = 'Global';
            }

            $('.region-value').text(this.capitalizeFirstLetter(this.region));

            if (this.year === 'all') {
              $('.year-value').text('Most recent value');
            } else {
              $('.year-value').text(this.year);
            }

            $('.type-value').text(this.capitalizeFirstLetter(this.type.replace(/-/g, ' ')));

            if (this.region === 'Africa') {
              Mi.map.setView([4.43, 28.83], 3);
            } else if (this.region === 'Americas') {
              Mi.map.setView([2.20, -77.26], 3);
            } else if (this.region === 'Asia') {
              Mi.map.setView([26.98, 87.10], 3);
            } else if (this.region === 'Oceania') {
              Mi.map.setView([-7.36, 162.60], 3);
            } else {
              Mi.map.setView([20, 0], 2);
            }


		        var _self = this;

            Mi.ratiosLayer.clearLayers();

            this.metaData = _.groupBy(Mi.data, 'country');

            console.log(this.metaData);

            // data handling

            _.each(this.data, function(d){
              d.crudeCoverage = 0;
              d.crudeCoverageType = (_self.type === 'all') ? 'total-microinsurance-coverage' : _self.type.slice(0, -6);
              _.each(_self.metaData[d.country], function(indicator) {
                 if (indicator.varName === d.crudeCoverageType) {
                   if (_self.year === 'all') {
                       d.crudeCoverage = indicator.mostRecent.value;
                   } else {
        						 _.each(indicator.timeseries, function(year) {
        						   if (year.year === parseFloat(_self.year)) {
        							   d.crudeCoverage = year.value;
        						   }
        						 });
                   }
                 }
                 if (_self.year === 'all') {
                    d.mainValue = d.mostRecent.value;
                 } else {
                   _.each(d.timeseries, function(year) {
                     if (parseFloat(_self.year) === year.year) {
                       d.mainValue = year.value;
                     }
                   });
                 }
                 if (Mi.year === 'all') {
                   d.filterYear = d.mostRecent.year;
                 } else {
                   d.filterYear = Mi.year;
                 }
              });
            });

            this.data.sort( function (a,b) {
                  return b.mainValue - a.mainValue;
            });

            this.$el.html(this.template({data: this.data, numberWithCommas: this.numberWithCommas}))

            _.each(this.data, function(value) {

              var centroid = null;
              _.each(Mi.centroids, function(country) {
                if (country.iso_a3 === value.iso) {
                  centroid = country.coordinates;
                }
              });

              var radius = value.mainValue;
              if (radius > 0 && radius < 4) {
                radius = 3;
              }
              if (radius > 29) {
                radius = 30;
              }

              if (centroid != null && value.mainValue !== 0) {
                var markup = '<div class="inner"><span class="popup-value">' + value.country + ', ' + value.mainValue + '%</span><br>' +
                             '<a href="#country/' + value.iso +'">Details</a></div>';
			          var marker = L.circleMarker([centroid[1], centroid[0]], {radius: radius, opacity: 1, fillOpacity: 0.7, color: '#006DA1'});
				        marker.bindPopup(markup, { autoPan: true });
				        Mi.ratiosLayer.addLayer(marker);
			        }


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

             $('#map').animate({height: '400px'});
             $('.more-info').popover({placement: 'top', trigger: 'hover', viewport: '.row-country'});


        },


        drawLineChart: function(id, data, categories, name) {

			$(id).highcharts({

			    chart: {
			       plotBorderColor: '#fff'
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
