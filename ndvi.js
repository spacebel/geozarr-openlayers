/*
	This function will be called at startup
*/
async function startup(){
	//	initialize list of Zarr	
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/ndvi/c_gls_NDVI_202006010000_GLOBE_PROBAV_V2.2.1_v3.zarr","01/06/2020"]);	
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/ndvi/c_gls_NDVI_202006110000_GLOBE_PROBAV_V2.2.1_v3.zarr","11/06/2020"]);		
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/ndvi/c_gls_NDVI_202006210000_GLOBE_PROBAV_V2.2.1_v3.zarr"
	,"21/06/2020"]);	
		
	const band = "NDVI";	
	const bands = ({ '': [band] });	
	const projName = "EPSG:4326";	
	
	var zarrUrl = zarrUrls[currentIndex][0];
	
	// call loadZarr(...) function
	await loadZarr(zarrUrl,bands);
	
	// create a map to display the zarr image
	createMap(projName,extent);
	
	//map.getView().fit(extent);
		
	setCurrentZoomButton();
	setDateInfo();
	toggleNavButtons();
}

async function navigate(index){
	var newIndex = currentIndex + index;	
	if(newIndex < 0){
		newIndex = 0;
	}
	if(newIndex > (zarrUrls.length -1)){
		newIndex = zarrUrls.length -1;
	}
	currentIndex = newIndex;
	await applyChange();
	setDateInfo();
	toggleNavButtons();
}
/**
	This function will be called when user click on "Zoom" buttons
*/

async function changeZoomLevel(targetZoomLevel){
	zoomLevel = targetZoomLevel;
	map.getView().setZoom(zoomLevel);
	await applyChange();
	
	
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
	
	var zarrUrl = zarrUrls[currentIndex][0];
	const band = "NDVI";
		
	const bands = ({ '': [band] });		
	const projCode = "EPSG:4326";	
	
	// call loadZarr(...) function
	await loadZarr(zarrUrl,bands);
		
	var projection = ol.proj.get(projCode);	
	
	//console.log(map.getView().getProjection().getCode());
	/*
	const newView = new ol.View({
			projection: projCode,
			center: ol.extent.getCenter(extent),
			zoom: zoomLevel,
			minZoom: zoomMin,
			maxZoom: zoomMax
		});
	*/	
	//map.setView(newView);
	//map.getView().setCenter(new ol.extent.getCenter(extent1));
	
	var ext = map.getView().calculateExtent();
	const newSource = new ol.source.ImageStatic({            
			url: imageURL,
			projection: projCode,
			imageExtent: ext
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
async function loadZarr(zarrUrl,bands) {	
	var lonArray;
	var latArray;
	
	// asynchronous load 
	arrays = await Promise.all(
	
		// iterate bands array
		Object.entries(bands).map(async ([w,paths]) => {
		
		// declare the store points to highest group e.g.: $zarrUrl/maja_v2
		const store = new zarr.HTTPStore(zarrUrl);
		
		// open group
		const grp = await zarr.openGroup(store);
		
		// read date and then concatenate them (flat()) into an array
		const arrs = await Promise.all(
		  paths.map(async p => {
			const name = `${p}`;			
			const arr = await grp.getItem(zoomLevel + "/" + p);			
			
			/*
				read minX, minY, maxX, maxY from x and y to compute the extent
			*/	
			
			var minx,miny,maxx,maxy;
			// read x data to extract minX and maxX
			const xData = await grp.getItem(zoomLevel + "/lon");
			if(xData){
				const xValues = await xData.getRaw(null);
				lonArray = xValues;
				minx = xValues.data[0];
				maxx = xValues.data[xValues.data.length - 1];
			}
			
			// read y data to extract minY and maxY			
			const yData = await grp.getItem(zoomLevel + "/lat");
			if(yData){
				const yValues = await yData.getRaw(null);
				latArray = yValues;
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
	
	/*
	console.log("extent = " + extent);
	console.log("lon length = " + lonArray.data.length);
	console.log("lat length = " + latArray.data.length);
	*/
	
	
	try{
		var currentExtent = map.getView().calculateExtent();
		console.log("Current extent: " + currentExtent);
		
		extent1 = currentExtent;
		let minLon = currentExtent[0];		
		let minLonIndex = getClosestIndex(minLon,lonArray.data);
		//console.log("minLon = " + minLon + "; minLonIndex = " + minLonIndex);		
		
		let minLat = currentExtent[1];		
		let minLatIndex = getClosestIndex(minLat,latArray.data);
		//console.log("minLat = " + minLat + "; minLatIndex = " + minLatIndex);
		
		let maxLon = currentExtent[2];		
		let maxLonIndex = getClosestIndex(maxLon,lonArray.data);
		//console.log("maxLon = " + maxLon + "; maxLonIndex = " + maxLonIndex);
		
		let maxLat = currentExtent[3];		
		let maxLatIndex = getClosestIndex(maxLat,latArray.data);
		//console.log("maxLatIndex = " + maxLatIndex + "; maxLat = " + maxLat);
		
		let lon1, lon2;
		let lat1, lat2;		
		
		if(minLonIndex < maxLonIndex){
			lon1 = minLonIndex;
			lon2 = maxLonIndex;
		}else{
			lon1 = maxLonIndex;
			lon2 = minLonIndex;
		}
		
		
		if(minLatIndex < maxLatIndex){
			lat1 = minLatIndex;
			lat2 = maxLatIndex;
		}else{
			lat1 = maxLatIndex;
			lat2 = minLatIndex;
		}
		console.log("Indexes: lon(" + lon1 + "," + lon2 + "); lat(" + lat1 + "," + lat2 + ")");
				
		data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get([zarr.slice(lon1,lon2),zarr.slice(lat1,lat2)])]));
		
		//data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get([zarr.slice(null),zarr.slice(null)])]));
		//console.log("DATA 2222");
		//console.log(data);	
	}catch(e){
		//console.log(e);
		data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get(null)]));
		//console.log("DATA 111");
		//	
	}

	// iterate the array to get all data
	//data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get([zarr.slice(0,200)])]));
			
	console.log(data);
	
	/*
		convert zarr data into an image
	*/		

	// get image size (height and width) from shape attribute			
	let height = data[0][1].shape[data[0][1].shape.length -2];
	let width = data[0][1].shape[data[0][1].shape.length -1];
	
	console.log("width ==> " + width);
	console.log("height ==> " + height);
				
	var canvas = document.createElement('canvas');  
	/*
		set width and height of the Zarr image to the canvas size
	*/
	canvas.width=width;
	canvas.height=height;  
	
	const ctx = canvas.getContext('2d');
	const imageData = ctx.createImageData(width, height);

	let offset = 0;			
		
	let xlen = data[0][1].data.length;
	let ylen = data[0][1].data[0].length;
	for (let x = 0; x < xlen ; x += 1) {
		for (let y = 0; y < ylen; y += 1) {
			let value = data[0][1].data[x][y];
			computeColor(imageData,value,offset);
									
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

function setCurrentZoomButton(){
	var btn = document.getElementById('zoomBtn' + zoomLevel);
	if(btn){
		btn.disabled = true;
		btn.style.backgroundColor = "#003366";
	}
}

function setDateInfo(){
	var dateSpan = document.getElementById('dateInfo');
	if(dateSpan){
		dateSpan.textContent = zarrUrls[currentIndex][1];
	}
}

function toggleNavButtons(){
	var prevBtn = document.getElementById('prevBtn');
	var nextBtn = document.getElementById('nextBtn');
	if(currentIndex === 0){
		// disable the prev button
		prevBtn.disabled = true;
		prevBtn.style.backgroundColor = "#cccccc";
		prevBtn.style.color = "#666666";
		prevBtn.style.cursor = "default";
	}else{
		prevBtn.disabled = false;
		prevBtn.style.backgroundColor = "white";
		prevBtn.style.color = "black";
		prevBtn.style.cursor = "pointer";
	}
	
	if(currentIndex === (zarrUrls.length -1)){
		// disable the next button
		nextBtn.disabled = true;
		nextBtn.style.backgroundColor = "#cccccc";
		nextBtn.style.color = "#666666";
		nextBtn.style.cursor = "default";
	}else{
		nextBtn.disabled = false;
		nextBtn.style.backgroundColor = "white";
		nextBtn.style.color = "black";
		nextBtn.style.cursor = "pointer";
	}
}

function computeColor(imageData, value, offset){
	// map the value to hex color code
	var hexColorCode = "000000";
	if(value > 20 && value <= 45){
		hexColorCode = "a50026";
	}else{
		if(value > 45 && value <= 70){
			hexColorCode = "d73027";
		}else{
			if(value > 70 && value <= 95){
				hexColorCode = "f46d43";
			}else{
				if(value > 95 && value <= 120){
					hexColorCode = "fdae61";
				}else{
					if(value > 120 && value <= 145){
						hexColorCode = "fee08b";
					}else{
						if(value > 145 && value <= 170){
							hexColorCode = "ffffbf";
						}else{
							if(value > 170 && value <= 195){
								hexColorCode = "d9ef8b";
							}else{
								if(value > 195 && value <= 220){
									hexColorCode = "a6d96a";
								}else{
									if(value > 220 && value <= 245){
										hexColorCode = "66bd63";
									}else{
										if(value > 245 && value < 250){
											hexColorCode = "1a9850";
										}else{
											if(value == 250){
												hexColorCode = "006837";
											}else{
												hexColorCode = "ffffff";
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}	
	
	// convert hex to RGB
	var bigint = parseInt(hexColorCode, 16);
	//console.log("bigint = " + bigint);
	
	var red = (bigint >> 16) & 255;
	//console.log("red = " + red);
	
	var green = (bigint >> 8) & 255;
	//console.log("green = " + green);
	
	var blue = bigint & 255;
	//console.log("blue = " + blue);
	 
	imageData.data[offset + 0] = red; // R value
	imageData.data[offset + 1] = green; // G value
	imageData.data[offset + 2] = blue; // B value
	
	if(green > 250){
		imageData.data[offset + 3] = 0;
	}else{
		imageData.data[offset + 3] = 255;
	}
}

function getClosestIndex(num,arr){
	let index = 0;
	
	let curr = arr[0], diff = Math.abs(num - curr);	
	for (let val = 0; val < arr.length; val++) {
		let newdiff = Math.abs(num - arr[val]);
		if (newdiff < diff) {
			diff = newdiff;
			curr = arr[val];
			index = val;
			//console.log(arr[val]);
		};
	};
	
	return index;	
}
