var planeIcon = L.icon({
    iconUrl: 'assets/images/plane.png',
    iconAnchor:   [15, 15] // point of the icon which will correspond to marker's location
});

var planeSelectedIcon = L.icon({
    iconUrl: 'assets/images/planeselected.png',
    iconAnchor:   [15, 15] // point of the icon which will correspond to marker's location
});

var planeLostIcon = L.icon({
    iconUrl: 'assets/images/planelost.png',
    iconAnchor:   [15, 15] // point of the icon which will correspond to marker's location
});

function Plane(map) {
    this.map = map;
    this.track = "0";
    this.marker = undefined;
    this.pendingUpdate = {};
    this.path = undefined;
    this.pathPoly = undefined;
    this.planeLost = false;
    this.lastLat = null;
    this.lastLon = null;
    this.inbound = undefined;
    this.thumb = $(
        "<div class='plane-entry'>"+
            "<div class='plane-heightcontainer'>"+
                "<img class='plane-image'>"+
                "<br>"+
                "<div class='plane-height'></div>"+
            "</div>"+
            "<div class='plane-fieldcontainer'>"+
                "<span class='plane-led' id='led'>&#9679;</span>"+
                "<span class='plane-registration' id='registration'></span>"+
                "<span class='plane-icao' id='hex'></span>"+
                "<div><span class='plane-flight' id='flight'>---</span></div>"+
                "<div><span class='plane-planetype' id='planeType'>---</span></div>"+
                "<div>"+
                    "<img src='assets/images/altitude.png' class='icon'><span class='plane-altitude' id='altitude'>---</span> ft&nbsp&nbsp"+
                    "<span class='plane-verticalspeed' id='vert_rate'>---</span> ft/min"+
                "</div>"+
                "<div>"+
                    "<img src='assets/images/speed.png' class='icon'><span class='plane-velocity' id='speed'>---</span> kts&nbsp&nbsp"+
                    "<img src='assets/images/heading.png' class='icon'><span class='plane-heading' id='track'>---</span>"+
                "</div>"+
                "<div>"+
                    "<img src='assets/images/position.png' class='icon'><span class='plane-latitude' id='lat'>---</span> - "+
                    "<span class='plane-longitude' id='lon'>---</span>"+
                "</div>"+
                "<div>"+
                    "<img id='distanceicon' src='assets/images/distance.png' class='icon'><span class='plane-distance' id='distance'>---</span> km&nbsp&nbsp"+
                    "<img src='assets/images/squawk.png' class='icon'><span class='plane-squawk' id='squawk'>---</span>"+
                "</div>"+
            "</div>"+
        "</div>").data("plane", this);
}

Plane.prototype.Select = function(selected) {
    if (this.marker) {
        this.marker.setIcon(selected?planeSelectedIcon:(this.planeLost?planeLostIcon:planeIcon));	
    }

    if (selected) {
        this.thumb.addClass('selected');
        if (this.path===undefined) {
            // It's the first time this plane is selected.
            // First retrieve the historical path data from the server
            $.getJSON('/track.json?hex='+this.hex, function(path) {
                this.path=[];
                for (var i=0; i<path.length; i++) {
                    this.path.push(new L.LatLng(parseFloat(path[i].lat), parseFloat(path[i].lon)));
                }
                // Check if this plane is still selected
                if (this.selected) {
                    this.pathPoly = L.polyline(this.path, {color: 'red'}).addTo(this.map);
                }
            }.bind(this));
        }
        else if (!this.pathPoly) {
            this.pathPoly = L.polyline(this.path, {color: 'red'}).addTo(this.map);
        }

    }
    else {
        this.thumb.removeClass('selected');
        if (this.pathPoly) {
            this.map.removeLayer(this.pathPoly);
            this.pathPoly = undefined;
        }
    }
    this.selected=selected;
}

Plane.prototype.Click = function(cb) {
    if (this.marker) {
        this.marker.on('click', cb);
    }
    this.clickCb = cb;
}

Plane.prototype.Update = function(data, home) {
    if (!this.flashTask && data.seen==0) {
        this.thumb.find(".plane-led").css('color','#f00');
        this.flashTask = setTimeout(function() {
            this.thumb.find(".plane-led").css('color','#000');
            this.flashTask=null;
        }.bind(this), 500);
    }

    if (data.seen<10) {
        if (this.planeLost) {
            this.thumb.removeClass('lost');
            if (this.marker) {
                this.marker.setIcon(planeIcon);	
            }
            this.planeLost = false;
        }
    }
    else {
        if (!this.planeLost) {
            this.thumb.addClass('lost');
            if (this.marker) {
                this.marker.setIcon(planeLostIcon);	
            }
            this.planeLost = true;
        }
        this.thumb.addClass('lost');
    }


    if (!this.staticInfoSet) {
        this.hex = data.hex;
        var uHex = data.hex.toUpperCase();
        if (planesInfo && uHex in planesInfo) {
            var planeInfo = planesInfo[uHex];
            this.thumb.find("#registration").text(planeInfo['registration']);

            var planeType = planeInfo['planeType'];	
            this.thumb.find("#planeType").text(planeType in planeTypes?planeTypes[planeType]:planeType);	
        }
        this.staticInfoSet = true;
    }


    if (data.validposition==1 && (this.lastLat!=data.lat || this.lastLon!=data.lon)) {
        this.lastLat = data.lat;
        this.lastLon = data.lon;
        var position = new L.LatLng(parseFloat(data.lat), parseFloat(data.lon));
        if (this.path!==undefined) {
            this.path.push(position);
        }
        if (this.pathPoly) {
            this.pathPoly.addLatLng(position);
        }

        if (this.marker) {
            this.marker.setLatLng(position)
        }
        else {
            this.marker = L.marker(position, {icon: this.planeLost?planeLostIcon:planeIcon, rotationAngle:parseInt(this.track)}).addTo(this.map)
                if (this.clickCb) {
                    this.marker.on('click', this.clickCb);
                }
        }
        if (home) {
            var rad = function(x) {
                return x * Math.PI / 180;
            };
            p1=home;
            p2=this.marker.getLatLng();
            var R = 6378137; // EarthÕs mean radius in meter
            var dLat = rad(p2.lat - p1.lat);
            var dLong = rad(p2.lng - p1.lng);
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
                Math.sin(dLong / 2) * Math.sin(dLong / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = (R * c)/1000;
            this.thumb.find("#distance").text(d.toFixed(2));
            if (this.distance) {
                var inbound = d<this.distance;
                if (inbound!==this.inbound) {
                    this.thumb.find("#distanceicon").attr('src', 'assets/images/'+(inbound?"distancein.png":"distanceout.png"));
                }
                this.inbound=inbound;
            }
            this.distance=d;
        }

    }	
    if (data.validtrack==1) {
        if (this.marker) {
            this.marker.setRotationAngle(90+parseInt(data.track));
        }
    }
    if (data.altitude) {
        var altitude = parseInt(data.altitude);
        var now = Date.now();
        if (this.lastAltTime==null) {
            this.lastAltTime=now;
            this.lastAlt = altitude;
        }
        else if (now-this.lastAltTime>5000) {
            this.verticalSpeed=Math.round((altitude-this.lastAlt)*60000/(now-this.lastAltTime));
            this.lastAlt=altitude;
            this.lastAltTime=now;
            var src='assets/images/planeleveled.png';
            if (this.verticalSpeed<-400)
                src='assets/images/planearrival.png';
            else if (this.verticalSpeed>400)
                src='assets/images/planedeparture.png';

            if (altitude>40000)
                altitude=40000;
            var height=100;//(this.element.fieldImg.parentNode.clientHeight-this.element.fieldImg.clientHeight);
            var offset=height-(height*altitude/40000);
            this.thumb.find(".plane-image").attr('src', src).css('top', offset+'px');
            this.thumb.find(".plane-height").css('top', (offset-4)+"px").css('height',(height-offset)+"px");
            this.thumb.find(".plane-heightcontainer").css('opacity','1');
        }
    }
    for (key in data) {
        this.thumb.find("#"+key).text(data[key]);
    }
}

Plane.prototype.GetThumb = function() {
    return this.thumb;	
}

Plane.prototype.Remove = function() {
    if (this.marker) {
        this.map.removeLayer(this.marker);
    }
    if (this.pathPoly) {
        this.map.removeLayer(this.pathPoly);
    }
}

