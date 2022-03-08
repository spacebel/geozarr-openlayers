let imageURL;
let zarrUrls = [];	
let zarrUrl;	
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
				
	//zarrUrl = zarrUrls[currentIndex][0];
	zarrUrl = "https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/prisma_v2_multiscales/20210608/";
	/*
		set default values to input fields
	*/
	setInputValue('zarrUrl',zarrUrl);		
	setInputValue('redBand',redBand);
	setInputValue('greenBand',greenBand);
	setInputValue('blueBand',blueBand);

	
	// call loadZarr(...) function
	canvas = document.createElement('canvas');  
	imageURL = await loadZarr(zarrUrl, canvas);
	
	// create a map to display the zarr image
	createMap();
	registerResolutionChangeCallback();
	
	setCurrentZoomButton();
	setDateInfo();
	toggleNavButtons();
	generateSubsettingForm();
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
	
	//retrieve values from the form
	zarrUrl = getInputValue('zarrUrl');
	redBand = getInputValue('redBand');
	greenBand = getInputValue('greenBand');
	blueBand = getInputValue('blueBand');
	setRequestedExtent(getInputValue("extent"))
	let subset = getSubsetValues();
	selectedProjection = getSelectedProjectionCode();
	setProjectionCode(selectedProjection);
	
	// call loadZarr(...) function
	// assign the canvas data URL to the global variable imageURL 
	imageURL = await loadZarr(zarrUrl,canvas,subset);

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

/*
*	Set value to an input field
*/
function setInputValue(id,value){
	var inputField = document.getElementById(id);
	inputField.value = value;
}
/**
 * Get input value from input field
 * @param {*} id 
 * @returns 
 */
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

function generateSubsettingForm(){
	console.log('Generating subsetting form...');

	subsettingForm = document.getElementById("subsetting-form");
	let dimensions = getDimensions();
	
	dimensions.forEach( dim =>{
		console.log('creating input for dimension: '+dim);

		let label = document.createElement("label");
		label.setAttribute("value",dim);
		label.setAttribute("for", dim);
		label.innerText = dim+" from : ";
		subsettingForm.appendChild(label);
		
		let inputStart = document.createElement("input");
		inputStart.setAttribute("type", "text");
		inputStart.setAttribute("name", dim);
		inputStart.setAttribute("id", dim+"_start");
		subsettingForm.appendChild(inputStart);

		let middleLabel = document.createElement("label");
		middleLabel.setAttribute("value",dim);
		middleLabel.setAttribute("for", dim);
		middleLabel.innerText = " to ";
		subsettingForm.appendChild(middleLabel);

		let inputEnd = document.createElement("input");
		inputEnd.setAttribute("type", "text");
		inputEnd.setAttribute("name", dim);
		inputEnd.setAttribute("id", dim+"_end");
		subsettingForm.appendChild(inputEnd);

		let lineReturn = document.createElement("br");
		subsettingForm.appendChild(lineReturn);
		subsettingForm.appendChild(lineReturn);
	});

}

function getSubsetValues(){

	subsettingForm = document.getElementById("subsetting-form");
	let dimensions = getDimensions();
	let subset = [];
	
	dimensions.forEach( dim =>{
		console.log('reading input for dimension: '+dim);
		
		let inputStart = document.getElementById(dim+"_start");
		let inputEnd = document.getElementById(dim+"_end");
		if(inputStart !== null && inputEnd !== null){
			subset[dim] = { "start": inputStart.value,"end": inputEnd.value};
		}
	});

	return subset;
}

function getSelectedProjectionCode(){
	projectionField = document.getElementById('projectionCode');
	return projectionField.options[projectionField.selectedIndex].value;
}

