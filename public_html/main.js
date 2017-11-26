$(document).ready(function() {
    var planes = {}
    var home = L.latLng(50.81679, 5.18647)
    var selectedPlane = undefined;
    var zoomed = false;

    var map = L.map('map').setView([0,0], 3);

    if (home) {
        var marker = L.marker(home).addTo(map);
        map.setView(home, 8);
        zoomed = true;
    }

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidGludGluNzciLCJhIjoiY2owY2JzNTU5MDAyYzJ3cG9iNWZjc3V0bSJ9.pJfRIWh_4IP2P2A_jEQllQ', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoidGludGluNzciLCJhIjoiY2phZ2plOWZkMjVyOTM0cjF3YWNpazFkbiJ9.902XDjuAkuhbEZ62vGU07Q'
    }).addTo(map);


    setInterval(function() {
        $.getJSON('/dump1090/data.json', function(updates) {
            var reportedPlanes = [];
            for (var updateIdx=0; updateIdx<updates.length; updateIdx++)
            {
                var update = updates[updateIdx];
                reportedPlanes.push(update.hex);
                if (update.hex)
                {
                    if (!(update.hex in planes))
                    {
                        var plane = new Plane(map);
                        planes[update.hex] = plane;
                        $("#planethumbs").append(plane.GetThumb());
                        var selectHandler = function(evt) {
                            if (selectedPlane)
                            {
                                selectedPlane.Select(false);
                            }   
                            selectedPlane = this;
                            this.Select(true);
                        }.bind(plane);
                        plane.GetThumb().click(selectHandler);
                        plane.Click(selectHandler);
                    }   
                    planes[update.hex].Update(update, home);
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
