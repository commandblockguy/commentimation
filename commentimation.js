const mime = 'application/x-vnd.google-docs-document-slice-clip+wrapped';

let lastPasteData = null;
let frameIDs = [];
let fileData = null;

document.getElementById('pastebox').addEventListener('paste', (event) => {
	console.log('Paste event:', event);
	event.preventDefault();
	event.target.value = '';
	let clipData = event.clipboardData.getData(mime);
	if(!clipData) {
		event.target.value = 'Not from Docs';
		return;
	}
	lastPasteData = JSON.parse(clipData);

	frameIDs = [];

	console.log(lastPasteData.data);
	const innerData = JSON.parse(lastPasteData.data);
	innerData.resolved.dsl_styleslices.forEach((elem) => {
		if(elem.stsl_type == 'comment') {
			elem.stsl_styles.forEach((style) => {
				if(style) {
					const ids = style.cs_cids.cv.opValue;
					if(ids.length == 0) return;
					if(ids.length > 1) {
						console.log(frameIDs.length);
						event.target.value = 'Comments overlap';
						return;
					}
					frameIDs.push(ids[0]);
				}
			});
		}
	});

	if(event.target.value == '') {
		event.target.value = 'Got ' + frameIDs.length + ' frames';
	}
});

document.getElementById("fileselect").addEventListener("change", async (event) => {
	const file = event.target.files[0];
	const arrBuf = await file.arrayBuffer();
	fileData = new Uint8Array(arrBuf);
}, false);

function getBit(data, frame, x, y) {
	const width = document.getElementById('width').value;
	const height = document.getElementById('height').value;
	const bitaddr = frame * width * height + y * width + x;
	const byteaddr = bitaddr >> 3;
	const bit = 7 - (bitaddr & 7);
	return (data[byteaddr] >> bit) & 1;
}

function convert() {
	let innerData = JSON.parse(lastPasteData.data);
	let result = Object.assign({}, lastPasteData);

	if(!fileData) throw Error('Upload a file');

	const width = document.getElementById('width').value;
	const height = document.getElementById('height').value;
	const text = '*'.repeat(frameIDs.length) + '\n' + ('    '.repeat(width) + '\n').repeat(height);
	innerData.resolved.dsl_spacers = text;

	let commentData = [];
	for(let frame = 0; frame < frameIDs.length; frame++) {
		commentData.push({
			"cs_cids": {
				"cv": {
					"op": "set",
					"opValue": [frameIDs[frame]]
				}
			}
		});
	}
	commentData.push({
		"cs_cids": {
			"cv": {
				"op": "set",
				"opValue": []
			}
		}
	});

	for(let y = 0; y < height; y++) {
		for(let x = 0; x < width; x++) {
			let ids = [];
			for(let frame = 0; frame < frameIDs.length; frame++) {
				const bit = getBit(fileData, frame, x, y);
				if(bit == 1) {
					ids.push(frameIDs[frame]);
				}
			}
			commentData.push({
				"cs_cids": {
					"cv": {
						"op": "set",
						"opValue": ids
					}
				}
			});
		}
		commentData.push({
			"cs_cids": {
				"cv": {
					"op": "set",
					"opValue": []
				}
			}
		});
	}

	console.log(commentData);

	innerData.resolved.dsl_styleslices.forEach((elem) => {
		if(elem.stsl_type == 'comment') {
			elem.stsl_styles = commentData;
		}
	});

	result.data = JSON.stringify(innerData);
	console.log(result);
	return result;
}

document.getElementById('copybox').addEventListener('copy', (event) => {
	console.log('Copy event:', event);
	try {
		const newData = convert();
		event.target.value = 'Copied!';
		event.clipboardData.setData(mime, JSON.stringify(newData));
		event.clipboardData.setData('text', "This doesn't look like Google Docs to me.");
	} catch(err) {
		console.error(err);
		event.target.value = err;
	}

	event.preventDefault();
});
