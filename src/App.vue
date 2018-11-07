<template>
<div>
    <div id="panel">
      <div id="color-palette"></div>
      <div>
        <button id="delete-button">Delete Selected Shape</button>
      </div>
    <div id="curpos"></div>
    <div id="cursel"></div>
    <div id="note"><small>Note: markers can be selected, but are not graphically indicated; can be deleted, but cannot have their color changed.</small></div>
    </div>
    <input id="pac-input" type="text" placeholder="Search Box">
    <div id="map">A</div>
</div>
</template>

<script>
import GoogleMapsLoader from "google-maps";
GoogleMapsLoader.KEY = "AIzaSyBhZEQAfHuYcYjtE4YsxLipcoOsT7EaULU";
GoogleMapsLoader.LANGUAGE = "ar";
GoogleMapsLoader.REGION = "SA";
GoogleMapsLoader.VERSION = "weekly";
GoogleMapsLoader.LIBRARIES = ["places", "drawing"];
export default {
  data() {
    return {
      center: {
        lat: 23.885942,
        lng: 45.079162
      },
      drawingManage: null,
      selectedShape: null,
      colors: ["#1E90FF", "#FF1493", "#32CD32", "#FF8C00", "#4B0082"],
      selectedColor: null,
      colorButtons: {},
      map: null, //= new google.maps.Map(document.getElementById('map'), {
      // these must have global refs too!:
      placeMarkers: [],
      input: null,
      searchBox: null,
      curposdiv: null,
      curseldiv: null,
      google: null
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const vm = this
      GoogleMapsLoader.load(google => {
        console.log(google)
        vm.google = google
        vm.map = new google.maps.Map(document.getElementById("map"), {
          //var
          zoom: 6, //10,
          center: new google.maps.LatLng(vm.center.lat, vm.center.lng), //(22.344, 114.048),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: false,
          zoomControl: true
        });
        vm.curposdiv = document.getElementById("curpos");
        vm.curseldiv = document.getElementById("cursel");
        var polyOptions = {
          strokeWeight: 0,
          fillOpacity: 0.45,
          editable: true
        };
        // Creates a drawing manager attached to the map that allows the user to draw
        // markers, lines, and shapes.
        vm.drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.POLYGON,
          markerOptions: {
            draggable: true,
            editable: true
          },
          polylineOptions: {
            editable: true
          },
          rectangleOptions: polyOptions,
          circleOptions: polyOptions,
          polygonOptions: polyOptions,
          map: vm.map
        });
        google.maps.event.addListener(
          vm.drawingManager,
          "overlaycomplete",
          function(e) {
            //~ if (e.type != google.maps.drawing.OverlayType.MARKER) {
            var isNotMarker = e.type != google.maps.drawing.OverlayType.MARKER;
            // Switch back to non-drawing mode after drawing a shape.
            vm.drawingManager.setDrawingMode(null);
            // Add an event listener that selects the newly-drawn shape when the user
            // mouses down on it.
            var newShape = e.overlay;
            newShape.type = e.type;
            google.maps.event.addListener(newShape, "click", function() {
              vm.setSelection(newShape, isNotMarker);
            });
            google.maps.event.addListener(newShape, "drag", function() {
              vm.updateCurSelText(newShape);
            });
            google.maps.event.addListener(newShape, "dragend", function() {
              vm.updateCurSelText(newShape);
            });
            vm.setSelection(newShape, isNotMarker);
            //~ }// end if
          }
        );
        // Clear the current selection when the drawing mode is changed, or when the
        // map is clicked.
        google.maps.event.addListener(
         vm.drawingManager,
          "drawingmode_changed",
          vm.clearSelection
        );
        google.maps.event.addListener(vm.map, "click", vm.clearSelection);
        google.maps.event.addDomListener(
          document.getElementById("delete-button"),
         "click",
          vm.deleteSelectedShape
        );
        vm.buildColorPalette();
        //~ initSearch();
        // Create the search box and link it to the UI element.
        vm.input /** @type {HTMLInputElement} */ = document.getElementById( //var
          "pac-input"
        );
        vm.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(vm.input);
        //
        var DelPlcButDiv = document.createElement("div");
        //~ DelPlcButDiv.style.color = 'rgb(25,25,25)'; // no effect?
        DelPlcButDiv.style.backgroundColor = "#fff";
        DelPlcButDiv.style.cursor = "pointer";
        DelPlcButDiv.innerHTML = "DEL";
        vm.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(DelPlcButDiv);
        google.maps.event.addDomListener(
          DelPlcButDiv,
          "click",
          vm.deletePlacesSearchResults
        );
        vm.searchBox = new google.maps.places.SearchBox( //var
          /** @type {HTMLInputElement} */ (vm.input)
        );
        // Listen for the event fired when the user selects an item from the
        // pick list. Retrieve the matching places for that item.
        google.maps.event.addListener(vm.searchBox, "places_changed", function() {
          var places = vm.searchBox.getPlaces();
          if (places.length == 0) {
            return;
          }
          for (let i = 0, marker; (marker = vm.placeMarkers[i]); i++) {
            marker.setMap(null);
          }
          // For each place, get the icon, place name, and location.
          vm.placeMarkers = [];
          var bounds = new google.maps.LatLngBounds();
          for (var j = 0, place; (place = places[j]); j++) {
            var image = {
              url: place.icon,
              size: new google.maps.Size(71, 71),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(17, 34),
              scaledSize: new google.maps.Size(25, 25)
            };
            // Create a marker for each place.
            var marker = new google.maps.Marker({
              map: vm.map,
              icon: image,
              title: place.name,
              position: place.geometry.location
            });
            vm.placeMarkers.push(marker);
            bounds.extend(place.geometry.location);
          }
          vm.map.fitBounds(bounds);
        });
        // Bias the SearchBox results towards places that are within the bounds of the
        // current map's viewport.
        google.maps.event.addListener(vm.map, "bounds_changed", function() {
          var bounds = vm.map.getBounds();
          vm.searchBox.setBounds(bounds);
          vm.curposdiv.innerHTML =
            "<b>curpos</b> Z: " +
            vm.map.getZoom() +
            " C: " +
            vm.map.getCenter().toUrlValue();
        }); //////////////////////
      });
    },
    clearSelection() {
      const vm = this;
      if (vm.selectedShape) {
        if (typeof vm.selectedShape.setEditable == "function") {
          vm.selectedShape.setEditable(false);
        }
        vm.selectedShape = null;
      }
      vm.curseldiv.innerHTML = "<b>cursel</b>:";
    },
    updateCurSelText() {
      const vm = this;
      let posstr = "" + vm.selectedShape.position;
      if (typeof vm.selectedShape.position == "object") {
        posstr = vm.selectedShape.position.toUrlValue();
      }
      let pathstr = "" + vm.selectedShape.getPath;
      if (typeof vm.selectedShape.getPath == "function") {
        pathstr = "[ ";
        for (var i = 0; i < vm.selectedShape.getPath().getLength(); i++) {
          // .toUrlValue(5) limits number of decimals, default is 6 but can do more
          vm.pathstr +=
            vm.selectedShape
              .getPath()
              .getAt(i)
              .toUrlValue() + " , ";
        }
        pathstr += "]";
      }
      let bndstr = "" + vm.selectedShape.getBounds;
      let cntstr = "" + vm.selectedShape.getBounds;
      if (typeof vm.selectedShape.getBounds == "function") {
        vm.selectedShape.getBounds();
        cntstr = "" + vm.tmpbounds.getCenter().toUrlValue();
        bndstr =
          "[NE: " +
          vm.tmpbounds.getNorthEast().toUrlValue() +
          " SW: " +
          vm.tmpbounds.getSouthWest().toUrlValue() +
          "]";
      }
     let cntrstr = "" + vm.selectedShape.getCenter;
      if (typeof vm.selectedShape.getCenter == "function") {
        cntrstr = "" + vm.selectedShape.getCenter().toUrlValue();
      }
      let radstr = "" + vm.selectedShape.getRadius;
      if (typeof vm.selectedShape.getRadius == "function") {
        radstr = "" + vm.selectedShape.getRadius();
      }
      vm.curseldiv.innerHTML =
        "<b>cursel</b>: " +
        vm.selectedShape.type +
        " " +
        vm.selectedShape +
        "; <i>pos</i>: " +
        posstr +
        " ; <i>path</i>: " +
        pathstr +
        " ; <i>bounds</i>: " +
        bndstr +
        " ; <i>Cb</i>: " +
        cntstr +
        " ; <i>radius</i>: " +
        radstr +
        " ; <i>Cr</i>: " +
        cntrstr;
    },
    setSelection(shape, isNotMarker) {
      const vm = this;
      vm.clearSelection();
      vm.selectedShape = shape;
      if (isNotMarker) shape.setEditable(true);
      vm.selectColor(shape.get("fillColor") || shape.get("strokeColor"));
      vm.updateCurSelText(shape);
    },
    deleteSelectedShape() {
      const vm = this;
      if (vm.selectedShape) {
        vm.selectedShape.setMap(null);
      }
    },
    selectColor(color) {
      const vm = this;
      vm.selectedColor = color;
      for (var i = 0; i < vm.colors.length; ++i) {
        var currColor = vm.colors[i];
        vm.colorButtons[currColor].style.border =
          currColor == color ? "2px solid #789" : "2px solid #fff";
      }
      // Retrieves the current options from the drawing manager and replaces the
      // stroke or fill color as appropriate.
      var polylineOptions = vm.drawingManager.get("polylineOptions");
      polylineOptions.strokeColor = color;
      vm.drawingManager.set("polylineOptions", polylineOptions);
      var rectangleOptions = vm.drawingManager.get("rectangleOptions");
      rectangleOptions.fillColor = color;
      vm.drawingManager.set("rectangleOptions", rectangleOptions);
      var circleOptions = vm.drawingManager.get("circleOptions");
      circleOptions.fillColor = color;
      vm.drawingManager.set("circleOptions", circleOptions);
      var polygonOptions = vm.drawingManager.get("polygonOptions");
      polygonOptions.fillColor = color;
      vm.drawingManager.set("polygonOptions", polygonOptions);
    },
    setSelectedShapeColor(color) {
      const vm = this;
      if (vm.selectedShape) {
        if (vm.selectedShape.type == vm.google.maps.drawing.OverlayType.POLYLINE) {
          vm.selectedShape.set("strokeColor", color);
        } else {
          vm.selectedShape.set("fillColor", color);
        }
      }
    },
    makeColorButton(color) {
      const vm = this;
      var button = document.createElement("span");
      button.className = "color-button";
      button.style.backgroundColor = color;
      vm.google.maps.event.addDomListener(button, "click", function() {
        vm.selectColor(color);
        vm.setSelectedShapeColor(color);
      });
      return button;
    },
    buildColorPalette() {
      const vm = this;
      var colorPalette = document.getElementById("color-palette");
      for (var i = 0; i < vm.colors.length; ++i) {
        var currColor = vm.colors[i];
        var colorButton = vm.makeColorButton(currColor);
        colorPalette.appendChild(colorButton);
        vm.colorButtons[currColor] = colorButton;
      }
      vm.selectColor(vm.colors[0]);
    },
    /////////////////////////////////////
    deletePlacesSearchResults() {
      const vm = this;
      for (var i = 0, marker; (marker = vm.placeMarkers[i]); i++) {
        marker.setMap(null);
      }
      vm.placeMarkers = [];
      vm.input.value = ""; // clear the box too
    }
  }
};
</script>
    <style>
#map,
html,
body {
  padding: 0;
  margin: 0;
  height: 100%;
}
#map {
  height: 500px;
}
#panel {
  width: 200px;
  font-family: Arial, sans-serif;
  font-size: 13px;
  float: right;
  margin: 10px;
}
#color-palette {
  clear: both;
}
.color-button {
  width: 14px;
  height: 14px;
  font-size: 0;
  margin: 2px;
  float: left;
  cursor: pointer;
}
#delete-button {
  margin-top: 5px;
}
</style>
