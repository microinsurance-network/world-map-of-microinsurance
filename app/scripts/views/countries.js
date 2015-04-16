/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
    'use strict';

    Mi.Views.Countries = Backbone.View.extend({

        template: JST['app/scripts/templates/countries.ejs'],

        tagName: 'div',

        id: '',

        className: '',
        
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
            
            //this.$el.html(this.template(this.model.toJSON()));
            
            console.log(this);
            
            console.log(Mi.centroids);
            
            //console.log(Mi);
            
            console.log(this.type);
            
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
            var i = 1;
            
            
            Mi.ratiosLayer.clearLayers();
            
            this.metaData = _.groupBy(Mi.data, 'country');
            
            console.log(this.metaData);

            
            
            $.each(this.data, function(index, value) {
            
              
              var crudeCoverage = 0;
              var crudeCoverageType = '';
              
              if (_self.type === 'all') {
                crudeCoverageType = 'total-microinsurance-coverage';
              } else {
                crudeCoverageType = _self.type.slice(0, -6);
              }
              
              console.log(crudeCoverageType);
              
              $.each(_self.metaData[value.country], function(index, indicator) {
                  if (value.country === value.country) {
                   if (indicator.varName === crudeCoverageType) {
                     if(_self.year === 'all') {
                         crudeCoverage = indicator.mostRecent.value;
                       } else {
						 $.each(indicator.timeseries, function(index, year) {
						   if (year.year === parseFloat(_self.year)) {
							 crudeCoverage = year.value;
						   }
						 });  
                     }
                   }
                  }
              });
            
            
             if (_self.year === 'all') {
                _self.mainValue = value.mostRecent.value;
             } else {
                $.each(value.timeseries, function(index, year) {
                  if (parseFloat(_self.year) === year.year) {
                    _self.mainValue = year.value;
                  }
                });
             }
             
             if (Mi.year === 'all') {
                var filterYear = value.mostRecent.year;
             } else {
                var filterYear = Mi.year;
             }
             
             var centroid = null;
             $.each(Mi.centroids, function(index, country) {
                if (country.iso_a3 === value.iso) {
                   centroid = country.coordinates;
                }
             });
             
             
             var radius = _self.mainValue;
             if (radius > 0 && radius < 4) {
                radius = 3;
             } 
             if (radius > 29) {
               radius = 30;
             }
             
             if (centroid != null && _self.mainValue != 0) {
              var markup = '<div class="inner">' + value.country + ', ' + _self.mainValue + '%</div>';
			  var marker = L.circleMarker([centroid[1], centroid[0]], {radius: radius, opacity: 1, fillOpacity: 0.7, color: '#006DA1'});
				marker.bindPopup(markup, {
				autoPan: true
			  });
				Mi.ratiosLayer.addLayer(marker);
			  }
			 
        
              if (_self.mainValue > 0) {
                $('#content').append('<div class="col-sm-4 col-md-3 col-xs-6 row-country" data-mi-ratio="' +  _self.mainValue + '">'
                 					 + '<div class="inner">'
                                     + '<b>' + value.country + '</b><br>' 
                                     + '<span class="mi-ratio-value"><a href="#country/ARG">' + _self.mainValue + '%</a></span>'
                                     + '<span class="mi-ratio-label">' + value.name + '</span>'
                                     + '<div id="' + value.iso + '-chart" class="hchart"></div>'
                                     + '<span class="mi-crude-value">' + _self.numberWithCommas(crudeCoverage) + ' policies</span>'
                                     + '<span class="mi-year-value">Year: ' + filterYear + '</span>'
                                     + '</div>'
                                     + '</div>'
                                     );
                i++;
                
                
                var chartData = [];
                var yearLabels = [];
                $.each(value.timeseries, function(index, year) {
                  if (year.value != 0) {
                   chartData.push(year.value);
                   yearLabels.push(year.year);
                  }
                });
                
                _self.drawLineChart('#' + value.iso + '-chart', chartData, yearLabels, value.name);
                
              }
              
               
		

             });
             
              if (i < 2) {
                $('#content').append('<div class="col-md-12 no-data"><h2>No data</h2></div>');
              }
              
              $('.row-country').tsort({
                    data: 'mi-ratio',
                    order: 'desc'
              });
              
              
               
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
