let map;
let projCode = "EPSG:32633";
let extent = [];		
const zoomMin = 0;
const zoomMax = 14;
let zoomLevel = 9;	
/**
	create a map to display the zarr image
*/
function createMap(projectionCode){ 
	//console.log("Creating the map...");
	/*
		projection
	*/			
	if(projectionCode === 'EPSG:32628'){		
		proj4.defs("EPSG:32628","+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);		
	} else if(projectionCode === 'EPSG:32633'){
		proj4.defs("EPSG:32633","+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}
	
	var projection = ol.proj.get(projectionCode);
	
	/*
		display the image on the map by using OpenLayers
	*/			
	map = new ol.Map({
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM(),
			}),			
			new ol.layer.Image({
				source: new ol.source.ImageStatic({            
					url: imageURL,
					projection: projection,
					imageExtent: extent
				})
			})
		],
		target: 'map',
		view: new ol.View({
			projection: projection,
			center: ol.extent.getCenter(extent),
			zoom: zoomLevel,
			minZoom: zoomMin,
			maxZoom: zoomMax
		})
	});  

    return map;	
}

function refreshMapView(imageURL, projectionCode, extent, zoomLevel, zoomMin,zoomMax){

    //console.log(map.getView().getProjection().getCode());
	const newView = new ol.View({
        projection: projectionCode,
        center: ol.extent.getCenter(extent),
        zoom: zoomLevel,
        minZoom: zoomMin,
        maxZoom: zoomMax
    });

    map.setView(newView);

    const newSource = new ol.source.ImageStatic({            
            url: imageURL,
            projection: projectionCode,
            imageExtent: extent
        });

    //console.log(map.getView());
    map.getLayers().forEach(function (layer, i) {
        if (layer instanceof ol.layer.Image) {			
            layer.setSource(newSource);			
        }
    });	

}

function setMapZoom(zoomLevel){
    map.getView().setZoom(zoomLevel);
}