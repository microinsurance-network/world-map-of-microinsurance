/*global Mi, Backbone*/

Mi.Routers = Mi.Routers || {};

(function () {
    'use strict';

    L.mapbox.accessToken = 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q';
    Mi.map = L.mapbox.map('map', 'devseed.49f9443d', {worldCopyJump: true})
    .setView([20, 0], 2);
    Mi.map.scrollWheelZoom.disable();
    Mi.ratiosLayer = L.mapbox.featureLayer();
    Mi.map.addLayer(Mi.ratiosLayer);
    
    
    $(document).on('click', '.mi-reset', function(e) {
        Mi.year = 'all',
        Mi.region = 'Global',
        Mi.name = 'total-microinsurance-coverage-ratio';
    });
    
    
    Mi.dataUrl = 'assets/data/mi-data.csv';
    Mi.data = null,
    Mi.models = {},
    Mi.collections = {},
    Mi.views = {},
    Mi.year = 'all',
    Mi.region = 'Global',
    Mi.name = 'total-microinsurance-coverage-ratio',
    Mi.centroids = centroids,



    Mi.Routers.App = Backbone.Router.extend({
    
    routes: {
       '' : 'viewPage',
       'view/:region/:year/:name' : 'viewPage',
     },
     
     
    execute: function(callback, args) {
        $('#content').empty().hide().fadeIn();
    
          if (!Mi.data) {
            this.loadData(callback, args);
            // maybe spin a loader here
          }
          else {
            if (callback) callback.apply(this, args);
          }
        },
        
        
    loadData: function(callback, args) {
          var that = this;
          d3.csv(Mi.dataUrl, function(d) {
                return {
                  category: d.Category,
                  mostRecent: _.reduce(d, function(a, b, key){
                    // numeric key, later year, has a value
                    return (!isNaN(Number(key)) && Number(key) > a.year && b !== "") ? { year: Number(key), value: Number(b) } : a },
                    { year: 0, value: ""}),
                  name: d.Indicator,
                  // iterate over our numeric keys
                  timeseries: _.map(_.filter(_.keys(d),function(key){ return !isNaN(Number(key)); }), function(numericKey){
                    return { year: Number(numericKey), value: Number(d[numericKey]) };
                  }),
                  varName: d.Indicator.split(' ').join('-').toLowerCase(),
                  country: d.Country,
                  region: d.Region,
                  iso: d.iso3
                };
              }, function(error, data) {
              Mi.data = data;
              Mi.countries = _.unique(_.pluck(Mi.data,'country'));
              Mi.iso = _.unique(_.pluck(Mi.data,'iso'));
              Mi.indicators = _.unique(_.pluck(Mi.data,'name'));
              // add max and median per indicator
              var mostRecentArray, indicatorMax, indicatorMedian;
              _.each(Mi.indicators, function(indicator) {
                // match our indicator and has a reasonable mostRecent value
                mostRecentArray = _.pluck(_.filter(Mi.data, function(d){ return (d.name === indicator && d.mostRecent.value !== ""); }),'mostRecent');
                indicatorMax = _.max(_.pluck(mostRecentArray,'value'))
                indicatorMedian = that.median(_.pluck(mostRecentArray,'value'));
                _.each(_.filter(Mi.data, function(d){ return (d.name === indicator); }), function(d) {
                  d.max = indicatorMax;
                  d.median = indicatorMedian;
                });
              });
             if (callback) callback.apply(that, args);
            });
        },
     

     
      viewPage: function(region, year, name) {
         
         $('.loader').fadeIn();
         
         
         if (region) {
           Mi.region = this.capitalizeFirstLetter(region);
         }
         
         if (year) {
           Mi.year = year;
         }
         
         if (name) {
           Mi.name = name;
         }
         
     
         
        $('.menu-type a.mi-filter').each(function() {
           $(this).attr('data-year', Mi.year);
           $(this).attr('data-region', Mi.region);
           $(this).attr('data-type', Mi.name);
           var filterValue = $(this).attr('data-var');
           $(this).attr('href', '#view/' +  Mi.region + '/' + Mi.year + '/' + filterValue);
         });
         
         $('.menu-region a.mi-filter').each(function() {
           $(this).attr('data-year', Mi.year);
           $(this).attr('data-region', Mi.region);
           $(this).attr('data-type', Mi.name);
           var filterValue = $(this).attr('data-var');
           $(this).attr('href', '#view/' +  filterValue + '/' + Mi.year + '/' + Mi.name);
         });
         
         $('.menu-year a.mi-filter').each(function() {
           $(this).attr('data-year', Mi.year);
           $(this).attr('data-region', Mi.region);
           $(this).attr('data-type', Mi.name);
           var filterValue = $(this).attr('data-var');
           $(this).attr('href', '#view/' +  Mi.region + '/' + filterValue + '/' + Mi.name);
         });
       
       
        var countries = [];
           $.each(Mi.data, function(index, row) {
           if (Mi.region == 'Global' || row.region === Mi.region) {
             if (row.varName === Mi.name) {
                countries.push(row);
              }
            }
           });
  
         var countriesPage = new Mi.Views.Countries();
         countriesPage.year = Mi.year;
         countriesPage.type = Mi.name;
         countriesPage.region = Mi.region;
         countriesPage.data = countries;
         countriesPage.render();
         
          $('.loader').fadeOut();
         
     }, 
     

    

     median: function(values) {
          values.sort(function(a,b) {return a - b;});
          var half = Math.floor(values.length/2);
          if (values.length % 2) {
            return values[half];
          }
          else {
              return (values[half-1] + values[half]) / 2.0;
          }
        },


      capitalizeFirstLetter: function(string) {
         return string.charAt(0).toUpperCase() + string.slice(1);
       }
     
     

    });

})();
