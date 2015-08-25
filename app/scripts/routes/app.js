/*global Mi, Backbone*/

Mi.Routers = Mi.Routers || {};

(function () {
  'use strict';

  var countryViewRendered = false;

  $(document).on('click', '.mi-reset', function(e) {
    Mi.year = 'all',
    Mi.region = 'global',
    Mi.name = 'total-microinsurance-coverage-ratio';
  });

  Mi.dataUrl = 'assets/data/mi-data.csv',
  Mi.studyUrl = 'assets/data/studies.csv',
  Mi.year = 'all',
  Mi.region = 'global',
  Mi.name = 'total-microinsurance-coverage-ratio',
  Mi.token = 'pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q',
  Mi.labelControl = L.Control.extend({
    options: {
      position: 'bottomleft'
    },

    initialize: function(options) {
      L.setOptions(this, options);
      this._info = {};
    },

    onAdd: function(map) {
      this._container = L.DomUtil.create('div', 'leaflet-control-layers leaflet-control');
      this._content = L.DomUtil.create('div', 'leaflet-control-layers-toggle', this._container);

      L.DomEvent.disableClickPropagation(this._container);

      return this._container;

    }
  }),

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
      this.headerInit();
      this.mapInit();
    },

    routes: {
      '' : 'viewPage',
      'view/:region/:year/:name' : 'viewPage',
      'country/:country' : 'viewCountry'
     },

    execute: function(callback, args) {
      $('#content').empty().hide().fadeIn();
      $('.loader').fadeIn();
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
          name: d.Indicator,
          // iterate over our numeric keys
          timeseries: _.map(_.filter(_.keys(d),function(key){ return !isNaN(Number(key)); }), function(numericKey){
            return {
              year: Number(numericKey),
              value: (d[numericKey] === '' ? '' : Number(d[numericKey])) };
          }),
          varName: d.Indicator.split(' ').join('-').toLowerCase(),
          country: d.Country,
          region: d.Region.toLowerCase(),
          iso: d.iso3
        };
      }, function(error, data) {
        Mi.data = data;
        Mi.countryGrouped = _.groupBy(Mi.data, 'country');
        Mi.varNameGrouped = _.groupBy(Mi.data, 'varName');
        Mi.doubledGrouped = {};
        _.each(Mi.countryGrouped, function (country, key) {
          Mi.doubledGrouped[key] = _.groupBy(country, 'varName');
        });
        Mi.years = _.pluck(Mi.data[0].timeseries, 'year');
        Mi.nameObject = _.zipObject(_.unique(_.pluck(Mi.data, 'varName')),
           _.unique(_.pluck(Mi.data, 'name')));

        if (callback) callback.apply(that, args);
      });
    },

    viewPage: function(region, year, name) {
      var _self = this;

      this.closePopups();

      if (region) { Mi.region = region; }
      if (year) { Mi.year = year; }
      if (name) { Mi.name = name; }

      if (Mi.region === 'global') {
        var countriesPage = new Mi.Views.Global({
          year: Mi.year,
          type: Mi.name,
          data: Mi.varNameGrouped[Mi.name],
          graphData: {
            population: Mi.varNameGrouped['population-(total)'],
            crudeCoverage: Mi.varNameGrouped[Mi.name.slice(0, -6)]
          }
        });
      } else {
        var extraData = Mi.data.filter(function (f) {
          return _self.regionMatch(f.region, Mi.region);
        });
        var data = Mi.varNameGrouped[Mi.name].filter(function (f) {
          return _self.regionMatch(f.region, Mi.region);
        });

        var countriesPage = new Mi.Views.Countries({
          year: Mi.year,
          type: Mi.name,
          region: Mi.region,
          data: data,
          extraData: extraData
        });
      }

      countryViewRendered = true;

      $('.loader').fadeOut();
     },


     viewCountry: function(country) {
       var _self = this;
        // if we haven't yet, do the full render to get map info
        if (!countryViewRendered) {
          this.viewPage();
        }

        this.closePopups();

        var countries = [];
        _.each(Mi.data, function(row) {
          if (country === row.iso && row.category === 'Microinsurance') {
             countries.push(row);
           }
         });

        var extraData = {};
        _.each(Mi.data, function(row){
          if (country === row.iso && _.contains([
            'Population (Total)',
            'GDP (current US$)',
            'Microinsurance Gross Premium (USD)',
            'Total microinsurance coverage',
            'Total microinsurance coverage ratio'
          ], row.name)) {
            extraData[row.varName] = _self.getFromTimeseries(row.timeseries, 'all');
          }
        });

        var countryPage = new Mi.Views.Country({
          year: Mi.year,
          type: Mi.name,
          region: Mi.region,
          data: countries,
          iso: countries[0].iso,
          country: countries[0].country,
          extraData: extraData
        });

        $('.loader').fadeOut();
     },

    mapInit: function () {
      // initialize map
      Mi.map = L.map('map', {
        maxBounds: [[-60,-180],[90,180]],
        noWrap: true,
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

      var url = 'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}'
      Mi.labels = L.tileLayer(url, {
        id: 'devseed.3255becb',
        token: Mi.token,
        noWrap: true,
      })

      Mi.choroLayer = L.featureGroup();
      Mi.countryGeo.addTo(Mi.choroLayer);
      Mi.choroLayer.addTo(Mi.map);
      Mi.disputedGeo.addTo(Mi.map);

      var control = new Mi.labelControl();
      control.addTo(Mi.map);
      $('.leaflet-control-layers').on('click', function(){
        if (Mi.map.hasLayer(Mi.labels)) {
          Mi.map.removeLayer(Mi.labels);
        } else {
          Mi.map.addLayer(Mi.labels);
        }
      })
      this.mapNoData();
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
    },

    headerInit: function () {
      d3.csv(Mi.studyUrl, function(error, data){
        var studies = data;
        // make object of region names and codes
        var regions = {};
        _.each(studies, function (study) {
          if (study.region_name) {
            regions[study.region_code] = study.region_name;
          }
        });
        Mi.regions = regions;
        Mi.header = new Mi.Views.Header({studies: studies, regions: regions });
      });
    },

    closePopups: function () {
      Mi.countryGeo.eachLayer(function (layer) {
        try {
          layer.closePopup();
        } catch (e) {
          _.each(layer._layers, function(subLayer){
            subLayer.closePopup();
          });
        }
      });
    },

    regionMatch: function (region, regionGroup) {
      switch (regionGroup) {
        case 'africa':
          return region === 'africa';
          break;
        case 'americas':
          return region === 'americas';
          break;
        case 'asia':
          return _.contains(['asia','oceania'], region);
          break;
      }
    },

    // TODO: duplicated from base.js, add to a utils file to remove cruft
    getFromTimeseries: function (timeseries, matchYear, altPluck, skipZeroes) {
      var toPluck = altPluck || 'value';
      if (matchYear === 'all') {
        var index = this.lastNonEmptyIndex(_.pluck(timeseries, 'value'), skipZeroes);
        return (index > 0) ? timeseries[index][toPluck] : '';
      } else {
        var toReturn = '';
        _.each(timeseries, function(y) {
          if (parseFloat(matchYear) === parseFloat(y.year)) {
            toReturn = y[toPluck];
          }
        });
        return toReturn;
      }
    },

    // I hate that the word series is its own plural
    aggregateTimeseries: function (array) {
      return array.reduce(function(a,b) {
        return _.merge(_.cloneDeep(a), b, function(c, d) {
         return { year: c.year, value: Number(c.value) + Number(d.value) }
        })
      })
    },

    // our timeseries arrays are always the same length
    // made into a function for clarity
    yearToIndex: function (year) {
      return Mi.years.indexOf(year);
    },

    lastNonEmptyElement: function (array, skipZeroes) {
      var index = this.lastNonEmptyIndex(array, skipZeroes);
      return (index > 0) ? array[index] : '';
    },

    lastNonEmptyIndex: function (array, skipZeroes) {
      var backwards = array.slice(0).reverse();
      var toReturn = '';
      for (var i = 0; i < backwards.length; i++) {
        if (backwards[i] !== '' && backwards[i] !== undefined) {
          if (!skipZeroes || backwards[i] !== 0){
            return backwards.length - i - 1
            break;
          }
        };
      }
      return -1;
    }

  });

})();
