/*global Mi, Backbone*/

Mi.Routers = Mi.Routers || {};

(function () {
    'use strict';

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

    // Info hover description
    Mi.description = {
      "total-microinsurance-coverage-ratio": "Coverage of all included microinsurance products provided.",
      "credit-life-coverage-ratio": "Coverage that repays the outstanding balance on loans in default due to the death of the borrower. Occasionally, partial or complete disability coverage is also included.",
      "accident-coverage-ratio": "Insurance providing financial protection against an event that is unforeseen, unexpected, and unintended.",
      "property-coverage-ratio": "Insurance providing financial protection against the loss of, or damage to, real and personal property caused by such perils as fire, theft, windstorm, hail, explosion, riot, aircraft, motor vehicles, vandalism, malicious mischief, riot and civil commotion, and smoke.",
      "agriculture-coverage-ratio": "Insurance providing financial protection against loss due to drought, livestock disease and death, flood, and other perils impacting agriculture production.",
      "health-coverage-ratio": "Coverage that provides benefits as a result of sickness or injury. Policies include insurance for losses from accident, medical expense, disability, or accidental death and dismemberment."
    },

    Mi.Routers.App = Backbone.Router.extend({

    initialize: function () {
      // initialize map
      Mi.map = L.map('map', {
        maxBounds: [[-60,-180],[90,180]],
        noWrap: true
      }).setView([20, 0], 2);
      Mi.map.scrollWheelZoom.disable();
      Mi.countryGeo = L.geoJson(topojson.feature(worldTopo, worldTopo.objects.ne_50m), { style: function (feature) {
        return {
          color: 'white',
          weight: 1,
          fillColor: 'url(#hash)',
          fillOpacity: 1,
          className: 'no-data'
        };
      }});
      Mi.disputedGeo = L.geoJson(topojson.feature(worldTopoDisputed, worldTopoDisputed.objects.disputed), { style: function (feature) {
        return { dashArray: '6,3',
                 fill: false,
                 color: '#fff',
                 opacity: 0.8,
                 weight: 0.5};
      }});

      Mi.choroLayer = L.featureGroup();
      Mi.countryGeo.addTo(Mi.choroLayer);
      Mi.choroLayer.addTo(Mi.map);
      Mi.disputedGeo.addTo(Mi.map);
      this.mapNoData();
    },

    routes: {
       '' : 'viewPage',
       'view/:region/:year/:name' : 'viewPage',
       'country/:country' : 'viewCountry'
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

         var countriesPage = new Mi.Views.Countries({
           year: Mi.year,
           type: Mi.name,
           region: Mi.region,
           data: countries,
         });


          $('.loader').fadeOut();
     },


     viewCountry: function(country) {

       // if there aren't any markers, call the default view before continuing
       var markerCount = 0;
       Mi.ratiosLayer.eachLayer(function(layer){
         markerCount++;
       })
       if (!markerCount){
         this.viewPage();
         $('#content').empty();
       }

        $('.loader').fadeIn();

         var countries = [];
         $.each(Mi.data, function(index, row) {
         if (country === row.iso && row.category === 'Microinsurance') {

              countries.push(row);
          }
         });

         var countryPage = new Mi.Views.Country();
         countryPage.year = Mi.year;
         countryPage.type = Mi.name;
         countryPage.region = Mi.region;
         countryPage.data = countries;
         countryPage.iso = countries[0].iso;
         countryPage.render();

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
     },

    mapNoData: function () {
      var defs = d3.select('#map svg').insert('defs',":first-child");
      var dashWidth = 3;
      var pattern = defs.append("pattern")
        .attr('id', 'hash')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', dashWidth)
        .attr('height', dashWidth)
        .attr("x", 0).attr("y", 0)
        .append("g").style("fill", "none").style("stroke", "#ddd").style("stroke-width", 0.5);
      pattern.append("path").attr("d", "M"+dashWidth+",0 l-"+dashWidth+","+dashWidth);
    }
    });

})();
