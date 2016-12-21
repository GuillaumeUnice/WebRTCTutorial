(function () {
	'use strict';
	var sendChannel = null;
	var fileInput = document.querySelector('input#fileInput');

	$('form').on('change', '#fileInput', function() {


		var file = this.files[0];
		var chunkSize = 16384;
		var maxNumberOfChunk = Math.ceil(file.size / chunkSize);
		var currentNumberOfChunk = 0;

		var message = {
			type: 'file_info',
			number: ++currentNumberOfChunk,
			numberMax: maxNumberOfChunk,
			fileName: file.name
		}
		sendChannel.send(JSON.stringify(message));

		var sliceFile = function(offset) {
			var reader = new window.FileReader();

			var slice = file.slice(offset, offset + chunkSize);
			reader.readAsArrayBuffer(slice);

			reader.onload = function(event) {
				sendChannel.send(event.target.result);
				if (maxNumberOfChunk > ++currentNumberOfChunk) {
					console.log('Chunk number : ', currentNumberOfChunk);
					sliceFile(offset + chunkSize);
				}
			};
		};
		sliceFile(0);





	});

	reactor.addEventListener('webRTCDataChannel', function(){
		console.log('webRTCDataChannel');

		////////////////////////////////////////////////////////////

		function onSendChannelStateChange() {
			var readyState = sendChannel.readyState;
			console.log('Send channel state is: ' + readyState);
			if (readyState === 'open') {
				enableToSendData();
			}
		}

		function enableToSendData() {
			console.log('enableToSendData');
			$('form').append('<input type="file" id="fileInput" />');
		}

		////////////////////////////////////////////////////////////

		var dataChannelOptions = {
			ordered: false, // do not guarantee order
			maxRetransmitTime: 3000, // in milliseconds
		};


		sendChannel = aliceConn.createDataChannel('sendDataChannel', dataChannelOptions);
		sendChannel.binaryType = 'arraybuffer';

		sendChannel.onopen = onSendChannelStateChange;
		sendChannel.onclose = onSendChannelStateChange;

	});

}) ();
