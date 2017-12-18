var lastUpdate;
var statisticsCallback;

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
        d[valName]={'value':dict[k].length,'meta':{'planes':dict[k]}};
        arr.push(d);
    }
    if (sort!==undefined) {
        arr.sort(function(a,b){return a[sort]['value']<b[sort]['value']?1:a[sort]['value']>b[sort]['value']?-1:0});
    }
    return arr;
}

liveStatisticsProvider = {
    fetch: function(cb) {
        var types = {};
        var airlines = {};
        var maxDistance = {'value':'---', 'meta':{'planes':[]}};
        var minDistance = {'value':'---', 'meta':{'planes':[]}};
        var maxAltitude = {'value':'---', 'meta':{'planes':[]}};
        var minAltitude = {'value':'---', 'meta':{'planes':[]}};
        var maxSpeed = {'value':'---', 'meta':{'planes':[]}};
        var minSpeed = {'value':'---', 'meta':{'planes':[]}};
        var airports = {}; 
        for (var hex in planes) {
            var plane = planes[hex];
            var icao = planes[hex].icao;
            var t = icao in planeTypes?planeTypes[icao]:icao;
            t in types?types[t].push(plane):types[t]=[plane];
            if (planes[hex].routeTo) {
                var a=planes[hex].routeTo;
                a in airports?airports[a].push(plane):airports[a]=[plane];
                var a=planes[hex].routeFrom;
                a in airports?airports[a].push(plane):airports[a]=[plane];
            }
            if (!isNaN(planes[hex].altitude)) {
                var altitude = parseInt(planes[hex].altitude);
                if (isNaN(maxAltitude['value']) || altitude>maxAltitude['value']) {maxAltitude={'value':altitude,'meta':{'planes':[plane]}};} 
                if (isNaN(minAltitude['value']) || altitude<minAltitude['value']) {minAltitude={'value':altitude,'meta':{'planes':[plane]}};} 
            }
            if (!isNaN(planes[hex].distance)) {
                var distance = parseInt(planes[hex].distance);
                if (isNaN(maxDistance['value']) || distance>maxDistance['value']) {maxDistance={'value':distance,'meta':{'planes':[plane]}};} 
                if (isNaN(minDistance['value']) || distance<minDistance['value']) {minDistance={'value':distance,'meta':{'planes':[plane]}};} 
            }
            if (!isNaN(planes[hex].speed)) {
                var speed = parseInt(planes[hex].speed);
                if (isNaN(maxSpeed['value']) || speed>maxSpeed['value']) {maxSpeed={'value':speed,'meta':{'planes':[plane]}};} 
                if (isNaN(minSpeed['value']) || speed<minSpeed['value']) {minSpeed={'value':speed,'meta':{'planes':[plane]}};} 
            }
            var a = planes[hex].airline;
            a in airlines?airlines[a].push(plane):airlines[a]=[plane];
        }
        var airlineCount = Object.keys(airlines).length;
        airlines = dictToArray(airlines,'airline','count','count');
        var statistics = {'planeTypes':{'total':Object.keys(planes).length, 'types':dictToArray(types,'type','count', 'count')},
                          'airlines':{'total':airlineCount, 'airlines':airlines},
                          'airports':{'total':Object.keys(airports).length, 'airports':dictToArray(airports,'airport','count','count')},
                          'altitudes':{'highest':maxAltitude, 'lowest':minAltitude},
                          'distances':{'farthest':maxDistance, 'closest':minDistance},
                          'speeds':{'fastest':maxSpeed, 'slowest':minSpeed}};
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
                if (typeof(data[field])==='object') {
                    el.find("*[data-field='"+field+"']")
                        .text(data[field]['value'])
                        .addClass('clickable')
                        .data('meta',data[field]['meta'])
                        .unbind('click')
                        .click(function(evt){
                            if (statisticsCallback) {statisticsCallback(evt, $(evt.currentTarget).data('meta'))}
                        }); 
                }
                else {
                    el.find("*[data-field='"+field+"']").text(data[field]); 
                }
            }
        }
    }

    for (var statistic in statistics) {
        var data=statistics[statistic];
        var pane=$("#statistics .statisticElement#"+statistic);
        updateElement(pane, data);
    }
}

function showStatistics(cb) {
    statisticsCallback=cb;
    function addElement(statistic, pane, parent) {
        parent = parent || $("#statistics");
        parent.append(pane.addClass("statisticElement").attr('id',statistic));
    }

    $("#statistics>#minmax").remove();
    $("#statistics").append($("<div class='pane'><table id='minmax'></table></div>"));

    statisticsProvider.fetch(function(statistics) {
        for (var statistic in statistics) {
            switch (statistic) {
                case 'planeTypes':
                    addElement(statistic, $(
                        "<div class='pane'>"+
                            "<div class='title'><span class='number big' data-field='total'></span> planes</div>"+
                            "<table class='list' data-field='types'><tr class='list-item'><td class='number' data-field='count'></td> <td data-field='type'></td></tr></table>"+
                        "</div>"));
                    break;
                case 'airports':
                    addElement(statistic, $(
                        "<div class='pane'>"+
                            "<div class='title'><span class='number big' data-field='total'></span> airports</div>"+
                            "<table class='list' data-field='airports'><tr class='list-item'><td class='number' data-field='count'></td> <td data-field='airport'></td></tr></table>"+
                        "</div>"));
                    break;
                case 'altitudes':
                    addElement(statistic, $(
                       "<tr><th>Highest</th><th>Lowest</th></tr><tr><td class='number medium'><span data-field='highest'>---</span>ft</td><td class='number medium'><span data-field='lowest'>---</span>ft</td></tr></table>"),
                        $("#statistics #minmax"));
                    break;
                case 'speeds':
                    addElement(statistic, $(
                        "<tr><th>Fastest</th><th>Slowest</th></tr><tr><td class='number medium'><span data-field='fastest'>---</span>kts</td><td class='number medium'><span data-field='slowest'>---</span>kts</td></tr></table>"),
                        $("#statistics #minmax"));
                    break;
                case 'distances':
                    addElement(statistic, $(
                        "<tr><th>Farthest</th><th>Closest</th></tr><tr><td class='number medium'><span data-field='farthest'>---</span>km</td><td class='number medium'><span data-field='closest'>---</span>km</td></tr></table>"),
                        $("#statistics #minmax"));
                    break;
                case 'airlines':
                    addElement(statistic, $(
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
    if (lastUpdate && new Date()-lastUpdate<10000) {
        return;
    }
    lastUpdate = new Date();
    statisticsProvider.fetch(function(statistics) {
        refresh(statistics);
    });
}


