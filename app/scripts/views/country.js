/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
    'use strict';

    Mi.Views.Country = Backbone.View.extend({

       template: JST['app/scripts/templates/country.ejs'],

        tagName: 'div',

        id: '',

        className: '',

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

            $('#content').append('<h2 class="country-title">' + this.data[0]["country"] + '</h2>');

            var centroid = null;

            _.each(Mi.centroids, function(country) {
              if (country.iso_a3 === _self.iso) {
                centroid = country.coordinates;
                Mi.map.setView([centroid[1], centroid[0]], 4);
                Mi.map.closePopup();
              }
            });

            $.each(this.data, function(index, value) {

              var indicatorValue = '';
              var crudeCoverage;
              if (value.name.indexOf('ratio') >= 0){
                if (indicatorValue != null) {
                  indicatorValue = value.mostRecent.value + '%';
                  crudeCoverage = _.filter(_self.data, function(d){
                    return d.varName === value.varName.replace('-ratio','');
                  })[0].mostRecent.value;

                }
              } else {
                indicatorValue = value.mostRecent.value;
              }

      			 if (value.name.indexOf('ratio') >= 0 && value.mostRecent.value != null && value.mostRecent.value > 0 && value.name != 'Life coverage ratio (excluding credit life)' && value.name != 'Life and accident coverage ratio (excluding credit life)') {
                      $('#content').append('<div class="col-sm-4 col-md-3 col-xs-6 row-country ' + value.varName + '" data-mi-ratio="' +  _self.mainValue + '">'
                       					 + '<div class="inner">'
                                           + '<b></b><br>'
                       					 + '<a class="more-info" href="#" data-toggle="popover" title="' + value.name + '" data-content=" Vestibulum sed iaculis enim, eu elementum tortor. Morbi efficitur lacus diam, nec aliquam purus consequat et. Quisque a sapien vitae nisi dignissim ultrices vitae et libero.">?</a>'
                                           + '<span class="mi-ratio-value"><a href="#country/' + value.iso + '">' + indicatorValue + '</a></span>'
                                           + '<span class="mi-ratio-label">' + value.name + '</span>'
                                           + '<div id="' + value.iso + '-chart-' + index + '" class="hchart"></div>'
                                           + '<span class="mi-crude-value">' + _self.numberWithCommas(crudeCoverage) + ' policies</span>'
                                           + '<span class="mi-year-value">Year: '  + value.mostRecent.year + '</span>'
                                           + '</div>'
                                           + '</div>'
                                           );

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



          // $('.row-country').css('opacity', '0.2');

          /*
          console.log(Mi.ratiosLayer);

          var i = 0;
          Mi.ratiosLayer.eachLayer(function (layer) {
            i++;
          });
          */

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
