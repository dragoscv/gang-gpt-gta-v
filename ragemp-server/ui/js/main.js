let chat =
{
	size: 0,
	container: null,
	input: null,
	enabled: false,
	active: true
};

function enableChatInput(enable)
{
	if(chat.active == false
		&& enable == true)
		return;
	
    if (enable != (chat.input != null))
	{
        mp.invoke("focus", enable);
        mp.invoke("setTypingInChatState", enable);

        if (enable)
		{
            chat.input = $("#chat").append('<div><input id="chat_msg" type="text" /></div>').children(":last");
			chat.input.children("input").focus();
        } 
		else
		{
            chat.input.fadeOut('fast', function()
			{
                chat.input.remove();
                chat.input = null;
            });
        }
    }
}

let idx = 0;

var chatAPI =
{
	push: (text) =>
	{
		chat.container.prepend("<li>" + text + "</li>");

		chat.size++;

		if (chat.size >= 50)
		{
			chat.container.children(":last").remove();
		}
	},
	
	clear: () =>
	{
		chat.container.html("");
	},
	
	activate: (toggle) =>
	{
		if (toggle == false
			&& (chat.input != null))
			enableChatInput(false);
			
		chat.active = toggle;
	},
	
	show: (toggle) =>
	{
		if (toggle == false
			&& (chat.input != null))
			enableChatInput(false);
			
		if(toggle)
			$("#chat").show();
		else
			$("#chat").hide();
		
		chat.active = toggle;
	}
};

if(mp.events)
{
	let api = {"chat:push": chatAPI.push, "chat:clear": chatAPI.clear, "chat:activate": chatAPI.activate, "chat:show": chatAPI.show}; 

	for(let fn in api)
	{
		mp.events.add(fn, api[fn]);
	}
}

$(document).ready(function()
{
	chat.container = $("#chat ul#chat_messages");
	
    $(".ui_element").show();

	chatAPI.push("Multiplayer started.");
	
    $("body").keydown(function(event)
	{
        if (event.which == 84 && chat.input == null
			&& chat.active == true)
		{
            enableChatInput(true);
            event.preventDefault();
        } 
		else if (event.which == 13 && chat.input != null)
		{
            let value = chat.input.children("input").val();

            if (value.length > 0) 
			{
                if (value[0] == "/")
				{
                    value = value.substr(1);

                    if (value.length > 0)
                        mp.invoke("command", value);
                }
				else
				{
                    mp.invoke("chatMessage", value);
                }
            }

            enableChatInput(false);
        }
    });
});