var captcha = {};

document.getElementById("form").onsubmit = function(event)
{
    event.preventDefault();

    document.getElementById("form-body").style.opacity = "0";
    document.getElementById("form-loader").style.display = "block";
    document.getElementById("form-error").style.display = "none";
    document.getElementById("form-error-username").style.display = "none";
    document.getElementById("form-error-password").style.display = "none";
    document.getElementById("captcha").style.display = "flex";
    document.getElementById("captcha-loader").style.display = "none";
    document.getElementById("form-error-captcha").style.display = "none";
    document.getElementById("captcha-input").style.display = "none";

    var data = JSON.stringify({
        username: document.getElementById("username").value,
        password1: document.getElementById("password-1").value,
        password2: document.getElementById("password-2").value,
        captchaId: captcha.id,
        captchaTimestamp: captcha.timestamp,
        captchaSolution: document.getElementById("code").value,
        captchaSignature: captcha.signature,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString()
    });
        
    document.getElementById("password-1").value = "";
    document.getElementById("password-2").value = "";
    document.getElementById("code").value = "";
    
    var request = new XMLHttpRequest();
    request.open("POST", "/api/register");

    request.onload = function()
    {
        if(request.status !== 200)
        {
            error();
            return;
        }

        var response = JSON.parse(request.responseText);

        if(response.length === 0)
        {
            window.location = "/";
        }
        else
        {
            document.getElementById("form-loader").style.display = "none";
            document.getElementById("form-body").style.opacity = "100";

            for(var index = 0; index < response.length; index++)
            {
                document.getElementById("form-error-" + response[index].type).innerHTML = response[index].message;
                document.getElementById("form-error-" + response[index].type).style.display = "block";
            }
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

    request.send(data);
};

document.getElementById("captcha").addEventListener("click", function()
{
    document.getElementById("captcha").style.display = "none";
    document.getElementById("captcha-loader").style.display = "block";
    document.getElementById("form-error-captcha").style.display = "none";

    var request = new XMLHttpRequest();
    request.open("POST", "/api/captcha");

    request.onload = function()
    {
        if(request.status !== 200)
        {
            error();
            return;
        }

        captcha = JSON.parse(request.responseText);

        document.getElementById("captcha-input").style.display = "block";
        document.getElementById("captcha-loader").style.display = "none";
        document.getElementById("form-captcha-content").innerHTML = captcha.content;
    };

    function error()
    {
        document.getElementById("captcha").style.display = "flex";
        document.getElementById("captcha-loader").style.display = "none";

        document.getElementById("form-error-captcha").innerHTML = "Unknown error occurred. Please try again later.";
        document.getElementById("form-error-captcha").style.display = "block";
    };

    request.onerror = error;
    request.ontimeout = error;

    request.send();

});