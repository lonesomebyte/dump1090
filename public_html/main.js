function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";               

    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

$(document).ready(function() {
    var planes = {}
    var homeLat = readCookie("homeLat");
    var homeLon = readCookie("homeLon");
    var selectedPlane = undefined;
    var setHome=false;
    
    var map = L.map('map').setView([0,0], 3);

    if (homeLat===null || homeLon===null) {
        homeLat=0;
        homeLon=0;
    }
    window.home = L.latLng(homeLat, homeLon);

    if (homeLat==0 && homeLon==0) {
        $("#homeCoordinates").text("Click here to set your home location");
    } else {
        $("#homeCoordinates").text(homeLat+" - "+homeLon);
    }

    var homeMarker = L.marker(window.home).addTo(map);
    map.setView(window.home, 8);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGludGluNzciLCJhIjoiY2owY2JzNTU5MDAyYzJ3cG9iNWZjc3V0bSJ9.pJfRIWh_4IP2P2A_jEQllQ', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoidGludGluNzciLCJhIjoiY2phZ2plOWZkMjVyOTM0cjF3YWNpazFkbiJ9.902XDjuAkuhbEZ62vGU07Q'
    }).addTo(map);

    map.on("click", function(evt) {
        if (setHome) {
            homeMarker.setLatLng(evt.latlng); 
            $("#homeCoordinates").text(evt.latlng.lat+" - "+evt.latlng.lng);
            setHome=false;
            createCookie("homeLat", evt.latlng.lat, 365);
            createCookie("homeLon", evt.latlng.lng, 365);
            window.home = L.latLng(evt.latlng.lat, evt.latlng.lng);
        }
    });
    $("#homeinfo").click(function(evt) {
        alert("Click on the map to set your home location");
        setHome=true;
    });

    setInterval(function() {
        $.getJSON('/dump1090/data.json', function(updates) {
            var reportedPlanes = [];
            for (var updateIdx=0; updateIdx<updates.length; updateIdx++) {
                var update = updates[updateIdx];
                reportedPlanes.push(update.hex);
                if (update.hex) {
                    if (!(update.hex in planes)) {
                        var plane = new Plane(map, update);
                        planes[update.hex] = plane;
                        $("#planethumbs").append(plane.GetThumb());
                        var selectHandler = function(evt) {
                            if (selectedPlane) {
                                selectedPlane.Select(false);
                            }   
                            selectedPlane = this;
                            this.Select(true);
                            // Make sure this thumb is visible, if not scroll
                            var thumb = selectedPlane.GetThumb();
                            var listview = thumb.parent();
                            var offset = thumb.position().top;
                            if ((offset<0) ||
                                (offset+thumb.height()>listview.height())) {
                                    listview.scrollTop(listview.scrollTop()+offset);
                            }
                        }.bind(plane);
                        plane.GetThumb().click(selectHandler);
                        plane.Click(selectHandler);
                    }   
                    planes[update.hex].Update(update, home);
                    //Sort the thumbs based on distance and inbound
                    $("#planethumbs").children().sort(function(a,b){
                        var plane_a = $(a).data('plane');
                        var plane_b = $(b).data('plane');
                        var dist_a = plane_a.distance===undefined?99999:(plane_a.inbound!==true?plane_a.distance+5000:plane_a.distance);
                        var dist_b = plane_b.distance===undefined?99999:(plane_b.inbound!==true?plane_b.distance+5000:plane_b.distance);
                        return dist_a-dist_b;
                    }).appendTo("#planethumbs");
                    $("#planecount").text(updates.length);
                }   
            }
            for (var hex in planes) {
                if (reportedPlanes.indexOf(hex)<0) {
                    planes[hex].Remove();
                    planes[hex].GetThumb().addClass('gone').on('transitionend webkitTransitionEnd oTransitionEnd', function(e) {
                        this.remove();
                    });
                }
            }
        }.bind(this));
    },1000);
});
