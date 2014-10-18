$(document).ready(function()
{
    $('.header .nav li').each(function()
    {
        if($(this).find('a').attr('href') == window.location.pathname)
            $(this).addClass('active');
    });
});
