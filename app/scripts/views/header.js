/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {

'use strict';

  Mi.Views.Header = Backbone.View.extend({

    template: JST['app/scripts/templates/header.ejs'],

    el: '#main-header',

    initialize: function (options) {
      this.studies = options.studies;
      this.render();
    },

    events: {
      'click .dropdown-menu': 'dropdownNav'
    },

    render: function () {

      // make object of region names and codes
      var regions = {};
      _.each(this.studies, function (study) {
        if (study.region_name) {
          regions[study.region_code] = study.region_name;
        }    
      });

      // render template
      this.$el.html(this.template({
        studies: this.studies,
        regions: regions
      }));

    },

    dropdownNav: function (e) {
      e.preventDefault();
      switch (e.currentTarget.classList[1]) {
        case 'menu-type':
          Mi.name = $(e.target).attr('data-var');
          break;
        case 'menu-region':
          Mi.region = $(e.target).attr('data-var');
          Mi.year = 'all';
          break;
        case 'menu-study':
          var duo = $(e.target).attr('data-var').split(' ');
          Mi.region = duo[0];
          Mi.year = duo[1];
          break;
      }
      Mi.router.navigate('view/' + Mi.region + '/' + Mi.year +
        '/' + Mi.name, {trigger: true})
    }
  });

})();
