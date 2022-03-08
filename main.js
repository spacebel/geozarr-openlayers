let imageURL;
let zarrUrls = [];	
let zarrUrl;	
let currentIndex = 0;
let canvas;
/*
	This function will be called at startup
*/
async function startup(){
	//	initialize Zarr	URL
	zarrUrl = "https://storage.sbg.cloud.ovh.net/v1/AUTH_d40770b0914c46bfb19434ae3e97ae19/hdsa-public/s2_v1_multiscales_4326/T33UWT/20210727";
	
	//set default values to input fields
	setInputValue('zarrUrl',zarrUrl);		
	setBandFieldsWithPredefinedValues();
	
	// call loadZarr(...) function
	canvas = document.createElement('canvas');  
	imageURL = await loadZarr(zarrUrl, canvas);
	
	// create a map to display the zarr image
	createMap();
	registerResolutionChangeCallback();
	//TODO: remove: this should be done in map.js
	changeZoomLevel(defaultZoomLevel);
	
	setCurrentZoomButton();
	generateSubsettingForm();
	//setDateInfo();
	//toggleNavButtons();
	
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

	if(document.getElementById("subsetting-form").innerHTML === ""){
		generateSubsettingForm();
	}
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

function getZarrUrl(){
	var value = "";
	var selectionField = document.getElementById(id);
	value = selectionField.options[selectionField.selectedIndex].value;

	if(value){
		value = value.trim();
	}
	return value;
}

function generateSubsettingForm(){
	console.log('Generating subsetting form...');

	subsettingForm = document.getElementById("subsetting-form");
	let dimensions = getDimensions();
	let dimensionsValues = getDimensionsValues();

	let title = document.createElement("h2");
	title.innerText = "Subsetting";
	subsettingForm.appendChild(title);

	dimensions.forEach( dim =>{
		console.log('creating input for dimension: '+dim);

		values = dimensionsValues[dim];
		if(values !== undefined){
			let min = values.data[0];
			let max = values.data[values.data.length -1];

			let label = document.createElement("label");
			label.setAttribute("value",dim);
			label.setAttribute("for", dim);
			label.innerText = dim+" from : ";
			subsettingForm.appendChild(label);
			
			let inputStart = document.createElement("input");
			inputStart.setAttribute("type", "text");
			inputStart.setAttribute("name", dim);
			inputStart.setAttribute("id", dim+"_start");
			inputStart.setAttribute("value",min);
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
			inputEnd.setAttribute("value",max);
			subsettingForm.appendChild(inputEnd);

			let lineReturn = document.createElement("br");
			subsettingForm.appendChild(lineReturn);

			let secondLineReturn = document.createElement("br");
			subsettingForm.appendChild(secondLineReturn);
		}
	});
}

function clearSubsettingForm(){
	console.log("Clearing subsetting form...")

	subsettingForm = document.getElementById("subsetting-form");
	subsettingForm.innerHTML="";
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

/**
 * Update band fields with valuesmatching the product (predefined values).
 */
function setBandFieldsWithPredefinedValues(){

	let selectionField = document.getElementById("zarrUrl");
	let productName = selectionField.options[selectionField.selectedIndex].label;
	console.log("Product selected: "+productName);

	switch(productName){
		case "Prisma":
			setInputValue('redBand',"/reflectance[560]");
			setInputValue('greenBand',"/reflectance[530]");
			setInputValue('blueBand',"/reflectance[430]");
			break;
		case "Sentinel-2":
			setInputValue('redBand',"B04/band_data[0]");
			setInputValue('greenBand',"B03/band_data[0]");
			setInputValue('blueBand',"B02/band_data[0]");
			break;
	}
}

/**
 * Update selected projection code with the one matching the product (predefined values).
 */
function setProjectionForCurrentProduct(){
	let selectionField = document.getElementById("zarrUrl");
	let productName = selectionField.options[selectionField.selectedIndex].label;
	console.log("Product selected: "+productName);

	//projectionField = document.getElementById('projectionCode');
	//projectionField.options[projectionField.selectedIndex].value;

	switch(productName){
		case "Prisma":
			setInputValue('projectionCode',"EPSG:32630");
			
			break;
		case "Sentinel-2":
			setInputValue('projectionCode',"EPSG:4326");
			break;
	}
}

function productSelectionChanged(){

	clearSubsettingForm();
	setBandFieldsWithPredefinedValues();
	setProjectionForCurrentProduct();
	changeZoomLevel(defaultZoomLevel);
}

function getSelectedProjectionCode(){
	projectionField = document.getElementById('projectionCode');
	return projectionField.options[projectionField.selectedIndex].value;
}

