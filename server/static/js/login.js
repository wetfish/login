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

    // Add active class to navigation links for the current page
    $('.header .nav li').each(function()
    {
        if($(this).find('a').attr('href') == window.location.pathname)
            $(this).addClass('active');
    });

    // Automatically select dropdown values on page load
    $('select').each(function()
    {
        var value = $(this).attr('value')
        
        if(value)
        {
            $(this).find('option').prop('selected', false);
            $(this).find('option[value="'+value+'"]').prop('selected', true);
        }
    });

    // Automatically hide unchecked permission boxes on join pages
    $('.join-form input[type="checkbox"]').each(function()
    {
        if(!$(this).prop('checked'))
            $(this).parents('.permission').hide();
    });

    $('.join-form .form-group').each(function()
    {
        // Only hide form groups which contain permission divs
        if($(this).find('.permission').length)
        {
            if(!$(this).find('.permission:visible').length)
                $(this).hide();
        }
    });

    // Use AJAX to submit all forms
    $('form').on('submit', function(event)
    {
        event.preventDefault();
        var form = $(this);

        // Remove previous error messages
        form.parents('.form-wrap').find('.alert').remove();

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
                            var input = form.find('[name="'+field+'"]');
                            
                            if(input.length)
                            {
                                // Remove any previous error messages when displaying new ones
                                input.siblings('.help-block').remove();
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
    $('form input, form textarea').on('keyup', function()
    {
        if($(this).val().length && $(this).parents('.form-group').hasClass('has-error'))
        {
            $(this).parents('.form-group').removeClass('has-error');
            $(this).siblings('.help-block').fadeOut(function() { $(this).remove(); });
        }
    });
});
