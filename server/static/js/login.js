function redirect(url, timeout)
{
    if($('.redirect').length)
    {
        var url = $('.redirect').attr('redirect-url');
        var timeout = parseInt($('.redirect').attr('redirect-timeout'));
    }

    if(url)
        setTimeout(function() { window.location = url; }, timeout * 1000);
}

$(document).ready(function()
{
    // Check for any redirects on page load
    redirect();
    
    $('.header .nav li').each(function()
    {
        if($(this).find('a').attr('href') == window.location.pathname)
            $(this).addClass('active');
    });

    // Use AJAX to submit all forms
    $('form').on('submit', function(event)
    {
        event.preventDefault();
        var form = $(this);

        // Remove previous error messages
        form.parents('.form-wrap').find('.alert').remove();

        form.find('input').each(function()
        {
            $(this).siblings('.help-block').remove();
        });

        $.post($(this).attr('action'), $(this).serialize(), function(response)
        {
            try {
                response = JSON.parse(response);
            }
            catch(error) {
                response = {'status': 'error', 'errors': {'unknown': 'We were unable to decode the response from the server.'}};
            }

            if(response.status == 'success')
            {
                var message = $('<div class="alert alert-success" style="display:none" role="alert"><strong>Success!</strong> '+response.message+'</div>');
                form.parents('.form-wrap').prepend(message);

                message.fadeIn();
                form.parents('.form').fadeOut();
            }
            else if(response.status == 'error')
            {
                // Handle generic error messages
                if(response.message)
                {
                    var message = $('<div class="alert alert-danger" style="display:none" role="alert"><strong>Error:</strong> '+response.message+'</div>');
                    form.parents('.form-wrap').prepend(message);

                    message.fadeIn();
                }
                
                // Handle lists of error messages
                else
                {
                    $.each(response.errors, function(field, error)
                    {
                        if(field == "unknown")
                        {
                            var message = $('<div class="alert alert-danger" style="display:none" role="alert"><strong>Error:</strong> '+error+'</div>');
                            form.parents('.form-wrap').prepend(message);

                            message.fadeIn();
                        }
                        else
                        {
                            var input = form.find('input[name="'+field+'"]');
                            
                            if(input.length)
                            {
                                input.parents('.form-group').addClass('has-error');

                                var message = $('<p class="help-block" style="display:none">'+error+'</p>');
                                input.parents('.col-sm-9').append(message);

                                message.fadeIn();
                            }
                        }
                    });
                }
            }
            else
            {
                console.log(response);
            }

            if(response.redirect)
            {
                redirect(response.redirect.url, response.redirect.timeout);
            }
        });
    });

    // Automatically remove error messages when typing into an input
    $('form input').on('keyup', function()
    {
        if($(this).val().length)
        {
            $(this).parents('.form-group').removeClass('has-error');
            $(this).siblings('.help-block').fadeOut(function() { $(this).remove(); });
        }
    });
});
