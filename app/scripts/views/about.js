/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
'use strict';
  Mi.Views.About = Backbone.View.extend({
    el: '#content',
    initialize: function (options) {
      // done without .show() and .hide() for massive performance benefit
      $('.page-header').css('display','none');
      $('#map').css('display','none');
      $('#content').addClass('about');
      this.render();
    },
    render: function () {
      // fetch and render template
      var _self = this;
      $.get("about.html", function(template){
        _self.$el.html(template);
      });
    },
  });

})();
