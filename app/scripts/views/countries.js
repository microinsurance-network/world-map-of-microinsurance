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
        
        year: '',
        
        type: '',

        initialize: function () {
            
        },

        render: function () {
            
            //this.$el.html(this.template(this.model.toJSON()));
            
            console.log(this);
            
            console.log(Mi.centroids);
            
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
            
            
            
            
            $.each(this.data, function(index, value) {
            
            
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
                                     + value.name + '<br>' 
                                     + '<span class="mi-ratio-value">' + _self.mainValue + '%</span>'
                                     + 'Year: ' + filterYear
                                     + '</div>'
                                     + '</div>'
                                     );
                i++;
                
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
        
        
        capitalizeFirstLetter: function(string) {
          return string.charAt(0).toUpperCase() + string.slice(1);
        }


    });

})();
