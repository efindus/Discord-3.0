document.getElementById("form").onsubmit = function(event)
{
    event.preventDefault();

    document.getElementById("form-body").style.opacity = "0";
    document.getElementById("form-loader").style.display = "block";
    document.getElementById("form-error").style.display = "none";
    document.getElementById("form-error-username").style.display = "none";
    document.getElementById("form-error-password").style.display = "none";

    var request = new XMLHttpRequest();
    request.open("POST", "/api/login");

    request.onload = function()
    {
        var response = JSON.parse(request.responseText);

        if(response.type === "success")
        {
            window.location = "/";
        }
        else
        {
            document.getElementById("form-error-" + response.type).innerHTML = response.message;
            document.getElementById("form-error-" + response.type).style.display = "block";
            document.getElementById("form-loader").style.display = "none";
            document.getElementById("form-body").style.opacity = "100";
        }
    };

    function error()
    {
        document.getElementById("form-error").style.display = "block";
        document.getElementById("form-loader").style.display = "none";
        document.getElementById("form-body").style.opacity = "100";
    };

    request.onerror = error;
    request.ontimeout = error;

    request.send(JSON.stringify({
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        remember: document.getElementById("remember").checked,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString()
    }));

    document.getElementById("password").value = "";
}