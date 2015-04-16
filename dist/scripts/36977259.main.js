window.Mi={Models:{},Collections:{},Views:{},Routers:{},init:function(){"use strict";Mi.router=new Mi.Routers.App,Backbone.history.start()}},$(document).ready(function(){"use strict";Mi.init()}),this.JST=this.JST||{},this.JST["app/scripts/templates/countries.ejs"]=function(obj){obj||(obj={});{var __t,__p="";_.escape,Array.prototype.join}with(obj)__p+='<div class="container">\n<h2>Main template</h2>\n',_.each(items,function(a){__p+="\n  "+(null==(__t=itemTemplate(a))?"":__t)+" \n"}),__p+="\n</div>";return __p},this.JST["app/scripts/templates/country.ejs"]=function(obj){obj||(obj={});{var __p="";_.escape}with(obj)__p+="<p>Your content here.</p>\n\n";return __p},Mi.Routers=Mi.Routers||{},function(){"use strict";L.mapbox.accessToken="pk.eyJ1IjoiZGV2c2VlZCIsImEiOiJnUi1mbkVvIn0.018aLhX0Mb0tdtaT2QNe2Q",Mi.map=L.mapbox.map("map","devseed.49f9443d",{worldCopyJump:!0}).setView([20,0],2),Mi.map.scrollWheelZoom.disable(),Mi.ratiosLayer=L.mapbox.featureLayer(),Mi.map.addLayer(Mi.ratiosLayer),$(document).on("click",".mi-reset",function(){Mi.year="all",Mi.region="Global",Mi.name="total-microinsurance-coverage-ratio"}),Mi.dataUrl="assets/data/mi-data.csv",Mi.data=null,Mi.models={},Mi.collections={},Mi.views={},Mi.year="all",Mi.region="Global",Mi.name="total-microinsurance-coverage-ratio",Mi.centroids=centroids,Mi.Routers.App=Backbone.Router.extend({routes:{"":"viewPage","view/:region/:year/:name":"viewPage","country/:country":"viewCountry"},execute:function(a,b){$("#content").empty().hide().fadeIn(),Mi.data?a&&a.apply(this,b):this.loadData(a,b)},loadData:function(a,b){var c=this;d3.csv(Mi.dataUrl,function(a){return{category:a.Category,mostRecent:_.reduce(a,function(a,b,c){return!isNaN(Number(c))&&Number(c)>a.year&&""!==b?{year:Number(c),value:Number(b)}:a},{year:0,value:""}),name:a.Indicator,timeseries:_.map(_.filter(_.keys(a),function(a){return!isNaN(Number(a))}),function(b){return{year:Number(b),value:Number(a[b])}}),varName:a.Indicator.split(" ").join("-").toLowerCase(),country:a.Country,region:a.Region,iso:a.iso3}},function(d,e){Mi.data=e,Mi.countries=_.unique(_.pluck(Mi.data,"country")),Mi.iso=_.unique(_.pluck(Mi.data,"iso")),Mi.indicators=_.unique(_.pluck(Mi.data,"name"));var f,g,h;_.each(Mi.indicators,function(a){f=_.pluck(_.filter(Mi.data,function(b){return b.name===a&&""!==b.mostRecent.value}),"mostRecent"),g=_.max(_.pluck(f,"value")),h=c.median(_.pluck(f,"value")),_.each(_.filter(Mi.data,function(b){return b.name===a}),function(a){a.max=g,a.median=h})}),a&&a.apply(c,b)})},viewPage:function(a,b,c){$(".loader").fadeIn(),a&&(Mi.region=this.capitalizeFirstLetter(a)),b&&(Mi.year=b),c&&(Mi.name=c),$(".menu-type a.mi-filter").each(function(){$(this).attr("data-year",Mi.year),$(this).attr("data-region",Mi.region),$(this).attr("data-type",Mi.name);var a=$(this).attr("data-var");$(this).attr("href","#view/"+Mi.region+"/"+Mi.year+"/"+a)}),$(".menu-region a.mi-filter").each(function(){$(this).attr("data-year",Mi.year),$(this).attr("data-region",Mi.region),$(this).attr("data-type",Mi.name);var a=$(this).attr("data-var");$(this).attr("href","#view/"+a+"/"+Mi.year+"/"+Mi.name)}),$(".menu-year a.mi-filter").each(function(){$(this).attr("data-year",Mi.year),$(this).attr("data-region",Mi.region),$(this).attr("data-type",Mi.name);var a=$(this).attr("data-var");$(this).attr("href","#view/"+Mi.region+"/"+a+"/"+Mi.name)});var d=[];$.each(Mi.data,function(a,b){("Global"==Mi.region||b.region===Mi.region)&&b.varName===Mi.name&&d.push(b)});var e=new Mi.Views.Countries;e.year=Mi.year,e.type=Mi.name,e.region=Mi.region,e.data=d,e.render(),$(".loader").fadeOut()},viewCountry:function(){$(".loader").fadeIn()},median:function(a){a.sort(function(a,b){return a-b});var b=Math.floor(a.length/2);return a.length%2?a[b]:(a[b-1]+a[b])/2},capitalizeFirstLetter:function(a){return a.charAt(0).toUpperCase()+a.slice(1)}})}(),Mi.Models=Mi.Models||{},function(){"use strict";Mi.Models.Country=Backbone.Model.extend({urlRoot:"assets/data",initialize:function(){},defaults:{},validate:function(){},parse:function(a){return a}})}(),Mi.Collections=Mi.Collections||{},function(){"use strict";Mi.Collections.Countries=Backbone.Collection.extend({model:Mi.Models.Countries})}(),Mi.Views=Mi.Views||{},function(){"use strict";Mi.Views.Country=Backbone.View.extend({template:JST["app/scripts/templates/country.ejs"],tagName:"div",id:"",className:"",data:{},events:{},initialize:function(){},render:function(){console.log(this)}})}(),Mi.Views=Mi.Views||{},function(){"use strict";Mi.Views.Countries=Backbone.View.extend({template:JST["app/scripts/templates/countries.ejs"],tagName:"div",id:"",className:"",data:{},events:{},region:"",mainValue:"",metaData:"",year:"",type:"",initialize:function(){},render:function(){console.log(this),console.log(Mi.centroids),console.log(this.type),this.region||(this.region="Global"),$(".region-value").text(this.capitalizeFirstLetter(this.region)),$(".year-value").text("all"===this.year?"Most recent value":this.year),$(".type-value").text(this.capitalizeFirstLetter(this.type.replace(/-/g," "))),"Africa"===this.region?Mi.map.setView([4.43,28.83],3):"Americas"===this.region?Mi.map.setView([2.2,-77.26],3):"Asia"===this.region?Mi.map.setView([26.98,87.1],3):"Oceania"===this.region?Mi.map.setView([-7.36,162.6],3):Mi.map.setView([20,0],2);var a=this,b=1;Mi.ratiosLayer.clearLayers(),this.metaData=_.groupBy(Mi.data,"country"),console.log(this.metaData),$.each(this.data,function(c,d){var e=0,f="";if(f="all"===a.type?"total-microinsurance-coverage":a.type.slice(0,-6),console.log(f),$.each(a.metaData[d.country],function(b,c){d.country===d.country&&c.varName===f&&("all"===a.year?e=c.mostRecent.value:$.each(c.timeseries,function(b,c){c.year===parseFloat(a.year)&&(e=c.value)}))}),"all"===a.year?a.mainValue=d.mostRecent.value:$.each(d.timeseries,function(b,c){parseFloat(a.year)===c.year&&(a.mainValue=c.value)}),"all"===Mi.year)var g=d.mostRecent.year;else var g=Mi.year;var h=null;$.each(Mi.centroids,function(a,b){b.iso_a3===d.iso&&(h=b.coordinates)});var i=a.mainValue;if(i>0&&4>i&&(i=3),i>29&&(i=30),null!=h&&0!=a.mainValue){var j='<div class="inner">'+d.country+", "+a.mainValue+"%</div>",k=L.circleMarker([h[1],h[0]],{radius:i,opacity:1,fillOpacity:.7,color:"#006DA1"});k.bindPopup(j,{autoPan:!0}),Mi.ratiosLayer.addLayer(k)}if(a.mainValue>0){$("#content").append('<div class="col-sm-4 col-md-3 col-xs-6 row-country" data-mi-ratio="'+a.mainValue+'"><div class="inner"><b>'+d.country+'</b><br><span class="mi-ratio-value"><a href="#country/ARG">'+a.mainValue+'%</a></span><span class="mi-ratio-label">'+d.name+'</span><div id="'+d.iso+'-chart" class="hchart"></div><span class="mi-crude-value">'+a.numberWithCommas(e)+' policies</span><span class="mi-year-value">Year: '+g+"</span></div></div>"),b++;var l=[],m=[];$.each(d.timeseries,function(a,b){0!=b.value&&(l.push(b.value),m.push(b.year))}),a.drawLineChart("#"+d.iso+"-chart",l,m,d.name)}}),2>b&&$("#content").append('<div class="col-md-12 no-data"><h2>No data</h2></div>'),$(".row-country").tsort({data:"mi-ratio",order:"desc"})},drawLineChart:function(a,b,c){$(a).highcharts({chart:{plotBorderColor:"#fff"},title:{text:"",x:-20},subtitle:{text:"",x:-20},xAxis:{categories:c},yAxis:{title:{text:""},labels:{enabled:!1},gridLineColor:"#fff"},credits:{enabled:!1},tooltip:{valueSuffix:"%"},legend:{layout:"vertical",align:"right",verticalAlign:"middle",borderWidth:0,enabled:!1},series:[{name:"Ratio",color:"#09AE8A",data:b}]})},numberWithCommas:function(a){return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")},capitalizeFirstLetter:function(a){return a.charAt(0).toUpperCase()+a.slice(1)}})}();