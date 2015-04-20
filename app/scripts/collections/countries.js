/*global Mi, Backbone*/

Mi.Collections = Mi.Collections || {};

(function () {
    'use strict';

    Mi.Collections.Countries = Backbone.Collection.extend({

        model: Mi.Models.Countries

    });

})();
