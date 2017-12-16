
function arrayToCount(arr) {
    var occurrences = {};
    for (var i = 0; i < arr.length; i++) {
          var num = arr[i];
          occurrences[num] = occurrences[num] ? occurrences[num] + 1 : 1;
    }
    return occurrences;
}

function dictToArray(dict, keyName, valName, sort)
{
    var arr=[];
    for (var k in dict) {
        var d={};
        d[keyName]=isNaN(k)?k:parseInt(k);
        d[valName]=dict[k];
        arr.push(d);
    }
    if (sort!==undefined) {
        arr.sort(function(a,b){return a[sort]<b[sort]?1:a[sort]>b[sort]?-1:0});
    }
    return arr;
}

liveStatisticsProvider = {
    fetch: function(cb) {
        var types = [];
        var altitudes = [];
        var distances = [];
        var airlines = [];
        var speeds = [];
        var maxDistance = undefined;
        var minDistance = undefined;
        var maxAltitude = undefined;
        var minAltitude = undefined;
        var maxSpeed = undefined;
        var minSpeed = undefined;
        for (var hex in planes) {
            var icao = planes[hex].icao;
            types.push(icao in planeTypes?planeTypes[icao]:icao);
            if (!isNaN(planes[hex].altitude)) {
                var altitude = parseInt(planes[hex].altitude);
                if (maxAltitude===undefined || altitude>maxAltitude) {maxAltitude=altitude;} 
                if (minAltitude===undefined || altitude<minAltitude) {minAltitude=altitude;} 
                altitudes.push(parseInt((altitude+500)/1000)*1000);
            }
            if (!isNaN(planes[hex].distance)) {
                var distance = parseInt(planes[hex].distance);
                if (maxDistance===undefined || distance>maxDistance) {maxDistance=distance;} 
                if (minDistance===undefined || distance<minDistance) {minDistance=distance;} 
                var div = distance<100?20:50;
                distance = (parseInt(distance / div)+1)*div;
                distances.push(distance);
            }
            if (!isNaN(planes[hex].speed)) {
                var speed = parseInt(planes[hex].speed);
                if (maxSpeed===undefined || speed>maxSpeed) {maxSpeed=speed;} 
                if (minSpeed===undefined || speed<minSpeed) {minSpeed=speed;} 
                var div=40;
                speed = (parseInt(speed / div)+1)*div;
                speeds.push(speed);
            }
            airlines.push(planes[hex].airline);
        }
        altitudes = dictToArray(arrayToCount(altitudes),'altitude','count','altitude');
        distances = dictToArray(arrayToCount(distances),'distance','count','distance');
        speeds = dictToArray(arrayToCount(speeds),'speed','count','speed');
        airlines = arrayToCount(airlines);
        var airlineCount = Object.keys(airlines).length;
        airlines = dictToArray(airlines,'airline','count','count');
        var statistics = {'planeTypes':{'total':Object.keys(planes).length, 'types':dictToArray(arrayToCount(types),'type','count', 'count')},
                          'airlines':{'total':airlineCount, 'airlines':airlines},
                          'altitudes':{'highest':maxAltitude?maxAltitude:'---', 'lowest':minAltitude?minAltitude:'---', 'altitudes':altitudes},
                          'distances':{'farthest':maxDistance?maxDistance:'---', 'closest':minDistance?minDistance:'---', 'distances':distances},
                          'speeds':{'fastest':maxSpeed?maxSpeed:'---', 'slowest':minSpeed?minSpeed:'---', 'speeds':speeds}};
        cb(statistics);
    }
}

var statisticsProvider = liveStatisticsProvider;

function refresh(statistics) {
    function updateElement(el, data) {
        for (var field in data) {
            if ($.isArray(data[field])) {
                var listEl = el.find("*[data-field='"+field+"']");
                var template = listEl.data('template');
                if (!template) {
                    template = listEl.find(".list-item");
                    template.find("*[data-field]").text("");
                    listEl.data('template', template);
                }
                listEl.find(".list-item").remove();
                for (var idx in data[field]) {
                    var row = template.clone(true);
                    updateElement(row,data[field][idx]);
                    listEl.append(row);
                }
            }
            else {
                el.find("*[data-field='"+field+"']").text(data[field]); 
            }
        }
    }

    for (var statistic in statistics) {
        var data=statistics[statistic];
        var pane=$("#statistics>#"+statistic);
        updateElement(pane, data);
    }
}

function showStatistics() {
    function addPane(statistic, pane) {
        $("#statistics").append(pane.attr('id',statistic));
    }

    statisticsProvider.fetch(function(statistics) {
        for (var statistic in statistics) {
            switch (statistic) {
                case 'planeTypes':
                    addPane(statistic, $(
                        "<div class='pane'>"+
                            "<div class='title'><span class='number big' data-field='total'></span> planes</div>"+
                            "<table class='list' data-field='types'><tr class='list-item'><td class='number' data-field='count'></td> <td data-field='type'></td></tr></table>"+
                        "</div>"));
                    break;
                case 'altitudes':
                    addPane(statistic, $(
                        "<div class='pane'>"+
                            "<table class='centered'><tr><th class='big'>Highest</th><th class='big'>Lowest</th></tr><tr><td class='number big' data-field='highest'></td><td class='number big' data-field='lowest'></td></tr></table>"+
                            "<table class='list' data-field='altitudes'><tr><th>#</th><th>Altitude</th></tr><tr class='list-item'><td class='number' data-field='count'></td><td><span data-field='altitude'></span> ft</td></tr></table>"+
                        "</div>"));
                    break;
                case 'speeds':
                    addPane(statistic, $(
                        "<div class='pane'>"+
                            "<table class='centered'><tr><th class='big'>Fastest</th><th class='big'>Slowest</th></tr><tr><td class='number big' data-field='fastest'></td><td class='number big' data-field='slowest'></td></tr></table>"+
                            "<table class='list' data-field='speeds'><tr><th>#</th><th>Speed</th></tr><tr class='list-item'><td class='number' data-field='count'></td><td><span data-field='speed'></span> kts</td></tr></table>"+
                        "</div>"));
                    break;
                case 'distances':
                    addPane(statistic, $(
                        "<div class='pane'>"+
                            "<table class='centered'><tr><th class='big'>Farthest</th><th class='big'>Closest</th></tr><tr><td class='number big' data-field='farthest'></td><td class='number big' data-field='closest'></td></tr></table>"+
                            "<table class='list' data-field='distances'><tr><th>#</th><th>Distance</th></tr><tr class='list-item'><td class='number' data-field='count'></td><td><span data-field='distance'></span> km</td></tr></table>"+
                        "</div>"));
                    break;
                case 'airlines':
                    addPane(statistic, $(
                        "<div class='pane'>"+
                            "<div class='title'><span class='number big' data-field='total'></span> airlines</div>"+
                            "<table class='list' data-field='airlines'><tr class='list-item'><td class='number' data-field='count'></td> <td data-field='airline'></td></tr></table>"+
                        "</div>"));
                            
            }
        }
        refresh(statistics);
    });
}

function updateStatistics() {
    statisticsProvider.fetch(function(statistics) {
        refresh(statistics);
    });
}


