/*global Mi, Backbone*/

Mi.Models = Mi.Models || {};

(function () {
    'use strict';

    Mi.Models.Country = Backbone.Model.extend({

        urlRoot: 'assets/data',

        initialize: function() {
        
        },

        defaults: {
        },

        validate: function(attrs, options) {
        },

        parse: function(response, options)  {
            return response;
        }
    });

})();
