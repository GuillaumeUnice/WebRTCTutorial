(function () {
	'use strict';
	var sendChannel = null;
	var fileInput = document.querySelector('input#fileInput');

	$('form').on('change', '#fileInput', function() {
			var reader = new FileReader();

			// reader.addEventListener('load', function() {
			//     console.log('Contenu du fichier "' + fileInput.files[0].name + '" :\n\n' + reader.result);
			// });

			reader.onload = (function() {
				if(sendChannel) {
					// console.log(reader.result);
					sendChannel.send(reader.result);
				}
			});

			reader.readAsText(this.files[0]);









//   var chunkSize = 16384;
//   var sliceFile = function(offset) {
//     var reader = new window.FileReader();
//     reader.onload = (function() {
//       return function(e) {
//         sendChannel.send(e.target.result);
//         if (file.size > offset + e.target.result.byteLength) {
//           window.setTimeout(sliceFile, 0, offset + chunkSize);
//         }
//         sendProgress.value = offset + e.target.result.byteLength;
//       };
//     })(file);
//     var slice = file.slice(offset, offset + chunkSize);
//     reader.readAsArrayBuffer(slice);
//   };
//   sliceFile(0);





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
