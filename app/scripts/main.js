/*global Mi, $*/


window.Mi = {
    Models: {},
    Collections: {},
    Views: {},
    Routers: {},
    init: function () {
        'use strict';
        
        //initialize router
        Mi.router = new Mi.Routers.App();
        Backbone.history.start();
        
    }
};

$(document).ready(function () {
    'use strict';
    Mi.init();
});
