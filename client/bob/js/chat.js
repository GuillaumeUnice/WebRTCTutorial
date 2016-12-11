$('form').submit(function(){
	var content = $('#m').val();
	if(content) {
		var msg = {
			username: 'Bob',
			content: content
		}
	socket.emit('CHAT_MESSAGE', msg);
	$('#m').val('');
	}
	return false;
});

socket.on('CHAT_MESSAGE', function(msg){
    $('#messages').append('<li><span class="username">' + msg.username + ': </span><span class="content">' + msg.content + '</span></li>');
});
