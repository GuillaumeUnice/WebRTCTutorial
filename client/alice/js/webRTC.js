(function () {
  'use strict';

	var video = document.getElementById('remoteVideo');
	toggleVideo();
	function toggleVideo () {
		if(video.style.display === '' || video.style.display === 'block') {
			video.style.display = 'none';
		} else {
			video.style.display = 'block';
		}
	}

	////////////////////////////////////////////////////////////

		/**
		 * @name getBrowserRTCConnectionObj
		 * @description
		 * private fonction wich return an instance of RTCPeerConnection appropriate with browser
		 * @returns {Object} instance RTCPeeConnection
		 */
		function getBrowserRTCConnectionObj () {
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
   * @name gotRemoteStream
   * @description
   * private fonction to add (bob's) remote stream
   *
   * @params {Object} bob's stream 
   * @returns {void}
   */
	function gotRemoteStream(evt) {
		console.log('gotRemoteStream');
		console.log(evt.stream);
  		video = attachMediaStream(video, evt.stream);
	};

	////////////////////////////////////////////////////////////
	
	$('#web_rtc_button').click(function(){

		// AdapterJS.webRTCReady(function(isUsingPlugin) {
			// ask authorization for use video and audio
			navigator.getUserMedia({
				audio: true,
				video: true
			}, function(aliceStream) {
				aliceConn = getBrowserRTCConnectionObj();

				reactor.dispatchEvent('webRTCDataChannel', 'param1');

				aliceConn.addStream(aliceStream);
				
				// display bob's screensharing
				aliceConn.onaddstream = gotRemoteStream;
				// envoie un ice candidate à l'autre pair
				// 2 points a noté :
				//   -le premier pas de stringify en préscence d'AdapterJS
				//   -On ne peu pas envoyer l'objet complet car trop lourd du moins pour IE 11 qui pête une erreur 28 : SCRIPT28: Espace pile insuffisant
				// En gros il arrive a faire péter la pile JS 
				aliceConn.onicecandidate = function (evt) {
					if (evt.candidate) {

						var lightCandidate = {
							sdpMid: evt.candidate.sdpMid,
							sdpMLineIndex: evt.candidate.sdpMLineIndex,
							candidate: evt.candidate.candidate
						}

						// send ice alice's iceCandidate to Bob
						socket.emit('CANDIDATE_WEB_RTC_ALICE', { "candidate": lightCandidate });
					}
				};

				aliceConn.createOffer( function (desc) {
					// desc is typeof RTCSessionDescription wich contains Alice's session
					aliceConn.setLocalDescription(desc);

					// send desc to Bob
					socket.emit('ASK_WEB_RTC', JSON.stringify(desc));

				},function(err) {
						console.error(err);
				}, {
					offerToReceiveAudio: 1,
					offerToReceiveVideo: 1
				});

			}, function(e) {
				console.error("You are not allow navigator use device", e);
			});
		});
	// });

	function close () {
			if(aliceConn) {
					aliceConn.close();
			}
			aliceConn = {};
	}

	///////////////////////////////////////////////////////////////////////
		/**
		 * @name addIceCandidateCallback
		 * @description
		 * fonction in order to add Bob's IceCandidate
		 * @returns {void}
		 */
			socket.on('CANDIDATE_WEB_RTC_BOB', function(candidate){
				// var candidate = JSON.parse(candidate);

				console.log('CANDIDATE_WEB_RTC_BOB');
				aliceConn.addIceCandidate( new RTCIceCandidate(candidate.candidate),
					function() {
						console.log('AddIceCandidate success!');
					}, function(err) {
						console.error('Error AddIceCandidate');
						console.error(err);
					});
			});

			socket.on('RESPONSE_WEB_RTC', function(bobDesc){
				var bobDesc = bobDesc;
				aliceConn.setRemoteDescription(new RTCSessionDescription(bobDesc));
				toggleVideo();
			});
			
}) ();
