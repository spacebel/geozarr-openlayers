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
	
	// return the canvas data URL.
	return canvas.toDataURL();
}