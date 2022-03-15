let latitudeName;   //Name used to represent the latitude variable in the zarr file.
let longitudeName; //Name used to represent the longitude variable in the zarr file.
var extent = [];         //Extent of the Zarr file
let scaleFactor = 20;  //Factor used for color computation
const firstDimSlicing = 0;     //Slicing on the zarr array (used for 3D zarr file)
let redBand = "B04/band_data[0]";   //Name of the red band (group/path)
let greenBand = "B03/band_data[0]"; //Name of the green band (group/path)
let blueBand = "B02/band_data[0]";  //Name of the blue band (group/path)
let requestedExtent = ""
let subset = []
let dimensions = []
let dimensionsArrays = [];
let productMaxZoomLevel = 4;
/*
	An async function to read Zarr data and then convert it into an image
*/	
async function loadZarr(zarrUrl, canvas, subsetting = []) {
	const bands = ({ '': [redBand, greenBand, blueBand] });
    let xData, yData;

	console.log("Loading zarr subset: ");
	console.log(subsetting);
	// asynchronous load 
	dimensions = null;
	arrays = await Promise.all(
		// iterate on bands array defined 
		Object.entries(bands).map(async ([w,paths]) => {
		
            // declare the store points to highest group e.g.: $zarrUrl/maja_v2
            const store = new zarr.HTTPStore(zarrUrl);
            
            // open group
            const grp = await zarr.openGroup(store);

			let productZoomLevel = zoomLevel;
			if(zoomLevel > productMaxZoomLevel){
				productZoomLevel = productMaxZoomLevel;
			}
            
            // read date and then concatenate them (flat()) into an array
            const arrs = await Promise.all(
                paths.map(async p => {
                    const name = `${p}`; //Name of the band	
					console.log("band path: "+p);
					if(p.indexOf('[') > 0){ //If band path contains subseeting removes it
						p = p.substring(0,p.indexOf('['))
					}

					let bandPath = "band_data";
					if(p.indexOf('/') > -1){//If band path contain the name of the array
						//Retrive band array name
						bandPath = p.substring(p.indexOf('/'));
						//remove band array name from path (to be able to add zoom level further).
						p = p.substring(0,p.indexOf('/'));
					}
                    const arr = await grp.getItem(p + "/" + productZoomLevel +"/"+ bandPath);
                    
                    //If not already fetched (by previous band)
					if(dimensions === null){
						//Fetch array attributes ad discover dimensions from it.
						let attributes = arr.attrs;
						dimensions = await discoverDimensions(attributes);
						
						//Copy reference of lat/lon arrays in the dictionnary of dimensions (used for subsetting)
						dimensionsArrays = [];
						for(let dimensionIndex = 0; dimensionIndex < dimensions.length; dimensionIndex += 1){
							let dim = dimensions[dimensionIndex];
							console.log("processing dimension: "+dim);
							let dimensionPath = p +"/"+ productZoomLevel + "/"+ dim;
							let item = await grp.getItem(dimensionPath);
							let dimName = await item.attrs.getItem("long_name");//use standard_name instead
							console.log("DimName: "+dimName);
							if(dimName){
								if(dimName === 'longitude'){
									longitudeName = dim;
									console.log("Found longitude name: "+dim);
								}
								if(dimName === 'latitude'){
									latitudeName = dim;
									console.log("Found latitude name: "+dim);
								}
							}
							try{
								dimensionsArrays[dim] = await item.getRaw(null);
							} catch(error){
								console.log("An error occured while reading dimension array "+dim+" : "+error);
							}
							
						}

						//Read Longitude & Latitude from arrays of dimensions.
						xData = dimensionsArrays[longitudeName];
						yData = dimensionsArrays[latitudeName];
					}
                    

					console.log("Dimensions: ");
					console.log(dimensionsArrays);
                    
                    return { name, arr };
                })
            );
            return arrs;
	  })
	).then(arr => arr.flat());
	 
	//Build Extent from latitude & longitude variables
	if(requestedExtent != ""){
		requestedExtentValues = requestedExtent.split(",")
		extent = requestedExtentValues.map(Number);
		console.log("Unsing requested extent")

	//If longitude start & end + latitude start & end are not null or empty.
	}else if( subsetting[latitudeName] != undefined && subsetting[longitudeName] != undefined
		 && subsetting[longitudeName].start.length !== 0 && subsetting[longitudeName].end.length != 0
		 && subsetting[latitudeName].start.length !== 0 && subsetting[latitudeName].end.length != 0){

		minx = Number(subsetting[longitudeName].start);
		miny = Number(subsetting[latitudeName].start);
		maxx = Number(subsetting[longitudeName].end);
		maxy = Number(subsetting[latitudeName].end);

		//reverve X(min,max) and Y(min,max) in case of incorrect order
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
		console.log("Using computed extent: ")
		console.log(extent);
	}
	else{
		extent = await buildExtent(yData,xData);
		console.log("Using default extent");
		console.log(extent);
	}

	// iterate the array to get all data for the requested subset
    let data = await getZarrData(subsetting,dimensionsArrays,arrays)
	//let data = await Promise.all(arrays.map(async d => [d.name, await d.arr.get(slicing)]));

	//convert zarr data into an image	
    drawImage(canvas, data, yData, xData)
			
	// Return the canvas data URL
	return canvas.toDataURL();
}

async function readXYData(zarrGroup, bandPath) {
    var item = await zarrGroup.getItem(bandPath);
	return await item.getRaw(null);
}
/**
 * Retrive dimensions from array attributes (by reading _ARRAY_DIMENSION attribute)
 * @param {*} arrayAttributes 
 */
async function discoverDimensions(arrayAttributes){
    arrayDimensions = await arrayAttributes.getItem("_ARRAY_DIMENSIONS");
    return arrayDimensions;
}

/**
 * Detect if coordinates are sorted in increasing or decreasing order.
 * @param {*} coordinates 
 * @returns TRUE if coordinates are sorted in ascending order
 */
function isAscending(coordinates){
    let ascending = true;
	for (let x = 0; x < coordinates.length; x += 1) {		
		if(coordinates.data[0][0] !== coordinates.data[0][x]){
			if(coordinates.data[0][0] >= coordinates.data[0][x]){
				ascending = false;				
			}
			break;
		}
	}
	return ascending;
}

/**
 * Build Extent from latitude & longitude variables
 * @param {*} yData : latitude variable
 * @param {*} xData : longitude variable
 * @returns [minx,miny,maxx,maxy]
 */
async function buildExtent(yData,xData){

	//read minX, minY, maxX, maxY from x and y to compute the extent
	var minx,miny,maxx,maxy;
	// read x data to extract minX and maxX
	if(xData){
		minx = xData.data[0];
		maxx = xData.data[xData.data.length - 1];
	}
			
	// read y data to extract minY and maxY			
	if(yData){
		miny = yData.data[yData.data.length - 1];
		maxy = yData.data[0];
	}
	
	//reverve X(min,max) and Y(min,max) in case of incorrect order
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
    // Build the extent
    return [minx,miny,maxx,maxy];;
}
/**
 * Draw Image to canvas using Zarr values
 * @param {*} canvas 
 * @param {*} data 
 * @param {*} yData 
 * @param {*} xData 
 */
function drawImage(canvas, data, yData, xData){
    // get image size (height and width) from shape attribute			
	let height = data[0][1].shape[data[0][1].shape.length -2];
	console.log("height: "+height);
	let width = data[0][1].shape[data[0][1].shape.length -1];
	console.log("width: "+width);
	
	//set width and height of the Zarr image to the canvas size
	canvas.width=width;
	canvas.height=height;  
	
	const ctx = canvas.getContext('2d');
	//ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas
	const imageData = ctx.createImageData(width, height);

    //Fill image from zarr values
    fillImage(imageData,data,yData,xData)

    // Draw image data to the canvas
	ctx.putImageData(imageData, 0, 0);
}
/**
 * Fill canvas image with zarr values
 * @param {*} imageData 
 * @param {*} data 
 * @param {*} yData 
 * @param {*} xData 
 */
function fillImage(imageData,data, yData, xData){

	let offset = 0;	
    //let xlen = imageData.width;
    //let ylen = imageData.height;
	let xlen = data[0][1].data.length;
	let ylen = data[0][1].data[0].length;
	
    //detect the order of x and y
	let xIncrease = isAscending(xData);
	let yIncrease = isAscending(yData);
	
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
			
			//If all visible colors combined have a value below 10 -> Consider it should be transparent.
			if (red + green + blue < 10) {
				imageData.data[offset + 3] = 0; // alpha value
			} else {
				imageData.data[offset + 3] = 255;
			}
			offset +=4;
		}
	}
	console.log("Image drawn")
}
/**
 * fetch zarr data subset based on the desired extent.
 * @param {*} desiredExtent 
 * @param {*} latArray 
 * @param {*} lonArray 
 * @param {*} zarrArays 
 * @returns 
 */
async function getZarrData(subset, dimensionArrays,zarrArrays){
	let slices = [];//Initialize slicing array
						
	Object.keys(subset).forEach( dim =>{
		let value = subset[dim];
		console.log("Dimension "+dim+" start "+value.start+" end "+value.end);

		
		if(dimensionArrays[dim] != undefined 
			&& dimensionArrays[dim].start !== undefined && dimensionArrays[dim].start.length > 0 
			&& dimensionArrays[dim].end !== undefined && dimensionArrays[dim].end.length > 0){
			
			let startIndex = null, endIndex = null;
			startIndex =  getClosestIndex(parseFloat(value.start),dimensionArrays[dim].data);
			endIndex =  getClosestIndex(parseFloat(value.end),dimensionArrays[dim].data);
			
			let dimensionSlice = null;
			if(startIndex !== null && endIndex !== null){ //If indexes are not null
				dimensionSlice = zarr.slice(startIndex,endIndex);
			}
			slices.push(dimensionSlice);
		}

	});
	console.log("Slicing data: ");
	console.log(slices);
	//console.log("Indexes: lon(" + lon1 + "," + lon2 + "); lat(" + lat1 + "," + lat2 + ")");	
	
	console.log(zarrArrays)	
    	
	//let result = await Promise.all(zarrArays.map(async d => [d.name, await d.arr.get([0,zarr.slice(0,600),zarr.slice(0,600)])]));	
	let result = [];
	let bandDataFetchingPromises = [];
	for(let index = 0; index < zarrArrays.length; index += 1){
		
		//zarrArays.map(async band => [band.name, await band.arr.get(slices)]));
		bandPath = zarrArrays[index].name;
		let bandName = bandPath;
		console.log("Creating promise for band: "+bandName);
		//if band[...] -> extract index and use it as first dimension slicing
		let firstDimensionSlicing = null;
		let bandSlices = [...slices] //initalize array with subsetting slices
		if(bandPath.indexOf('[') > -1 && bandPath.indexOf(']') > -1){
			firstDimensionSlicing= bandPath.substring(bandPath.indexOf('[')+1,bandPath.indexOf(']'));
			firstDimensionSlicing = Number(firstDimensionSlicing);

			//Retrieve index value//Only convert from coordinates to index for 3D array (not used for Sentinel-2 products)
			//because the band dimension of sentinel 2 products is not present in dimensionArrays
			if(Object.keys(dimensionArrays).length > 2){
				//List keys present in dimensionArrays (because it is an object and not really an array).
				keyOfFirstDimension = Object.keys(dimensionArrays)[0];
				//Retrieve values from the first dimension
				firstDimensionValues= dimensionArrays[keyOfFirstDimension].data;
				//Retrive index corresponding to the requested value.
				firstDimensionSlicing = getClosestIndex(firstDimensionSlicing,firstDimensionValues);
			}

			//Add first dimension slice at the beginning of the array of slices.
			bandSlices.unshift(firstDimensionSlicing);
			console.log("Added slice index, now slicing with:");
			console.log(bandSlices);
		}
		//Register data fecthing promise 
		bandDataFetchingPromises.push(
			zarrArrays[index].arr.get(bandSlices)
						.then((values)=>{return [bandName,values]})//append band_name/array in the result object.
		);
	}
	console.log("promises created:"+bandDataFetchingPromises.length)
	//Wait for all zarr data arrays to be downloaded
	result = await Promise.all(bandDataFetchingPromises);
			
	console.log(result);
    return result;
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
		};
	};
	
	return index;	
}

function getDimensions(){
    return dimensions;
}

function getDimensionsValues(){
	return dimensionsArrays;
}

function getZarrExtent(){
    return extent;
}

function setRequestedExtent(value){
    requestedExtent = value;
}