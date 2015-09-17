/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
'use strict';
  Mi.Views.Partners = Backbone.View.extend({
    el: '#content',
    initialize: function (options) {
      // done without .show() and .hide() for massive performance benefit
      $('.page-header').css('display','none');
      $('#map').css('display','none');
      $('#content').addClass('partners');
      this.render();
    },
    render: function () {
      var _self = this;
      $.get("partners.html", function(template){
        _self.$el.html(template);
      });
    },
  });

})();
