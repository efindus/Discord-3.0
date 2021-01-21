function getCookie(name)
{
    var cookies = document.cookie.split(";");

    for(var cookie = 0; cookie < cookies.length; cookie++)
    {
        var index = cookies[cookie].indexOf("=");

        if(cookies[cookie].substr(0, index).trim() === name)
        {
            return cookies[cookie].substr(index + 1);
        }
    }

    return "";
}

function getTheme()
{
    if(getCookie("theme") === "light")
    {
        return "light";
    }
    else
    {
        return "dark";
    }
}

function setTheme(theme)
{
    document.body.classList.remove("dark");
    document.body.classList.remove("light");
    document.body.classList.add(theme);

    document.cookie = "theme=" + theme;
}

window.onload = function() 
{
    document.body.classList.add(getTheme());
};