/*
	This function will be called at startup
*/
async function startup(){
	//var zarrUrl = "https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_quicklook3";
	
	var zarrUrl = "https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/ndvi/c_gls_NDVI_202006010000_GLOBE_PROBAV_V2.2.1_subset.zarr";	
	
	var redBand = "NDVI";
	var greenBand = "NDVI";
	var blueBand = "NDVI";		
	
	const rgbBands = ({ '': [redBand, greenBand, blueBand] });	
	var projName = "EPSG:4326";	
	var scaleFactor = 1;

	/*
		set default values to input fields
	*/
	setInputValue('zarrUrl',zarrUrl);		
	setInputValue('redBand',redBand);
	setInputValue('greenBand',greenBand);
	setInputValue('blueBand',blueBand);
		
	// call loadZarr(...) function
	await loadZarr(zarrUrl,rgbBands,scaleFactor);
	
	// create a map to display the zarr image
	createMap(projName,extent);
	
	//map.getView().fit(extent);
		
	setCurrentZoomButton();
}

/**
	This function will be called when user click on "Zoom" buttons
*/

async function changeZoomLevel(targetZoomLevel){
	zoomLevel = targetZoomLevel;
	applyChange();
	map.getView().setZoom(zoomLevel);
	
	// disable the current zoom button
	for(var i = 1; i <= 9; i++){
		var btn = document.getElementById('zoomBtn' + i);
		if(btn){
			if(i != targetZoomLevel){
				btn.disabled = false;
				btn.style.backgroundColor = "#17a2b8";
			}
		}
	}
}
/**
	This function will be called when user click on "Apply" button to reload Zarr image with new input info
*/

async function applyChange(){
	const loadingBar = document.getElementById('loadingBar');
	loadingBar.style.display = 'table';
	
	var zarrUrl = getInputValue('zarrUrl');
	//console.log("zarrUrl = " + zarrUrl);		
	
	var redBand = getInputValue('redBand');
	var greenBand = getInputValue('greenBand');
	var blueBand = getInputValue('blueBand');
	const rgbBands = ({ '': [redBand, greenBand, blueBand] });		
	
	var scaleFactor = 1;
	var projCode = "EPSG:4326";	
	
	// call loadZarr(...) function
	await loadZarr(zarrUrl,rgbBands,scaleFactor);
	
	/*
		projection
	*/
	
	if(projCode === 'EPSG:32628'){
		//console.log("proj28");		
		proj4.defs("EPSG:32628","+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");	
		ol.proj.proj4.register(proj4);
	} else if(projCode === 'EPSG:32633'){
		//console.log("proj33");
		proj4.defs("EPSG:32633","+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}
	
	//proj4.defs(projCode, map.getView().getProjection().getCode());
	//ol.proj.proj4.register(proj4);
	
	var projection = ol.proj.get(projCode);
	//console.log(projection);
	//console.log("new extent = " + extent);
	
	//console.log(map.getView().getProjection().getCode());
	const newView = new ol.View({
			projection: projCode,
			center: ol.extent.getCenter(extent),
			zoom: zoomLevel,
			minZoom: zoomMin,
			maxZoom: zoomMax
		});
	map.setView(newView);
	
	const newSource = new ol.source.ImageStatic({            
			url: imageURL,
			projection: projCode,
			imageExtent: extent
		});
	
	//console.log(map.getView());
	map.getLayers().forEach(function (layer, i) {
		if (layer instanceof ol.layer.Image) {			
			layer.setSource(newSource);			
		}
	});	
	
	//map.getView().fit(extent);
	
	map.getView().on('change:resolution', (event) => {
		var zoom = Math.round(map.getView().getZoom()); 
		//console.log("Zoom level: " + map.getView().getZoom());
		
		if(zoom != zoomLevel){			
			console.log("Change zoom level from " + zoomLevel + " to " + zoom);
			zoomLevel = zoom;
			changeZoomLevel(zoom);
		}		
	});
	
	
	loadingBar.style.display = 'none';
	setCurrentZoomButton();
}

/*
	An async function to read Zarr data and then convert it into an image
*/	
async function loadZarr(zarrUrl,rgbBands,scaleFactor) {	
	// asynchronous load 
	arrays = await Promise.all(
	
		// iterate rgbBands array
		Object.entries(rgbBands).map(async ([w,paths]) => {
		
		// declare the store points to highest group e.g.: $zarrUrl/maja_v2
		const store = new zarr.HTTPStore(zarrUrl);
		
		// open group
		const grp = await zarr.openGroup(store);
		
		// read all groups: B4/band_data, B3/band_data and B2/band_data and then concatenate them (flat()) into an array
		const arrs = await Promise.all(
		  paths.map(async p => {
			const name = `${p}`;
			//console.log("name:" + name);				
			//const arr = await grp.getItem(p + '/band_data');
			const arr = await grp.getItem(zoomLevel + "/" + p);
			
			/*
				read minX, minY, maxX, maxY from x and y to compute the extent
			*/	
			
			var minx,miny,maxx,maxy;
			// read x data to extract minX and maxX
			//const xData = await grp.getItem(p + '/x');
			const xData = await grp.getItem(zoomLevel + "/lon");
			if(xData){
				const xValues = await xData.getRaw(null);
				minx = xValues.data[0];
				maxx = xValues.data[xValues.data.length - 1];
			}
			
			// read y data to extract minY and maxY
			//const yData = await grp.getItem(p + '/y');
			const yData = await grp.getItem(zoomLevel + "/lat");
			if(yData){
				const yValues = await yData.getRaw(null);
				miny = yValues.data[yValues.data.length - 1];
				maxy = yValues.data[0];
			}
			// compute the extent
			/*
				reverve X(min,max) and Y(min,max) in case of incorrect order
			*/
			if(minx > maxx){
				let tmpx = maxx;
				maxx = minx;
				minx = tmpx;
			}
			if(miny > maxy){
				let tmpy = maxy;
				maxy = miny;
				miny = tmpy;
			}
			extent = [minx,miny,maxx,maxy];

			//}
			return { name, arr };
		  })
		);
		return arrs;
	  })
	).then(arr => arr.flat());
	
	//console.log("extent = " + extent);

	// iterate the array to get all data
	data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get(null)]));
	//console.log(data);			

	/*
		convert zarr data into an image
	*/		

	// get image size (height and width) from shape attribute			
	let height = data[0][1].shape[data[0][1].shape.length -2];
	let width = data[0][1].shape[data[0][1].shape.length -1];
	
	let xlen=width;
	let ylen=height;
	//console.log(width+  " - " + height);
	//width += 10;
	//height += 10;
	
	//console.log("width ==> " + width);
	//console.log("height ==> " + height);			
				
	var canvas = document.createElement('canvas');  
	/*
		set width and height of the Zarr image to the canvas size
	*/
	canvas.width=xlen;
	canvas.height=ylen;  
	
	const ctx = canvas.getContext('2d');
	const imageData = ctx.createImageData(width, height);

	let offset = 0;			
	
	/*
		detect the order of x and y
	*/	
	//let xIncrease = true;//(data[0][1].data[0][1] - data[0][1].data[0][0]) > 0 ;
	//let yIncrease = true;//(data[0][1].data[1][1] - data[0][1].data[1][0]) > 0 ;		
	
	let xIncrease = true;
	for (let x = 0; x < xlen; x += 1) {		
		if(data[0][1].data[0][0] !== data[0][1].data[0][x]){
			if(data[0][1].data[0][0] >= data[0][1].data[0][x]){
				xIncrease = false;				
			}
			break;
		}
	}
	
	let yIncrease = true;
	for (let x = 0; x < xlen; x += 1) {	
		if(data[0][1].data[0][0] !== data[0][1].data[0][x]){
			if(data[0][1].data[1][0] >= data[0][1].data[1][x]){
				yIncrease = false;				
			}
			break;
		}
	}	
	
	for (let x = 0; x < xlen; x += 1) {		
		for (let y = 0; y < ylen; y += 1) {
			let xi = x;
			if(!xIncrease) {
				xi=xlen-x;
			}
			let yi = y;
			if(!yIncrease) {
				yi = (ylen - 1) - y;
			}
			/*
			imageData.data[offset + 0] = data[0][1].data[yi][xi]/scaleFactor; // R value
			imageData.data[offset + 1] = data[1][1].data[yi][xi]/scaleFactor; // G value
			imageData.data[offset + 2] = data[2][1].data[yi][xi]/scaleFactor; // B value
			*/						
						
			imageData.data[offset + 0] = data[0][1].data[xi][yi]; // R value
			imageData.data[offset + 1] = data[1][1].data[xi][yi]; // G value
			imageData.data[offset + 2] = data[2][1].data[xi][yi]; // B value
			
			if(data[1][1].data[xi][yi] > 150){
				// if the green component value is higher than 150 make the pixel transparent
				imageData.data[offset + 3] = 0;
			}else{
				imageData.data[offset + 3] = 255;
			}
			
			offset +=4;
		}
	}
	
	// Draw image data to the canvas
	ctx.putImageData(imageData, 0, 0);		
	
	// assign the canvas data URL to the global variable imageURL 
	imageURL = canvas.toDataURL();
	//console.log(imageURL);	
}

/**
	create a map to display the zarr image
*/
function createMap(projName){ 
	//console.log("Creating the map...");
	/*
		projection
	*/			
	if(projName === 'EPSG:32628'){		
		proj4.defs("EPSG:32628","+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);		
	} else if(projName === 'EPSG:32633'){
		proj4.defs("EPSG:32633","+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}
	
	var projection = ol.proj.get(projName);
	
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

	map.getView().on('change:resolution', (event) => {
		var zoom = Math.round(map.getView().getZoom()); 
		//console.log("Zoom level: " + map.getView().getZoom());
		
		if(zoom != zoomLevel){			
			//console.log("Change zoom level from " + zoomLevel + " to " + zoom);
			zoomLevel = zoom;
			changeZoomLevel(zoom);
		}		
	});
		
}

/*
	set value to an input field
*/
function setInputValue(id,value){
	var inputField = document.getElementById(id);
	inputField.value = value;
}

function getInputValue(id){	
	var value = "";
	var inputField = document.getElementById(id);
	if(inputField){
		value = inputField.value;
		if(value){
			value = value.trim();
		}
	}
	return value;
}

function setCurrentZoomButton(){
	var btn = document.getElementById('zoomBtn' + zoomLevel);
	if(btn){
		btn.disabled = true;
		btn.style.backgroundColor = "#003366";
	}
}
