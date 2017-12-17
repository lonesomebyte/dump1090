function Plane(map, data) {
    this.map = map;
    this.track = "0";
    this.pendingUpdate = {};
    this.path = undefined;
    this.pathPoly = undefined;
    this.planeLost = false;
    this.lastLat = null;
    this.lastLon = null;
    this.inbound = undefined;
    this.icao=data.icao;
    var icons = {};
    icons["a380"]=["A388","A380","A389","A225"];
    icons["b747"]=["B741","B742","B743","B744","B74F","B74S","B748","BCLF","BLCF"];
    icons["a320"]=["A318","A319","A320","A321","A148","A158","BCS1","BCS3","A19N","A20N","A21N"];
    icons["b737"]=["B731","B732","B733","B734","B735","B736","B737","B738","B739","E170","E190","A300","A30B","A306","A310","SU95","E75S","E75L","B37M","B38M","B39M","E195"];
    icons["b777"]=["B772","B773","B77F","B77L","B77W","B78X","A35K"];
    icons["b757"]=["B752","B753","T204","T214"];
    icons["b767"]=["B762","B763","B764"];
    icons["a330"]=["A332","A333","A359","B788","B789","A3ST"];
    icons["a343"]=["A342","A343","IL76","IL86","IL96","K35R","A124"];
    icons["a346"]=["A345","A346"];
    icons["rjx"]=["RJ1H","RJ70","RJ85","B461","B462","B463","AN12","C130","C30J","A400"];
    icons["md11"]=["MD11","DC10"];
    icons["helo"]=["A002","A109","A119","A129","A139","A149","A169","A189","ALH","ALO2","ALO3","AS32","AS3B","AS50","AS55","AS65","B06","B06T","B105","B212","B222","B230","B407","B412","B427","B429","B430","B47G","B47J","BK17","BSTP","EC20","EC25","EC30","EC35","EC45","EC55","EC75","EC155","EH10","EXPL","FREL","GAZL","H2","H269","H47","H500","H53","H53S","H60","H64","HUCO","KA32","KA50","KA52","KMAX","LAMA","LYNX","MI26","MI38","MI8","NH90","OH1","PUMA","R22","R44","R66","RVAL","S61","S61R","S76","S92","SUCO","TIGR","UH1","UH1Y","V22","G2CA","GYRO"];
    icons["md80"]=["MD80","MD81","MD82","MD83","MD87","MD88","MD90","B712","B717","B722","CRJ","CRJX","CRJ1","CRJ2","CRJ7","CRJ9","DC91","DC93","DC95","E45X","E135","E145","E35L","F70","F100","T154","YK42"];
    icons["sb20"]=["CL2T","DA62","C27J","SB20","SF34","AN26","ATP","AT42","AT72","AT43","AT44","AT45","AT46","AT73","AT74","AT75","AT76","B190","B350","BE99","CVLP","CVLT","D228","D328","DC3","DC3T","DC6","DHC6","DHC7","DH8A","DH8B","DH8C","DH8D","E110","E120","F50","G159","JS31","JS32","JS41","SH33","SH36","SW4","J328","AC50","AC90","AC95","AEST","BE10","BE20","BE30","BE50","BE55","BE56","BE58","BE60","BE65","BE76","BE80","BE95","BE96","BE9L","BE9T","C303","C310","C320","C340","C402","C404","C414","C421","C425","C441","C21T","DA42","MU2","PA23","PA27","PA30","PA31","PA34","PA44","PA60","PAY1","PAY2","PAY3","PAY4","P34A","P180","SW2","SW3","STAR","C212","F406","L410","P68","BN2P","P06T","PA23","PA27","C72R","B58T"];
    icons["lj45"]=["ASTR","BE40","C500","C501","C510","C525","C25A","C25B","C25C","C550","C551","C55B","C560","C56X","C650","C680","C750","CL30","CL35","CL60","EA50","E50P","E55P","FA10","FA20","FA30","FA40","FA50","FA7X","FA8X","F900","F2TH","GALX","GLF2","GLF3","GLF4","GLF5","GL5T","GLF6","GLEX","G150","G200","G250","G280","HA4T","H25B","H25X","H25C","LJ25","LJ31","LJ35","LJ36","LJ40","LJ45","LJ55","LJ60","LJ85","LRJ","MU30","PRM1","SBR1","SBR2","WW24","LJ70","LJ75","E550","E545","LJ75","EA55","C68A","C25M"];
    icons["c172"]=["A210","D400","DA20","DIMO","ECHO","EVSS","GLST","PZ3T","TL20","AA5","AC11","BE23","BE24","BE33","BE35","BE36","C10T","C42","C77R","C82R","C150","C152","C160","C162","C170","C172","C175","C177","C180","C182","C205","C206","C207","C208","C210","C337","C82S","COL3","COL4","DA40","DV20","EVOL","FBA2","FDCT","GA8","GLAS","GP4","G58","G115","JAB4","KODI","LNC2","LNC4","M20P","M20T","MO20","NAVI","PA22","PA24","PA28","PA32","PA38","PA46","PC12","PC21","P28","P28A","P28B","P28R","P32R","P32T","P46T","P210","RV4","RV6","RV7","RV8","RV9","RV10","RV12","S208","SR20","SR22","TBM7","TBM8","TRIN","Z42","WT9","GLID","PC6T","PC7","PC9","DR40","TB20","TB21","S22T","P28T","P750","PA25","TOBA","TAMP","AN2","AP22","AT8T","BL8","HUSK","T210","TBM9","B36T","PA18","T206","EV97","C240","E314","HR20","CRUZ","P28U","DH60","SIRA","PA18","BT36","C185"];
    this.icon = "default";
    if (this.icao) {
        for (var type in icons) {
            if (icons[type].indexOf(this.icao.toUpperCase())>=0) {
                this.icon=type;
                break;
            }
        } 
    }

    this.marker = L.marker(L.latLng([0,0]), {icon: L.icon({iconUrl:'assets/images/planes/'+this.icon+".png", iconAnchor:[20,20]}), rotationAngle:parseInt(this.track)});

    this.thumb = $(
        "<div class='plane-entry'>"+
            "<div class='plane-heightcontainer'>"+
                "<img src='assets/images/planeleveled.png' class='plane-image'>"+
                "<br>"+
                "<div class='plane-height'></div>"+
            "</div>"+
            "<div class='plane-fieldcontainer'>"+
                "<span class='plane-led' id='led'>&#9679;</span>"+
                "<span class='plane-registration' id='registration'></span>"+
                "<span class='plane-icao' id='hex'></span>"+
                "<div>"+
                    "<span class='plane-from'><img src='assets/images/planefrom.png'><span id='from'></span></span>"+
                    "<span class='plane-to'><span id='to'></span><img src='assets/images/planeto.png'></span>"+
                    "<span class='plane-flight' id='flight'>---</span>"+
                "</div>"+
                "<div><span class='plane-airline' id='airline'>&nbsp;<span></div>"+
                "<div><span class='plane-planetype' id='planeType'>---</span></div>"+
                "<table class='infotable'>"+
                    "<tr>"+
                        "<td><img src='assets/images/altitude.png' class='icon'><span class='plane-altitude' id='altitude'>---</span> ft</td>"+
                        "<td><span class='plane-verticalspeed' id='vert_rate'>---</span> ft/min</td>"+
                    "</tr>"+
                    "<tr>"+
                        "<td><img src='assets/images/speed.png' class='icon'><span class='plane-velocity' id='speed'>---</span> kts</td>"+
                        "<td><img src='assets/images/heading.png' class='icon'><span class='plane-heading' id='track'>---</span></td>"+
                    "</tr>"+
                    "<tr>"+
                        "<td><img src='assets/images/position.png' class='icon'><span class='plane-latitude' id='lat'>---</span></td>"+
                        "<td><span class='plane-longitude' id='lon'>---</span></td>"+
                    "</tr>"+
                    "<tr>"+
                        "<td><img id='distanceicon' src='assets/images/distance.png' class='icon'><span class='plane-distance' id='distance'>---</span></td>"+
                        "<td><img src='assets/images/squawk.png' class='icon'><span class='plane-squawk' id='squawk'>---</span></td>"+
                    "</tr>"+
                "</table>"+
            "</div>"+
        "</div>").data("plane", this);
    this.hex = data.hex;
    this.airline = data.airline;
    if (data.hex) {
        this.thumb.find("#hex").text(data.hex);
    }
    if (data.reg) {
        this.thumb.find("#registration").text(data.reg);
    }
    if (data.icao) {
        this.thumb.find("#planeType").text(data.icao in planeTypes?planeTypes[data.icao]:data.icao);	
    }
    if (data.airline) {
        this.thumb.find("#airline").text(data.airline);	
    }
}

Plane.prototype.Select = function(selected) {
    this.marker.setIcon(L.icon({iconUrl:'assets/images/planes/'+this.icon+(selected?"_selected.png":".png"), iconAnchor:[20,20]}));
    //Check if marker is visible on map.
    if (this.map.hasLayer(this.marker) && this.map.getBounds().contains(this.marker.getLatLng())==false) {
        this.map.setView(this.marker.getLatLng());
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
    this.marker.on('click', cb);
}

Plane.prototype.Update = function(data) {
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
            this.marker.setIcon(L.icon({iconUrl:'assets/images/planes/'+this.icon+".png", iconAnchor:[20,20]}));
            this.planeLost = false;
        }
    }
    else {
        if (!this.planeLost) {
            this.thumb.addClass('lost');
            this.marker.setIcon(L.icon({iconUrl:'assets/images/planes/'+this.icon+"_lost.png", iconAnchor:[20,20]}));
            
            this.planeLost = true;
        }
        this.thumb.addClass('lost');
    }

    // Check if alarm status has changed and update if needed
    if (data.alarm!==this.alarm) {
        this.alarm=data.alarm;
        if (this.alarm!=="0") {
            this.thumb.addClass('alarm');
            var audio = new Audio("assets/sounds/notification.mp3");
            audio.play();
        } else {
            this.thumb.removeClass('alarm');
        }
    }

    // Update position if changed
    if (data.lat && (this.lastLat!=data.lat || this.lastLon!=data.lon)) {
        // Check if a marker for this plane is added to the map
        if (!this.map.hasLayer(this.marker)) {
            this.marker.addTo(this.map);
        } 
        this.lastLat = data.lat;
        this.lastLon = data.lon;
        var position = new L.LatLng(parseFloat(data.lat), parseFloat(data.lon));

        this.thumb.find("#lat").text(data.lat);
        this.thumb.find("#lon").text(data.lon);

        // We only push new coordinates to the flight path once we
        // received the full path from the server.
        if (this.path!==undefined) {
            this.path.push(position);
            if (this.pathPoly) {
                this.pathPoly.addLatLng(position);
            }
        }

        this.marker.setLatLng(position)

        // If the home location is known, calculate the distance between plane and home
        if (window.home) {
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
            // Check if the plane is approaching
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
    // Check if the track has changed
    if (data.track && data.track!==this.track) {
        this.track=data.track;
        this.thumb.find("#track").text(data.track);
        this.marker.setRotationAngle(parseInt(data.track));
    }

    if (data.vert_rate && data.vert_rate!=this.vert_rate) {
        this.vert_rate = data.vert_rate;
        var src='assets/images/planeleveled.png';
        if (this.vert_rate<-400)
            src='assets/images/planearrival.png';
        else if (this.vert_rate>400)
            src='assets/images/planedeparture.png';

        if (this.planeHeightIcon!=src) {
            this.planeHeightIcon=src;
            this.thumb.find(".plane-image").attr('src', src);
        }

        this.thumb.find("#vert_rate").text(this.vert_rate);
    }

    // Check the altitude
    if (data.altitude && data.altitude!==this.altitude) {
        this.altitude=data.altitude;
        var altitude = parseInt(data.altitude);
        this.thumb.find("#altitude").text(this.altitude);

        if (altitude>40000)
            altitude=40000;
        var height=100;//(this.element.fieldImg.parentNode.clientHeight-this.element.fieldImg.clientHeight);
        var offset=height-(height*altitude/40000);
        this.thumb.find(".plane-height").css('top', (offset-4)+"px").css('height',(height-offset)+"px");
        this.thumb.find(".plane-heightcontainer").css('opacity','1');
        this.thumb.find(".plane-image").css('top', offset+'px');
    }

    if (data.flight && this.flight!=data.flight) {
        this.flight=data.flight;
        this.thumb.find("#flight").text(data.flight);
    }

    if (data.speed && this.speed!=data.speed) {
        this.speed=data.speed;
        this.thumb.find("#speed").text(data.speed);
    }

    if (data.squawk && this.squawk!=data.squawk) {
        this.squawk=data.squawk;
        this.thumb.find("#squawk").text(data.squawk);
    }
    if (data.route && this.route!=data.route) {
        this.route = data.route;
        var spl = this.route.split("-");
        this.routeFrom = spl[0]
        this.routeTo = spl[spl.length-1];
        this.thumb.find("#from").text(this.routeFrom);
        this.thumb.find("#to").text(this.routeTo);
    }
}

Plane.prototype.GetThumb = function() {
    return this.thumb;	
}

Plane.prototype.Remove = function() {
    this.map.removeLayer(this.marker);
    if (this.pathPoly) {
        this.map.removeLayer(this.pathPoly);
    }
}

