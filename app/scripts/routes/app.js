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
  Mi.dataFolder = 'assets/data/',
  Mi.dataUrl = Mi.dataFolder + 'mi-data.csv',
  Mi.studyUrl = Mi.dataFolder + 'studies.csv',
  Mi.typeUrl = Mi.dataFolder + 'types.csv',
  Mi.linkUrl = Mi.dataFolder + 'links.csv',
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
  Mi.resetControl = L.Control.extend({
    options: {
      position: 'topleft',

    },

    initialize: function(options) {
      L.setOptions(this, options);
      this._info = {};
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'leaflet-control');
         this._content = L.DomUtil.create('div', 'leaflet-control-reset', this._container);
        return this._container;
    }
  }),

  Mi.Routers.App = Backbone.Router.extend({

    initialize: function () {
      this.headerInit();
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
      var _self = this;
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

        // load maps
        _self.mapInit(function () {
          if (callback) callback.apply(_self, args);
        });
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
            crudeCoverage: Mi.varNameGrouped[Mi.name.replace('-ratio','')]
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
            extraData[row.varName] = {
              value: _self.getFromTimeseries(row.timeseries, 'all'),
              year: _self.getFromTimeseries(row.timeseries, 'all', 'year')
            };
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

    mapInit: function (callback) {
      var _self = this;
      // initialize map
      L.mapbox.accessToken = Mi.token;
      Mi.map = L.map('map', {
        maxBounds: [[-60,-180],[90,180]],
        noWrap: true
      }).setView([20, 0], 2);
      Mi.map.scrollWheelZoom.disable();

      d3.json(Mi.dataFolder + 'geo/ne_50m.topojson', function (error, countries) {
        d3.json(Mi.dataFolder + 'geo/disputed.topojson', function (error, disputed) {
          Mi.countryGeo = L.geoJson(topojson.feature(countries, countries.objects.ne_50m), { style: function (feature) {
            return {
              color: 'white',
              weight: 1,
              fillColor: 'url(#hash)',
              fillOpacity: 1,
              className: 'no-data'
            };
          }});
          Mi.disputedGeo = L.geoJson(topojson.feature(disputed, disputed.objects.disputed), { style: function (feature) {
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
          _self.mapNoData();
          callback();
        });
      });

      Mi.labels = L.mapbox.tileLayer('devseed.549da763', {
        noWrap: true
      });

      var resetControl = new Mi.resetControl();
      resetControl.addTo(Mi.map);
      $('.leaflet-control-reset').on('click', function(){
        Mi.region = 'global';
        _self.navigate('/view/' + Mi.region + '/' + Mi.year + '/' + Mi.name, {trigger: true});
      });

      var control = new Mi.labelControl();
      control.addTo(Mi.map);
      $('.leaflet-control-layers').on('click', function(){
        if (Mi.map.hasLayer(Mi.labels)) {
          Mi.map.removeLayer(Mi.labels);
        } else {
          Mi.map.addLayer(Mi.labels);
        }
      });
    },


    mapNoData: function () {
      var defs = d3.select('#map svg').insert('defs',":first-child");
      var dashWidth = 4;
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
      d3.csv(Mi.linkUrl, function(error, links){
        // Info hover description
        Mi.links = {};
        _.each(links, function (link) {
          Mi.links[link.countryCode] = link.link;
        });
      });
      d3.csv(Mi.typeUrl, function(error, types){
        // Info hover description
        var descriptions = {};
        _.each(types, function (type) {
          descriptions[type.type] = type.description;
        });
        Mi.description = descriptions;
        d3.csv(Mi.studyUrl, function(error, studies){
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
      });

    },

    closePopups: function () {
      // in case it hasn't loaded yet
      if (Mi.countryGeo) {
        Mi.countryGeo.eachLayer(function (layer) {
          try {
            layer.closePopup();
          } catch (e) {
            _.each(layer._layers, function(subLayer){
              subLayer.closePopup();
            });
          }
        });
      }
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
