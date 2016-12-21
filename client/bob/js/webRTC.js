(function () {
    'use strict';

		var aliceTempDesc = {};
		var aliceTempIceCandidates = [];
		
		var bobConn = {};
		// var isAcceptedOffer = false;

		var receiveChannel = {};
		var downloadAnchor = document.querySelector('a#download');

		var video = document.getElementById('remoteVideo');
	 	toggleVideo();
		function toggleVideo () {
			if(video.style.display === '' || video.style.display === 'block') {
				video.style.display = 'none';
			} else {
				video.style.display = 'block';
			}
		}

	/**
   * @name getBrowserRTCConnectionObj
   * @description
   * private fonction wich return an instance of RTCPeerConnection appropriate with browser
   *
   * @returns {Object} instance RTCPeeConnection
   */
		function getBrowserRTCConnectionObj () {
			// default params
			var servers = null;
			var pcConstraints = {
				'optional': []
			};
			if (window.mozRTCPeerConnection) {
				return new mozRTCPeerConnection(servers, pcConstraints);
			} else if (window.webkitRTCPeerConnection) {
					return new webkitRTCPeerConnection(servers, pcConstraints);
			} else if (window.msRTCPeerConnection) {
					return new msRTCPeerConnection(servers, pcConstraints);
			} else {
				return new RTCPeerConnection(servers, pcConstraints);
			}
		}

  /**
   * @name gotDescription
   * @description
   * private fonction in order to share the bob current description
	 * and evovle RTCSessionDescription from alice's offer to state's answer
	 * For this send bob description
   *
   * @params {Object} Wich contains all description/configuration to et ablish a PeerConnection 
   * @returns {void}
   */
		function gotDescription(bobDesc) {
			bobConn.setLocalDescription(bobDesc,
    		function() {
					// isAcceptedOffer = true;
					registerIceCandidate();
					// send desc to Alice
					socket.emit('RESPONSE_WEB_RTC', bobDesc);
   		 }, function(err) {
					console.error(err);
			});
		}

  /**
   * @name registerIceCandidate
   * @description
   * private fonction in order to register the Alice's IceCandidate
	 * Have to exec this function only after bob acceptOffer for compatibility whith IE
   *
   * @returns {void}
   */
		function registerIceCandidate() {
			for(var i = 0; i < aliceTempIceCandidates.length; i++) {
				bobConn.addIceCandidate(
					new RTCIceCandidate(aliceTempIceCandidates[i]), function() {
					console.log('AddIceCandidate success!');
				}, function(err) {
					console.error('Error AddIceCandidate');
					console.error(err);
				});
			}
		}

	/**
   * @name sentIceCandidates
   * @methodOf myApp.WebRTCService
   * @description
   * private fonction to send iceCandidate to alice
   *
   * @params {Object} bob's iceCandidate 
   * @returns {void}
   */
		function sentIceCandidates(evt) {
			// dernier icecandidate null et inutile en somme et risque de faire un undefined property error pour Alice
			if (evt.candidate) {
				// 2 points a noté :
				//   -le premier pas de stringify en préscence d'AdapterJS
				//   -On ne peu pas envoyer l'objet complet car trop lourd du moins pour IE 11 qui pête une erreur 28 : SCRIPT28: Espace pile insuffisant
				// En gros il arrive a faire péter la pile JS 
				var lightCandidate = {
					sdpMid: evt.candidate.sdpMid,
					sdpMLineIndex: evt.candidate.sdpMLineIndex,
					candidate: evt.candidate.candidate
				}
				// send desc to Alice
				// socket.emit('CANDIDATE_WEB_RTC_BOB', { "candidate": evt.candidate });
				socket.emit('CANDIDATE_WEB_RTC_BOB', { "candidate": lightCandidate });
			}
		};

	/**
   * @name gotRemoteStream
   * @description
   * private fonction to add (alice's) remote stream
   *
   * @params {Object} alice's stream 
   * @returns {void}
   */
		function gotRemoteStream(evt) {
      video = attachMediaStream(video, evt.stream);

			// Before AdapterJS
			//  window.stream = evt.stream;
			// if (window.URL) {
				// 	attachMediaStream(video,  evt.stream);
				// video.src =  window.URL.createObjectURL(evt.stream);
			// } else {
				// video.src =  evt.stream;
			// }			
		};

	/**
   * @name displayError
   * @description
   * private fonction to display in console error
   *
   * @params {Object} error 
   * @returns {void}
   */
	function displayError(error) {
		console.error(error);
	}

	var receiveBuffer = [];
	var file = null;
	var currentChunk = 0;
	function onReceiveMessageCallback (event) {
		if(!file) {
			file = JSON.parse(event.data);
			console.log('FILE INFO', file);
		} else {
			currentChunk++;
			receiveBuffer.push(event.data);
			
			if(file.numberMax === (currentChunk+1)) {
				var received = new window.Blob(receiveBuffer);

				downloadAnchor.href = URL.createObjectURL(received);
				downloadAnchor.download = file.fileName;
				downloadAnchor.textContent = file.fileName;
				
				var fileDownload = document.getElementById('fileDownload');
				fileDownload.style.display = 'block';
				downloadAnchor.style.display = 'block';

				currentChunk = 0;
				file = null;
				receiveBuffer = [];
			}
		}
	}



	function onReceiveChannelStateChange(event) {
		var state = receiveChannel.readyState;
		if (state === 'open') {
			console.log('receiveChannel Opened');
		} else {
			console.log('onReceiveChannelStateChange', state);
		}
	}

	function receiveChannelCallback(event) {
		console.log('Receive Channel Callback');
		console.log(event.channel);
		receiveChannel = event.channel;
		receiveChannel.binaryType = 'arraybuffer';
		receiveChannel.onmessage = onReceiveMessageCallback;
		receiveChannel.onopen = onReceiveChannelStateChange;
		// receiveChannel.onclose = onReceiveChannelStateChange;

		// receivedSize = 0;
		// bitrateMax = 0;
		// downloadAnchor.textContent = '';
		// downloadAnchor.removeAttribute('download');
		// if (downloadAnchor.href) {
		// 	URL.revokeObjectURL(downloadAnchor.href);
		// 	downloadAnchor.removeAttribute('href');
		// }
	}


	/////////////////////////////////////////////////////////////////////
  
	
  /**
   * @name acceptOffer
   * @description
   * public fonction to acceptOffer WebRTC visio with alice
   *
   * @returns {void}
   */
	
	$('form').on('click', '#web_rtc_button', function(){

		// The WebRTC API is ready.
    // isUsingPlugin: true if the WebRTC plugin is being used, false otherwise
		// AdapterJS.webRTCReady(function(isUsingPlugin) {
 
			bobConn = getBrowserRTCConnectionObj();

			// restriction when you use screen sharing you cant's use audio in parallel
			navigator.getUserMedia({
				audio: false,
				video: {
					mediaSource: 'screen'	
				}
			}, function(myStream) {

				bobConn.addStream(myStream);

				// video = attachMediaStream(video, myStream);
				// event to send bob's iceCandaide to alice
				bobConn.onicecandidate = sentIceCandidates;

				// display alice's video stream
				bobConn.onaddstream = gotRemoteStream;
				// bobConn.ontrack = gotRemoteStream;

				bobConn.ondatachannel = receiveChannelCallback;

				// add alice's description
				bobConn.setRemoteDescription(
					new RTCSessionDescription(aliceTempDesc),
					function() {
						bobConn.createAnswer(gotDescription, displayError);
						toggleVideo();
				}, displayError);
		
			}, displayError);
	});

	/**
	 * @name close
	 * @description
	 * fonction to close WebRTC connection properly
	 *
	 * @returns {void}
	 */
	function close () {
		if(bobConn) {
			bobConn.close();
		}
		if (receiveChannel) {
			receiveChannel.close();
			console.log('Closed data channel with label: ' + receiveChannel.label);
			receiveChannel = null;
		}
		bobConn = null;
	}

	///////////////////////////////////////////////////////////////////////

	/**
	 * @name addIceCandidateCallback
	 * @description
	 * event in order to receive Alice's IceCandidate
	 * @returns {void}
	 */
		socket.on('CANDIDATE_WEB_RTC_ALICE', function(candidate){
			aliceTempIceCandidates.push(candidate.candidate);
			// var candidate = JSON.parse(candidate);
			// if(isAcceptedOffer) {
			// 	console.log('cela marche');
			// 	bobConn.addIceCandidate(
			// 		new RTCIceCandidate(candidate.candidate)
			// 	, function() {
			// 		console.log('AddIceCandidate success!');
			// 	}, function(err) {
			// 		console.error('Error AddIceCandidate');
			// 		console.error(err);
			// 	});
			// }
			
		});

	/**
	 * @name webRTCOffer
	 * @description
	 * event in order to receive Alice's desc
	 * @returns {void}
	 */
	socket.on('ASK_WEB_RTC', function(aliceDesc){
		aliceTempDesc = JSON.parse(aliceDesc);
		$('form').append('<button id="web_rtc_button">Accept visio</button>');
	});

}) ();
