$('form').submit(function(){
	var content = $('#m').val();
	if(content) {
		var msg = {
			username: 'Bob',
			content: content
		}
	socket.emit('CHAT_MESSAGE', JSON.stringify(msg));
	$('#m').val('');
	}
	return false;
});

socket.on('CHAT_MESSAGE', function(msg){
	msg = JSON.parse(msg);
    $('#messages').append('<li><span class="username">' + msg.username + ': </span><span class="content">' + msg.content + '</span></li>');
});
