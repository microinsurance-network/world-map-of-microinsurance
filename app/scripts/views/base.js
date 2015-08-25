/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

var blue = '#006Da1',
    green = '#3a3',
    red = 'maroon',
    orange = '#a61',
    purple = '#63b',
    brown = '#321';

  Mi.Views.Base = Backbone.View.extend({

    el: '#content',

    drawLineChart: function(selector, data, categories, name, type, agg) {
      var _self = this;
      var typeUsed = type || this.type;
      var color = _self.getColor(2, typeUsed).hex();

      $(selector).highcharts({
        chart: {
          plotBorderColor: '#fff',
          style: {
            fontFamily: "'Abel', sans-serif",
          }
        },
        title: { text: '', x: -20 /*center*/},
        subtitle: { text: '', x: -20 },
        xAxis: {
          categories: categories,
          labels: {
            enabled: true,
            style: { color: '#aaa'}
          }
        },
        yAxis: {
          allowDecimals: (!!agg),
          min: 0,
          title: { text: '' },
          labels: {
            x: -8,
            enabled: true,
            style: { color: '#aaa'}
          },
          gridLineColor: '#fff',
          tickWidth: 1,
          tickLength: 5
        },
        credits: { enabled: false },
        tooltip: { valueSuffix: '%' },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle',
          borderWidth: 0,
          enabled: false
        },
        series: [{
          color: color,
          name: 'Ratio',
          data: data
        }]
      });

    },

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    capitalizeFirstLetter: function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },

    setView: function (region) {
      switch (region) {
        case 'africa':
          Mi.map.setView([4.43, 28.83], 3);
          break;
        case 'americas':
          Mi.map.setView([2.20, -77.26], 3);
          break;
        case 'asia':
          Mi.map.setView([26.98, 87.10], 3);
          break;
        default:
          Mi.map.setView([20, 0], 2);
      }
    },

    drawLegend: function () {
      var _self = this;

      d3.select('.legend').select('*').remove();

      var margin = {top: 20, right: 10, bottom: 10, left: 10};

      var width = d3.select('.legend').style('width').replace('px','') - margin.left - margin.right,
          height = d3.select('.legend').style('height').replace('px','') - margin.top - margin.bottom;

      var svg = d3.select('.legend').append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      var data = [0, 0.1, 1, 2, 3];

      svg.selectAll('color')
        .data(data)
        .enter()
        .append('rect')
        .attr('fill', function(d) { return _self.getColor(d, _self.type); })
        .attr('opacity', function(d) { return d ? 0.8 : 0.4; })
        .attr('width', width / data.length)
        .attr('height', height)
        .attr('y',0)
        .attr('x', function(d,i) { return i * width / data.length});

     svg.selectAll('label')
       .data(data)
       .enter()
       .append('text')
       .attr('class','label')
       .attr('dy', -5)
       .attr('x', function(d,i) { return (i + 0.5) * width / data.length; })
       .attr('text-anchor','middle')
       .text(function(d, i) {
         if (d === 0) { return '0%'; }
         return Math.floor(data[i]) +
         ((data[i+1]) ? ' - ' + data[i+1] + '%' : '%+');
       });
    },

    typeToColor: function (type) {
      switch (type) {
        case 'total-microinsurance-coverage-ratio':
          return blue;
          break;
        case 'credit-life-coverage-ratio':
          return red;
          break;
        case 'health-coverage-ratio':
          return green;
          break;
        case 'accident-coverage-ratio':
          return orange;
          break;
        case 'property-coverage-ratio':
          return brown;
          break;
        case 'agriculture-coverage-ratio':
          return purple;
          break;
      }
    },

    getColor: function (value, type) {
      var palette = ['white', this.typeToColor(type)];
      var scale = chroma.scale(palette)
        .mode('hsl')
        .domain([-1, 0, 1, 2, 3, 4]);
      return (Number(value) === 0) ? '#ddd' : scale(Math.floor(Math.min(value, 3)));
    },

    resetMapStyle: function () {
      Mi.countryGeo.eachLayer(function(layer){
        layer.setStyle({
          color: 'white',
          weight: 1,
          fillColor: 'url(#hash)',
          fillOpacity: 1
        });
        // hack until https://github.com/Leaflet/Leaflet/issues/2662
        // is resolved
        d3.selectAll('.leaflet-overlay-pane path').classed('no-data', true);
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

    regionNav: function (e) {
      e.preventDefault();
      Mi.router.navigate('view/' + e.target.id.toLowerCase() + '/' + Mi.year +
        '/' + Mi.name, {trigger: true});
    },

    updateShareLinks: function () {
      // share links
      $('#twitter-share-btn').attr('href', 'https://twitter.com/home?status=' + window.location.href);
      $('#facebook-share-btn').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
      $('#linkedin-share-btn').attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href);
    },

    updateMap: function (value) {
      var _self = this;

      Mi.countryGeo.eachLayer(function(layer){
        if (value.iso === layer.feature.properties.iso_a3 && value.mainValue !== '') {
          var color = _self.getColor(value.mainValue, _self.type);
          layer.setStyle({
            fillColor: color,
            fillOpacity: (value.mainValue) ? 0.8 : 0.3
          });
          // make the countries with data clickable
          if (layer._path) {
            layer._path.setAttribute('class','leaflet-clickable');
          } else {
            _.each(layer._layers, function (l) {
              l._path.setAttribute('class','leaflet-clickable');
            });
          }

          var markup = '<div class="inner"><span class="country-name">' + value.country +
          '</span><span class="year"> (' + value.filterYear + ')</span><br>' +
          '<span class="popup-value">' + _self.capitalizeFirstLetter(_self.type.replace(/-/g, ' ')) + ': ' + value.mainValue + '%</span><br>' +
                       '<a href="#country/' + value.iso +'">View profile</a></div>';
          layer.bindPopup(markup, { autoPan: true });
        }
      });
    },

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
