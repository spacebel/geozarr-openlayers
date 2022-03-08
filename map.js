let map;
//let projectionCode = "EPSG:32633";	
let projectionCode= "EPSG:32630";
//let projectionCode = "EPSG:4326";
const zoomMin = 0;
const zoomMax = 14;
let zoomLevel = 3;	
/**
	create a map to display the zarr image
*/
function createMap(){ 
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
	else if(projectionCode === 'EPSG:32630'){
		proj4.defs("EPSG:32630","+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}	
	
	var projection = ol.proj.get(projectionCode);
    let imageExtent = getZarrExtent()

    const mousePositionControl = new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(4),
		projection: projectionCode,
		className: 'custom-mouse-position',
		target: document.getElementById('mouse-position'),
	});
	
	/*
		display the image on the map by using OpenLayers
	*/			
	map = new ol.Map({
        controls: ol.control.defaults().extend([mousePositionControl]),
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM(),
			}),			
			new ol.layer.Image({
				source: new ol.source.ImageStatic({            
					url: imageURL,
					projection: projection,
					imageExtent: imageExtent
				})
			})
		],
		target: 'map',
		view: new ol.View({
			projection: projection,
			center: ol.extent.getCenter(imageExtent),
			zoom: zoomLevel,
			minZoom: zoomMin,
			maxZoom: zoomMax
		})
	});  

    return map;	
}

function refreshMapView(imageURL, zoomLevel){

    let imageExtent = getZarrExtent()

    //console.log(map.getView().getProjection().getCode());
	const newView = new ol.View({
        projection: projectionCode,
        center: ol.extent.getCenter(imageExtent),
        zoom: zoomLevel,
        minZoom: zoomMin,
        maxZoom: zoomMax
    });

    map.setView(newView);

    const newSource = new ol.source.ImageStatic({            
            url: imageURL,
            projection: projectionCode,
            imageExtent: imageExtent
        });

    //console.log(map.getView());
    map.getLayers().forEach(function (layer, i) {
        if (layer instanceof ol.layer.Image) {			
            layer.setSource(newSource);			
        }
    });	

}

function getMapZoom(){
    return map.getView().getZoom();
}

/**
 * Update Map Zoom
 */
function updateMapZoom(level){
    map.getView().setZoom(level);
}

/**
 * Set Zoom Level property
 */
function setDesiredZoomLevel(level){
    zoomLevel = level;
}

/**
 * Get Zoom Level property
 */
function getDesiredZoomLevel(){
    return zoomLevel;
}

function getMaxZoom(){
    return zoomMax;
}

function getMinZoom(){
    return zoomMin;
}

function onMapResolutionChange(callback){

    map.getView().on('change:resolution', callback);
}

function setProjectionCode(newCode){
	projectionCode = newCode;
}