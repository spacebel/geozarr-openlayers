let imageURL;
let zarrUrls = [];		
let currentIndex = 0;
let canvas;
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
	canvas = document.createElement('canvas');  
	imageURL = await loadZarr(zarrUrl, canvas);
	
	// create a map to display the zarr image
	createMap();
	registerResolutionChangeCallback();
	
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
	setDesiredZoomLevel(targetZoomLevel);
	applyChange().then(() =>{
		//Update map Zoom
		updateMapZoom(targetZoomLevel);
		//Disable the current zoom button
		disableCurrentZoomButton(targetZoomLevel);
	});
}

async function applyChange(){
	const loadingBar = document.getElementById('loadingBar');
	loadingBar.style.display = 'table';
	
	var zarrUrl = zarrUrls[currentIndex][0];	
	
	// call loadZarr(...) function
	// assign the canvas data URL to the global variable imageURL 
	imageURL = await loadZarr(zarrUrl,canvas);

	//refresh Image view displayed on the Map.
	refreshMapView(imageURL,zoomLevel);
	
	registerResolutionChangeCallback();
	
	loadingBar.style.display = 'none';
	setCurrentZoomButton();
}

function registerResolutionChangeCallback(){

	callback = (event) => {
		var zoom = Math.round(getMapZoom()); 
		
		if(zoom != getDesiredZoomLevel()){		

			console.log("Update Map Zoom from "+getDesiredZoomLevel()+ " to "+zoom)
			changeZoomLevel(zoom);
		}		
	};

	onMapResolutionChange(callback);
}

function setCurrentZoomButton(){
	var btn = document.getElementById('zoomBtn' + getDesiredZoomLevel());
	if(btn){
		btn.disabled = true;
		btn.style.backgroundColor = "#003366";
	}
}

function disableCurrentZoomButton(targetZoomLevel){
	
	for(var i = 1; i <= getMaxZoom(); i++){
		var btn = document.getElementById('zoomBtn' + i);
		if(btn){
			if(i != targetZoomLevel){
				btn.disabled = false;
				btn.style.backgroundColor = "#17a2b8";
			}
		}
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
