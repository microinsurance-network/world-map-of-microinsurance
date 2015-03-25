/*global Mi, Backbone, JST*/

Mi.Views = Mi.Views || {};

(function () {
    'use strict';

    Mi.Views.Country = Backbone.View.extend({

        template: JST['app/scripts/templates/country.ejs'],

        tagName: 'div',

        id: '',

        className: '',
        
        data: {},

        events: {},

        initialize: function () {
          
        },

        render: function () {
            //this.$el.html(this.template(this.model.toJSON()));
            
            console.log(this);
        }

    });

})();
