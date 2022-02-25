/*
	This function will be called at startup
*/
async function startup(){
	//	initialize list of Zarr
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210103","T33UWT 03/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210105","T33UWT 05/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210108","T33UWT 08/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210110","T33UWT 10/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210113","T33UWT 13/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210115","T33UWT 15/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210118","T33UWT 18/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210120","T33UWT 20/01/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales/T33UWT/20210123","T33UWT 23/01/2021"]);			
				
	var zarrUrl = zarrUrls[currentIndex][0];
	
	// call loadZarr(...) function
	await loadZarr(zarrUrl);
	
	// create a map to display the zarr image
	createMap();
	
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
	await applyChange();
	map.getView().setZoom(zoomLevel);
	
	// disable the current zoom button
	for(var i = 1; i <= zoomMax; i++){
		var btn = document.getElementById('zoomBtn' + i);
		if(btn){
			if(i != targetZoomLevel){
				btn.disabled = false;
				btn.style.backgroundColor = "#17a2b8";
			}
		}
	}
}

async function applyChange(){
	const loadingBar = document.getElementById('loadingBar');
	loadingBar.style.display = 'table';
	
	var zarrUrl = zarrUrls[currentIndex][0];	
	
	// call loadZarr(...) function
	await loadZarr(zarrUrl);
		
	var projection = ol.proj.get(projCode);	
	
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
async function loadZarr(zarrUrl) {
	const bands = ({ '': [redBand, greenBand, blueBand] });
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
			const arr = await grp.getItem(p + "/" + zoomLevel + "/band_data");
			
			/*
				read minX, minY, maxX, maxY from x and y to compute the extent
			*/	
			
			var minx,miny,maxx,maxy;
			// read x data to extract minX and maxX
			const xData = await grp.getItem(p + "/" + zoomLevel + "/x");
			if(xData){
				const xValues = await xData.getRaw(null);
				minx = xValues.data[0];
				maxx = xValues.data[xValues.data.length - 1];
			}
			
			// read y data to extract minY and maxY			
			const yData = await grp.getItem(p + "/" + zoomLevel + "/y");
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
	data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get(slicing)]));
	console.log(data);			

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
				xi= (xlen -1) -x;
			}
			let yi = y;
			if(!yIncrease) {
				yi = (ylen - 1) - y;
			}			
			
			let red = data[0][1].data[xi][yi]/scaleFactor;
			let green = data[1][1].data[xi][yi]/scaleFactor;
			let blue = data[2][1].data[xi][yi]/scaleFactor;
			
			imageData.data[offset + 0] = red; // R value
			imageData.data[offset + 1] = green; // G value
			imageData.data[offset + 2] = blue; // B value
			imageData.data[offset + 3] = 255;
			/*
			if(green > 0){
				// if the green component value is higher than 250 make the pixel transparent
				imageData.data[offset + 3] = 0;
			}else{
				imageData.data[offset + 3] = 255;
			}			
			*/
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
function createMap(){ 
	//console.log("Creating the map...");
	/*
		projection
	*/			
	if(projCode === 'EPSG:32628'){		
		proj4.defs("EPSG:32628","+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);		
	} else if(projCode === 'EPSG:32633'){
		proj4.defs("EPSG:32633","+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}
	
	var projection = ol.proj.get(projCode);
	
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
