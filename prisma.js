/*
	This function will be called at startup
*/
async function startup(){
	//	initialize list of Zarr
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200410","10/04/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200625","25/06/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200706","06/07/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200724","24/07/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200804","04/08/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200822","22/08/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20200914","14/09/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20201013","13/10/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20201122","22/11/2020"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20201227","27/12/2020"]);
	
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210411","11/04/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210608","08/06/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210614","14/06/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210805","05/08/2021"]);
	zarrUrls.push(["https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210811","11/08/2021"]);
				
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
	map.getView().setZoom(zoomLevel + 5);
	
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
		
	loadingBar.style.display = 'none';
	setCurrentZoomButton();
}

/*
	An async function to read Zarr data and then convert it into an image
*/	
async function loadZarr(zarrUrl) {
	const bands = ({ '': [redBand, greenBand, blueBand] });		
	
	// declare the store points to highest group e.g.: $zarrUrl/maja_v2
	const store = new zarr.HTTPStore(zarrUrl);
	
	// open group
	const grp = await zarr.openGroup(store);
	
	// read bands data
	const redBandPath = zoomLevel + "/" + redBand;
	const greenBandPath = zoomLevel + "/" + greenBand;
	const blueBandPath = zoomLevel + "/" + blueBand;
	
	// read lat, lon data
	var redData = await readBandData(grp, redBandPath, redBandSubset);       
	var greenData = await readBandData(grp, greenBandPath, greenBandSubset);
	var blueData = await readBandData(grp, blueBandPath, blueBandSubset);
	
	const lonPath = zoomLevel + "/longitude";
	const latPath = zoomLevel + "/latitude";
	
	var xData = await readXYData(grp,lonPath);
	var yData = await readXYData(grp,latPath);
	
	var minx,miny,maxx,maxy;
	if(xData){		
		minx = xData.data[0];
		maxx = xData.data[xData.data.length - 1];
	}
			
	if(yData){		
		miny = yData.data[yData.data.length - 1];
		maxy = yData.data[0];
	}
	
	// reverve X(min,max) and Y(min,max) in case of incorrect order	
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
	console.log("extent = " + extent);
		
	if(projCode === 'EPSG:32628'){		
		proj4.defs("EPSG:32628","+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);		
	} else if(projCode === 'EPSG:32633'){
		proj4.defs("EPSG:32633","+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	} else if(projCode === 'EPSG:32630'){
		proj4.defs("EPSG:32630","+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs");
		ol.proj.proj4.register(proj4);
	}		

	// convert zarr data into an image	

	// get image size (height and width) from shape attribute			
	let height = redData.shape[redData.shape.length -2];
	let width = redData.shape[redData.shape.length -1];		
	
	//console.log("width ==> " + width);
	//console.log("height ==> " + height);			
				
	var canvas = document.createElement('canvas');  
	/*
		set width and height of the Zarr image to the canvas size
	*/
	canvas.width=width;
	canvas.height=height;  
	
	const ctx = canvas.getContext('2d');
	const imageData = ctx.createImageData(width, height);		
	
	// detect the order of x and y
	
	let xIncrease = true;
	for (let x = 0; x < xData.length; x += 1) {		
		if(xData.data[0][0] !== xData.data[0][x]){
			if(xData.data[0][0] >= xData.data[0][x]){
				xIncrease = false;				
			}
			break;
		}
	}
	
	let yIncrease = true;
	for (let y = 0; y < yData.length; y += 1) {		
		if(yData.data[0][0] !== yData.data[0][y]){
			if(yData.data[0][0] >= yData.data[0][y]){
				xIncrease = false;				
			}
			break;
		}
	}	
		
	let xlen = redData.data.length;
	let ylen = redData.data[0].length;
	let offset = 0;	
	
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
			
			let red = redData.data[xi][yi]/scaleFactor;
			let green = greenData.data[xi][yi]/scaleFactor;
			let blue = greenData.data[xi][yi]/scaleFactor;
			
			imageData.data[offset + 0] = red; // R value
			imageData.data[offset + 1] = green; // G value
			imageData.data[offset + 2] = blue; // B value
			
			// make black transparent: change the alpha value of all the black pixels to zero
			// https://stackoverflow.com/questions/35643175/html5-canvas-make-black-transparent
			if (red + green + blue < 10) {
				imageData.data[offset + 3] = 0; // alpha value
			} else {
				imageData.data[offset + 3] = 255;
			}
			
			offset +=4;
		}
	}
	
	// Draw image data to the canvas
	ctx.putImageData(imageData, 0, 0);		
	
	// assign the canvas data URL to the global variable imageURL 
	imageURL = canvas.toDataURL();
	console.log(imageURL);	
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
	} else if(projCode === 'EPSG:32630'){
		proj4.defs("EPSG:32630","+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs");
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
			zoom: zoomLevel + 5,
			minZoom: zoomMin + 5,
			maxZoom: zoomMax + 5
		})
	});  

	map.getView().on('change:resolution', (event) => {
		var zoom = Math.round(map.getView().getZoom()); 
		zoom = zoom - 5;
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

async function readBandData(zarrGroup, bandPath, slicing) {
    var item = await zarrGroup.getItem(bandPath);
    if (slicing) {
        if(isNaN(slicing)){
            console.log(slicing + " is not a number");
        }else{
            console.log(slicing + " is a number");            
            return await item.get([Number(slicing)]);
        }
         return await item.get(s);       
    } else {
        return await item.get(null);
    }
};

async function readXYData(zarrGroup, bandPath) {
    var item = await zarrGroup.getItem(bandPath);
	return await item.getRaw(null);
};
